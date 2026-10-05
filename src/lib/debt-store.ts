import { useSyncExternalStore } from "react";

export type DebtDirection = "receivable" | "payable";
export type DebtSource = "customer" | "supplier" | "cash_loan" | "company_loan";

export type DebtPayment = {
  id: string;
  amount: number;
  date: string;
  accountId: string;
  accountName: string;
  note?: string;
};

export type DebtRecord = {
  id: string;
  code: string;
  source: DebtSource;
  direction: DebtDirection;
  partyName: string;
  phone?: string;
  amount: number;
  dueDate: string;
  issuedAt: string;
  accountId?: string;
  accountName?: string;
  note?: string;
  payments: DebtPayment[];
};

export type DebtDueDates = Record<string, string>;
type DebtState = { records: DebtRecord[]; dueDates: DebtDueDates };

const KEY = "benadir_debts_v1";
const EMPTY: DebtState = { records: [], dueDates: {} };
let state: DebtState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : EMPTY;
    state = { records: Array.isArray(parsed.records) ? parsed.records : [], dueDates: parsed.dueDates || {} };
  } catch { state = EMPTY; }
}
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  read();
  window.addEventListener("benadir-remote-update", () => { read(); listeners.forEach((l) => l()); });
}
function save(next: DebtState) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}
export function getDebtState() { load(); return state; }
export function useDebts() {
  load();
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => EMPTY);
}
export function debtBalance(d: DebtRecord) {
  return Math.max(0, d.amount - d.payments.reduce((sum, p) => sum + p.amount, 0));
}
function nextDebtCode(records: DebtRecord[]) {
  const highest = records.reduce((max, r) => Math.max(max, Number(r.code.replace(/\D/g, "")) || 0), 0);
  return `D${String(highest + 1).padStart(5, "0")}`;
}
export function addDebt(input: Omit<DebtRecord, "id" | "code" | "payments">) {
  load();
  const record: DebtRecord = { ...input, id: crypto.randomUUID(), code: nextDebtCode(state.records), payments: [] };
  save({ ...state, records: [record, ...state.records] });
  return record;
}
export function addDebtPayment(debtId: string, payment: Omit<DebtPayment, "id">) {
  load();
  const debt = state.records.find((r) => r.id === debtId);
  if (!debt || payment.amount <= 0 || payment.amount > debtBalance(debt) + 0.004) return false;
  save({ ...state, records: state.records.map((r) => r.id === debtId ? { ...r, payments: [...r.payments, { ...payment, id: crypto.randomUUID() }] } : r) });
  return true;
}
export function removeDebt(id: string) {
  load();
  const debt = state.records.find((r) => r.id === id);
  if (!debt || debt.payments.length) return false;
  save({ ...state, records: state.records.filter((r) => r.id !== id) });
  return true;
}
export function setLinkedDebtDueDate(key: string, dueDate: string) {
  load();
  save({ ...state, dueDates: { ...state.dueDates, [key]: dueDate } });
}
export function debtReminderState(dueDate: string, balance: number, today = new Date().toISOString().slice(0, 10)) {
  if (!dueDate || balance <= 0) return "none" as const;
  const dayBefore = new Date(`${dueDate}T12:00:00`); dayBefore.setDate(dayBefore.getDate() - 1);
  const start = dayBefore.toISOString().slice(0, 10);
  if (today < start) return "none" as const;
  if (today > dueDate) return "overdue" as const;
  if (today === dueDate) return "today" as const;
  return "tomorrow" as const;
}