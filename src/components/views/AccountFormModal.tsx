import React, { useEffect, useState } from "react";
import { Modal } from "../common/Modal";
import { useStore } from "../../context/StoreContext";
import type { PaymentAccount } from "../../types";
import { ACCOUNT_CATEGORIES, accountCategory, categoryToType, type AccountCategory } from "@/lib/accounts";
import { maskAccountNumber } from "@/utils/mask-account";

const OTHER = "__other__";

/** Add or edit a payment account (Cash, Mobile Wallet, Merchant, Bank). */
export function AccountFormModal({ isOpen, onClose, account }: { isOpen: boolean; onClose: () => void; account?: PaymentAccount | null }) {
  const { addAccount, updatePaymentAccount } = useStore();
  const [category, setCategory] = useState<AccountCategory>("wallet");
  const [provider, setProvider] = useState("EVC Plus");
  const [customProvider, setCustomProvider] = useState("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [balance, setBalance] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (account) {
      const c = accountCategory(account);
      const list = ACCOUNT_CATEGORIES.find((x) => x.id === c)!.providers;
      const p = account.provider || "";
      setCategory(c);
      if (p && !list.includes(p)) { setProvider(OTHER); setCustomProvider(p); } else { setProvider(p || list[0]); setCustomProvider(""); }
      setName(account.name);
      setNumber("");
      setHolder(account.accountHolder || "");
      setIsActive(account.isActive !== false);
      setIsDefault(!!account.isDefault);
    } else {
      setCategory("wallet"); setProvider("EVC Plus"); setCustomProvider(""); setName(""); setNumber(""); setHolder(""); setBalance("0"); setIsActive(true); setIsDefault(false);
    }
  }, [isOpen, account]);

  const providers = ACCOUNT_CATEGORIES.find((x) => x.id === category)!.providers;
  const providerName = provider === OTHER ? customProvider.trim() : provider;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || providerName;
    if (!finalName) return;
    const base = {
      name: finalName,
      category,
      provider: providerName || undefined,
      type: categoryToType(category),
      accountHolder: holder.trim() || undefined,
      isActive,
      isDefault,
      ...(number.trim() ? { accountNumber: maskAccountNumber(number) } : {}),
    };
    if (account) updatePaymentAccount(account.id, base);
    else addAccount({ ...base, balance: parseFloat(balance) || 0, currency: "USD" });
    onClose();
  };

  const field = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900";
  const label = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1";
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? "Wax ka beddel Account" : "Ku dar Payment Account"}
      subtitle="Cash, Mobile Wallet, Merchant ama Bank"
      maxWidth="md"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl">Jooji</button>
          <button type="submit" form="form-account" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl">Kaydi</button>
        </>
      }
    >
      <form id="form-account" onSubmit={submit} className="space-y-4">
        <div>
          <span className={label}>Nooca</span>
          <div className="grid grid-cols-4 gap-1.5">
            {ACCOUNT_CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => { setCategory(c.id); setProvider(c.providers[0]); setCustomProvider(""); }}
                className={`py-2 rounded-lg text-xs font-bold ${category === c.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>Shirkadda / Bangiga
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className={field}>
              {providers.map((p) => <option key={p} value={p}>{p}</option>)}
              <option value={OTHER}>Kale (qor magaca)…</option>
            </select>
          </label>
          {provider === OTHER ? (
            <label className={label}>Magaca kale
              <input required value={customProvider} onChange={(e) => setCustomProvider(e.target.value)} placeholder="e.g. Dara Salaam Bank" className={field} />
            </label>
          ) : (
            <label className={label}>Magaca Account-ka
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={providerName || "Magac"} className={field} />
            </label>
          )}
        </div>
        {provider === OTHER && (
          <label className={label}>Magaca Account-ka
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={providerName || "Magac"} className={field} />
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>Lambarka / Telefoonka
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={account?.accountNumber ? "Ka tag madhan si aan loo beddelin" : "+25261… ama IBAN"} className={`${field} font-mono`} />
          </label>
          <label className={label}>Milkiilaha
            <input value={holder} onChange={(e) => setHolder(e.target.value)} className={field} />
          </label>
        </div>
        {!account && (
          <label className={label}>Lacagta bilowga ($)
            <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} className={field} />
          </label>
        )}
        {account && <p className="text-[11px] text-slate-500">Haraaga lacagta halkan lagama beddelo — isticmaal Transfer, Deposit ama Spend si ay xisaabtu u saxnaato.</p>}
        <div className="flex gap-4 text-xs font-semibold text-slate-700">
          <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Firfircoon</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Account-ka caadiga ah</label>
        </div>
      </form>
    </Modal>
  );
}
