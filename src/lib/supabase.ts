import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.SUPABASE_URL : "") ||
  "https://placeholder-project.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== "undefined"
    ? process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
    : "") ||
  "placeholder-anon-key";

/**
 * Clean Supabase client configured for the production project.
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables
 * with browser localStorage authentication state persistence.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "benadir_supabase_auth_token",
  },
});

export default supabase;
