import { useState } from "react";
import { DollarSign, Wallet, Banknote, Scale } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsView } from "./AccountsView";
import { PaymentsHistoryView } from "./PaymentsHistoryView";
import { PettyCashView } from "./PettyCashView";
import { EvcReconciliationView } from "./EvcReconciliationView";

type FinanceTab = "payments" | "accounts" | "petty" | "evc";
type Props = { initialTab?: FinanceTab; onOpenTransfer: () => void; onOpenNewExpense: () => void; onOpenNewIncome: () => void };
export function FinanceHubView({ initialTab = "payments", onOpenTransfer, onOpenNewExpense, onOpenNewIncome }: Props) {
  const [tab, setTab] = useState<FinanceTab>(initialTab);
  return <div className="min-w-0"><div className="border-b border-border bg-card px-4 py-3 sm:px-6"><h1 className="text-lg font-bold text-foreground">Payments &amp; Accounts</h1><Tabs value={tab} onValueChange={(v) => setTab(v as FinanceTab)} className="mt-3"><TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit sm:grid-cols-4"><TabsTrigger value="payments"><DollarSign />Payments</TabsTrigger><TabsTrigger value="accounts"><Wallet />Accounts</TabsTrigger><TabsTrigger value="petty"><Banknote />Petty Cash</TabsTrigger><TabsTrigger value="evc"><Scale />EVC</TabsTrigger></TabsList></Tabs></div>
    {tab === "payments" && <PaymentsHistoryView />}{tab === "accounts" && <AccountsView onOpenTransfer={onOpenTransfer} onOpenNewExpense={onOpenNewExpense} onOpenNewIncome={onOpenNewIncome} />}{tab === "petty" && <PettyCashView />}{tab === "evc" && <EvcReconciliationView />}
  </div>;
}