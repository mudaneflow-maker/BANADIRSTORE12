import { useState } from "react";
import { ClipboardList, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesOrdersView } from "./SalesOrdersView";
import { CustomersView } from "./CustomersView";
import type { Customer, Sale } from "@/types";

type Props = {
  initialTab?: "transactions" | "customers";
  openNewSignal?: number;
  onConvertSale: (orderId: string) => void;
  onViewReceipt: (sale: Sale) => void;
  onOpenReturn: (sale: Sale) => void;
  onReceivePayment: (sale: Sale) => void;
  onOpenNewCustomer: () => void;
  onReceiveCustomerPayment: (customer: Customer | null) => void;
};
export function SalesHubView({ initialTab = "transactions", openNewSignal, onConvertSale, onViewReceipt, onOpenReturn, onReceivePayment, onOpenNewCustomer, onReceiveCustomerPayment }: Props) {
  const [tab, setTab] = useState(initialTab);
  return <div className="min-w-0"><div className="border-b border-border bg-card px-4 py-3 sm:px-6"><h1 className="text-lg font-bold text-foreground">Sales / Orders</h1><Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-3"><TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit"><TabsTrigger value="transactions"><ClipboardList />Sales / Orders</TabsTrigger><TabsTrigger value="customers"><Users />Customers</TabsTrigger></TabsList></Tabs></div>
    {tab === "transactions" && <SalesOrdersView openNewSignal={openNewSignal} onConvertSale={onConvertSale} onViewReceipt={onViewReceipt} onOpenReturn={onOpenReturn} onReceivePayment={onReceivePayment} />}
    {tab === "customers" && <CustomersView onOpenNewCustomer={onOpenNewCustomer} onReceivePayment={onReceiveCustomerPayment} />}
  </div>;
}