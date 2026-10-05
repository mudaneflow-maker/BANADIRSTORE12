import React, { useState } from "react";
import { resetBalancePinWithPassword } from "@/lib/balance-pin.functions";

/** Owner forgot the balance PIN: confirm the account password, then choose a new PIN. */
export function ForgotPinPanel() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPin !== confirm) return setMsg({ ok: false, text: "PIN-ka cusub iyo xaqiijintu isku mid ma aha." });
    if (!/^\d{4,12}$/.test(newPin)) return setMsg({ ok: false, text: "PIN waa inuu noqdaa tiro 4-12 lambar ah." });
    setBusy(true);
    try {
      const r = await resetBalancePinWithPassword({ data: { password, newPin } });
      if (r.ok) {
        setMsg({ ok: true, text: "PIN cusub waa la dejiyay. Isku-dayadii khaldanaana waa la tirtiray." });
        setPassword(""); setNewPin(""); setConfirm("");
      } else setMsg({ ok: false, text: r.error });
    } catch {
      setMsg({ ok: false, text: "Lama dejin karin PIN-ka hadda." });
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  const input = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-bold text-slate-900 underline">
        Ma ilowday PIN-ka? Dib u deji adigoo xaqiijinaya akoonkaaga
      </button>
      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <p className="text-[11px] text-slate-500">Geli password-ka akoonkaaga (kan aad ku gasho system-ka), kadib dooro PIN cusub.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-bold text-slate-500">Password-ka akoonka
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </label>
            <label className="text-xs font-bold text-slate-500">PIN Cusub
              <input type="password" inputMode="numeric" autoComplete="off" required value={newPin} onChange={(e) => setNewPin(e.target.value)} className={input} />
            </label>
            <label className="text-xs font-bold text-slate-500">Xaqiiji PIN Cusub
              <input type="password" inputMode="numeric" autoComplete="off" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
            </label>
          </div>
          {msg && <p role="alert" className={`text-xs font-semibold ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
          <button type="submit" disabled={busy} className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl disabled:opacity-50">
            {busy ? "Waa la hubinayaa…" : "Dib u deji PIN-ka"}
          </button>
        </form>
      )}
    </div>
  );
}
