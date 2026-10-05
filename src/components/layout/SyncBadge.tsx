import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  X,
} from "lucide-react";
import { getSyncStatus, subscribeSync, pendingCount, flush } from "../../lib/cloud-sync";
import { resetAllAuthData } from "@/lib/auth-reset";
import { useStore } from "@/context/StoreContext";
import { BanadirLogo } from "@/components/brand/BanadirLogo";

export const SyncBadge: React.FC = () => {
  const status = useSyncExternalStore(subscribeSync, getSyncStatus, () => "synced" as const);
  const { currentUser } = useStore();
  const [remote, setRemote] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  const ownerName =
    (typeof window !== "undefined" && localStorage.getItem("benadir__owner_name")) ||
    currentUser?.name ||
    "Mudane Flow";
  const ownerEmail =
    (typeof window !== "undefined" && localStorage.getItem("benadir__owner_email")) ||
    currentUser?.email ||
    "mudaneflow@gmail.com";

  useEffect(() => {
    const h = () => setRemote(true);
    window.addEventListener("benadir-remote-update", h);
    return () => window.removeEventListener("benadir-remote-update", h);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Online always stays Online. Only when offline without internet does it say sugaya.
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const map = isOffline
    ? {
        Icon: CloudOff,
        text: pendingCount() > 0 ? `${pendingCount()} sugaya (Offline)` : "Offline (Sugaya)",
        cls: "bg-slate-700 text-white border-slate-700 shadow-sm",
        dot: "bg-amber-400",
      }
    : {
        Icon: Cloud,
        text: "Online",
        cls: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
        dot: "bg-lime-300",
      };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await flush();
    } finally {
      setIsSyncing(false);
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    setOpen(false);
    await resetAllAuthData();
    window.location.reload();
  };

  return (
    <div className="relative flex items-center gap-2" ref={popoverRef}>
      {remote && (
        <button
          onClick={() => location.reload()}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-lime-400 text-black hover:bg-lime-300 transition-colors shadow-xs"
        >
          Xog cusub — cusboonaysii
        </button>
      )}

      {/* Main Status Badge in Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${map.cls}`}
        title="Xaaladda: Online (Auto-Synced)"
      >
        <span
          className={`h-2 w-2 rounded-full ${map.dot} ${!isOffline ? "animate-pulse" : ""}`}
          aria-hidden
        />
        <map.Icon
          className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
        />
        <span>{map.text}</span>
      </button>

      {/* Active User & Sync Status Popover */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 max-w-[92vw] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shadow-xs">
                <BanadirLogo variant="icon" size="sm" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900 leading-tight">
                  {ownerName}
                </div>
                <div className="text-[11px] text-slate-500">{ownerEmail}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Xir"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role & Verification Badge */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Awoodda:</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono">
              Owner / Maamule
            </span>
          </div>

          {/* Reassuring State Message */}
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs font-medium space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Auto-Sync Wuu Shidan Yahay</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed font-normal">
              Dhammaan xogta dukaanka waxaa si toos ah (Automatic) loogu kaydiyaa Local Cache iyo daruuraha (Cloud).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Waa la kaydinayaa..." : "Auto-Sync (Xogtu waa Sugan)"}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ka Bax Akoonka (Log Out)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
