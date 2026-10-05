import { useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import { fmtDateTime } from "@/utils/codes";

export function PaymentsHistoryView() {
  const { sales } = useStore();
  const rows = useMemo(() => [...sales].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)), [sales]);
  return <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6 lg:p-8">
    <div><h2 className="text-xl font-black text-foreground sm:text-2xl">Payments</h2><p className="text-sm text-muted-foreground">Lacagaha iibka la helay.</p></div>
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr><th className="p-3">Tixraac</th><th className="p-3">Macmiil</th><th className="p-3">Habka</th><th className="p-3">Lacagta</th><th className="p-3">Taariikh</th></tr></thead>
      <tbody className="divide-y divide-border">{rows.map((sale) => <tr key={sale.id}><td className="p-3 font-semibold">{sale.invoiceNo}</td><td className="p-3">{sale.customerName}</td><td className="p-3">{sale.paymentMethod}</td><td className="p-3 font-bold">${sale.grandTotal.toFixed(2)}</td><td className="p-3 text-muted-foreground">{fmtDateTime(sale.date, sale.time)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Weli payment lama diiwaan gelin.</td></tr>}</tbody></table>
    </div>
  </div>;
}