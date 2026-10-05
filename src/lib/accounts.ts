import type { PaymentAccount } from "@/types";

export type AccountCategory = "cash" | "wallet" | "merchant" | "bank";

export const ACCOUNT_CATEGORIES: { id: AccountCategory; label: string; providers: string[] }[] = [
  { id: "cash", label: "Cash", providers: ["Cash Drawer", "Safe Box"] },
  { id: "wallet", label: "Mobile Wallet", providers: ["EVC Plus", "E-Dahab", "Golis", "Zaad / Telesom", "Premier Wallet", "Ebessa", "My Cash"] },
  { id: "merchant", label: "Merchant", providers: ["Hormuud Merchant", "Somtel Merchant", "Premier Wallet Merchant", "MyCash Merchant", "Ebessa Merchant"] },
  { id: "bank", label: "Bank", providers: ["Salaam Somali Bank", "Premier Bank", "MyBank", "IBS Somalia", "Dahabshiil Bank", "Amaana Bank", "Amal Bank", "SomBank"] },
];

/** Main wallets shown first everywhere. */
export const MAIN_WALLETS = ["EVC Plus", "E-Dahab"];

/** Category of an account, inferred for older records that only have `type`. */
export function accountCategory(a: PaymentAccount): AccountCategory {
  if (a.category) return a.category;
  const t = String(a.type).toLowerCase();
  if (t.includes("bank")) return "bank";
  if (t.includes("mobile")) return "wallet";
  return "cash";
}

export function categoryToType(c: AccountCategory): PaymentAccount["type"] {
  return c === "bank" ? "Bank" : c === "cash" ? "Cash" : "Mobile Money";
}

export function categoryLabel(c: AccountCategory) {
  return ACCOUNT_CATEGORIES.find((x) => x.id === c)?.label ?? c;
}

/** Account that receives money for a sale payment method (by category/name, never fixed ids). */
export function matchAccountForMethod(accounts: PaymentAccount[], method: string): PaymentAccount | undefined {
  const active = accounts.filter((a) => a.isActive !== false);
  const byName = (re: RegExp) => active.find((a) => re.test(`${a.provider ?? ""} ${a.name}`));
  const byCat = (c: AccountCategory) => active.find((a) => accountCategory(a) === c);
  const m = method.toLowerCase();
  return (
    (m === "cash" && byCat("cash")) ||
    (m.includes("evc") && (byName(/evc/i) || byCat("wallet"))) ||
    (m.includes("sahal") && (byName(/sahal|golis/i) || byCat("wallet"))) ||
    (m.includes("premier") && (byName(/premier/i) || byCat("bank"))) ||
    (m.includes("dahab") && (byName(/dahab/i) || byCat("bank"))) ||
    active.find((a) => a.isDefault) ||
    active[0]
  );
}
