import React, { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import type { Product } from "../../types";

/** Resize an uploaded photo to a small JPEG data URL so it syncs cheaply. */
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 480;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

interface Props {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  /** Called after the product is saved; qty = how many to put in the sale/order. */
  onSaved: (product: Product, qty: number) => void;
}

export const QuickAddProductModal: React.FC<Props> = ({ open, initialName = "", onClose, onSaved }) => {
  const { addProduct, units, categories } = useStore();
  const [name, setName] = useState(initialName);
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("PCS");
  const [category, setCategory] = useState("General");
  const [shoeSizes, setShoeSizes] = useState("");
  const [costMode, setCostMode] = useState<"cost" | "free">("cost");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<string>("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) { setName(initialName); setQty("1"); setCategory("General"); setShoeSizes(""); setCostMode("cost"); setCost(""); setPrice(""); setImage(""); setError(""); }
  }, [open, initialName]);

  const isShoes = /^shoes?$|kab/i.test(category.trim());
  const categoryOptions = React.useMemo(() => {
    const names = categories.map((c) => c.name);
    for (const base of ["General", "Shoes"]) if (!names.some((n) => n.toLowerCase() === base.toLowerCase())) names.push(base);
    return names;
  }, [categories]);

  if (!open) return null;

  const save = () => {
    const q = Number(qty), c = costMode === "free" ? 0 : Number(cost), p = Number(price);
    if (!name.trim()) return setError("Geli magaca alaabta.");
    if (!(q > 0)) return setError("Tirada (Qty) waa inay ka badnaataa 0.");
    if (costMode === "cost" && !(c >= 0)) return setError("Qiimaha iibsiga (Cost) ma noqon karo taban.");
    if (!(p > 0)) return setError("Geli qiimaha iibka (Sale price).");
    const product = addProduct({
      sku: "", name: name.trim(), category, costPrice: c, sellingPrice: p,
      stock: q, minStockLevel: 0, unit, isActive: true, imageUrl: image || undefined,
      ...(isShoes && shoeSizes.trim() ? { shoeSizes: shoeSizes.trim() } : {}),
    } as Omit<Product, "id" | "code" | "createdAt">);
    onSaved(product, q);
    onClose();
  };

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Quick Add Product</h3>
          <button onClick={onClose} aria-label="Xir" className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-3">
            {image ? <img src={image} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted"><ImagePlus className="h-6 w-6 text-muted-foreground" /></div>}
            <span className="text-sm text-muted-foreground">Sawirka alaabta (ikhtiyaari)</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await fileToDataUrl(f)); }} />
          </label>
          <div><label className="text-xs font-semibold text-muted-foreground">Magaca *</label><input autoFocus className={field} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs font-semibold text-muted-foreground">Category *</label>
              <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-muted-foreground">Qty *</label><input type="number" min="0" step="any" className={field} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-muted-foreground">Unit</label>
              <select className={field} value={unit} onChange={(e) => setUnit(e.target.value)}>
                {units.map((u) => <option key={u.id} value={u.symbol}>{u.symbol}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-muted-foreground">Sale price (unit) *</label><input type="number" min="0" step="any" className={field} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          </div>
          {isShoes && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5">
              <label className="text-xs font-semibold text-amber-800">Cabbirrada kabaha (tusaale: 38, 39, 40, 41, 42)</label>
              <input className={`${field} mt-1 border-amber-300 bg-white`} value={shoeSizes} onChange={(e) => setShoeSizes(e.target.value)} placeholder="38, 39, 40, 41, 42" />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Qiimaha iibsiga</label>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setCostMode("cost")} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold ${costMode === "cost" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>Cost (lacag baxay)</button>
              <button type="button" onClick={() => setCostMode("free")} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold ${costMode === "free" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>Bilaash (hadiyad)</button>
            </div>
            {costMode === "cost" && <input type="number" min="0" step="any" placeholder="0.00" className={`${field} mt-2`} value={cost} onChange={(e) => setCost(e.target.value)} />}
            {costMode === "free" && <p className="mt-1 text-[11px] text-muted-foreground">Alaabtan lacag lagama bixin — cost-keedu waa $0, iibka oo dhan waa faa'iido.</p>}
          </div>
          {Number(qty) > 0 && Number(price) > 0 && <p className="text-xs text-muted-foreground">Wadarta: ${(Number(qty) * Number(price)).toFixed(2)} · Faa'iido: ${(Number(qty) * (Number(price) - (costMode === "free" ? 0 : Number(cost || 0)))).toFixed(2)}</p>}
          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
          <button onClick={save} className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground">Save & ku dar</button>
        </div>
      </div>
    </div>
  );
};
