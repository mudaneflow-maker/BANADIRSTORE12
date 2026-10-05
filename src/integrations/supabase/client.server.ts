import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminUrl(): string {
  return process.env.SUPABASE_URL || "https://placeholder-project.supabase.co";
}

function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";
}

export function createSupabaseAdminClient() {
  const url = getSupabaseAdminUrl();
  const key = getSupabaseServiceRoleKey();

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
