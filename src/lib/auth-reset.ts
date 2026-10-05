import { supabase } from "@/integrations/supabase/client";
import { ROLE_CACHE_KEY } from "@/lib/roles";

export async function resetAllAuthData(): Promise<void> {
  try {
    await supabase.auth.signOut().catch(() => {});
  } catch {
    /* ignore */
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("benadir_supabase_auth_token");
      localStorage.removeItem(ROLE_CACHE_KEY);
      localStorage.removeItem("benadir__owner_email");
      localStorage.removeItem("benadir__owner_name");
      localStorage.removeItem("benadir__owner_configured");
      localStorage.removeItem("benadir__offline_mode");
      localStorage.removeItem("benadir_portal_auth");
      localStorage.removeItem("benadir_active_portal");

      // Remove any supabase auth tokens
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("auth-token") || k.includes("supabase.auth"))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      window.dispatchEvent(new CustomEvent("benadir-auth-reset"));
    } catch {
      /* storage access error */
    }
  }
}
