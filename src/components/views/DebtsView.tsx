import React, { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, HandCoins, Phone, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDebt, addDebtPayment, debtBalance, debtReminderState, removeDebt, setLinkedDebtDueDate, useDebts, type DebtDirection } from "@/lib/debt-store";

const money = (n: number) => `$${(n || 0).toFixed(2)}`;
const today = () => new Date().toISOString().slice(0, 10);
const inputClass = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground";

export const DebtsView: React.FC = () => {
  const { customers, suppliers, sales, purchases, accounts, currentUser, adjustAccountBalance, receiveCustomerPayment, recordSupplierPayment } = useStore();
  const state = useDebts();
  const [newOpen, setNewOpen] = useState(false);
  const [paying, setPaying] = useState<{ id: string; kind: "independent" | "customer" | "supplier"; name: string; balance: number; direction: DebtDirection } | null>(null);
  const [direction, setDirection] = useState<DebtDirection>("receivable");
  const [partyName, setPartyName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccount, setPaymentAccount] = useState(accounts[0]?.id ?? "");
  const [error, setError] = useState("");

  const customerRows = customers.filter((c) => c.balance > 0.004).map((c) => ({
    id: c.id, name: c.name, phone: c.phone, balance: c.balance, dueDate: state.dueDates[`customer:${c.id}`] || "",
    lastRef: sales.filter((s) => s.customerId === c.id && s.remainingBalance > 0).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0]?.invoiceNo || c.code || "—",
  }));
  const supplierRows = suppliers.filter((s) => s.balance > 0.004).map((s) => ({
    id: s.id, name: s.name, phone: s.phone, balance: s.balance, dueDate: state.dueDates[`supplier:${s.id}`] || "",
    lastRef: purchases.filter((p) => p.supplierId === s.id && p.supplierBalance > 0 && p.status !== "Cancelled").sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0]?.purchaseNo || s.code || "—",
  }));
  const independent = state.records.map((d) => ({ ...d, balance: debtBalance(d) }));
  const receivable = customerRows.reduce((s, r) => s + r.balance, 0) + independent.filter((d) => d.direction === "receivable").reduce((s, d) => s + d.balance, 0);
  const payable = supplierRows.reduce((s, r) => s + r.balance, 0) + independent.filter((d) => d.direction === "payable").reduce((s, d) => s + d.balance, 0);
  const reminders = useMemo(() => [
    ...customerRows.map((r) => ({ ...r, key: `c-${r.id}`, type: "Customer", state: debtReminderState(r.dueDate, r.balance) })),
    ...supplierRows.map((r) => ({ ...r, key: `s-${r.id}`, type: "Supplier", state: debtReminderState(r.dueDate, r.balance) })),
    ...independent.map((r) => ({ key: `d-${r.id}`, name: r.partyName, type: r.direction === "receivable" ? "Deyn la bixiyay" : "Deyn nalagu leeyahay", ...r, state: debtReminderState(r.dueDate, r.balance) })),
  ].filter((r) => r.state !== "none"), [customerRows, supplierRows, independent]);

  const createDebt = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    const value = Number(amount); const account = accounts.find((a) => a.id === accountId);
    if (!partyName.trim() || !dueDate || !account || value <= 0) return setError("Buuxi magaca, lacagta, account-ka iyo due date-ka.");
    const movement = direction === "receivable" ? -value : value;
    if (!adjustAccountBalance(account.id, movement, `${direction === "receivable" ? "Deyn la siiyay" : "Deyn la qaatay"}: ${partyName.trim()}`)) return setError("Account-ka lacag ku filan ma leh ama xogtu sax ma aha.");
    addDebt({ source: direction === "receivable" ? "cash_loan" : "company_loan", direction, partyName: partyName.trim(), phone: phone.trim(), amount: value, dueDate, issuedAt: new Date().toISOString(), accountId: account.id, accountName: account.name, note: note.trim() });
    setNewOpen(false); setPartyName(""); setPhone(""); setAmount(""); setDueDate(""); setNote("");
  };

  const makePayment = (e: React.FormEvent) => {
    e.preventDefault(); if (!paying) return; setError("");
    const value = Number(paymentAmount); const account = accounts.find((a) => a.id === paymentAccount);
    if (!account || value <= 0 || value > paying.balance + 0.004) return setError("Lacagta ama account-ka sax ma aha.");
    if (paying.kind === "customer") receiveCustomerPayment(paying.id, value, account.id);
    else if (paying.kind === "supplier") recordSupplierPayment({ paymentNo: `SP${Date.now().toString().slice(-5)}`, supplierId: paying.id, supplierName: paying.name, date: today(), time: new Date().toTimeString().slice(0, 5), amount: value, paymentMethod: account.name, accountId: account.id, accountName: account.name, actor: currentUser.name, notes: "Deymaha page" });
    else {
      const movement = paying.direction === "receivable" ? value : -value;
      if (!adjustAccountBalance(account.id, movement, `${paying.direction === "receivable" ? "Deyn la soo celiyay" : "Deyn la bixiyay"}: ${paying.name}`)) return setError("Account-ka lacag ku filan ma leh.");
      if (!addDebtPayment(paying.id, { amount: value, date: new Date().toISOString(), accountId: account.id, accountName: account.name })) return setError("Payment-ka lama kaydin.");
    }
    setPaying(null); setPaymentAmount("");
  };

  const dueBadge = (date: string, balance: number) => {
    const s = debtReminderState(date, balance);
    const label = s === "overdue" ? "Dib u dhacay" : s === "today" ? "Maanta" : s === "tomorrow" ? "Berri" : date ? date : "Due date ma leh";
    return <span className={s === "overdue" ? "text-destructive" : s === "today" || s === "tomorrow" ? "text-[var(--dash-clay)]" : "text-muted-foreground"}>{label}</span>;
  };
  const LinkedTable = ({ kind }: { kind: "customer" | "supplier" }) => {
    const rows = kind === "customer" ? customerRows : supplierRows;
    return <div className="space-y-2">{rows.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Deyn furan ma jirto.</p> : rows.map((r) => <div key={r.id} className="grid gap-3 border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_120px_180px_auto] md:items-center">
      <div className="min-w-0"><strong className="block truncate text-sm text-foreground">{r.name}</strong><span className="text-xs text-muted-foreground">{r.lastRef} · {r.phone || "Lambar ma leh"}</span></div>
      <strong className="text-lg text-foreground">{money(r.balance)}</strong>
      <label className="text-xs text-muted-foreground">Due date<input type="date" value={r.dueDate} onChange={(e) => setLinkedDebtDueDate(`${kind}:${r.id}`, e.target.value)} className={`${inputClass} mt-1`} /></label>
      <div className="flex items-center gap-2 md:justify-end">{r.phone && <Button size="icon" variant="outline" asChild><a href={`tel:${r.phone}`} aria-label={`Wac ${r.name}`}><Phone /></a></Button>}<Button size="sm" onClick={() => setPaying({ id: r.id, kind, name: r.name, balance: r.balance, direction: kind === "customer" ? "receivable" : "payable" })}>Diiwaan geli bixinta</Button></div>
      <div className="text-xs md:col-span-4">{dueBadge(r.dueDate, r.balance)}</div>
    </div>)}</div>;
  };

  return <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><HandCoins className="text-primary" />Deymaha</h1><p className="text-sm text-muted-foreground">Customer, supplier, deyn la bixiyay iyo deyn nalagu leeyahay.</p></div><Button onClick={() => { setError(""); setNewOpen(true); }}><Plus />Deyn cusub</Button></div>
    <section className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 lg:grid-cols-4">
      {[["Nalagu leeyahay", receivable, "text-positive"], ["Annaga nalagu leeyahay", payable, "text-destructive"], ["Farqiga", receivable - payable, "text-foreground"], ["Digniino", reminders.length, "text-[var(--dash-clay)]"]].map(([label, value, tone]) => <div key={String(label)} className="border border-border bg-card p-4"><span className="dashboard-kicker text-muted-foreground">{label}</span><strong className={`mt-1 block break-all text-2xl ${tone}`}>{label === "Digniino" ? value : money(Number(value))}</strong></div>)}
    </section>
    <Tabs defaultValue="customers"><TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4"><TabsTrigger value="customers">Customers</TabsTrigger><TabsTrigger value="suppliers">Suppliers</TabsTrigger><TabsTrigger value="loans">Deyn kale</TabsTrigger><TabsTrigger value="alerts">Alerts ({reminders.length})</TabsTrigger></TabsList>
      <TabsContent value="customers"><LinkedTable kind="customer" /></TabsContent>
      <TabsContent value="suppliers"><LinkedTable kind="supplier" /></TabsContent>
      <TabsContent value="loans" className="space-y-2">{independent.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Deyn madax-bannaan wali lama diiwaan gelin.</p> : independent.map((d) => <div key={d.id} className="grid gap-3 border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_130px_160px_auto] md:items-center"><div><strong className="block text-sm">{d.partyName}</strong><span className="text-xs text-muted-foreground">{d.code} · {d.direction === "receivable" ? "Qof aan amaahinay" : "Qof na amaahiyay"} · {d.phone || "Lambar ma leh"}</span></div><div><strong className="text-lg">{money(d.balance)}</strong><span className="block text-xs text-muted-foreground">Asal {money(d.amount)}</span></div><div className="text-xs">{dueBadge(d.dueDate, d.balance)}<span className="block text-muted-foreground">{d.dueDate}</span></div><div className="flex gap-2 md:justify-end"><Button size="sm" disabled={d.balance <= 0} onClick={() => setPaying({ id: d.id, kind: "independent", name: d.partyName, balance: d.balance, direction: d.direction })}>{d.balance <= 0 ? <><CheckCircle2 />La bixiyay</> : "Payment"}</Button><Button size="icon" variant="outline" disabled={d.payments.length > 0} onClick={() => removeDebt(d.id)} aria-label="Tirtir deynta"><Trash2 /></Button></div></div>)}</TabsContent>
      <TabsContent value="alerts" className="space-y-2">{reminders.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Digniin deyn ma jirto maanta.</p> : reminders.map((r) => <div key={r.key} className="flex items-start gap-3 border border-border bg-card p-4"><AlertTriangle className={r.state === "overdue" ? "text-destructive" : "text-[var(--dash-clay)]"} /><div><strong className="block text-sm">{r.name} · {money(r.balance)}</strong><span className="text-xs text-muted-foreground">{r.type} · {r.dueDate} · {r.state === "overdue" ? "Waqtigii wuu dhaafay" : r.state === "today" ? "Maanta ayaa la sugayaa" : "Berri ayaa la sugayaa"}</span></div></div>)}</TabsContent>
    </Tabs>

    <Dialog open={newOpen} onOpenChange={setNewOpen}><DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Deyn cusub</DialogTitle><DialogDescription>Diiwaan geli lacag qof la amaahiyay ama lacag ganacsiga la amaahiyay.</DialogDescription></DialogHeader><form onSubmit={createDebt} className="space-y-3"><label className="block text-xs font-semibold">Nooca<select value={direction} onChange={(e) => setDirection(e.target.value as DebtDirection)} className={`${inputClass} mt-1`}><option value="receivable">Qof ayaan lacag amaahinay</option><option value="payable">Qof ayaa ganacsiga amaahiyay</option></select></label><label className="block text-xs font-semibold">Magaca<input value={partyName} onChange={(e) => setPartyName(e.target.value)} className={`${inputClass} mt-1`} /></label><label className="block text-xs font-semibold">Telefoon<input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} mt-1`} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold">Lacagta<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} mt-1`} /></label><label className="block text-xs font-semibold">Due date<input type="date" min={today()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${inputClass} mt-1`} /></label></div><label className="block text-xs font-semibold">Payment Account<select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={`${inputClass} mt-1`}>{accounts.filter((a) => a.isActive !== false).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="block text-xs font-semibold">Faahfaahin<textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 min-h-20 w-full rounded-md border border-border bg-background p-3 text-sm" /></label>{error && <p className="text-xs text-destructive">{error}</p>}<Button type="submit" className="w-full">Keydi deynta</Button></form></DialogContent></Dialog>
    <Dialog open={!!paying} onOpenChange={(open) => { if (!open) setPaying(null); }}><DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md"><DialogHeader><DialogTitle>Diiwaan geli bixinta</DialogTitle><DialogDescription>{paying?.name} · hadhay {money(paying?.balance ?? 0)}</DialogDescription></DialogHeader><form onSubmit={makePayment} className="space-y-3"><label className="block text-xs font-semibold">Lacagta<input type="number" min="0.01" max={paying?.balance} step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className={`${inputClass} mt-1`} /></label><label className="block text-xs font-semibold">Account<select value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)} className={`${inputClass} mt-1`}>{accounts.filter((a) => a.isActive !== false).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>{error && <p className="text-xs text-destructive">{error}</p>}<Button type="submit" className="w-full">Xaqiiji payment-ka</Button></form></DialogContent></Dialog>
  </div>;
};