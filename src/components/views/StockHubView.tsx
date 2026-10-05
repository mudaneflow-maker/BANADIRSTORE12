import React, { useState } from "react";
import { Building2, LineChart, Package, ShoppingBag, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsView } from "./ProductsView";
import { InventoryView } from "./InventoryView";
import { PurchasesView } from "./PurchasesView";
import { StockInsightsView } from "./StockInsightsView";
import type { Product } from "@/types";

export function StockHubView({ onOpenNewProduct, onQuickSell }: { onOpenNewProduct: () => void; onQuickSell: (product: Product) => void }) {
  const [tab, setTab] = useState("products");
  return <div className="min-w-0">
    <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
      <h1 className="text-lg font-bold text-foreground">Products &amp; Stock</h1>
      <Tabs value={tab} onValueChange={setTab} className="mt-3">
        <TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit sm:grid-cols-5">
          <TabsTrigger value="products" className="gap-1.5"><Sparkles />Products</TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1.5"><Package />Inventory</TabsTrigger>
          <TabsTrigger value="purchases" className="gap-1.5"><ShoppingBag />Purchases</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-1.5"><Building2 />Suppliers</TabsTrigger>
          <TabsTrigger value="advisor" className="gap-1.5"><LineChart />AI Advisor</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    {tab === "products" && <ProductsView onOpenNewProduct={onOpenNewProduct} onQuickSell={onQuickSell} />}
    {tab === "inventory" && <InventoryView />}
    {tab === "purchases" && <PurchasesView initialTab="purchases" />}
    {tab === "suppliers" && <PurchasesView initialTab="suppliers" />}
    {tab === "advisor" && <StockInsightsView />}
  </div>;
}