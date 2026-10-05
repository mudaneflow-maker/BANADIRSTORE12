import React, { useState } from "react";
import { MapPin, Package, Truck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryManagementView } from "./DeliveryManagementView";
import { CargoView } from "./CargoView";
import { TrackingView } from "./TrackingView";

type LogisticsTab = "delivery" | "cargo" | "tracking";

export function LogisticsHubView({ initialTab = "delivery" }: { initialTab?: LogisticsTab }) {
  const [tab, setTab] = useState<LogisticsTab>(initialTab);
  return <div className="min-w-0">
    <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
      <h1 className="text-lg font-bold text-foreground">Delivery &amp; Logistics</h1>
      <Tabs value={tab} onValueChange={(value) => setTab(value as LogisticsTab)} className="mt-3">
        <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="delivery" className="gap-1.5"><Truck />Local &amp; Drivers</TabsTrigger>
          <TabsTrigger value="cargo" className="gap-1.5"><Package />Cargo</TabsTrigger>
          <TabsTrigger value="tracking" className="gap-1.5"><MapPin />Tracking &amp; Alerts</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    {tab === "delivery" && <DeliveryManagementView />}
    {tab === "cargo" && <CargoView />}
    {tab === "tracking" && <TrackingView />}
  </div>;
}