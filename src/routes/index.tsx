import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { StaffGate } from "../components/auth/StaffGate";
import { AutoLock } from "../components/auth/AutoLock";
import { BanadirLogo } from "../components/brand/BanadirLogo";

// Pull newest cloud data into the offline copy before the admin app reads it.
const App = lazy(async () => {
  const { startCloudSync } = await import("../lib/cloud-sync");
  await startCloudSync();
  return import("../App");
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Banadir Online - Enterprise E-Commerce & Store Operations" },
      {
        name: "description",
        content:
          "Banadir Online - Enterprise POS, Inventory, Sales, Financial Engine, and Customer Order Portal",
      },
      { property: "og:title", content: "Banadir Online" },
      {
        property: "og:description",
        content:
          "Banadir Online - Enterprise POS, Inventory, Sales, Financial Engine, and Customer Order Portal",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loadingScreen = (
    <div className="fixed inset-0 flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-slate-900">
      <div className="mb-4">
        <BanadirLogo variant="full" size="lg" />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">System-ka waa furmayaa si toos ah...</p>
      <div className="mt-5 h-1 w-36 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[#F7B928]" />
      </div>
    </div>
  );

  if (!mounted) return loadingScreen;
  return (
    <StaffGate>
      <AutoLock>
        <Suspense fallback={loadingScreen}>
          <App />
        </Suspense>
      </AutoLock>
    </StaffGate>
  );
}
