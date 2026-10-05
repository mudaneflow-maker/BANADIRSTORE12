import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PinResult =
  | { ok: true }
  | { ok: false; error: "wrong"; remaining: number }
  | { ok: false; error: "locked"; lockedUntil: string }
  | { ok: false; error: "forbidden" | "not_set" | "failed" };

function mapResult(r: any): PinResult {
  if (r?.ok) return { ok: true };
  if (r?.error === "wrong") return { ok: false, error: "wrong", remaining: Number(r.remaining ?? 0) };
  if (r?.error === "locked") return { ok: false, error: "locked", lockedUntil: String(r.locked_until) };
  if (r?.error === "forbidden" || r?.error === "not_set") return { ok: false, error: r.error };
  return { ok: false, error: "failed" };
}

async function checkPin(supabase: any, pin: string): Promise<PinResult> {
  const { data, error } = await supabase.rpc("balance_pin_check", { p_pin: pin });
  if (error) return { ok: false, error: "failed" };
  if (data?.error !== "not_set") return mapResult(data);
  // No PIN stored yet: compare with the configured fallback, still counting attempts.
  const fallback = process.env["BALANCE_VIEW_PIN"] || "8125";
  let ok = false;
  if (fallback) {
    const { timingSafeEqual } = await import("node:crypto");
    const a = Buffer.from(pin), b = Buffer.from(fallback);
    ok = a.length === b.length && timingSafeEqual(a, b);
  }
  const { data: rec } = await supabase.rpc("balance_pin_record_result", { p_ok: ok });
  return mapResult(rec);
}

/** Verifies the balance PIN; wrong attempts are limited (5 tries → 15 min lock). */
export const verifyBalancePin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => z.object({ pin: z.string().max(12) }).parse(value))
  .handler(async ({ data, context }) => checkPin(context.supabase, data.pin));

async function isOwner(supabase: any, userId: string) {
  const { data } = await supabase.from("staff_members").select("role").eq("user_id", userId).maybeSingle();
  return data?.role === "owner";
}

const newPinSchema = z.string().min(4).max(12).regex(/^\d+$/);

export const setBalancePin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => z.object({ currentPin: z.string().max(12), newPin: newPinSchema }).parse(value))
  .handler(async ({ data, context }) => {
    if (!(await isOwner(context.supabase, context.userId))) return { ok: false as const, error: "Owner keliya ayaa beddeli kara PIN-ka." };
    const check = await checkPin(context.supabase, data.currentPin);
    if (!check.ok) {
      if (check.error === "locked") return { ok: false as const, error: "Isku-dayo badan. PIN-ka waa la xiray 15 daqiiqo." };
      return { ok: false as const, error: "PIN-ka hadda jira waa khaldan." };
    }
    const { data: r, error } = await context.supabase.rpc("balance_pin_owner_set", { p_new: data.newPin });
    if (error || !(r as any)?.ok) return { ok: false as const, error: "Lama kaydsan karin PIN-ka." };
    return { ok: true as const };
  });

/** Owner forgot the PIN: re-verify the account password, then set a new PIN. */
export const resetBalancePinWithPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => z.object({ password: z.string().min(1).max(200), newPin: newPinSchema }).parse(value))
  .handler(async ({ data, context }) => {
    if (!(await isOwner(context.supabase, context.userId))) return { ok: false as const, error: "Owner keliya ayaa dib u dejin kara PIN-ka." };
    const email = (context.claims as any)?.email as string | undefined;
    if (!email) return { ok: false as const, error: "Email-ka akoonka lama helin." };
    const { createClient } = await import("@supabase/supabase-js");
    const verifier = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { data: signIn, error: authErr } = await verifier.auth.signInWithPassword({ email, password: data.password });
    if (authErr || signIn.user?.id !== context.userId) return { ok: false as const, error: "Password-ka akoonka waa khaldan." };
    await verifier.auth.signOut().catch(() => {});
    const { data: r, error } = await context.supabase.rpc("balance_pin_owner_set", { p_new: data.newPin });
    if (error || !(r as any)?.ok) return { ok: false as const, error: "Lama kaydsan karin PIN-ka." };
    return { ok: true as const };
  });
