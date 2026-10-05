import React from "react";
import type { EngineResult } from "@/lib/financial-engine";
import { maskMoney } from "@/lib/balance-visibility";

/**
 * Business Target summary — display rounds to 2-4 decimals; engine values stay full precision.
 * Implements Section 21 & Section 30 of GRAND MASTER specification.
 */
export const BusinessTargetSummary: React.FC<{ engine: EngineResult }> = ({ engine }) => {
  const money = (n: number) => maskMoney(n, true);
  const c = engine.activeCycle;
  const t = engine.today;

  const todayDiff = (t?.actualSales ?? 0) - (t?.requiredTarget ?? 0);
  const isSurplus = todayDiff > 0;
  const isShortfall = todayDiff < 0;

  return (
    <section aria-label="Business target" className="dashboard-panel border border-border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="dashboard-heading text-base font-semibold text-foreground">Business Financial Target</h2>
          <p className="text-xs text-muted-foreground">
            Bisha: <span className="font-semibold text-foreground">{c?.monthKey ?? "—"}</span> · Target-ka Bisha:{" "}
            <span className="font-semibold text-foreground">{money(c?.monthlyTarget ?? 93.5)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Maalmaha Harsan:</span>
          <strong className="rounded bg-accent px-2 py-0.5 font-bold text-foreground">
            {engine.remainingCalendarDays} maalmood
          </strong>
        </div>
      </div>

      {/* TODAY'S TARGET HERO ROW */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Today's Final Target</span>
          <span className="text-xs text-muted-foreground font-mono">
            Default ${t?.defaultDailyTarget.toFixed(4)} + Burden ${t?.activeBurden.toFixed(4)}
            {t && t.surplusReduction > 0 ? ` - Dheeri $${t.surplusReduction.toFixed(4)}` : ""}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-4">
          <strong className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {money(engine.todayFinalTarget)}
          </strong>
          <div className="text-sm">
            <span className="text-muted-foreground">Sales maanta: </span>
            <strong className="font-bold text-foreground">{money(engine.todaySales)}</strong>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Xaaladda: </span>
            <strong
              className={`font-bold ${
                isSurplus ? "text-positive" : isShortfall ? "text-destructive" : "text-foreground"
              }`}
            >
              {isSurplus
                ? `+${money(todayDiff)} (DHEERI)`
                : isShortfall
                ? `-${money(Math.abs(todayDiff))} (DHIMAN)`
                : "LA GAARAY"}
            </strong>
          </div>
        </div>
      </div>

      {/* DETAILED STAT GRID */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="border border-border p-2.5">
          <div className="dashboard-kicker text-muted-foreground">Default Daily Target</div>
          <div className="mt-1 font-mono text-sm font-semibold text-foreground">
            ${(t?.defaultDailyTarget ?? 93.5 / 31).toFixed(4)}
          </div>
        </div>
        <div className="border border-border p-2.5">
          <div className="dashboard-kicker text-muted-foreground">Today's Burden</div>
          <div className={`mt-1 font-mono text-sm font-semibold ${t && t.activeBurden > 0 ? "text-destructive" : "text-foreground"}`}>
            +${(t?.activeBurden ?? 0).toFixed(4)}
          </div>
        </div>
        <div className="border border-border p-2.5">
          <div className="dashboard-kicker text-muted-foreground">Surplus Reduction</div>
          <div className="mt-1 font-mono text-sm font-semibold text-positive">
            -${(t?.surplusReduction ?? 0).toFixed(4)}
          </div>
        </div>
        <div className="border border-border p-2.5">
          <div className="dashboard-kicker text-muted-foreground">Current Monthly Burden</div>
          <div className={`mt-1 font-semibold ${engine.currentMonthlyBurden > 0 ? "text-destructive" : "text-foreground"}`}>
            {money(engine.currentMonthlyBurden)}
          </div>
        </div>
        <div className="border border-border p-2.5">
          <div className="dashboard-kicker text-muted-foreground">Current Monthly Surplus</div>
          <div className="mt-1 font-semibold text-positive">
            {money(engine.currentMonthlySurplus)}
          </div>
        </div>
        <div className="border border-border p-2.5">
          <div className="dashboard-kicker text-muted-foreground">Monthly Remaining</div>
          <div className="mt-1 font-semibold text-foreground">
            {money(engine.remainingMonthlyRequirement)}
          </div>
        </div>
      </div>
    </section>
  );
};
