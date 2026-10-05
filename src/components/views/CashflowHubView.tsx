import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpensesView } from "./ExpensesView";
import { IncomeView } from "./IncomeView";

type CashflowTab = "income" | "expenses";
export function CashflowHubView({ initialTab = "income", onOpenNewExpense, onOpenNewIncome }: { initialTab?: CashflowTab; onOpenNewExpense: () => void; onOpenNewIncome: () => void }) {
  const [tab, setTab] = useState<CashflowTab>(initialTab);
  return <div className="min-w-0"><div className="border-b border-border bg-card px-4 py-3 sm:px-6"><h1 className="text-lg font-bold text-foreground">Income &amp; Expenses</h1><Tabs value={tab} onValueChange={(v) => setTab(v as CashflowTab)} className="mt-3"><TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit"><TabsTrigger value="income"><TrendingUp />Income</TabsTrigger><TabsTrigger value="expenses"><TrendingDown />Expenses</TabsTrigger></TabsList></Tabs></div>
    {tab === "income" && <IncomeView onOpenNewIncome={onOpenNewIncome} />}{tab === "expenses" && <ExpensesView onOpenNewExpense={onOpenNewExpense} />}
  </div>;
}