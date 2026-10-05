import React, { useMemo, useState } from "react";
import { Target, TrendingUp, CheckCircle2, Clock, Zap, AlertCircle, ShieldCheck, Calendar } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { StatCard } from "../common/StatCard";
import {
  computeEngine,
  updateFinConfig,
  useFinEngine,
  DEFAULT_MONTHLY_TARGET,
  type DayRecord,
} from "../../lib/financial-engine";
import { buildDailySalesMap } from "../../lib/daily-net";

const money = (n: number) => `$${(n || 0).toFixed(2)}`;
const money4 = (n: number) => `$${(n || 0).toFixed(4)}`;

export const TargetsView: React.FC = () => {
  const { sales, orders, currentUser } = useStore();
  const fin = useFinEngine();
  const today = new Date().toISOString().slice(0, 10);

  const engine = useMemo(
    () => computeEngine(today, fin.config, buildDailySalesMap(sales, orders)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, fin.config, sales, orders],
  );

  const t = engine.today;
  const cycle = engine.activeCycle;

  const pct =
    t && t.requiredTarget > 0
      ? Math.min(100, Math.max(0, Math.round((t.actualSales / t.requiredTarget) * 100)))
      : t && t.actualSales > 0
      ? 100
      : 0;

  const monthPct =
    cycle && cycle.effectiveMonthlyRequirement > 0
      ? Math.min(100, Math.max(0, Math.round((cycle.totalActualSales / cycle.effectiveMonthlyRequirement) * 100)))
      : 0;

  const remainingToday = t ? Math.max(0, t.requiredTarget - t.actualSales) : 0;
  const extraToday = t ? Math.max(0, t.actualSales - t.requiredTarget) : 0;

  const [base, setBase] = useState(String(fin.config.monthlyBaseTarget ?? DEFAULT_MONTHLY_TARGET));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateFinConfig(
      {
        monthlyBaseTarget: Math.max(0, parseFloat(base) || DEFAULT_MONTHLY_TARGET),
      },
      currentUser?.name || "staff",
    );
    alert("Qorshaha bishii waa la keydiyay.");
  };

  const pastCycles = engine.cycles.filter((c) => c.closed).reverse();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Business Financial Engine — Daily Targets
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Target-ka rasmiga ah ee Business-ka ($93.50 bishii). Qeybsi siman, redistribution-ka culayska iyo dheeriga
          maalmaha dambe, iyo minus carry-forward.
        </p>
      </div>

      {/* TODAY'S ACTIVE TARGET HERO CARD */}
      <div className="grid grid-cols-1 gap-3 border-2 border-primary/40 bg-card p-5 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider">
            <Target className="h-5 w-5" /> Today's Final Target (Maanta)
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {today} · Day {t?.dayNumber} of {t?.daysInMonth}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-4 mt-1">
          <strong className="text-4xl font-extrabold sm:text-5xl text-foreground">
            {money(engine.todayFinalTarget)}
          </strong>
          <div className="text-base">
            <span className="text-muted-foreground">Sales maanta: </span>
            <strong className="text-foreground">{money(engine.todaySales)}</strong>
          </div>
          <div className="text-base">
            <span className="text-muted-foreground">Harsan maanta: </span>
            <strong className={remainingToday > 0 ? "text-destructive font-bold" : "text-positive font-bold"}>
              {remainingToday > 0 ? `-${money(remainingToday)}` : extraToday > 0 ? `+${money(extraToday)} (Dheeri)` : "La gaaray"}
            </strong>
          </div>
        </div>

        {t && (
          <details className="mt-2 text-xs text-muted-foreground border-t border-border pt-3">
            <summary className="cursor-pointer font-semibold hover:text-foreground">
              Faahfaahinta Xisaabinta Maanta (Audit Formula)
            </summary>
            <div className="mt-2 grid gap-1.5 font-mono text-[11px] bg-muted/50 p-3 rounded-lg border border-border">
              <div>Default Target: ${t.defaultDailyTarget.toFixed(6)}</div>
              <div>Active Previous Burdens: +${t.activeBurden.toFixed(6)}</div>
              {t.surplusReduction > 0 && <div>Surplus Reductions: -${t.surplusReduction.toFixed(6)}</div>}
              <div className="font-bold text-foreground">
                Final Required Target: ${t.requiredTarget.toFixed(6)} ({money(t.requiredTarget)})
              </div>
              <div>Actual Sales: ${t.actualSales.toFixed(2)}</div>
              <div>Shortfall Created Today: ${t.shortfall.toFixed(6)}</div>
              {t.remainingDaysAfter > 0 && (
                <div>Future Redistribution: ${t.burdenAllocatedToFuture.toFixed(6)} per day across {t.remainingDaysAfter} remaining days</div>
              )}
            </div>
          </details>
        )}
      </div>

      {/* MONTHLY SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Monthly Target"
          value={money(cycle?.effectiveMonthlyRequirement ?? DEFAULT_MONTHLY_TARGET)}
          subtitle={cycle?.openingCarriedBurden ? `Base $${cycle.monthlyTarget.toFixed(2)} + Minus $${cycle.openingCarriedBurden.toFixed(2)}` : "Base target ($93.50)"}
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Sales Bishan"
          value={money(cycle?.totalActualSales ?? 0)}
          subtitle={`${monthPct}% gaaray`}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          highlight={!!cycle && cycle.totalActualSales >= cycle.effectiveMonthlyRequirement}
        />
        <StatCard
          title="Current Burden"
          value={money(engine.currentMonthlyBurden)}
          subtitle="Culayska ku faafaya maalmaha dambe"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Monthly Remaining"
          value={money(engine.remainingMonthlyRequirement)}
          subtitle={`${engine.remainingCalendarDays} maalmood oo harsan`}
          icon={CheckCircle2}
          iconBg="bg-lime-50"
          iconColor="text-lime-700"
        />
      </div>

      {/* DAILY TARGET TABLE (SECTION 30) */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-foreground">Diiwaanka Maalmaha Bisha (Daily Target Schedule)</h3>
            <p className="text-xs text-muted-foreground">
              Maalmaha hore waa LOCKED (taariikh). Maanta waa ACTIVE. Maalmaha mustaqbalka waa DYNAMIC.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Locked
            </span>
            <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-primary font-bold">
              <span className="h-2 w-2 rounded-full bg-primary" /> Today (Active)
            </span>
            <span className="flex items-center gap-1 rounded bg-accent px-2 py-1 text-foreground">
              <span className="h-2 w-2 rounded-full bg-border" /> Future (Dynamic)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground bg-muted/30">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Default Target</th>
                <th className="py-2.5 px-3 text-right">Burden</th>
                <th className="py-2.5 px-3 text-right font-bold text-foreground">Final Target</th>
                <th className="py-2.5 px-3 text-right">Sales</th>
                <th className="py-2.5 px-3 text-right">Shortfall</th>
                <th className="py-2.5 px-3 text-right">Surplus</th>
                <th className="py-2.5 px-3 text-right">Future Burden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(cycle?.days ?? []).map((d: DayRecord) => {
                const isToday = d.status === "today";
                const isPast = d.status === "past";
                const isFuture = d.status === "future";

                return (
                  <tr
                    key={d.date}
                    className={`transition-colors ${
                      isToday
                        ? "bg-primary/10 font-medium"
                        : isPast
                        ? "bg-transparent opacity-85 hover:bg-muted/40"
                        : "bg-muted/10 opacity-70 hover:bg-muted/30"
                    }`}
                  >
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isToday ? (
                          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                            TODAY
                          </span>
                        ) : isPast ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                        <span className={isToday ? "font-bold text-foreground" : "text-muted-foreground"}>
                          {d.date}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {money4(d.defaultDailyTarget)}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono ${d.activeBurden > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      {d.activeBurden > 0 ? `+${money4(d.activeBurden)}` : "—"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                      {money4(d.requiredTarget)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-foreground">
                      {isFuture ? "—" : money(d.actualSales)}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono ${d.shortfall > 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                      {d.shortfall > 0 ? money4(d.shortfall) : "—"}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono ${d.surplus > 0 ? "text-positive font-bold" : "text-muted-foreground"}`}>
                      {d.surplus > 0 ? money4(d.surplus) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {d.remainingBurden > 0 ? money(d.remainingBurden) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORICAL CLOSED MONTHS */}
      {pastCycles.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-sm text-foreground">Bilihii Hore ee Xirmay (Closed Months)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground text-left border-b border-border pb-2">
                <tr>
                  <th className="py-2 px-3">Bisha</th>
                  <th className="py-2 px-3 text-right">Qorshaha</th>
                  <th className="py-2 px-3 text-right">Burden Hore</th>
                  <th className="py-2 px-3 text-right">Sales La Gaaray</th>
                  <th className="py-2 px-3 text-right">Minus Gudbay (Burden)</th>
                  <th className="py-2 px-3 text-right">Plus Xirmay (Surplus)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pastCycles.map((c) => (
                  <tr key={c.monthKey}>
                    <td className="py-2 px-3 font-semibold text-foreground">{c.monthKey}</td>
                    <td className="py-2 px-3 text-right font-mono">{money(c.monthlyTarget)}</td>
                    <td className="py-2 px-3 text-right font-mono">{money(c.openingCarriedBurden)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{money(c.totalActualSales)}</td>
                    <td className="py-2 px-3 text-right font-mono text-destructive font-bold">
                      {c.monthEndRemainingBurden > 0 ? money(c.monthEndRemainingBurden) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-positive">
                      {c.closingSurplus > 0 ? `${money(c.closingSurplus)} (Closed)` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY TARGET CONFIGURATION */}
      <div className="bg-card rounded-2xl border border-border p-5 max-w-xl">
        <h3 className="font-bold text-base mb-1 text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Qorshaha Bisha (Business Target Setting)
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Business Monthly Target: ${DEFAULT_MONTHLY_TARGET.toFixed(2)} bishii.
        </p>
        <form onSubmit={save} className="space-y-3">
          <label className="block text-xs font-bold text-foreground">
            Business Monthly Target ($)
            <input
              type="number"
              step="0.01"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground font-mono"
            />
          </label>
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-colors"
          >
            Keydi Qorshaha
          </button>
        </form>
      </div>
    </div>
  );
};
