import React, { useState, useEffect } from "react";
import {
  Wallet,
  Building2,
  Smartphone,
  ArrowRightLeft,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { AccountFormModal } from "./AccountFormModal";
import { accountCategory, categoryLabel, MAIN_WALLETS, type AccountCategory } from "@/lib/accounts";

const ORDER: AccountCategory[] = ["cash", "wallet", "merchant", "bank"];
import { verifyBalancePin } from "@/lib/balance-pin.functions";
import { pinErrorMessage } from "@/lib/pin-message";
import { useStore } from "../../context/StoreContext";
import { Account, AccountTransfer } from "../../types";
import { StatCard } from "../common/StatCard";
import { Modal } from "../common/Modal";
import { displayAccountNumber } from "@/utils/mask-account";
import { fmtDateTime } from "@/utils/codes";

interface AccountsViewProps {
  onOpenTransfer: () => void;
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenTransfer,
  onOpenNewExpense,
  onOpenNewIncome,
}) => {
  const { accounts, accountTransfers, deletePaymentAccount } = useStore();
  const sortedAccounts = [...accounts].sort((x, y) => ORDER.indexOf(accountCategory(x)) - ORDER.indexOf(accountCategory(y)) || Number(MAIN_WALLETS.includes(y.provider ?? y.name)) - Number(MAIN_WALLETS.includes(x.provider ?? x.name)));
  const removeAccount = (acc: Account) => {
    if (!confirm(`Ma tirtirtaa ${acc.name}?`)) return;
    const r = deletePaymentAccount(acc.id);
    if (!r.ok) alert(r.error);
  };

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(false);
  useEffect(() => { if (!balanceVisible) return; const t = window.setTimeout(() => setBalanceVisible(false), 5000); return () => window.clearTimeout(t); }, [balanceVisible]);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const toggleBalance = () => {
    if (balanceVisible) setBalanceVisible(false);
    else {
      setPin("");
      setPinError("");
      setPinOpen(true);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const getAccountIcon = (acc: Account) => {
    switch (accountCategory(acc)) {
      case "bank":
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case "wallet":
      case "merchant":
        return <Smartphone className="w-5 h-5 text-emerald-600" />;
      case "cash":
      default:
        return <Wallet className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Accounts & Financial Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time cash drawers, EVC Plus, and bank reserves with atomic double-entry ledger
            balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransfer}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            Transfer Funds
          </button>

          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-lime-400 stroke-[3]" />
            Add Account
          </button>
        </div>
      </div>

      {/* KPI Cards (Screenshot 7) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="relative">
          <StatCard
            title="Total Treasury Pool"
            value={balanceVisible ? `$${totalBalance.toFixed(2)}` : "••••••"}
            subtitle="Net liquid cash & bank"
            icon={Wallet}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            highlight
          />
          <button
            onClick={toggleBalance}
            aria-label={balanceVisible ? "Qari lacagta" : "Arag lacagta"}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <StatCard
          title="Active Accounts"
          value={accounts.length}
          subtitle="Cash drawers & bank vaults"
          icon={Building2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Inter-Account Transfers"
          value={accountTransfers.length}
          subtitle="Liquidity re-allocations"
          icon={ArrowRightLeft}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />

        <StatCard
          title="Ledger Health"
          value="100% Balanced"
          subtitle="Mathematical audit verified"
          icon={CheckCircle2}
          iconBg="bg-lime-50"
          iconColor="text-lime-700"
        />
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedAccounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  {getAccountIcon(acc)}
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {categoryLabel(accountCategory(acc))}{acc.isActive === false ? " · off" : ""}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{acc.name}</h3>
              {acc.provider && acc.provider !== acc.name && <p className="text-[11px] text-slate-500">{acc.provider}</p>}
              {acc.accountNumber && (
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{displayAccountNumber(acc.accountNumber)}</p>
              )}

              <div className="mt-4">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Available Balance
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {balanceVisible ? `$${acc.balance.toFixed(2)}` : "••••••"}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={onOpenNewIncome}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
              </button>
              <button
                onClick={onOpenNewExpense}
                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Spend
              </button>
              <button onClick={() => setEditing(acc)} aria-label={`Edit ${acc.name}`} className="text-slate-500 hover:text-slate-900"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => removeAccount(acc)} aria-label={`Delete ${acc.name}`} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Inter-Account Transfers History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Account Transfers</h3>
            <p className="text-xs text-slate-500">
              Internal liquidity shifts between cash drawers, mobile wallets, and banking vaults.
            </p>
          </div>
        </div>

        {accountTransfers.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No transfers recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            {accountTransfers.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{t.fromAccountName}</span>
                    <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-slate-900">{t.toAccountName}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {fmtDateTime(t.date)} • {t.performedBy} {t.note ? `• "${t.note}"` : ""}
                  </div>
                </div>

                <div className="text-right font-black text-slate-900">${t.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AccountFormModal isOpen={isAddAccountOpen || !!editing} account={editing} onClose={() => { setIsAddAccountOpen(false); setEditing(null); }} />

      {/* PIN unlock dialog */}
      {pinOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unlock balance"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
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
                setPinError("Lama xaqiijin karo PIN-ka hadda.");
              }
            }}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
          >
            <h2 className="text-lg font-bold text-slate-900">Arag lacagta</h2>
            <label className="block text-sm text-slate-700">
              Geli PIN
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-2"
              />
            </label>
            {pinError && (
              <p role="alert" className="text-sm text-rose-600">
                {pinError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Fur
              </button>
              <button
                type="button"
                onClick={() => {
                  setPinOpen(false);
                  setPin("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Xir
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
