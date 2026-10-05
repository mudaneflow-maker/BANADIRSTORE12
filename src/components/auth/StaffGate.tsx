import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StaffRoleContext, ROLE_CACHE_KEY, type StaffRole } from "@/lib/roles";
import { flush, pull } from "@/lib/cloud-sync";
import { BanadirLogo } from "@/components/brand/BanadirLogo";

const AUTO_OWNER_NAME = "Mudane Flow";
const AUTO_OWNER_EMAIL = "mudaneflow@gmail.com";
const AUTO_OWNER_PIN = "8125";

export const StaffGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<StaffRole>("owner");

  useEffect(() => {
    // 1. Auto-configure Owner credentials & privileges immediately
    const existingName = localStorage.getItem("benadir__owner_name");
    const existingEmail = localStorage.getItem("benadir__owner_email");

    if (!existingName) localStorage.setItem("benadir__owner_name", AUTO_OWNER_NAME);
    if (!existingEmail) localStorage.setItem("benadir__owner_email", AUTO_OWNER_EMAIL);

    localStorage.setItem("benadir__owner_configured", "true");
    localStorage.setItem(ROLE_CACHE_KEY, "owner");
    if (!localStorage.getItem("benadir_balance_pin")) {
      localStorage.setItem("benadir_balance_pin", AUTO_OWNER_PIN);
    }

    setRole("owner");
    setReady(true);

    // 2. Silent background sync attempt (does NOT block the user)
    const silentBackgroundSync = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await supabase.rpc("claim_first_owner").catch(() => {});
          await supabase.from("profiles").upsert({
            id: data.session.user.id,
            name: existingName || AUTO_OWNER_NAME,
            role: "owner",
          }).catch(() => {});
        }
        await pull().catch(() => {});
        await flush().catch(() => {});
      } catch {
        /* silent catch: user is already inside with offline-first IndexedDB guarantee */
      }
    };

    void silentBackgroundSync();
  }, []);

  // System opens automatically with full Owner privileges
  return (
    <StaffRoleContext.Provider value={role}>
      {ready ? (
        children
      ) : (
        <div className="fixed inset-0 flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-slate-900">
          <div className="mb-4">
            <BanadirLogo variant="full" size="lg" />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">Waa la furayaa si toos ah (Auto-Login)...</p>
          <div className="mt-5 h-1 w-36 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full animate-pulse rounded-full bg-[#F7B928]" />
          </div>
        </div>
      )}
    </StaffRoleContext.Provider>
  );
};
