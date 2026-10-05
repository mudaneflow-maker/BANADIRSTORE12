import React, { useEffect, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeTransactionNote } from "@/lib/txnote.functions";
import type { EngineResult } from "@/lib/financial-engine";

type Note = {
  id: string;
  at: string;
  note: string;
  category: string;
  kind: string;
  amount: number | null;
  targetEffect: "helps" | "hurts" | "neutral";
  impact: string;
};

const KEY = "benadir_txnotes_v1";
const money = (n: number) => `$${n.toFixed(2)}`;

/** AI-assisted notes: only categorizes and explains — never creates or changes records. */
export const TransactionNotesPanel: React.FC<{ engine: EngineResult; monthlyPlan: number }> = ({ engine, monthlyPlan }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { setNotes([]); }
  }, []);
  const save = (n: Note[]) => { setNotes(n); localStorage.setItem(KEY, JSON.stringify(n)); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const note = text.trim();
    if (note.length < 2 || busy) return;
    setBusy(true); setError("");
    const t = engine.today;
    const context = [
      `Monthly target: ${money(monthlyPlan)}`,
      `Today's required target: ${money(t?.adjustedTarget ?? 0)}`,
      `Today's sales so far: ${money(t?.achievement ?? 0)}`,
      `Remaining monthly target: ${money(engine.remainingMonthlyTarget)}`,
      `Remaining days after today: ${engine.remainingCalendarDays}`,
    ].join("\n");
    const res = await analyzeTransactionNote({ data: { note, context } }).catch((err) => ({ result: null, error: String(err?.message || err) }));
    setBusy(false);
    if (!res.result) { setError(res.error || "Khalad"); return; }
    save([{ id: crypto.randomUUID(), at: new Date().toISOString(), note, ...res.result }, ...notes].slice(0, 200));
    setText("");
  };

  const tone = (e: Note["targetEffect"]) => e === "helps" ? "text-positive" : e === "hurts" ? "text-destructive" : "text-muted-foreground";

  return (
    <section aria-label="Transaction notes" className="dashboard-panel border border-border bg-card p-4 sm:p-5">
      <h2 className="dashboard-heading flex items-center gap-2 text-base font-semibold text-foreground"><Sparkles className="h-4 w-4 text-primary" /> Qoraalka dhaqdhaqaaqa (AI)</h2>
      <p className="mb-3 text-xs text-muted-foreground">Qor dhaqdhaqaaq — AI-gu wuxuu kala saarayaa nooca, wuxuuna sharxayaa saameynta target-ka. Xog lama beddelo.</p>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Tusaale: Bixiyay $5 koronto" className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm" />
        <Button type="submit" className="w-full sm:w-auto" disabled={busy || text.trim().length < 2}>{busy ? "Falanqaynaya..." : "Falanqee"}</Button>
      </form>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <ul className="mt-3 space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="border border-border p-3 text-xs">
            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-foreground">{n.note}</p>
                <p className="mt-0.5 text-muted-foreground">{new Date(n.at).toLocaleString()} · <b>{n.category}</b> · {n.kind}{n.amount !== null ? ` · ${money(n.amount)}` : ""}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`font-bold uppercase ${tone(n.targetEffect)}`}>{n.targetEffect === "helps" ? "Caawinaya" : n.targetEffect === "hurts" ? "Culees" : "Dhexdhexaad"}</span>
                <button aria-label="Tirtir" onClick={() => save(notes.filter((x) => x.id !== n.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="mt-1.5 break-words text-foreground">{n.impact}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
