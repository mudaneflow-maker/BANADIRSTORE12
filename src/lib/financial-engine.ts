import { useSyncExternalStore } from "react";

// ============================================================
// GRAND MASTER FINAL — BUSINESS FINANCIAL ENGINE + DAILY TARGET
//
// Rules:
// 1. Business only. Zero Personal, Zero Guaranteed Income, Zero Petty Cash/EVC interference.
// 2. Business Monthly Target = $93.50 (exact default).
// 3. Default Daily Target = $93.50 / daysInMonth (full precision internal, no early rounding).
// 4. Day 1 starts clean.
// 5. Shortfall creates a burden that is redistributed equally across remaining days in the month.
// 6. Each missed day creates an additional burden. All active daily burdens are tracked per source day.
// 7. Surplus reduces future active burden. Unused surplus is kept in current month, never carries over.
// 8. Month-end minus (outstanding burden) CARRIES FORWARD to next month as Opening Carried Burden.
// 9. Month-end plus (surplus) is CLOSED and NEVER carries to the next month.
// 10. Past days are LOCKED. Current day is ACTIVE. Future days are DYNAMIC.
// ============================================================

export type FinEngineConfig = {
  systemStartDate: string; // YYYY-MM-DD — default "2026-10-01"
  monthlyBaseTarget: number; // default 93.50
};

export type DayBurdenDetail = {
  sourceDay: number;
  sourceDate: string;
  originalShortfall: number;
  remainingDaysAtCreation: number;
  dailyAllocation: number;
};

export type DayRecord = {
  date: string;
  dayNumber: number; // 1..31
  daysInMonth: number;
  monthlyTarget: number;
  defaultDailyTarget: number; // monthlyTarget / daysInMonth
  activeBurden: number; // sum of previous daily burden allocations for this day
  surplusReduction: number; // reduction from prior surpluses
  requiredTarget: number; // defaultDailyTarget + activeBurden - surplusReduction
  adjustedTarget: number; // alias for backward-compatibility with UI (equals requiredTarget)
  baseTarget: number; // alias for backward-compatibility (equals defaultDailyTarget)
  inheritedLoad: number; // alias for backward-compatibility (equals activeBurden - surplusReduction)
  actualSales: number;
  achievement: number; // alias for actualSales
  shortfall: number; // max(0, requiredTarget - actualSales)
  deficit: number; // alias for shortfall
  surplus: number; // max(0, actualSales - requiredTarget)
  burdenCreatedToday: number;
  burdenAllocatedToFuture: number;
  redistributed: number; // alias for burdenAllocatedToFuture
  surplusAppliedToBurden: number;
  remainingDaysAfter: number;
  remainingBurden: number;
  deficitCarryAfter: number;
  surplusCarryAfter: number;
  status: "past" | "today" | "future";
  burdenDetails: DayBurdenDetail[];
};

export type MonthCycle = {
  monthKey: string; // YYYY-MM
  totalDays: number;
  monthlyTarget: number;
  openingCarriedBurden: number;
  openingDeficit: number; // alias
  effectiveMonthlyRequirement: number;
  plan: number; // alias
  burden: number; // alias
  baseDailyTarget: number;
  days: DayRecord[];
  totalActualSales: number;
  totalAchievement: number; // alias
  totalRequiredTarget: number;
  totalShortfall: number;
  totalSurplus: number;
  currentBurden: number;
  currentSurplus: number;
  remainingMonthlyRequirement: number;
  monthEndRemainingBurden: number;
  closingDeficit: number; // alias
  closingSurplus: number; // alias
  closed: boolean;
};

export type EngineResult = {
  cycles: MonthCycle[];
  activeCycle: MonthCycle | null;
  today: DayRecord | null;
  todayDefaultTarget: number;
  todayBurden: number;
  todaySurplusReduction: number;
  todayFinalTarget: number;
  todaySales: number;
  todayRemaining: number;
  todayShortfall: number;
  todaySurplus: number;
  nextDayTarget: number;
  remainingMonthlyTarget: number;
  remainingMonthlyRequirement: number;
  remainingCalendarDays: number;
  outstandingDeficit: number;
  currentMonthlyBurden: number;
  currentMonthSurplus: number;
  currentMonthlySurplus: number;
  days: DayRecord[];
};

export type FundTransfer = {
  id: string;
  date: string;
  fromAccountId: string;
  fromAccountName: string;
  amount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
};

export type Reconciliation = {
  id: string;
  date: string;
  accountId: string;
  accountName: string;
  liveBalance: number;
  ledgerBalance: number;
  difference: number;
  reason: string;
  createdBy: string;
  createdAt: string;
};

export type FinEngineState = {
  config: FinEngineConfig;
  fundTransfers: FundTransfer[];
  reconciliations: Reconciliation[];
};

export const ENGINE_START_DATE = "2026-10-01";
export const DEFAULT_MONTHLY_TARGET = 93.5;
export const PETTY_CASH_FUND = "Petty Cash Fund";

const DEFAULT_CONFIG: FinEngineConfig = {
  systemStartDate: ENGINE_START_DATE,
  monthlyBaseTarget: DEFAULT_MONTHLY_TARGET,
};

const KEY = "benadir_finengine_v1";

const EMPTY: FinEngineState = {
  config: DEFAULT_CONFIG,
  fundTransfers: [],
  reconciliations: [],
};

let state: FinEngineState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
        fundTransfers: Array.isArray(parsed.fundTransfers) ? parsed.fundTransfers : [],
        reconciliations: Array.isArray(parsed.reconciliations) ? parsed.reconciliations : [],
      };
    } else {
      state = EMPTY;
    }
  } catch {
    state = EMPTY;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  read();
  window.addEventListener("benadir-remote-update", () => {
    read();
    listeners.forEach((l) => l());
  });
}

function persist(next: FinEngineState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function getFinEngineState(): FinEngineState {
  load();
  return state;
}

export function useFinEngine() {
  load();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => EMPTY,
  );
}

export function updateFinConfig(patch: Partial<FinEngineConfig>, _user?: string) {
  load();
  persist({
    ...state,
    config: { ...state.config, ...patch },
  });
}

export function addFundTransfer(t: Omit<FundTransfer, "id" | "createdAt">): FundTransfer {
  load();
  const rec: FundTransfer = {
    ...t,
    id: `FT-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  persist({
    ...state,
    fundTransfers: [rec, ...state.fundTransfers],
  });
  return rec;
}

export function addReconciliation(
  r: Omit<Reconciliation, "id" | "createdAt" | "difference">,
): Reconciliation {
  load();
  const rec: Reconciliation = {
    ...r,
    id: `REC-${Date.now().toString(36)}`,
    difference: Math.round((r.liveBalance - r.ledgerBalance) * 100) / 100,
    createdAt: new Date().toISOString(),
  };
  persist({
    ...state,
    reconciliations: [rec, ...state.reconciliations],
  });
  return rec;
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthlyPlanFor(_monthKey: string, cfg: FinEngineConfig): number {
  return cfg.monthlyBaseTarget ?? DEFAULT_MONTHLY_TARGET;
}

export function pettyCashFundBalance(
  fundTransfers: FundTransfer[],
  expensesPaidFromFund: number,
): number {
  const funded = fundTransfers.reduce((s, t) => s + t.amount, 0);
  return Math.round((funded - expensesPaidFromFund) * 100) / 100;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * PURE BUSINESS FINANCIAL ENGINE & DAILY TARGET REDISTRIBUTION
 *
 * Implements exact day-by-day burden redistribution and month-end rollover.
 * - Full mathematical precision (no premature rounding).
 * - Historical days are locked.
 * - Today is active.
 * - Future days are dynamic.
 */
export function computeEngine(
  todayDate: string,
  cfg: FinEngineConfig,
  dailySalesMap: Record<string, number>,
): EngineResult {
  const effectiveStart =
    !cfg.systemStartDate || cfg.systemStartDate < ENGINE_START_DATE
      ? ENGINE_START_DATE
      : cfg.systemStartDate;

  const startMonth = effectiveStart.slice(0, 7);
  const todayMonth = todayDate.slice(0, 7);
  const cycles: MonthCycle[] = [];

  let openingCarriedBurden = 0;
  let mk = startMonth;

  for (let guard = 0; guard < 600 && mk <= todayMonth; guard++) {
    const totalDays = daysInMonth(mk);
    const monthlyTarget = cfg.monthlyBaseTarget ?? DEFAULT_MONTHLY_TARGET;
    const effectiveMonthlyRequirement = monthlyTarget + openingCarriedBurden;
    const defaultDailyTarget = effectiveMonthlyRequirement / totalDays;

    // futureBurdens[d] stores the burden allocated to day d
    const futureBurdens: number[] = new Array(totalDays + 1).fill(0);
    // futureReductions[d] stores the surplus reduction applied to day d
    const futureReductions: number[] = new Array(totalDays + 1).fill(0);

    const activeBurdenDetails: DayBurdenDetail[] = [];
    const days: DayRecord[] = [];

    let totalActualSales = 0;
    let totalRequiredTarget = 0;
    let totalShortfall = 0;
    let totalSurplus = 0;
    let currentBurden = 0;
    let unusedSurplusForMonth = 0;

    for (let d = 1; d <= totalDays; d++) {
      const date = `${mk}-${pad(d)}`;
      const isPast = date < todayDate;
      const isToday = date === todayDate;
      const isFuture = date > todayDate;
      const status: "past" | "today" | "future" = isPast ? "past" : isToday ? "today" : "future";

      const activeBurden = futureBurdens[d];
      let surplusReduction = futureReductions[d];
      if (surplusReduction > activeBurden || Math.abs(activeBurden - surplusReduction) < 1e-12) {
        surplusReduction = activeBurden;
      }
      const netBurden = Math.max(0, activeBurden - surplusReduction);
      const requiredTarget = Math.max(0, defaultDailyTarget + netBurden);

      let actualSales = 0;
      let shortfall = 0;
      let surplus = 0;
      let burdenCreatedToday = 0;
      let burdenAllocatedToFuture = 0;
      let surplusAppliedToBurden = 0;
      const remainingDaysAfter = totalDays - d;

      if (!isFuture) {
        actualSales = dailySalesMap[date] || 0;
        totalActualSales += actualSales;
        totalRequiredTarget += requiredTarget;

        if (actualSales < requiredTarget) {
          shortfall = requiredTarget - actualSales;
          totalShortfall += shortfall;
          burdenCreatedToday = shortfall;

          if (remainingDaysAfter > 0) {
            burdenAllocatedToFuture = shortfall / remainingDaysAfter;
            for (let k = d + 1; k <= totalDays; k++) {
              futureBurdens[k] += burdenAllocatedToFuture;
            }
            activeBurdenDetails.push({
              sourceDay: d,
              sourceDate: date,
              originalShortfall: shortfall,
              remainingDaysAtCreation: remainingDaysAfter,
              dailyAllocation: burdenAllocatedToFuture,
            });
          }
        } else if (actualSales > requiredTarget) {
          surplus = actualSales - requiredTarget;
          totalSurplus += surplus;

          // Calculate total outstanding future burden across remaining days
          let totalRemainingFutureBurden = 0;
          for (let k = d + 1; k <= totalDays; k++) {
            totalRemainingFutureBurden += Math.max(0, futureBurdens[k] - futureReductions[k]);
          }

          if (totalRemainingFutureBurden > 0 && remainingDaysAfter > 0) {
            const applied = Math.min(surplus, totalRemainingFutureBurden);
            surplusAppliedToBurden = applied;
            const perDayReduction = applied / remainingDaysAfter;
            for (let k = d + 1; k <= totalDays; k++) {
              futureReductions[k] += perDayReduction;
            }
            unusedSurplusForMonth += surplus - applied;
          } else {
            unusedSurplusForMonth += surplus;
          }
        }
      }

      // Compute remaining net future burden after day d
      let remainingNetBurden = 0;
      for (let k = d + 1; k <= totalDays; k++) {
        const net = futureBurdens[k] - futureReductions[k];
        remainingNetBurden += net > 1e-12 ? net : 0;
      }
      currentBurden = remainingNetBurden;

      days.push({
        date,
        dayNumber: d,
        daysInMonth: totalDays,
        monthlyTarget,
        defaultDailyTarget,
        activeBurden,
        surplusReduction,
        requiredTarget,
        adjustedTarget: requiredTarget,
        baseTarget: defaultDailyTarget,
        inheritedLoad: netBurden,
        actualSales,
        achievement: actualSales,
        shortfall,
        deficit: shortfall,
        surplus,
        burdenCreatedToday,
        burdenAllocatedToFuture,
        redistributed: burdenAllocatedToFuture,
        surplusAppliedToBurden,
        remainingDaysAfter,
        remainingBurden: remainingNetBurden,
        deficitCarryAfter: shortfall,
        surplusCarryAfter: surplus,
        status,
        burdenDetails: [...activeBurdenDetails],
      });
    }

    // Month-End Rollover Determination
    const isClosedMonth = mk < todayMonth;
    let monthEndRemainingBurden = 0;
    let monthEndClosedSurplus = 0;

    if (totalActualSales < effectiveMonthlyRequirement) {
      // Outstanding deficit / minus carries forward
      monthEndRemainingBurden = effectiveMonthlyRequirement - totalActualSales;
      monthEndClosedSurplus = 0;
    } else {
      // Month-end surplus is closed and never carried forward
      monthEndRemainingBurden = 0;
      monthEndClosedSurplus = totalActualSales - effectiveMonthlyRequirement;
    }

    const remainingMonthlyRequirement = Math.max(0, effectiveMonthlyRequirement - totalActualSales);

    cycles.push({
      monthKey: mk,
      totalDays,
      monthlyTarget,
      openingCarriedBurden,
      openingDeficit: openingCarriedBurden,
      effectiveMonthlyRequirement,
      plan: effectiveMonthlyRequirement,
      burden: effectiveMonthlyRequirement,
      baseDailyTarget: defaultDailyTarget,
      days,
      totalActualSales,
      totalAchievement: totalActualSales,
      totalRequiredTarget,
      totalShortfall,
      totalSurplus,
      currentBurden,
      currentSurplus: unusedSurplusForMonth,
      remainingMonthlyRequirement,
      monthEndRemainingBurden,
      closingDeficit: monthEndRemainingBurden,
      closingSurplus: monthEndClosedSurplus,
      closed: isClosedMonth,
    });

    // CULAYS BISHII KA BAXA: minus carries forward; plus never carries forward
    openingCarriedBurden = monthEndRemainingBurden;

    const [y, m] = mk.split("-").map(Number);
    mk = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  }

  const activeCycle = cycles[cycles.length - 1] ?? null;
  const [curYear, curMonth, curDay] = (todayDate || "").split("-").map(Number);
  const todayDayNumber = !isNaN(curDay) && curDay > 0 ? curDay : new Date().getDate();
  const calculatedMonthDays =
    !isNaN(curYear) && !isNaN(curMonth) && curYear > 0 && curMonth > 0
      ? new Date(curYear, curMonth, 0).getDate()
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const todayRec =
    activeCycle?.days.find((d) => d.date === todayDate) ??
    activeCycle?.days[Math.min(todayDayNumber - 1, (activeCycle?.days.length ?? 1) - 1)] ??
    null;

  const totalDays = activeCycle?.totalDays ?? calculatedMonthDays;
  const remainingCalendarDays = Math.max(0, totalDays - todayDayNumber);

  // Next day target
  let nextDayTarget = 0;
  if (activeCycle) {
    const nextDay = activeCycle.days.find((d) => d.dayNumber === todayDayNumber + 1);
    if (nextDay) {
      nextDayTarget = nextDay.requiredTarget;
    } else {
      // First day of next month
      const nextMonthRequirement =
        (cfg.monthlyBaseTarget ?? DEFAULT_MONTHLY_TARGET) +
        (activeCycle.monthEndRemainingBurden ?? 0);
      nextDayTarget = nextMonthRequirement / 30; // standard approximation for next month
    }
  }

  return {
    cycles,
    activeCycle,
    today: todayRec,
    todayDefaultTarget: todayRec?.defaultDailyTarget ?? DEFAULT_MONTHLY_TARGET / 31,
    todayBurden: todayRec?.activeBurden ?? 0,
    todaySurplusReduction: todayRec?.surplusReduction ?? 0,
    todayFinalTarget: todayRec?.requiredTarget ?? DEFAULT_MONTHLY_TARGET / 31,
    todaySales: todayRec?.actualSales ?? 0,
    todayRemaining: todayRec ? Math.max(0, todayRec.requiredTarget - todayRec.actualSales) : 0,
    todayShortfall: todayRec?.shortfall ?? 0,
    todaySurplus: todayRec?.surplus ?? 0,
    nextDayTarget,
    remainingMonthlyTarget: activeCycle?.remainingMonthlyRequirement ?? DEFAULT_MONTHLY_TARGET,
    remainingMonthlyRequirement: activeCycle?.remainingMonthlyRequirement ?? DEFAULT_MONTHLY_TARGET,
    remainingCalendarDays,
    outstandingDeficit: activeCycle?.currentBurden ?? 0,
    currentMonthlyBurden: activeCycle?.currentBurden ?? 0,
    currentMonthSurplus: activeCycle?.currentSurplus ?? 0,
    currentMonthlySurplus: activeCycle?.currentSurplus ?? 0,
    days: activeCycle?.days ?? [],
  };
}
