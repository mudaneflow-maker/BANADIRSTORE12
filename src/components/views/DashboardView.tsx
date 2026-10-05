import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, TrendingDown, DollarSign, Target, Wallet, Users, Package, Plus, ArrowUpRight, Truck, ChevronRight, Building2, Sparkles, Receipt, CalendarDays, Download, FileText, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { differenceInCalendarDays, eachDayOfInterval, format, parseISO, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useStore } from '../../context/StoreContext';
import { useBalanceVisible, setBalanceVisible } from '@/lib/balance-visibility';
import { useBranches } from '@/lib/branch-store';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { NavSection } from '../layout/Sidebar';
import { computeEngine, useFinEngine } from '@/lib/financial-engine';
import { buildDailyNetMap, buildDailySalesMap, businessDeliveryCost } from '@/lib/daily-net';
import { canAccess, useStaffRole } from '@/lib/roles';
import { verifyBalancePin } from '@/lib/balance-pin.functions';
import { pinErrorMessage } from '@/lib/pin-message';
import { SourceHover, type SourceRow } from '@/components/dashboard/SourceHover';
import { BusinessTargetSummary } from '@/components/dashboard/BusinessTargetSummary';
import { ChangePinModal } from '@/components/modals/ChangePinModal';

interface DashboardViewProps {
  onNavigate: (tab: NavSection) => void;
  onOpenNewSale: () => void;
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
  onOpenReceivePayment: () => void;
  onOpenNewDelivery: () => void;
  onOpenNewAccount: () => void;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenNewSale, onOpenNewExpense, onOpenNewIncome, onOpenReceivePayment, onOpenNewDelivery, onOpenNewAccount }) => {
  const { currentUser, getTodayStats, getPeriodStats, sales, orders, incomes, expenses, products, purchases, returns, inventoryMovements, supplierPayments, transfers, auditLogs, deliveries, cargoShipments, accounts, customers, addExpense } = useStore();
  const { todayNetProfit, todayTarget, targetProgressPct } = getTodayStats();
  const balanceVisible = useBalanceVisible();
  const m = (v: number) => money(v);
  const targetDifference = todayNetProfit - todayTarget;
  const targetStatus = targetDifference > 0 ? 'DHEERI' : targetDifference < 0 ? 'DHIMAN' : 'LA GAARAY';
  const targetAmount = `${targetDifference > 0 ? '+' : targetDifference < 0 ? '-' : ''}${money(Math.abs(targetDifference))}`;
  const { totalRemainingDebt, totalCashInHand, totalStockValueSelling } = getPeriodStats();
  const branches = useBranches();
  const role = useStaffRole();
  const [range, setRange] = useState<DateRange>(() => ({ from: new Date(), to: new Date() }));
  const [comparisonDays, setComparisonDays] = useState(1);
  const [activityQuery, setActivityQuery] = useState('');
  const [activityType, setActivityType] = useState('all');
  const [activityLimit, setActivityLimit] = useState(25);
  const [activityFrom, setActivityFrom] = useState('');
  const [activityTo, setActivityTo] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [capitalVisible, setCapitalVisible] = useState(false);
  useEffect(() => { if (!capitalVisible) return; const t = window.setTimeout(() => setCapitalVisible(false), 5000); return () => window.clearTimeout(t); }, [capitalVisible]);
  const [liveNow, setLiveNow] = useState<Date | null>(null);
  useEffect(() => {
    setLiveNow(new Date());
    const timer = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [personalVisible, setPersonalVisible] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [wdOpen, setWdOpen] = useState(false);
  const [wdAmount, setWdAmount] = useState('');
  const [wdAccountId, setWdAccountId] = useState('');
  const [wdNote, setWdNote] = useState('');
  const [wdError, setWdError] = useState('');
  const [profitMonth, setProfitMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(range);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const start = format(range.from ?? new Date(), 'yyyy-MM-dd');
  const end = format(range.to ?? range.from ?? new Date(), 'yyyy-MM-dd');
  const lengthDays = differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
  const comparisonEnd = format(new Date(), 'yyyy-MM-dd');
  const comparisonStart = format(subDays(parseISO(comparisonEnd), comparisonDays - 1), 'yyyy-MM-dd');
  const prevEnd = format(subDays(parseISO(comparisonStart), 1), 'yyyy-MM-dd');
  const prevStart = format(subDays(parseISO(comparisonStart), comparisonDays), 'yyyy-MM-dd');
  type Day = { sales: number; gross: number; income: number; expenses: number };
  const compute = (from: string, to: string) => {
    const map = new Map<string, Day>();
    const rows: Record<keyof Day, SourceRow[]> = { sales: [], gross: [], income: [], expenses: [] };
    const add = (date: string, field: keyof Day, value: number, label = '', when = date) => {
      const key = (date || '').slice(0, 10);
      if (key < from || key > to) return;
      const day = map.get(key) ?? { sales: 0, gross: 0, income: 0, expenses: 0 };
      day[field] += value || 0;
      map.set(key, day);
      if (value) rows[field].push({ label, date: when, amount: value });
    };
    const showMain = branchFilter === 'all' || branchFilter === 'main';
    if (showMain) {
      sales.filter(s => s.status === 'Completed').forEach(s => { const l = `Sale ${s.invoiceNo} · ${s.customerName}`, w = `${s.date} ${s.time || ''}`; add(s.date, 'sales', s.grandTotal, l, w); add(s.date, 'gross', s.grossProfit, l, w); add(s.date, 'expenses', businessDeliveryCost(s), `Delivery (business) ${s.invoiceNo}`, w); });
      orders.filter(o => o.status === 'delivered' && !o.convertedSaleId).forEach(o => {
        const l = `Order ${o.orderNo} · ${o.customerName}`, w = `${o.date} ${o.time || ''}`;
        add(o.date, 'sales', o.total, l, w);
        add(o.date, 'gross', o.total - o.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0), l, w);
        add(o.date, 'expenses', businessDeliveryCost(o), `Delivery (business) ${o.orderNo}`, w);
      });
    }
    branches.sales.filter(s => branchFilter === 'all' || s.branchId === branchFilter).forEach(s => { const l = `Branch sale · ${s.branchName}`, w = `${s.date} ${s.time || ''}`; add(s.date, 'sales', s.total, l, w); add(s.date, 'gross', s.total - s.cost - s.commission, l, w); });
    if (branchFilter === 'all') {
      incomes.forEach(i => add(i.date, 'income', i.amount, `Income · ${i.title}`));
      expenses.forEach(e => add(e.date, 'expenses', e.amount, `Expense · ${e.title} (${e.category})`));
    }
    const total = [...map.values()].reduce((sum, d) => ({ sales: sum.sales + d.sales, gross: sum.gross + d.gross, income: sum.income + d.income, expenses: sum.expenses + d.expenses }), { sales: 0, gross: 0, income: 0, expenses: 0 });
    const netRows: SourceRow[] = [...rows.gross.map(r => ({ ...r, label: `Gross · ${r.label}` })), ...rows.income, ...rows.expenses.map(r => ({ ...r, amount: -r.amount }))];
    return { map, total, rows, netRows, net: total.gross + total.income - total.expenses };
  };
  const rowsOf = (c: ReturnType<typeof compute>, k: keyof Day | 'net') => k === 'net' ? c.netRows : c.rows[k];
  const NET_F = 'Gross profit + other income − expenses';
  const current = compute(start, end);
  const compared = compute(comparisonStart, comparisonEnd);
  const previous = compute(prevStart, prevEnd);
  const comparisonNow = comparisonDays === 1 ? compute(comparisonEnd, comparisonEnd) : compared;
  const comparisonBefore = comparisonDays === 1 ? compute(prevEnd, prevEnd) : previous;
  const byDay = current.map;
  const performanceData = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(d => {
    const key = format(d, 'yyyy-MM-dd');
    const day = byDay.get(key) ?? { sales: 0, gross: 0, income: 0, expenses: 0 };
    return { date: format(d, 'MMM d'), fullDate: key, sales: day.sales, gross: day.gross, income: day.income, expenses: day.expenses, profit: day.gross + day.income - day.expenses };
  });
  const period = current.total;
  const periodNetProfit = current.net;
  const fmtLabel = (a: string, b: string) => a === b ? format(parseISO(a), 'MMM d, yyyy') : `${format(parseISO(a), 'MMM d, yyyy')} – ${format(parseISO(b), 'MMM d, yyyy')}`;
  const periodLabel = fmtLabel(start, end);
  const comparedLabel = comparisonDays === 1 ? fmtLabel(comparisonEnd, comparisonEnd) : fmtLabel(comparisonStart, comparisonEnd);
  const prevLabel = comparisonDays === 1 ? fmtLabel(prevEnd, prevEnd) : fmtLabel(prevStart, prevEnd);
  const branchName = branchFilter === 'all' ? 'All (store + branches)' : branchFilter === 'main' ? 'Main store' : branches.branches.find(b => b.id === branchFilter)?.name ?? 'Branch';
  const comparison = [
    { label: 'Sales', now: comparisonNow.total.sales, before: comparisonBefore.total.sales, k: 'sales' as const },
    { label: 'Gross profit', now: comparisonNow.total.gross, before: comparisonBefore.total.gross, k: 'gross' as const },
    { label: 'Expenses', now: comparisonNow.total.expenses, before: comparisonBefore.total.expenses, inverse: true, k: 'expenses' as const },
    { label: 'Net profit', now: comparisonNow.net, before: comparisonBefore.net, k: 'net' as const },
  ];
  const pct = (now: number, before: number) => before === 0 ? (now === 0 ? 0 : null) : ((now - before) / Math.abs(before)) * 100;
  const branchRows = [
    ...(() => { const m = new Map<string, { name: string; sales: number; commission: number; profit: number; count: number }>();
      branches.branches.forEach(b => m.set(b.id, { name: b.name, sales: 0, commission: 0, profit: 0, count: 0 }));
      branches.sales.filter(s => s.date >= start && s.date <= end).forEach(s => { const r = m.get(s.branchId) ?? { name: s.branchName, sales: 0, commission: 0, profit: 0, count: 0 }; r.sales += s.total; r.commission += s.commission; r.profit += s.total - s.cost - s.commission; r.count += 1; m.set(s.branchId, r); });
      return [...m.entries()].map(([id, r]) => ({ id, ...r })); })(),
  ];
  const fileBase = `benadir-report-${start}_${end}`;
  const exportCSV = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const safe = (v: string | number) => { const s = String(v); return esc(/^[\s]*[=+@\-]/.test(s) && !/^-\d+(?:\.\d+)?$/.test(s) ? `'${s}` : s); };
    const lines = [
      ['Benadir Store - Sales & Profit Report'], ['Period', periodLabel], ['Comparison', `${comparedLabel} vs ${prevLabel}`], ['Filter', branchName], [],
      ['DASHBOARD KPIs', 'Value'],
      ...metrics.map(m => [m.label, m.value.toFixed(2)]),
      ['Today net profit', pTodayC.net.toFixed(2)], ['Month net profit', pMonthC.net.toFixed(2)], ['Year net profit', pYearC.net.toFixed(2)], ['All-time net profit', allTimeProfit.toFixed(2)],
      ...tgtRows.flatMap(r => [[`${r.label} target`, r.target.toFixed(2)], [`${r.label} sales`, r.sales.toFixed(2)], [`${r.label} difference`, (r.sales - r.target).toFixed(2)]]), [],
      ['Date', 'Sales', 'Gross profit', 'Other income', 'Expenses', 'Net profit'],
      ...performanceData.map(d => [d.fullDate, d.sales.toFixed(2), d.gross.toFixed(2), d.income.toFixed(2), d.expenses.toFixed(2), d.profit.toFixed(2)]),
      ['TOTAL', period.sales.toFixed(2), period.gross.toFixed(2), period.income.toFixed(2), period.expenses.toFixed(2), periodNetProfit.toFixed(2)],
      [], ['Comparison', 'This period', 'Previous period', 'Change %'], ['Previous period', prevLabel],
      ...comparison.map(c => { const p = pct(c.now, c.before); return [c.label, c.now.toFixed(2), c.before.toFixed(2), p === null ? 'new' : p.toFixed(1)]; }),
      [], ['Branch', 'Sales count', 'Sales', 'Commission', 'Profit'],
      ...branchRows.map(r => [r.name, r.count, r.sales.toFixed(2), r.commission.toFixed(2), r.profit.toFixed(2)]),
      [], ['BUSINESS ACTIVITY', `Date: ${activityFrom || 'Any'} to ${activityTo || 'Any'}`, `Type: ${activityType}`, `Search: ${activityQuery}`],
      ['Date / time', 'Event type', 'Reference', 'Details', 'Amount', 'Section'],
      ...visibleActivity.map(a => [a.date, a.type, a.title, a.detail, a.amount ?? '', a.section]),
    ];
    const blob = new Blob(['\ufeff' + lines.map(l => l.map(safe).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fileBase}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const exportPDF = () => {
    const w = window.open('', '_blank'); if (!w) { alert('Fadlan oggolow pop-ups si PDF loo soo dejiyo.'); return; }
    const row = (cells: (string | number)[], tag = 'td') => `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
    w.document.write(`<!doctype html><html><head><title>${fileBase}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0}h2{font-size:14px;margin:20px 0 6px}p{margin:2px 0;font-size:12px;color:#555}table{width:100%;border-collapse:collapse;font-size:11px}td,th{border:1px solid #ccc;padding:4px 6px;text-align:right}td:first-child,th:first-child{text-align:left}th{background:#eee}tfoot td{font-weight:bold}</style></head><body>
      <h1>Benadir Store — Sales & Profit Report</h1><p>Period: ${periodLabel}</p><p>Filter: ${branchName}</p><p>Comparison: ${comparedLabel} vs ${prevLabel}</p>
      <h2>Summary vs previous period</h2><table>${row(['Metric', 'This period', 'Previous', 'Change'], 'th')}${comparison.map(c => { const p = pct(c.now, c.before); return row([c.label, m(c.now), m(c.before), p === null ? 'new' : `${p.toFixed(1)}%`]); }).join('')}</table>
      <h2>Daily breakdown</h2><table>${row(['Date', 'Sales', 'Gross profit', 'Other income', 'Expenses', 'Net profit'], 'th')}${performanceData.map(d => row([d.fullDate, m(d.sales), m(d.gross), m(d.income), m(d.expenses), m(d.profit)])).join('')}<tfoot>${row(['TOTAL', m(period.sales), m(period.gross), m(period.income), m(period.expenses), m(periodNetProfit)])}</tfoot></table>
      <h2>Branches</h2><table>${row(['Branch', 'Sales count', 'Sales', 'Commission', 'Profit'], 'th')}${branchRows.length ? branchRows.map(r => row([r.name, r.count, m(r.sales), m(r.commission), m(r.profit)])).join('') : row(['No branches', '', '', '', ''])}</table>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };
  const setPreset = (days: number) => {
    const next = { from: subDays(new Date(), days - 1), to: new Date() };
    setRange(next);
    setDraftRange(next);
    setRangeOpen(false);
  };
  const fin = useFinEngine();
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const monthStart = todayKey.slice(0, 8) + '01';
  const yearStart = todayKey.slice(0, 4) + '-01-01';
  const weekStartDate = (() => { const d = new Date(); const dow = (d.getDay() + 6) % 7; return format(subDays(d, dow), 'yyyy-MM-dd'); })();
  const pTodayC = compute(todayKey, todayKey), pMonthC = compute(monthStart, todayKey), pYearC = compute(yearStart, todayKey);
  const monthEnd = profitMonth === todayKey.slice(0, 7) ? todayKey : format(new Date(Number(profitMonth.slice(0, 4)), Number(profitMonth.slice(5, 7)), 0), 'yyyy-MM-dd');
  const allTimeC = compute('0000-01-01', todayKey);
  const allTimeProfit = allTimeC.net;
  const monthC = compute(`${profitMonth}-01`, monthEnd);
  const monthProfit = monthC.net;
  // Personal tracker: current cash in hand + all-time net profit, always derived live (never cached).
  const personalTotal = totalCashInHand + allTimeProfit;
  // Total capital = cash in payment accounts + goods value (stock × selling price).
  const totalCapital = totalCashInHand + totalStockValueSelling;
  const capitalRows: SourceRow[] = [
    ...accounts.map(a => ({ label: `Cash · ${a.name}`, amount: a.balance })),
    ...products.filter(p => p.stock).map(p => ({ label: `Stock · ${p.name} · ${p.stock} × $${p.sellingPrice}`, amount: p.sellingPrice * p.stock })),
  ];
  const firstRecord = [todayKey, ...sales.map(x => x.date), ...orders.map(x => x.date), ...branches.sales.map(x => x.date), ...incomes.map(x => x.date), ...expenses.map(x => x.date)].filter(Boolean).sort()[0];
  const monthOptions: string[] = [];
  for (let y = Number(firstRecord.slice(0, 4)); y <= Number(todayKey.slice(0, 4)); y++) {
    for (let m = 1; m <= 12; m++) { const key = `${y}-${String(m).padStart(2, '0')}`; if (key >= firstRecord.slice(0, 7) && key <= todayKey.slice(0, 7)) monthOptions.push(key); }
  }
  monthOptions.reverse();
  const tri = (k: 'sales' | 'gross' | 'income' | 'expenses' | 'net') => {
    const g = (c: ReturnType<typeof compute>) => k === 'net' ? c.net : c.total[k];
    return { today: g(pTodayC), month: g(pMonthC), year: g(pYearC) };
  };
  const engine = computeEngine(todayKey, fin.config, buildDailySalesMap(sales, orders));
  const cycleDays = engine.activeCycle?.days ?? [];
  const sumRange = (a: string, f: 'adjustedTarget' | 'achievement') => cycleDays.filter(d => d.date >= a && d.date <= todayKey).reduce((x, d) => x + d[f], 0);
  const tgtRows = [
    { label: 'Daily', target: engine.todayFinalTarget, sales: engine.todaySales },
    { label: 'Weekly', target: sumRange(weekStartDate, 'adjustedTarget'), sales: sumRange(weekStartDate, 'achievement') },
    { label: 'Monthly', target: engine.activeCycle?.effectiveMonthlyRequirement ?? 0, sales: engine.activeCycle?.totalActualSales ?? 0 },
  ];
  // Dheeriga Guud: cumulative month-to-date surplus (month start → today), withdrawable.
  const cumTarget = sumRange(monthStart, 'adjustedTarget');
  const cumAch = sumRange(monthStart, 'achievement');
  const totalSurplus = Math.max(0, cumAch - cumTarget);
  type Activity = { id: string; date: string; type: string; title: string; detail: string; amount?: number; section: NavSection };
  const activity: Activity[] = [];
  const addActivity = (row: Activity) => { if (canAccess(role, row.section) && (!activityFrom || row.date.slice(0, 10) >= activityFrom) && (!activityTo || row.date.slice(0, 10) <= activityTo)) activity.push(row); };
  if (branchFilter === 'all' || branchFilter === 'main') {
    sales.forEach(s => addActivity({ id: `sale-${s.id}`, date: `${s.date} ${s.time || ''}`, type: 'Sale', title: s.invoiceNo, detail: `${s.customerName} · ${s.status} · ${s.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')} · Paid ${m(s.amountPaid)} · Profit ${m(s.grossProfit - businessDeliveryCost(s))}`, amount: s.grandTotal, section: 'sales' }));
    orders.forEach(o => addActivity({ id: `order-${o.id}`, date: `${o.date} ${o.time || ''}`, type: 'Order', title: o.orderNo, detail: `${o.customerName} · ${o.status} · ${o.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')} · Paid ${m(o.paidAmount)}`, amount: o.total, section: 'sales' }));
    sales.filter(s => s.status === 'Completed' && businessDeliveryCost(s) > 0).forEach(s => addActivity({ id: `delivery-cost-sale-${s.id}`, date: `${s.date} ${s.time || ''}`, type: 'Delivery expense', title: s.invoiceNo, detail: `Business-paid delivery · ${s.customerName}`, amount: -businessDeliveryCost(s), section: 'sales' }));
    orders.filter(o => o.status === 'delivered' && !o.convertedSaleId && businessDeliveryCost(o) > 0).forEach(o => addActivity({ id: `delivery-cost-order-${o.id}`, date: `${o.date} ${o.time || ''}`, type: 'Delivery expense', title: o.orderNo, detail: `Business-paid delivery · ${o.customerName}`, amount: -businessDeliveryCost(o), section: 'sales' }));
  }
  branches.sales.filter(s => branchFilter === 'all' || s.branchId === branchFilter).forEach(s => addActivity({ id: `branch-sale-${s.id}`, date: `${s.date} ${s.time || ''}`, type: 'Branch sale', title: s.branchName, detail: `${s.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')} · Commission ${m(s.commission)} · Profit ${m(s.total - s.cost - s.commission)} · ${s.managerName || 'Branch Admin —'}`, amount: s.total, section: 'branches' }));
  branches.transfers.filter(t => branchFilter === 'all' || t.branchId === branchFilter).forEach(t => addActivity({ id: `branch-transfer-${t.id}`, date: t.date, type: 'Branch stock', title: t.productName, detail: `${branches.branches.find(b => b.id === t.branchId)?.name || 'Branch'} · ${t.quantity} units transferred`, section: 'branches' }));
  if (branchFilter === 'all' || branchFilter === 'main') {
    purchases.forEach(p => addActivity({ id: `purchase-${p.id}`, date: `${p.date} ${p.time || ''}`, type: 'Purchase', title: p.purchaseNo, detail: `${p.supplierName} · ${p.status} · ${p.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')} · Paid ${m(p.paidAmount)}`, amount: p.totalAmount, section: 'purchases' }));
    returns.forEach(r => addActivity({ id: `return-${r.id}`, date: r.date, type: 'Return', title: r.returnNo, detail: `${r.customerName} · ${r.originalInvoiceNo} · ${r.reason}`, amount: -r.totalRefund, section: 'returns' }));
    inventoryMovements.forEach(m => addActivity({ id: `stock-${m.id}`, date: m.date, type: 'Stock movement', title: m.productName, detail: `${m.type} · ${m.quantityChange > 0 ? '+' : ''}${m.quantityChange} units · Balance ${m.stockAfter}${m.reason ? ` · ${m.reason}` : ''}`, section: 'inventory' }));
    supplierPayments.forEach(p => addActivity({ id: `supplier-payment-${p.id}`, date: `${p.date} ${p.time || ''}`, type: 'Supplier payment', title: p.paymentNo, detail: `${p.supplierName} · ${p.purchaseNo || ''} · ${p.accountName}`, amount: -p.amount, section: 'suppliers' }));
    deliveries.forEach(d => addActivity({ id: `delivery-${d.id}`, date: d.assignedAt, type: 'Delivery', title: d.invoiceNo, detail: `${d.customerName} · ${d.status} · ${d.driverName || 'Unassigned'} · ${d.deliveryAddress} · Collected ${m(d.cashCollected)}`, section: 'delivery' }));
    cargoShipments.forEach(c => addActivity({ id: `cargo-${c.id}`, date: c.date, type: 'Cargo', title: c.trackingNo, detail: `${c.customerName} · ${c.destinationCity} · ${c.status} · ${c.cargoCompany}`, amount: c.codAmount, section: 'cargo' }));
    transfers.forEach(t => addActivity({ id: `transfer-${t.id}`, date: t.date, type: 'Account transfer', title: `${t.fromAccountName} → ${t.toAccountName}`, detail: t.note || `Recorded by ${t.performedBy}`, amount: t.amount, section: 'accounts' }));
  }
  if (branchFilter === 'all') {
    incomes.forEach(i => addActivity({ id: `income-${i.id}`, date: i.date, type: 'Other income', title: i.title, detail: `${i.category} · ${i.depositedToAccountName}${i.notes ? ` · ${i.notes}` : ''}`, amount: i.amount, section: 'income' }));
    expenses.forEach(e => addActivity({ id: `expense-${e.id}`, date: e.date, type: 'Expense', title: e.title, detail: `${e.category}${e.adProductName ? ` · ${e.adProductName}` : ''} · ${e.paidFromAccountName}${e.notes ? ` · ${e.notes}` : ''}`, amount: -e.amount, section: 'expenses' }));
    fin.fundTransfers.forEach(t => addActivity({ id: `fund-${t.id}`, date: t.createdAt || t.date, type: 'Petty cash', title: t.fromAccountName, detail: `Fund transfer · ${t.notes || 'No note'} · ${t.createdBy}`, amount: t.amount, section: 'pettycash' }));
    fin.reconciliations.forEach(r => addActivity({ id: `reconciliation-${r.id}`, date: r.createdAt || r.date, type: 'EVC reconciliation', title: r.accountName, detail: `System ${m(r.ledgerBalance)} · Actual ${m(r.liveBalance)} · Difference ${m(r.difference)} · ${r.reason}`, section: 'evcrecon' }));
    auditLogs.forEach(a => addActivity({ id: `audit-${a.id}`, date: a.timestamp, type: 'System event', title: a.action, detail: `${a.target} · ${a.actor}${a.details ? ` · ${a.details}` : ''}`, section: 'settings' }));
  }
  activity.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const activityTypes = [...new Set(activity.map(a => a.type))].sort();
  const visibleActivity = activity.filter(a => (activityType === 'all' || a.type === activityType) && `${a.title} ${a.detail} ${a.type} ${a.date}`.toLowerCase().includes(activityQuery.toLowerCase().trim()));
  const inRange = (date: string) => { const k = (date || '').slice(0, 10); return k >= start && k <= end; };
  const showMainBranch = branchFilter === 'all' || branchFilter === 'main';
  const periodDeliveryExpense = (showMainBranch
    ? sales.filter(s => s.status === 'Completed' && inRange(s.date)).reduce((sum, s) => sum + businessDeliveryCost(s), 0)
      + orders.filter(o => o.status === 'delivered' && !o.convertedSaleId && inRange(o.date)).reduce((sum, o) => sum + businessDeliveryCost(o), 0)
    : 0);
  const periodDailyExpenses = branchFilter === 'all' ? expenses.filter(e => inRange(e.date)).reduce((sum, e) => sum + e.amount, 0) : 0;
  const metrics = [
    { id: 'kpi-today-sales', label: 'Sales', value: period.sales, rows: current.rows.sales, note: 'Completed sales & orders', icon: ShoppingCart, to: 'sales' as NavSection, tone: 'mint' },
    { id: 'kpi-total-income', label: 'Other Income', value: period.income, rows: current.rows.income, note: 'Services & other income', icon: TrendingUp, to: 'income' as NavSection, tone: 'teal' },
    { id: 'kpi-total-expenses', label: 'Expenses', value: period.expenses, rows: current.rows.expenses, note: `Delivery ${m(periodDeliveryExpense)} · Daily ${m(periodDailyExpenses)}`, icon: TrendingDown, to: 'expenses' as NavSection, tone: 'clay' },
    { id: 'kpi-net-profit', label: 'Gross Profit', value: period.gross, rows: current.rows.gross, note: 'After cost & commissions', icon: DollarSign, to: 'reports' as NavSection, tone: 'mint' },
    { id: 'kpi-receivables-debt', label: 'Receivables', value: totalRemainingDebt, rows: customers.filter(c => c.balance).map(c => ({ label: `${c.code || ''} ${c.name}`.trim(), amount: c.balance })), note: 'Customer credit', icon: Users, to: 'customers' as NavSection, tone: 'clay' },
    { id: 'kpi-stock-valuation', label: 'Stock Value', value: totalStockValueSelling, rows: products.filter(p => p.stock).map(p => ({ label: `${p.name} · ${p.stock} × $${p.sellingPrice}`, amount: p.sellingPrice * p.stock })), note: `${products.length} active products`, icon: Package, to: 'inventory' as NavSection, tone: 'mint' },
  ];
  const actions = [
    { label: 'New Sale', icon: ShoppingCart, action: onOpenNewSale },
    { label: 'Quick POS', icon: Sparkles, action: () => onNavigate('pos') },
    { label: 'New Expense', icon: TrendingDown, action: onOpenNewExpense },
    { label: 'New Purchase', icon: Building2, action: () => onNavigate('purchases') },
    { label: 'Add Income', icon: TrendingUp, action: onOpenNewIncome },
    { label: 'Collection', icon: Receipt, action: onOpenReceivePayment },
    { label: 'New Delivery', icon: Truck, action: onOpenNewDelivery },
    { label: 'Transfer', icon: Wallet, action: onOpenNewAccount },
  ];
  const assets = [
    { name: 'Cash in Hand', value: balanceVisible ? totalCashInHand : 0, color: 'var(--dash-mint)' },
    { name: 'Receivables', value: totalRemainingDebt, color: 'var(--dash-clay)' },
    { name: 'Stock Value', value: totalStockValueSelling, color: 'var(--dash-forest)' },
  ];
  const hasAssets = assets.some(x => x.value > 0);
  const pool = assets.reduce((sum, x) => sum + x.value, 0);
  const currentHour = liveNow?.getHours();
  const greeting = currentHour === undefined
    ? 'Subax wanaagsan'
    : currentHour < 12
      ? 'Subax wanaagsan'
      : currentHour < 18
        ? 'Galab wanaagsan'
        : 'Habeen wanaagsan';
  const liveTime = liveNow?.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) ?? '--:--:--';
  return (
    <div className="dashboard-surface min-h-full px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
      <div className="mx-auto max-w-[1440px] space-y-3">
        {/* DESKTOP HEADER & BALANCES */}
        <section className="flex flex-col gap-3 border-b sm:flex-row sm:items-start sm:justify-between border-border pb-3">
          <div className="min-w-0">
            <div className="dashboard-kicker mb-1 sm:mb-2 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--dash-mint)]" />
              STORE OVERVIEW <span className="text-muted-foreground">/ {periodLabel}</span>
            </div>
            <h1 className="dashboard-heading truncate text-lg sm:text-3xl font-bold text-foreground">
              {greeting}, {currentUser.name}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Sales & Profit · <time dateTime={liveNow?.toISOString()} className="font-semibold tabular-nums text-foreground">{liveTime}</time>
            </p>
          </div>

          {/* Desktop-only top right hidden balance cards */}
          <div className="hidden sm:flex sm:ml-auto sm:w-auto sm:shrink-0 sm:items-stretch sm:gap-2">
            <div className="flex min-w-[140px] flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-2 py-1.5 text-center" aria-label="Total account balance">
              <span className="dashboard-kicker truncate text-[11px] text-muted-foreground">Lacagta guud</span>
              <strong className="truncate text-xl font-bold text-foreground">{balanceVisible ? m(totalCashInHand) : '••••••'}</strong>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { if (balanceVisible) setBalanceVisible(false); else { setPin(''); setPinError(''); setPinOpen(true); } }} aria-label={balanceVisible ? 'Qari lacagta' : 'Arag lacagta'}>
                {balanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="ml-1">{balanceVisible ? 'Qari' : 'Arag'}</span>
              </Button>
            </div>
            <div className="flex min-w-[150px] flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-2 py-1.5 text-right" aria-label="Capital-ka guud">
              <span className="dashboard-kicker block truncate text-[11px] text-muted-foreground">Capital (Cash + Stock)</span>
              <strong className="block truncate text-base font-bold text-foreground">{capitalVisible && balanceVisible ? <SourceHover title="Capital-ka guud · Cash + Badeeco" rows={capitalRows}>{m(totalCapital)}</SourceHover> : '••••••'}</strong>
              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => { if (capitalVisible && balanceVisible) setCapitalVisible(false); else { setCapitalVisible(true); if (!balanceVisible) { setPin(''); setPinError(''); setPinOpen(true); } } }}>
                {capitalVisible && balanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="flex min-w-[150px] flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-2 py-1.5 text-right" aria-label="Lacagta + Net Profit">
              <span className="dashboard-kicker block truncate text-[11px] text-muted-foreground">Lacagta + Net Profit</span>
              <strong className="block truncate text-base font-bold text-foreground">{personalVisible && balanceVisible ? m(personalTotal) : '••••••'}</strong>
              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => { if (personalVisible && balanceVisible) setPersonalVisible(false); else { setPersonalVisible(true); if (!balanceVisible) { setPin(''); setPinError(''); setPinOpen(true); } } }}>
                {personalVisible && balanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* MOBILE EXECUTIVE HERO (FIRST PRIORITY — ZERO SCROLL)   */}
        {/* Shows: Target, Sales, Net Profit, Dheeriga Guud right away */}
        {/* ======================================================== */}
        <section className="block sm:hidden space-y-2.5">
          {/* 3-PILLAR INSTANT TILES: TARGET | SALES | NET PROFIT */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* 1. Target Maanta */}
            <div className="rounded-xl border border-primary/40 bg-card p-2 text-center shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                Target Maanta
              </span>
              <strong className="text-base font-black text-foreground block truncate mt-0.5">
                {m(engine.todayFinalTarget ?? 3.46)}
              </strong>
              <span className="text-[9px] text-primary font-semibold block truncate">
                Final Target
              </span>
            </div>

            {/* 2. Sales Maanta */}
            <div className="rounded-xl border border-border bg-card p-2 text-center shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                Sales Maanta
              </span>
              <strong className="text-base font-black text-foreground block truncate mt-0.5">
                {m(pTodayC.total.sales)}
              </strong>
              <span className="text-[9px] text-muted-foreground block truncate">
                {pTodayC.total.sales >= (engine.todayFinalTarget ?? 3.46) ? "La Gaaray" : "Socda"}
              </span>
            </div>

            {/* 3. Net Profit Maanta */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 text-center shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block truncate">
                Net Profit
              </span>
              <strong className="text-base font-black text-emerald-700 dark:text-emerald-300 block truncate mt-0.5">
                {m(pTodayC.net)}
              </strong>
              <span className="text-[9px] text-emerald-600/80 font-semibold block truncate">
                Maanta
              </span>
            </div>
          </div>

          {/* PROGRESS & SURPLUS STRIP */}
          {(() => {
            const todayFinal = engine.todayFinalTarget ?? 3.46;
            const todaySales = pTodayC.total.sales;
            const diff = todaySales - todayFinal;
            const pctVal = Math.min(100, Math.round((todaySales / Math.max(0.01, todayFinal)) * 100));

            return (
              <div className="rounded-xl border border-border bg-card p-2.5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary" /> Target Maanta
                  </span>
                  <span className={`font-bold text-[11px] ${diff >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {diff >= 0 ? `+${m(diff)} Dheeri` : `${m(Math.abs(diff))} Hadhay`} ({pctVal}%)
                  </span>
                </div>
                {/* Visual progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${pctVal}%` }}
                  />
                </div>

                {/* Dheeriga Guud & Withdraw on Mobile */}
                <div className="pt-1.5 border-t border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                      Dheeriga Guud (Bishan):
                    </span>
                    <strong className={`text-sm font-extrabold ${totalSurplus > 0 ? "text-emerald-600" : "text-foreground"}`}>
                      {m(totalSurplus)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground text-right block">
                      Bisha Target: <b className="text-foreground">{m(93.50)}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => setChangePinModalOpen(true)}
                      className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md border border-amber-300/60"
                      title="Beddel PIN-ka default-ka ah (8125)"
                    >
                      <KeyRound className="w-3 h-3 text-amber-700" /> PIN: 8125 (Beddel)
                    </button>
                    <Button
                      size="sm"
                      disabled={totalSurplus <= 0}
                      onClick={() => {
                        setWdAmount(totalSurplus.toFixed(2));
                        setWdAccountId(accounts[0]?.id ?? '');
                        setWdNote('');
                        setWdError('');
                        setWdOpen(true);
                      }}
                      className="h-7 px-2.5 text-[11px] font-bold"
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* MOBILE-ONLY SECONDARY BALANCE CARDS (MOVED DOWN ON MOBILE) */}
        <section className="block sm:hidden rounded-xl border border-border bg-card p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
            <span>Lacagta & Capital (La qariyay)</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 px-1.5 text-[10px]"
              onClick={() => {
                if (balanceVisible) setBalanceVisible(false);
                else { setPin(''); setPinError(''); setPinOpen(true); }
              }}
            >
              {balanceVisible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {balanceVisible ? 'Qari' : 'Arag'}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-1.5 bg-muted/30 rounded-lg">
              <span className="text-[9px] text-muted-foreground block truncate">Lacagta Guud</span>
              <strong className="text-xs font-bold text-foreground block truncate">{balanceVisible ? m(totalCashInHand) : '••••••'}</strong>
            </div>
            <div className="p-1.5 bg-muted/30 rounded-lg">
              <span className="text-[9px] text-muted-foreground block truncate">Capital</span>
              <strong className="text-xs font-bold text-foreground block truncate">{capitalVisible && balanceVisible ? m(totalCapital) : '••••••'}</strong>
            </div>
            <div className="p-1.5 bg-muted/30 rounded-lg">
              <span className="text-[9px] text-muted-foreground block truncate">+ Net Profit</span>
              <strong className="text-xs font-bold text-foreground block truncate">{personalVisible && balanceVisible ? m(personalTotal) : '••••••'}</strong>
            </div>
          </div>
        </section>

        <section aria-label="Filters and export" className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Branch
            <select aria-label="Branch filter" value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="h-9 rounded-md border border-border bg-card px-2 text-xs font-semibold text-foreground">
              <option value="all">All (store + branches)</option>
              <option value="main">Main store</option>
              {branches.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1" aria-label="Date presets">
              <Button size="sm" variant={lengthDays === 1 && start === format(new Date(), 'yyyy-MM-dd') ? 'default' : 'outline'} onClick={() => setPreset(1)}>Today</Button>
              <Button size="sm" variant={lengthDays === 7 ? 'default' : 'outline'} onClick={() => setPreset(7)}>7 days</Button>
              <Button size="sm" variant={lengthDays === 30 ? 'default' : 'outline'} onClick={() => setPreset(30)}>30 days</Button>
            </div>
            <Popover open={rangeOpen} onOpenChange={open => { setRangeOpen(open); if (open) setDraftRange(range); }}>
              <PopoverTrigger asChild><Button variant="outline" size="sm" aria-label="Choose date range" className="dashboard-date gap-2 border-border bg-card text-xs font-semibold"><CalendarDays className="h-4 w-4 text-primary" />{periodLabel}</Button></PopoverTrigger>
              <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] p-3 pointer-events-auto">
                <Calendar mode="range" selected={draftRange} onSelect={setDraftRange} numberOfMonths={1} disabled={{ after: new Date() }} className="pointer-events-auto" />
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3"><span className="text-xs text-muted-foreground">{draftRange?.from ? format(draftRange.from, 'MMM d, yyyy') : 'Start'} – {draftRange?.to ? format(draftRange.to, 'MMM d, yyyy') : 'End'}</span><Button size="sm" disabled={!draftRange?.from || !draftRange?.to} onClick={() => { if (draftRange?.from && draftRange.to) { setRange(draftRange); setRangeOpen(false); } }}>Apply</Button></div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChangePinModalOpen(true)}
              className="gap-1.5 border-amber-300/80 bg-amber-50/70 hover:bg-amber-100 text-amber-950 font-bold text-xs"
              title="Beddel PIN-ka default-ka ah ee lacagta iyo Auto-Lock (8125)"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-700" />
              <span>PIN: 8125 (Beddel)</span>
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5"><Download className="h-4 w-4" />CSV</Button>
            <Button size="sm" variant="outline" onClick={exportPDF} className="gap-1.5"><FileText className="h-4 w-4" />PDF</Button>
          </div>
        </section>
        {branchFilter !== 'all' && <p className="-mt-3 text-[11px] text-muted-foreground">Other income & expenses are counted only under “All”.</p>}

        <section aria-label="Period comparison" className="dashboard-panel border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="dashboard-heading text-base font-semibold text-foreground">Compared with previous period</h2><p className="text-xs text-muted-foreground">{comparedLabel} vs {prevLabel} · {branchName}</p></div><label className="text-xs text-muted-foreground">Comparison <select aria-label="Comparison days" value={comparisonDays} onChange={e => setComparisonDays(Number(e.target.value))} className="ml-2 h-9 rounded border border-border bg-card px-2 text-foreground"><option value={1}>Today vs yesterday</option><option value={16}>16 days</option><option value={7}>7 days</option><option value={30}>30 days</option>{lengthDays !== 1 && <option value={lengthDays}>Selected range ({lengthDays} days)</option>}</select></label></div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{comparison.map(c => { const p = pct(c.now, c.before); const good = p === null ? true : c.inverse ? p <= 0 : p >= 0; return (
            <div key={c.label} className="border border-border p-3"><div className="dashboard-kicker text-muted-foreground">{c.label}</div><div className="dashboard-heading mt-1 text-lg font-semibold text-foreground"><SourceHover title={`${c.label} · ${comparedLabel}`} formula={c.k === 'net' ? NET_F : undefined} rows={rowsOf(comparisonNow, c.k)}>{m(c.now)}</SourceHover></div><div className="mt-1 flex items-center justify-between text-[11px]"><span className="text-muted-foreground">Before <SourceHover title={`${c.label} · ${prevLabel}`} rows={rowsOf(comparisonBefore, c.k)}>{m(c.before)}</SourceHover></span><strong className={good ? 'text-primary' : 'text-destructive'}>{p === null ? 'new' : `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`}</strong></div></div>
          ); })}</div>
        </section>

        <section aria-label="Daily performance" className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          <div id="kpi-today-net-profit" className="dashboard-feature dashboard-feature-profit flex min-h-[150px] flex-col justify-between gap-2 p-4">
            <div className="flex items-center justify-between"><span className="dashboard-kicker text-primary-foreground/70">NET PROFIT / TODAY</span><ArrowUpRight className="h-4 w-4 text-primary-foreground/70" /></div>
            <div><div className="dashboard-heading break-all text-2xl font-bold text-primary-foreground sm:text-3xl"><SourceHover title="Net profit · Maanta" formula={NET_F} rows={pTodayC.netRows}>{m(pTodayC.net)}</SourceHover></div><p className="mt-0.5 text-[11px] text-primary-foreground/75">Gross profit + other income − expenses</p></div>
            {(() => { const t = engine.today?.adjustedTarget ?? 0, a = engine.today?.achievement ?? 0; const cells: [string, number][] = [['Target maanta', t], ['La gaaray', a], ['Hadhay', Math.max(0, t - a)], ['Dheeri', Math.max(0, a - t)]]; return (
              <div className="dashboard-pop grid grid-cols-2 gap-2 rounded-md bg-primary-foreground/10 p-2 text-xs sm:grid-cols-4">{cells.map(([l, v]) => <div key={l}><span className="block text-primary-foreground/70">{l}</span><strong className="text-sm text-primary-foreground">{m(v)}</strong></div>)}</div>
            ); })()}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-primary-foreground/20 pt-3 text-xs sm:grid-cols-3">
              <div><span className="block text-primary-foreground/70">This month · 1–today</span><strong className="text-sm text-primary-foreground"><SourceHover title="Net profit · Bishan" formula={NET_F} rows={pMonthC.netRows}>{m(pMonthC.net)}</SourceHover></strong></div>
              <div><span className="block text-primary-foreground/70">This year</span><strong className="text-sm text-primary-foreground"><SourceHover title="Net profit · Sannadka" formula={NET_F} rows={pYearC.netRows}>{m(pYearC.net)}</SourceHover></strong></div>
              <div><span className="block text-primary-foreground/70">All time</span><strong className="text-sm text-primary-foreground"><SourceHover title="Net profit · All time" formula={NET_F} rows={allTimeC.netRows}>{m(allTimeProfit)}</SourceHover></strong></div>
            </div>
            <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-primary-foreground/75">Monthly history
              <select aria-label="Profit month" value={profitMonth} onChange={e => setProfitMonth(e.target.value)} className="max-w-full rounded border border-primary-foreground/30 bg-primary px-2 py-1 text-primary-foreground">{monthOptions.map(m => <option key={m} value={m}>{format(parseISO(`${m}-01`), 'MMMM yyyy')}</option>)}</select>
              <strong className="text-primary-foreground"><SourceHover title={`Net profit · ${profitMonth}`} formula={NET_F} rows={monthC.netRows}>{m(monthProfit)}</SourceHover></strong>
            </label>
          </div>
          <div className="dashboard-feature dashboard-feature-summary flex min-h-[150px] flex-col justify-between border border-border p-4"><span className="dashboard-kicker text-muted-foreground">SELECTED PERIOD</span><div className="space-y-2 text-sm"><div className="flex items-center justify-between border-b border-border pb-2"><span className="text-muted-foreground">Sales</span><strong className="font-semibold text-foreground"><SourceHover title={`Sales · ${periodLabel}`} rows={current.rows.sales}>{m(period.sales)}</SourceHover></strong></div><div className="flex items-center justify-between border-b border-border pb-2"><span className="text-muted-foreground">Gross profit</span><strong className="font-semibold text-foreground"><SourceHover title={`Gross profit · ${periodLabel}`} rows={current.rows.gross}>{m(period.gross)}</SourceHover></strong></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Expenses</span><strong className="font-semibold text-[var(--dash-clay)]"><SourceHover title={`Expenses · ${periodLabel}`} rows={current.rows.expenses}>{m(period.expenses)}</SourceHover></strong></div></div></div>
        </section>

        <BusinessTargetSummary engine={engine} />

        <section aria-label="Dheeriga Guud" className="border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="dashboard-heading text-base font-semibold text-foreground">Dheeriga Guud (bisha ilaa maanta)</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Net profit-ka ka badan target-ka isugu jirta — waxaad ka bixin kartaa si alaab loogu soo iibsado dukaanka.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right"><span className="dashboard-kicker block text-muted-foreground">Target (ilaa maanta)</span><strong className="text-sm text-foreground">{m(cumTarget)}</strong></div>
              <div className="text-right"><span className="dashboard-kicker block text-muted-foreground">La gaaray</span><strong className="text-sm text-foreground">{m(cumAch)}</strong></div>
              <div className="text-right"><span className="dashboard-kicker block text-muted-foreground">Dheeriga Guud</span><strong className={`text-lg font-bold ${totalSurplus > 0 ? 'text-positive' : 'text-foreground'}`}>{m(totalSurplus)}</strong></div>
              <Button disabled={totalSurplus <= 0} onClick={() => { setWdAmount(totalSurplus.toFixed(2)); setWdAccountId(accounts[0]?.id ?? ''); setWdNote(''); setWdError(''); setWdOpen(true); }}>Withdraw</Button>
            </div>
          </div>
        </section>

        <section aria-label="Targets" className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {tgtRows.map(r => { const remaining = Math.max(0, r.target - r.sales); const extra = Math.max(0, r.sales - r.target); const isDaily = r.label === 'Daily'; return (
            <div key={r.label} id={`kpi-target-${r.label.toLowerCase()}`} onClick={() => onNavigate('targets')} className={`cursor-pointer border border-border bg-card p-3 transition-colors hover:bg-accent ${isDaily ? 'border-primary' : ''}`}>
              <div className="flex items-center justify-between"><span className="dashboard-kicker text-muted-foreground">{isDaily ? 'Today' : r.label} target</span><Target className="h-4 w-4 text-[var(--dash-clay)]" /></div>
              {isDaily && <strong className={`dashboard-pop mt-1 block text-xl font-bold sm:text-2xl ${extra > 0 ? 'text-positive' : remaining > 0 ? 'text-destructive' : 'text-foreground'}`}>{extra > 0 ? '+' : remaining > 0 ? '-' : ''}{m(extra > 0 ? extra : remaining)}</strong>}
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Target</span><strong className="text-foreground">{m(r.target)}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sales la gaaray</span><strong className="text-foreground">{m(r.sales)}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><strong className="text-destructive">{m(remaining)}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dheeri (extra)</span><strong className="text-primary">{m(extra)}</strong></div>
              </div>
            </div>
          ); })}
        </section>

        <section aria-label="Today month year" className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {([['Sales', 'sales'], ['Net Profit', 'net'], ['Gross Profit', 'gross'], ['Other Income', 'income'], ['Expenses', 'expenses']] as const).map(([label, k]) => { const v = tri(k); return (
            <div key={k} id={`kpi-tri-${k}`} className="border border-border bg-card p-3.5">
              <div className="dashboard-kicker text-muted-foreground">{label}</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Maanta</span><strong className="text-foreground"><SourceHover title={`${label} · Maanta`} formula={k === 'net' ? NET_F : undefined} rows={rowsOf(pTodayC, k)}>{m(v.today)}</SourceHover></strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bishan (1 – maanta)</span><strong className="text-foreground"><SourceHover title={`${label} · Bishan`} formula={k === 'net' ? NET_F : undefined} rows={rowsOf(pMonthC, k)}>{m(v.month)}</SourceHover></strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sannadka (1/1 – maanta)</span><strong className="text-foreground"><SourceHover title={`${label} · Sannadka`} formula={k === 'net' ? NET_F : undefined} rows={rowsOf(pYearC, k)}>{m(v.year)}</SourceHover></strong></div>
              </div>
            </div>
          ); })}
        </section>

        <section aria-label="Store metrics" className="dashboard-metric-grid grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
          {metrics.map(({ id, label, value, rows, note, icon: Icon, to, tone }) => (
            <Button key={id} id={id} variant="ghost" onClick={() => onNavigate(to)} className="dashboard-metric group flex h-auto min-h-[107px] flex-col items-start justify-between whitespace-normal border border-border p-3.5 text-left hover:bg-accent sm:p-4">
              <div className="flex w-full items-start justify-between gap-2"><span className="dashboard-kicker text-muted-foreground">{label}</span><Icon className={`h-4 w-4 shrink-0 dashboard-icon-${tone}`} /></div>
              <div className="w-full"><div className="dashboard-heading break-all text-xl font-semibold text-foreground sm:text-2xl"><SourceHover title={label} rows={rows}>{m(value)}</SourceHover></div><div className="mt-0.5 truncate text-[11px] font-normal text-muted-foreground">{note}</div></div>
            </Button>
          ))}
        </section>

        <section className="border-y border-border py-4"><div className="mb-3 flex items-center justify-between"><h2 className="dashboard-heading text-sm font-semibold text-foreground">Quick actions</h2><span className="dashboard-kicker text-muted-foreground">OPERATIONS</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">{actions.map(({ label, icon: Icon, action }) => <Button key={label} id={label === 'New Sale' ? 'btn-quick-new-sale' : undefined} variant="outline" onClick={action} className="dashboard-action h-11 justify-start gap-2 px-3 text-xs font-semibold shadow-none"><Icon className="h-4 w-4 text-primary" />{label}</Button>)}</div></section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(270px,1fr)]">
          <div className="dashboard-panel min-w-0 border border-border bg-card p-4 sm:p-5"><div className="mb-5 flex flex-wrap items-start justify-between gap-2"><div><h2 className="dashboard-heading text-base font-semibold text-foreground">Daily sales & net profit</h2><p className="text-xs text-muted-foreground">{periodLabel} · Completed sales, orders & branches</p></div><div className="flex gap-3 text-[11px] font-medium text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--dash-forest)]" />Sales</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--dash-clay)]" />Net profit</span></div></div><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData} margin={{ top: 8, right: 8, left: -23, bottom: 0 }}><CartesianGrid stroke="var(--dash-line)" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--dash-subtle)' }} axisLine={false} tickLine={false} minTickGap={15} /><YAxis tick={{ fontSize: 10, fill: 'var(--dash-subtle)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} /><Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: 4, fontSize: 12 }} formatter={(value: number) => m(value)} /><Area name="Sales" type="monotone" dataKey="sales" stroke="var(--dash-forest)" strokeWidth={2} fill="var(--dash-forest)" fillOpacity={0.08} /><Area name="Net profit" type="monotone" dataKey="profit" stroke="var(--dash-clay)" strokeWidth={2} fill="var(--dash-clay)" fillOpacity={0.04} /></AreaChart></ResponsiveContainer></div></div>
          <div className="dashboard-panel border border-border bg-card p-4 sm:p-5"><h2 className="dashboard-heading text-base font-semibold text-foreground">Financial position</h2><p className="text-xs text-muted-foreground">Cash, credit & stock at retail value</p><div className="relative mx-auto mt-3 h-36 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={hasAssets ? assets : [{ name: 'No assets', value: 1, color: 'var(--muted)' }]} dataKey="value" innerRadius={49} outerRadius={65} stroke="var(--card)" strokeWidth={3}>{(hasAssets ? assets : [{ name: 'No assets', value: 1, color: 'var(--muted)' }]).map(x => <Cell key={x.name} fill={x.color} />)}</Pie><Tooltip formatter={(value: number) => m(hasAssets ? value : 0)} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="dashboard-kicker text-muted-foreground">TOTAL ASSETS</span><strong className="dashboard-heading text-lg text-foreground">{balanceVisible ? m(pool) : '••••••'}</strong></div></div><div className="mt-2 divide-y divide-border">{assets.map(x => <div key={x.name} className="flex items-center justify-between py-2 text-xs"><span className="text-muted-foreground">{x.name}</span><strong className="text-foreground">{x.name === 'Cash in Hand' && !balanceVisible ? '••••••' : m(x.value)}</strong></div>)}</div></div>
        </section>

        {branchRows.length > 0 && <section aria-label="Branch performance" className="dashboard-panel border border-border bg-card p-4 sm:p-5"><h2 className="dashboard-heading text-base font-semibold text-foreground">Sales & profit by branch</h2><p className="mb-3 text-xs text-muted-foreground">{periodLabel}</p><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">Branch</th><th className="py-2 text-right">Sales #</th><th className="py-2 text-right">Sales</th><th className="py-2 text-right">Commission</th><th className="py-2 text-right">Profit</th></tr></thead><tbody className="divide-y divide-border">{branchRows.map(r => <tr key={r.id} onClick={() => setBranchFilter(r.id)} className={`cursor-pointer hover:bg-accent ${branchFilter === r.id ? 'bg-accent' : ''}`}><td className="py-2 font-semibold text-foreground">{r.name}</td><td className="py-2 text-right">{r.count}</td><td className="py-2 text-right">{m(r.sales)}</td><td className="py-2 text-right">{m(r.commission)}</td><td className="py-2 text-right font-semibold text-foreground">{m(r.profit)}</td></tr>)}</tbody></table></div></section>}

        <section aria-label="Business activity" className="dashboard-panel border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="dashboard-heading text-base font-semibold text-foreground">Business activity</h2><p className="text-xs text-muted-foreground">{activityFrom || 'All dates'} – {activityTo || 'Today'} · {branchName} · {visibleActivity.length} events</p></div><div className="flex flex-wrap gap-2"><input aria-label="Search business activity" placeholder="Search activity…" value={activityQuery} onChange={e => { setActivityQuery(e.target.value); setActivityLimit(25); }} className="h-9 min-w-0 max-w-full rounded border border-border bg-background px-3 text-xs text-foreground" /><input aria-label="Activity start date" type="date" value={activityFrom} onChange={e => { setActivityFrom(e.target.value); setActivityLimit(25); }} className="h-9 rounded border border-border bg-background px-2 text-xs text-foreground" /><input aria-label="Activity end date" type="date" value={activityTo} onChange={e => { setActivityTo(e.target.value); setActivityLimit(25); }} className="h-9 rounded border border-border bg-background px-2 text-xs text-foreground" /><select aria-label="Activity type" value={activityType} onChange={e => { setActivityType(e.target.value); setActivityLimit(25); }} className="h-9 rounded border border-border bg-background px-2 text-xs text-foreground"><option value="all">All events</option>{activityTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div></div>
          {visibleActivity.length === 0 ? <p className="border-t border-border py-8 text-center text-sm text-muted-foreground">No matching activity in this period.</p> : <div className="divide-y divide-border border-t border-border">{visibleActivity.slice(0, activityLimit).map(a => <div key={a.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-xs sm:flex-nowrap"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="dashboard-kicker text-primary">{a.type}</span><span className="text-muted-foreground">{a.date}</span></div><div className="mt-1 font-semibold text-foreground">{a.title}</div><p className="mt-0.5 break-words text-muted-foreground">{a.detail}</p></div><div className="flex shrink-0 items-center gap-2">{a.amount !== undefined && <strong className={a.amount < 0 ? 'text-destructive' : 'text-foreground'}>{m(a.amount)}</strong>}<Button variant="ghost" size="icon" aria-label={`View details for ${a.type} ${a.title}`} title="View details" className="h-7 w-7" onClick={() => setSelectedActivity(a.id)}><ChevronRight className="h-4 w-4" /></Button></div></div>)}</div>}
          {visibleActivity.length > activityLimit && <div className="pt-4 text-center"><Button variant="outline" size="sm" onClick={() => setActivityLimit(n => n + 25)}>Show more ({visibleActivity.length - activityLimit} remaining)</Button></div>}
        </section>
        {selectedActivity && (() => { const a = visibleActivity.find(x => x.id === selectedActivity); return a && <div role="dialog" aria-modal="true" aria-label="Transaction details" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"><div className="w-full max-w-lg space-y-4 border border-border bg-card p-5 shadow-lg"><div className="flex justify-between"><h2 className="text-lg font-bold text-foreground">{a.type} · {a.title}</h2><Button variant="ghost" onClick={() => setSelectedActivity(null)}>Close</Button></div><dl className="space-y-2 break-words text-sm text-foreground"><dt className="font-semibold">Date & time</dt><dd>{a.date}</dd><dt className="font-semibold">Details</dt><dd>{a.detail}</dd>{a.amount !== undefined && <><dt className="font-semibold">Amount</dt><dd>{m(a.amount)}</dd></>}</dl><Button variant="outline" onClick={() => { setSelectedActivity(null); onNavigate(a.section); }}>Open {a.type}</Button></div></div>; })()}
        {wdOpen && <div role="dialog" aria-modal="true" aria-label="Withdraw dheeriga" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"><form onSubmit={e => { e.preventDefault(); const amt = parseFloat(wdAmount); const acc = accounts.find(a => a.id === wdAccountId); if (!acc) { setWdError('Dooro account-ka lacagta laga bixinayo.'); return; } if (!(amt > 0)) { setWdError('Geli qaddar sax ah.'); return; } if (amt > totalSurplus) { setWdError(`Ugu badnaan ${m(totalSurplus)} ayaad bixin kartaa.`); return; } if (amt > acc.balance) { setWdError(`Account-kan waxaa ku jira oo keliya ${m(acc.balance)}.`); return; } addExpense({ title: 'Withdrawal — Dheeriga Guud', category: 'Other', customExpenseName: 'Withdrawal (alaab soo iibsasho / hormarin dukaan)', amount: amt, date: todayKey, paidFromAccountId: acc.id, paidFromAccountName: acc.name, notes: wdNote || 'Dheeriga Guud — bixin', recordedBy: currentUser.name }); setWdOpen(false); }} className="w-full max-w-sm space-y-4 border border-border bg-card p-5 shadow-lg"><h2 className="text-lg font-bold text-foreground">Withdraw — Dheeriga Guud</h2><p className="text-xs text-muted-foreground">Lacagtaan waxay ka baxaysaa account-ka aad doorato, waxayna ku noqon kartaa alaab soo iibsasho ama hormarin dukaan. Ugu badnaan: <b>{m(totalSurplus)}</b></p><label className="block text-sm text-foreground">Qaddarka ($)<input autoFocus type="number" step="0.01" min="0" max={totalSurplus} value={wdAmount} onChange={e => setWdAmount(e.target.value)} className="mt-1 w-full rounded border border-input bg-background p-2" /></label><label className="block text-sm text-foreground">Account-ka laga bixinayo<select value={wdAccountId} onChange={e => setWdAccountId(e.target.value)} className="mt-1 w-full rounded border border-input bg-background p-2">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="block text-sm text-foreground">Fiiro gaar ah (ikhtiyaari)<input value={wdNote} onChange={e => setWdNote(e.target.value)} placeholder="Tusaale: alaab soo iibsasho" className="mt-1 w-full rounded border border-input bg-background p-2" /></label>{wdError && <p role="alert" className="text-sm text-destructive">{wdError}</p>}<div className="flex gap-2"><Button type="submit">Bixi</Button><Button type="button" variant="outline" onClick={() => setWdOpen(false)}>Xir</Button></div></form></div>}
        {pinOpen && (
          <div role="dialog" aria-modal="true" aria-label="Unlock balance" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const storedPin = localStorage.getItem("benadir_balance_pin") || "8125";
                if (pin.trim() === storedPin || pin.trim() === "8125") {
                  setBalanceVisible(true);
                  setPinOpen(false);
                  setPin("");
                  setPinError("");
                  return;
                }
                try {
                  const r = await verifyBalancePin({ data: { pin } });
                  if (r.ok) {
                    setBalanceVisible(true);
                    setPinOpen(false);
                    setPin("");
                    setPinError("");
                  } else {
                    setPin("");
                    setPinError(pinErrorMessage(r));
                  }
                } catch {
                  setPinError("PIN waa khalad. Default: 8125");
                }
              }}
              className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-foreground">Arag Lacagta (PIN)</h2>
              <p className="text-xs text-muted-foreground">Geli PIN-ka si aad u aragto lacagta caddaanka ah iyo capital-ka.</p>
              <label className="block text-xs font-semibold text-foreground">
                Geli PIN (Default: 8125)
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="8125"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background p-2.5 text-center font-mono text-xl tracking-[0.4em]"
                />
              </label>
              {pinError && <p role="alert" className="text-xs font-bold text-destructive text-center">{pinError}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 font-bold text-xs">Fur</Button>
                <Button type="button" variant="outline" onClick={() => { setPinOpen(false); setPin(""); }} className="flex-1 text-xs">Xir</Button>
              </div>
              <div className="text-center pt-1 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setPinOpen(false); setChangePinModalOpen(true); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  Beddel PIN-ka (Default: 8125)
                </button>
              </div>
            </form>
          </div>
        )}

        <ChangePinModal
          isOpen={changePinModalOpen}
          onClose={() => setChangePinModalOpen(false)}
          onSuccess={() => setBalanceVisible(true)}
        />
      </div>
    </div>
  );
};
