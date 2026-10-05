import React from "react";
import {
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  Users,
  Sparkles,
  Package,
  ShoppingBag,
  Building2,
  Truck,
  Car,
  DollarSign,
  Wallet,
  Receipt,
  TrendingUp,
  BarChart3,
  Target,
  BookOpen,
  ShieldCheck,
  Settings,
  ChevronRight,
  X,
  MapPin,
  LineChart,
  Store,
  Scale,
  HandCoins,
  Camera,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "../../context/StoreContext";
import { canAccess, useStaffRole } from "@/lib/roles";
import { BanadirLogo } from "@/components/brand/BanadirLogo";

export type NavSection =
  | "dashboard"
  | "sales"
  | "returns"
  | "orders"
  | "customers"
  | "products"
  | "inventory"
  | "purchases"
  | "suppliers"
  | "logistics"
  | "delivery"
  | "cargo"
  | "tracking"
  | "drivers"
  | "finance"
  | "cashflow"
  | "payments"
  | "accounts"
  | "debts"
  | "expenses"
  | "income"
  | "reports"
  | "targets"
  | "accounting"
  | "insights"
  | "users"
  | "settings"
  | "pos"
  | "pettycash"
  | "evcrecon"
  | "branches"
  | "library";
export interface SidebarProps {
  activeTab?: NavSection;
  setActiveTab?: (tab: NavSection) => void;
  activeSection?: NavSection;
  onSelectSection?: (section: NavSection) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenNewSale?: () => void;
}
const groups = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard" as NavSection, label: "Dashboard", icon: LayoutGrid },
      { id: "orders" as NavSection, label: "Sales / Orders", icon: ClipboardList },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "products" as NavSection, label: "Products & Stock", icon: Package },
      { id: "branches" as NavSection, label: "Branches & Stock", icon: Store },
      { id: "library" as NavSection, label: "Photo Library", icon: Camera },
      { id: "logistics" as NavSection, label: "Delivery & Logistics", icon: Truck },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { id: "finance" as NavSection, label: "Payments & Accounts", icon: Wallet },
      { id: "debts" as NavSection, label: "Deymaha", icon: HandCoins },
      { id: "cashflow" as NavSection, label: "Income & Expenses", icon: TrendingUp },
      { id: "reports" as NavSection, label: "Reports", icon: BarChart3 },
      { id: "accounting" as NavSection, label: "Accounting", icon: BookOpen },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [{ id: "settings" as NavSection, label: "Users & Settings", icon: Settings }],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeSection,
  onSelectSection,
  isOpen = false,
  onClose = () => {},
}) => {
  const currentTab = activeSection || activeTab || "dashboard";
  const handleSelectTab = onSelectSection || setActiveTab || (() => {});
  const { currentUser, settings } = useStore();
  const staffRole = useStaffRole();
  const select = (tab: NavSection) => {
    handleSelectTab(tab);
    onClose();
  };
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/55 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-label="Xir Menu-ga"
        />
      )}
      <aside
        className={`dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:pointer-events-auto ${isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"}`}
      >
        <div className="flex min-h-20 items-center justify-between gap-2 border-b border-sidebar-border px-4 py-2 bg-[#051433]">
          <div className="flex min-w-0 items-center">
            <BanadirLogo variant="horizontal" size="md" theme="dark" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Xir Menu-ga"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-3 pt-4">
          <Button
            id="quick-pos-launch-btn"
            onClick={() => select("pos")}
            className="h-10 w-full justify-start bg-[#F7B928] hover:bg-[#E5A817] px-3 text-xs font-black text-[#071A3E] shadow-sm transition-all active:scale-98"
          >
            <ShoppingCart className="h-4 w-4 text-[#071A3E]" />
            <span>Quick POS</span>
            <ChevronRight className="ml-auto h-4 w-4 text-[#071A3E]" />
          </Button>
        </div>
        <nav
          className="dashboard-sidebar-nav mt-3 flex-1 overflow-y-auto px-3 pb-4"
          aria-label="Store navigation"
        >
          {groups.map((group) => {
            const items = group.items.filter((item) => canAccess(staffRole, item.id));
            if (!items.length) return null;
            return (
              <div key={group.title} className="mb-4">
                <div className="dashboard-kicker px-3 pb-1.5 pt-2 text-[var(--dash-subtle)]">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const selected =
                      item.id === currentTab ||
                      (item.id === "orders" && ["sales", "returns"].includes(currentTab));
                    return (
                      <Button
                        key={item.id}
                        id={`sidebar-nav-${item.id}`}
                        variant="ghost"
                        onClick={() => select(item.id)}
                        aria-current={selected ? "page" : undefined}
                        className={`dashboard-sidebar-link h-9 w-full justify-start gap-3 px-3 text-[13px] font-medium ${selected ? "dashboard-sidebar-active bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate">{item.label}</span>
                        {selected && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4 bg-[#051433]/70">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7B928] text-xs font-black uppercase text-[#071A3E]">
            {currentUser.name.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-white">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-[#F7B928] font-medium">{currentUser.role}</div>
          </div>
        </div>
      </aside>
    </>
  );
};
