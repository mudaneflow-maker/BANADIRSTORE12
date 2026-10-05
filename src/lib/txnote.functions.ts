import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({ note: z.string().min(2).max(1000), context: z.string().max(4000) });

export const analyzeTransactionNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { analyzeTxNote } = await import("./txnote.server");
    try {
      return { result: await analyzeTxNote(data.note, data.context), error: "" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/402|credit/i.test(msg)) return { result: null, error: "AI credits-ka waa dhammaadeen." };
      if (/403/.test(msg)) return { result: null, error: "AI-ga lama ogola hadda." };
      if (/429|rate/i.test(msg)) return { result: null, error: "Codsiyo badan — sug daqiiqad." };
      return { result: null, error: "AI lama gaari karo: " + msg.slice(0, 160) };
    }
  });
