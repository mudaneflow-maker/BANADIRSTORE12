import { useState } from "react";
import { Settings, Target, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsView } from "./SettingsView";
import { SystemManagement } from "./SystemManagement";
import { TargetsView } from "./TargetsView";

type AdminTab = "users" | "settings" | "targets";
export function AdminHubView({ initialTab = "users" }: { initialTab?: AdminTab }) {
  const [tab, setTab] = useState<AdminTab>(initialTab);
  return <div className="min-w-0"><div className="border-b border-border bg-card px-4 py-3 sm:px-6"><h1 className="text-lg font-bold text-foreground">Users &amp; Settings</h1><Tabs value={tab} onValueChange={(v) => setTab(v as AdminTab)} className="mt-3"><TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit"><TabsTrigger value="users"><Users />Users &amp; Roles</TabsTrigger><TabsTrigger value="settings"><Settings />Settings</TabsTrigger><TabsTrigger value="targets"><Target />Targets</TabsTrigger></TabsList></Tabs></div>
    {tab === "users" && <div className="mx-auto max-w-7xl p-4 sm:p-6"><SystemManagement /></div>}{tab === "settings" && <SettingsView showSystemManagement={false} />}{tab === "targets" && <TargetsView />}
  </div>;
}