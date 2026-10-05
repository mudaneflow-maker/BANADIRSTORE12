import { supabase } from "@/integrations/supabase/client";
import { getOfflineDB, getPendingOutbox, removeOutboxItem } from "@/lib/offline-db";

let isSyncing = false;
let syncTimer: any = null;

export async function drainOutbox(): Promise<{ processed: number; errors: number }> {
  if (isSyncing || typeof window === "undefined" || !navigator.onLine) {
    return { processed: 0, errors: 0 };
  }

  isSyncing = true;
  let processed = 0;
  let errors = 0;

  try {
    const items = await getPendingOutbox();
    for (const item of items) {
      try {
        if (item.entity === "sale" && item.action === "create") {
          const { error } = await supabase.from("sales").insert([item.payload]);
          if (!error) {
            await removeOutboxItem(item.id);
            processed++;
          } else {
            errors++;
          }
        } else if (item.entity === "order" && item.action === "create") {
          const { error } = await supabase.from("orders").insert([item.payload]);
          if (!error) {
            await removeOutboxItem(item.id);
            processed++;
          } else {
            errors++;
          }
        } else if (item.entity === "expense" && item.action === "create") {
          const { error } = await supabase.from("expenses").insert([item.payload]);
          if (!error) {
            await removeOutboxItem(item.id);
            processed++;
          } else {
            errors++;
          }
        } else {
          // generic fallback or acknowledged
          await removeOutboxItem(item.id);
          processed++;
        }
      } catch (e) {
        errors++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { processed, errors };
}

export function initSyncWorker() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    void drainOutbox();
  });

  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    if (navigator.onLine) {
      void drainOutbox();
    }
  }, 30000);
}
