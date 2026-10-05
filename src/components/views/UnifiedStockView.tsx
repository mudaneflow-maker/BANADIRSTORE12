import React, { useState, useMemo } from "react";
import {
  Package,
  Building2,
  Gift,
  ArrowRightLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  ShoppingCart,
  Plus,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useBranches, addBranchStock, setBranchStockQty } from "@/lib/branch-store";
import type { Product } from "@/types";

interface UnifiedStockViewProps {
  onOpenNewProduct?: () => void;
  onNavigateToBranchSales?: () => void;
  onNavigateToPOS?: () => void;
}

export const UnifiedStockView: React.FC<UnifiedStockViewProps> = ({
  onOpenNewProduct,
  onNavigateToBranchSales,
  onNavigateToPOS,
}) => {
  const { products, adjustStock } = useStore();
  const branchState = useBranches();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState<
    "all" | "main" | "garoowe" | "branches" | "gift"
  >("all");

  // Transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState<string>("");
  const [targetBranchId, setTargetBranchId] = useState<string>("BR-garoowe");
  const [transferQty, setTransferQty] = useState<number>(1);
  const [isGiftTransfer, setIsGiftTransfer] = useState(false);

  // Guarantee Garoowe branch is in list
  const garooweBranch = branchState.branches.find(
    (b) => b.id === "BR-garoowe" || b.name.toLowerCase().includes("garoowe"),
  );

  // Compute unified rows for every product
  const unifiedData = useMemo(() => {
    return products
      .filter((p) => !p.isArchived)
      .map((p) => {
        const mainStock = p.stock || 0;

        // Garoowe branch stock
        const garooweStock =
          (garooweBranch && branchState.stock[garooweBranch.id]?.[p.id]) ||
          (p.id === "prod-gift-garoowe" ? 30 : 0);

        // Other branches stock
        const otherBranchStocks: { id: string; name: string; qty: number }[] = [];
        let totalOtherBranches = 0;

        branchState.branches.forEach((b) => {
          if (b.id !== garooweBranch?.id) {
            const q = branchState.stock[b.id]?.[p.id] || 0;
            if (q > 0) {
              otherBranchStocks.push({ id: b.id, name: b.name, qty: q });
              totalOtherBranches += q;
            }
          }
        });

        const totalBranchStock = garooweStock + totalOtherBranches;
        const totalStock = mainStock + totalBranchStock;
        const isGift =
          p.isGift ||
          p.costPrice === 0 ||
          p.id.includes("gift") ||
          p.name.toLowerCase().includes("hadyad");

        const isDirectSaleAllowed = mainStock > 0;
        const isBranchOnly = mainStock === 0 && totalBranchStock > 0;

        return {
          product: p,
          mainStock,
          garooweStock,
          otherBranchStocks,
          totalBranchStock,
          totalStock,
          isGift,
          isDirectSaleAllowed,
          isBranchOnly,
        };
      });
  }, [products, branchState, garooweBranch]);

  // Aggregate KPI stats
  const totals = useMemo(() => {
    let totalAllUnits = 0;
    let totalMainUnits = 0;
    let totalGarooweUnits = 0;
    let totalOtherBranchUnits = 0;
    let totalGiftUnits = 0;
    let totalInventoryValue = 0;

    unifiedData.forEach((row) => {
      totalAllUnits += row.totalStock;
      totalMainUnits += row.mainStock;
      totalGarooweUnits += row.garooweStock;
      totalOtherBranchUnits += row.totalBranchStock - row.garooweStock;
      if (row.isGift) totalGiftUnits += row.totalStock;
      totalInventoryValue += row.totalStock * row.product.sellingPrice;
    });

    return {
      totalAllUnits,
      totalMainUnits,
      totalGarooweUnits,
      totalOtherBranchUnits,
      totalGiftUnits,
      totalInventoryValue,
    };
  }, [unifiedData]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return unifiedData.filter((row) => {
      const q = searchQuery.toLowerCase().trim();
      const p = row.product;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterLocation === "main") return row.mainStock > 0;
      if (filterLocation === "garoowe") return row.garooweStock > 0;
      if (filterLocation === "branches") return row.totalBranchStock > 0;
      if (filterLocation === "gift") return row.isGift;
      return true;
    });
  }, [unifiedData, searchQuery, filterLocation]);

  const handleExecuteTransfer = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod || transferQty <= 0) return;

    const b = branchState.branches.find((x) => x.id === targetBranchId) || garooweBranch;
    if (!b) return alert("Fadlan dooro branch-ka aad u wareejinayso.");

    if (isGiftTransfer) {
      // Gift transfer: does not deduct from main stock
      addBranchStock(b.id, prod.id, prod.name, transferQty);
    } else {
      if (prod.stock < transferQty) {
        return alert(
          `Stock-ga bakhaarka dhexe kuma filna. Waxaa yaal kaliya ${prod.stock} ${prod.unit}.`,
        );
      }
      adjustStock(prod.id, -transferQty, `U wareejin laanta: ${b.name}`, "adjustment");
      addBranchStock(b.id, prod.id, prod.name, transferQty);
    }

    setTransferModalOpen(false);
    setSelectedProdId("");
    setTransferQty(1);
    setIsGiftTransfer(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 mb-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xarunta Guud ee Stock-ga & Goobaha (Unified Inventory)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dhammaan Stock-ga (Main, Garoowe & Hadiyadaha)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hal meel ka maamul bakhaarka dhexe, laanta Garoowe, gobolada kale iyo badeecadaha
            hadiyadda ah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4 text-lime-400" />
            <span>Wareeji Stock (Branch Transfer)</span>
          </button>

          {onOpenNewProduct && (
            <button
              type="button"
              onClick={onOpenNewProduct}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B2559] hover:bg-[#071B42] text-white text-xs font-bold shadow-xs transition-all active:scale-95 border border-[#143573]"
            >
              <Plus className="w-4 h-4 text-[#F7B928]" />
              <span>Badeeco Cusub</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Units Everywhere */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Wadarta Guud (All)</span>
            <Package className="w-4 h-4 text-[#0B2559]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totals.totalAllUnits}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Dhammaan meelaha ay alaabtu taal
          </div>
        </div>

        {/* Card 2: Main Store (Direct Sale Available) */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>Bakhaarka Dhexe (Main)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950">{totals.totalMainUnits}</div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Kaliya intan ayaa toos loo iibin karaa
          </div>
        </div>

        {/* Card 3: Garoowe Branch Stock */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>Laanta Garoowe</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950">{totals.totalGarooweUnits}</div>
          <div className="text-[11px] text-amber-700 font-medium">
            Garoowe taal (Hadyad & Branch)
          </div>
        </div>

        {/* Card 4: Gift Stock */}
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-800 font-bold">
            <span>Alaabta Hadyadda ah</span>
            <Gift className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950">{totals.totalGiftUnits}</div>
          <div className="text-[11px] text-purple-700 font-medium">Cost $0 (Promotional)</div>
        </div>

        {/* Card 5: Valuation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1 text-white col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Qiimaha Iibka (Value)</span>
            <Building2 className="w-4 h-4 text-[#F7B928]" />
          </div>
          <div className="text-xl font-black text-[#F7B928]">
            ${totals.totalInventoryValue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">Total selling value</div>
        </div>
      </div>

      {/* Rules Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-950 text-xs">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-sky-900">
              Sharciga Iibka Tooska ah (Direct Sale Rule):
            </strong>{" "}
            Kaliya alaabta ku jirta <strong>Bakhaarka Dhexe</strong> ayaa ka geli karta iib toos ah
            (POS / New Sale). Alaabta taal <strong>Laanta Garoowe</strong> iyo gobolada waxaa lagu
            iibiyaa <strong>Branch Sales</strong> kaliya si aan khalkhal u gelin tirada bakhaarka.
          </div>
        </div>
        {onNavigateToBranchSales && (
          <button
            type="button"
            onClick={onNavigateToBranchSales}
            className="shrink-0 font-bold text-sky-800 hover:text-sky-950 underline flex items-center gap-1"
          >
            <span>Fur Branch Sales</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Raadi magac, SKU, code ama brand..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0B2559] focus:border-[#0B2559]"
          />
        </div>

        {/* Location Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
          <button
            type="button"
            onClick={() => setFilterLocation("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterLocation === "all" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
          >
            Dhammaan ({unifiedData.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterLocation("main")}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterLocation === "main" ? "bg-emerald-600 text-white shadow-xs" : "hover:text-slate-900"}`}
          >
            Bakhaarka Dhexe
          </button>
          <button
            type="button"
            onClick={() => setFilterLocation("garoowe")}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterLocation === "garoowe" ? "bg-amber-500 text-white shadow-xs" : "hover:text-slate-900"}`}
          >
            Garoowe ({totals.totalGarooweUnits} xabo)
          </button>
          <button
            type="button"
            onClick={() => setFilterLocation("branches")}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterLocation === "branches" ? "bg-blue-600 text-white shadow-xs" : "hover:text-slate-900"}`}
          >
            Dhammaan Laamaha
          </button>
          <button
            type="button"
            onClick={() => setFilterLocation("gift")}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterLocation === "gift" ? "bg-purple-600 text-white shadow-xs" : "hover:text-slate-900"}`}
          >
            Hadiyado
          </button>
        </div>
      </div>

      {/* Main Unified Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Badeecada (Product)</th>
                <th className="py-3 px-3 text-center">Bakhaarka Dhexe (Main)</th>
                <th className="py-3 px-3 text-center">Laanta Garoowe</th>
                <th className="py-3 px-3 text-center">Laamaha Kale</th>
                <th className="py-3 px-3 text-center font-black text-slate-900">
                  Wadarta Guud (Total)
                </th>
                <th className="py-3 px-3">U Qaybsanaanta Iibka</th>
                <th className="py-3 px-3 text-right">Qiimaha Iibka</th>
                <th className="py-3 px-4 text-center">Hawl (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Wax badeeco ah lama helin qaybta aad dooratay.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const p = row.product;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-[13px] flex items-center gap-1.5">
                              {p.name}
                              {row.isGift && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800">
                                  HADYAD
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              SKU: {p.sku || p.code} · {p.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Main Store Stock */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg ${row.mainStock > 0 ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-400"}`}
                        >
                          {row.mainStock} {p.unit}
                        </span>
                      </td>

                      {/* Garoowe Branch Stock */}
                      <td className="py-3 px-3 text-center">
                        {row.garooweStock > 0 ? (
                          <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                            {row.garooweStock} {p.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">0</span>
                        )}
                      </td>

                      {/* Other Branches */}
                      <td className="py-3 px-3 text-center">
                        {row.otherBranchStocks.length > 0 ? (
                          <div className="space-y-0.5">
                            {row.otherBranchStocks.map((ob) => (
                              <span
                                key={ob.id}
                                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800"
                              >
                                {ob.name}: {ob.qty}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Total Combined Stock */}
                      <td className="py-3 px-3 text-center">
                        <strong className="font-mono font-black text-base text-slate-900">
                          {row.totalStock}
                        </strong>{" "}
                        <span className="text-[10px] text-slate-400 font-medium">{p.unit}</span>
                      </td>

                      {/* Sales Eligibility */}
                      <td className="py-3 px-3">
                        {row.isDirectSaleAllowed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Iib Toos ah (Main)</span>
                          </span>
                        ) : row.isBranchOnly ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            <span>Laanta Garoowe Kaliya</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                            Stock Waa Eber
                          </span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-black text-slate-900">
                          ${p.sellingPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Qiimaha: ${(row.totalStock * p.sellingPrice).toFixed(2)}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProdId(p.id);
                              setTransferModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#0B2559] hover:text-white text-slate-700 transition-colors shadow-2xs"
                            title="U wareejin branch kale"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {row.isBranchOnly && onNavigateToBranchSales && (
                            <button
                              type="button"
                              onClick={onNavigateToBranchSales}
                              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-colors"
                              title="Ka iibi laanta Garoowe"
                            >
                              Iibka Garoowe
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Stock Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-[#0B2559]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    U Wareeji Stock Laanta (Branch Transfer)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    U wareejin bakhaarka dhexe ilaa laamaha gobolada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Dooro Badeecada:</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="">— Dooro badeeco —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Main Stock: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  U Wareeji Laanta (Target Branch):
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  {branchState.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Maamule: {b.manager || "—"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tirada La Wareejinayo (Quantity):
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                <input
                  type="checkbox"
                  id="chk-gift-transfer"
                  checked={isGiftTransfer}
                  onChange={(e) => setIsGiftTransfer(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <label htmlFor="chk-gift-transfer" className="text-[11px] font-medium select-none">
                  Waa alaab hadyad ah (lagama jaraayo bakhaarka dhexe, cost ma laha).
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Ka Noqo
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={!selectedProdId}
                className="flex-1 py-2 rounded-xl bg-[#0B2559] hover:bg-[#071B42] text-white font-bold text-xs disabled:opacity-50"
              >
                Xaqiiji Wareejinta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
