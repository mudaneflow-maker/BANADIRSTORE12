import React, { useState } from "react";
import { Building2, LineChart, Package, ShoppingBag, Sparkles, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedStockView } from "./UnifiedStockView";
import { ProductsView } from "./ProductsView";
import { InventoryView } from "./InventoryView";
import { PurchasesView } from "./PurchasesView";
import { StockInsightsView } from "./StockInsightsView";
import type { Product } from "@/types";

export function StockHubView({
  onOpenNewProduct,
  onQuickSell,
  onNavigateToBranchSales,
}: {
  onOpenNewProduct: () => void;
  onQuickSell: (product: Product) => void;
  onNavigateToBranchSales?: () => void;
}) {
  const [tab, setTab] = useState("unified");
  return (
    <div className="min-w-0">
      <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
        <h1 className="text-lg font-bold text-foreground">Stock &amp; Badeecadaha</h1>
        <Tabs value={tab} onValueChange={setTab} className="mt-3">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit sm:grid-cols-6">
            <TabsTrigger value="unified" className="gap-1.5 font-bold">
              <Layers className="w-4 h-4 text-[#F7B928]" />
              Dhammaan Stock-ga (All Locations)
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1.5">
              <Package className="w-4 h-4" />
              Inventory Audit
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              Purchases
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-1.5">
              <Building2 className="w-4 h-4" />
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="advisor" className="gap-1.5">
              <LineChart className="w-4 h-4" />
              AI Advisor
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {tab === "unified" && (
        <UnifiedStockView
          onOpenNewProduct={onOpenNewProduct}
          onNavigateToBranchSales={onNavigateToBranchSales}
        />
      )}
      {tab === "products" && (
        <ProductsView onOpenNewProduct={onOpenNewProduct} onQuickSell={onQuickSell} />
      )}
      {tab === "inventory" && <InventoryView />}
      {tab === "purchases" && <PurchasesView initialTab="purchases" />}
      {tab === "suppliers" && <PurchasesView initialTab="suppliers" />}
      {tab === "advisor" && <StockInsightsView />}
    </div>
  );
}
