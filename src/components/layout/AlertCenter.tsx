import { useEffect, useRef, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useTrackItems } from "../../lib/tracking-items";
import { updateTrack, todayStr } from "../../lib/tracking-store";
import { debtBalance, debtReminderState, useDebts } from "../../lib/debt-store";
import { useStore } from "../../context/StoreContext";

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    /* ignore */
  }
}

function notify(title: string, body: string) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") new Notification(title, { body });
    else if (Notification.permission === "default") Notification.requestPermission();
  } catch {
    /* ignore */
  }
}

export function AlertCenter({ onOpen, onOpenDebt }: { onOpen: () => void; onOpenDebt: () => void }) {
  const items = useTrackItems();
  const debtData = useDebts();
  const { customers, suppliers } = useStore();
  const [, tick] = useState(0);
  const [hidden, setHidden] = useState(false);
  const lastKey = useRef("");

  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const cash = items.filter((i) => i.cashOverdue);
  const debts = items.filter((i) => i.debtState === "soon" || i.debtState === "overdue");
  const today = todayStr();
  const freshDebt = debts.filter((d) => d.track.lastDebtReminder !== today);
  const ledgerDebtAlerts = [
    ...customers.map((c) => ({ id: `customer:${c.id}`, name: c.name, balance: c.balance, dueDate: debtData.dueDates[`customer:${c.id}`] || "" })),
    ...suppliers.map((s) => ({ id: `supplier:${s.id}`, name: s.name, balance: s.balance, dueDate: debtData.dueDates[`supplier:${s.id}`] || "" })),
    ...debtData.records.map((d) => ({ id: d.id, name: d.partyName, balance: debtBalance(d), dueDate: d.dueDate })),
  ].map((d) => ({ ...d, state: debtReminderState(d.dueDate, d.balance) })).filter((d) => d.state !== "none");

  // Sound + notification: every minute while cash is overdue; once per day per debt.
  useEffect(() => {
    const minute = Math.floor(Date.now() / 60000);
    const key = `${cash.length}:${freshDebt.length}:${ledgerDebtAlerts.length}:${cash.length ? minute : today}`;
    if ((cash.length || freshDebt.length || ledgerDebtAlerts.length) && key !== lastKey.current) {
      lastKey.current = key;
      beep();
      setHidden(false);
      if (cash.length)
        notify(
          "Lacagta Driver-ka",
          `${cash.length} driver ayaan lacagta soo collect garayn 1 saac kadib.`,
        );
       if (freshDebt.length || ledgerDebtAlerts.length) {
        notify(
          "Xasuusin Deyn",
           `${freshDebt.length + ledgerDebtAlerts.length} deyn ayaa bixinteedu dhow tahay ama dhaaftay.`,
        );
        freshDebt.forEach((d) => updateTrack(d.id, { lastDebtReminder: today }));
      }
    }
  });

  if (!cash.length && !debts.length && !ledgerDebtAlerts.length) return null;
  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed bottom-5 right-5 z-50 bg-red-600 text-white rounded-full p-4 shadow-2xl animate-bounce"
      >
        <BellRing className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-white text-red-600 rounded-full text-xs font-black px-2">
          {cash.length + debts.length + ledgerDebtAlerts.length}
        </span>
      </button>
    );
  }
  return (
    <div className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[92vw] bg-white border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-2 animate-pulse">
        <BellRing className="w-5 h-5 animate-bounce" />
        <b className="flex-1 text-sm">Digniin — Xasuusin</b>
        <button onClick={() => setHidden(true)} aria-label="Xir">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-sm">
        {cash.map((c) => (
          <div key={c.id} className="px-4 py-2">
            <b className="text-red-700">Wac {c.carrier}</b> — ${c.balance.toFixed(2)} lacag ah (
            {c.ref}) weli lama soo dirin.
          </div>
        ))}
        {debts.map((d) => (
          <div key={d.id} className="px-4 py-2">
            <b className={d.debtState === "overdue" ? "text-red-700" : "text-amber-700"}>
              Wac {d.customer}
            </b>{" "}
            — deyn ${d.balance.toFixed(2)}{" "}
            {d.debtState === "overdue" ? "waqtigii waa dhaafay" : "bixintu waa berri"}.
          </div>
        ))}
        {ledgerDebtAlerts.map((d) => (
          <div key={d.id} className="px-4 py-2">
            <b className={d.state === "overdue" ? "text-red-700" : "text-amber-700"}>{d.name}</b>
            {" "}— deyn ${d.balance.toFixed(2)} {d.state === "overdue" ? "waqtigii waa dhaafay" : d.state === "today" ? "maanta ayaa la sugayaa" : "bixintu waa berri"}.
          </div>
        ))}
      </div>
      <button onClick={ledgerDebtAlerts.length ? onOpenDebt : onOpen} className="w-full bg-slate-900 text-lime-400 py-2 text-xs font-bold">
        Fur {ledgerDebtAlerts.length ? "Deymaha" : "Tracking"}
      </button>
    </div>
  );
}
