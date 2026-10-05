import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { useStore } from "../../context/StoreContext";
import { nextCode } from "../../utils/codes";

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREFIXES = ["+25261", "+25262", "+25263", "+25264", "+25265", "+25266", "+25268", "+25269", "+25290", "+25271", "+25277", "+25279"];

const MOGADISHU_DISTRICTS = [
  "Hodan", "Howlwadaag", "Wadajir", "Dharkenley", "Waberi", "Hamar Weyne", "Hamar Jajab",
  "Shangaani", "Bondhere", "Shibis", "Abdiaziz", "Karaan", "Yaqshid", "Heliwaa", "Wardhiigley",
  "Kaxda", "Daynile", "Garasbaley", "Gubadley", "Tarabuunka", "Mataban",
].map((d) => `Muqdisho - ${d}`);

const REGIONS = [
  "Banaadir", "Shabeellaha Hoose", "Shabeellaha Dhexe", "Hiiraan", "Galgaduud", "Mudug", "Nugaal",
  "Bari", "Sanaag", "Sool", "Togdheer", "Waqooyi Galbeed", "Awdal", "Bay", "Bakool", "Gedo",
  "Jubbada Hoose", "Jubbada Dhexe",
];

const inputCls =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900";
const labelCls = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1";

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose }) => {
  const { addCustomer, customers } = useStore();
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("+25261");
  const [number, setNumber] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !number.trim()) return;
    addCustomer({
      code: nextCode("CU", customers.map((c) => c.code)),
      name: name.trim(),
      phone: prefix + number.replace(/\D/g, ""),
      address: address || undefined,
      creditLimit: 0,
      balance: 0,
      status: "active",
    });
    onClose();
    setName("");
    setNumber("");
    setPrefix("+25261");
    setAddress("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Customer"
      maxWidth="md"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl">
            Cancel
          </button>
          <button type="submit" form="form-new-customer" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs">
            Save Customer
          </button>
        </>
      }
    >
      <form id="form-new-customer" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Customer Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hassan Mohamed" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Customer Number *</label>
          <div className="flex gap-2">
            <select value={prefix} onChange={(e) => setPrefix(e.target.value)} className={`${inputCls} w-32`}>
              {PREFIXES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input type="tel" inputMode="numeric" required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="xxxxxxx" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Address</label>
          <select value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls}>
            <option value="">— Dooro meesha —</option>
            <optgroup label="Degmooyinka Muqdisho">
              {MOGADISHU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </optgroup>
            <optgroup label="Gobolada Soomaaliya">
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </optgroup>
          </select>
        </div>
      </form>
    </Modal>
  );
};
