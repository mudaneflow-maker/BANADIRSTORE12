import { describe, it, expect } from "vitest";
import {
  computeEngine,
  daysInMonth,
  monthlyPlanFor,
  DEFAULT_MONTHLY_TARGET,
  type FinEngineConfig,
} from "./financial-engine";

const cfg: FinEngineConfig = {
  systemStartDate: "2026-10-01",
  monthlyBaseTarget: 93.5,
};

describe("Grand Master Business Financial Engine — All 14 Validation Tests", () => {
  it("Test 1: 31-day month, zero sales every day creates proper accumulated daily targets", () => {
    const res = computeEngine("2026-10-05", cfg, {});
    const days = res.days;

    // Day 1: 93.50 / 31
    expect(days[0].requiredTarget).toBeCloseTo(93.5 / 31, 10);
    // Day 2: 93.50 / 30
    expect(days[1].requiredTarget).toBeCloseTo(93.5 / 30, 10);
    // Day 3: 93.50 / 29
    expect(days[2].requiredTarget).toBeCloseTo(93.5 / 29, 10);
    // Day 4: 93.50 / 28
    expect(days[3].requiredTarget).toBeCloseTo(93.5 / 28, 10);
    // Day 5 (Today): 93.50 / 27 = 3.46296296...
    expect(days[4].requiredTarget).toBeCloseTo(93.5 / 27, 10);
    expect(res.todayFinalTarget).toBeCloseTo(93.5 / 27, 10);

    // Verify UI formatted values
    expect(days[0].requiredTarget.toFixed(4)).toBe("3.0161");
    expect(days[1].requiredTarget.toFixed(4)).toBe("3.1167");
    expect(days[2].requiredTarget.toFixed(4)).toBe("3.2241");
    expect(days[3].requiredTarget.toFixed(4)).toBe("3.3393");
    expect(days[4].requiredTarget.toFixed(4)).toBe("3.4630");
  });

  it("Test 2: Sales exactly equal to required target keeps target at base daily", () => {
    const base = 93.5 / 31;
    const sales = {
      "2026-10-01": base,
      "2026-10-02": base,
      "2026-10-03": base,
    };
    const res = computeEngine("2026-10-03", cfg, sales);
    expect(res.days[0].requiredTarget).toBeCloseTo(base, 10);
    expect(res.days[1].requiredTarget).toBeCloseTo(base, 10);
    expect(res.days[2].requiredTarget).toBeCloseTo(base, 10);
    expect(res.todayBurden).toBe(0);
    expect(res.todayShortfall).toBe(0);
  });

  it("Test 3: Day 1 zero sales, Day 2 normal sales", () => {
    const day2Target = 93.5 / 30; // 3.1166667
    const sales = {
      "2026-10-01": 0,
      "2026-10-02": day2Target,
    };
    const res = computeEngine("2026-10-02", cfg, sales);
    expect(res.days[0].requiredTarget).toBeCloseTo(93.5 / 31, 10);
    expect(res.days[1].requiredTarget).toBeCloseTo(day2Target, 10);
    expect(res.days[1].shortfall).toBe(0);
  });

  it("Test 4: Multiple consecutive days with zero sales", () => {
    const res = computeEngine("2026-10-04", cfg, {});
    expect(res.days[0].requiredTarget).toBeCloseTo(93.5 / 31, 10);
    expect(res.days[1].requiredTarget).toBeCloseTo(93.5 / 30, 10);
    expect(res.days[2].requiredTarget).toBeCloseTo(93.5 / 29, 10);
    expect(res.days[3].requiredTarget).toBeCloseTo(93.5 / 28, 10);
    expect(res.todayFinalTarget).toBeCloseTo(93.5 / 28, 10);
  });

  it("Test 5: Large surplus on one day", () => {
    const sales = {
      "2026-10-01": 50.0,
    };
    const res = computeEngine("2026-10-02", cfg, sales);
    expect(res.days[0].surplus).toBeCloseTo(50.0 - (93.5 / 31), 10);
    expect(res.days[1].activeBurden).toBe(0);
  });

  it("Test 6: Surplus partially reduces burden", () => {
    // Day 1 has 0 sales -> shortfall is 93.5/31 = 3.016129.
    // Day 2 has sales that exceed Day 2 target by 1.00 (surplus = 1.00).
    const day2Target = 93.5 / 30; // 3.1166667
    const sales = {
      "2026-10-01": 0,
      "2026-10-02": day2Target + 1.0,
    };
    const res = computeEngine("2026-10-03", cfg, sales);
    // Surplus of 1.00 is applied across the remaining 29 days (days 3..31)
    // Day 3 target should be lower than without surplus
    const withoutSurplus = 93.5 / 29; // 3.224138
    expect(res.days[2].requiredTarget).toBeLessThan(withoutSurplus);
    // Math identity: total remaining target is 93.50 - (day2Target + 1.0)
    const remainingMonth = 93.5 - (day2Target + 1.0);
    expect(res.days[2].requiredTarget).toBeCloseTo(remainingMonth / 29, 10);
  });

  it("Test 7: Surplus completely eliminates burden", () => {
    // Day 1 has 0 sales. Total future burden across days 2..31 is 3.016129
    // Day 2 has surplus equal to the remaining future burden
    const day2Target = 93.5 / 30;
    const totalRemainingBurdenAtDay2 = (93.5 / 31);
    const sales = {
      "2026-10-01": 0,
      "2026-10-02": day2Target + totalRemainingBurdenAtDay2,
    };
    const res = computeEngine("2026-10-03", cfg, sales);
    // Burden should be completely eliminated on Day 3
    expect(res.days[2].activeBurden - res.days[2].surplusReduction).toBeCloseTo(0, 10);
  });

  it("Test 8: Surplus exceeds burden", () => {
    const day2Target = 93.5 / 30;
    const sales = {
      "2026-10-01": 0,
      "2026-10-02": day2Target + 10.0,
    };
    const res = computeEngine("2026-10-03", cfg, sales);
    expect(res.activeCycle!.currentSurplus).toBeGreaterThan(0);
    expect(res.days[2].activeBurden - res.days[2].surplusReduction).toBe(0);
  });

  it("Test 9: Month ends with remaining burden", () => {
    // October ends with zero sales
    const res = computeEngine("2026-10-31", cfg, {});
    expect(res.activeCycle!.monthEndRemainingBurden).toBeCloseTo(93.5, 10);
    expect(res.activeCycle!.closingDeficit).toBeCloseTo(93.5, 10);
  });

  it("Test 10: Month ends with surplus", () => {
    const sales = {
      "2026-10-31": 200,
    };
    const res = computeEngine("2026-10-31", cfg, sales);
    expect(res.activeCycle!.monthEndRemainingBurden).toBe(0);
    expect(res.activeCycle!.closingSurplus).toBeGreaterThan(0);
  });

  it("Test 11: New month after previous month burden carries minus forward", () => {
    // October ends with 0 sales -> 93.50 carried forward to November (30 days)
    const res = computeEngine("2026-11-01", cfg, {});
    expect(res.cycles[0].monthEndRemainingBurden).toBeCloseTo(93.5, 10);
    expect(res.activeCycle!.openingCarriedBurden).toBeCloseTo(93.5, 10);
    // November total requirement: 93.50 base + 93.50 carried = 187.00
    expect(res.activeCycle!.effectiveMonthlyRequirement).toBeCloseTo(187.0, 10);
    // November Day 1 target: 187.00 / 30 = 6.2333333
    expect(res.todayFinalTarget).toBeCloseTo(187.0 / 30, 10);
  });

  it("Test 12: New month after previous month surplus does NOT carry plus forward", () => {
    // October ends with huge surplus
    const res = computeEngine("2026-11-01", cfg, { "2026-10-31": 500 });
    expect(res.cycles[0].closingSurplus).toBeGreaterThan(0);
    // November openingCarriedBurden must be 0
    expect(res.activeCycle!.openingCarriedBurden).toBe(0);
    expect(res.activeCycle!.effectiveMonthlyRequirement).toBeCloseTo(93.5, 10);
    expect(res.todayFinalTarget).toBeCloseTo(93.5 / 30, 10);
  });

  it("Test 13: Historical target values do not change after future sales", () => {
    const salesBefore = { "2026-10-01": 0, "2026-10-02": 0 };
    const r1 = computeEngine("2026-10-03", cfg, salesBefore);
    const day1Target = r1.days[0].requiredTarget;
    const day2Target = r1.days[1].requiredTarget;

    // Now sales occur on Day 3 and Day 4
    const salesAfter = {
      ...salesBefore,
      "2026-10-03": 50.0,
      "2026-10-04": 20.0,
    };
    const r2 = computeEngine("2026-10-04", cfg, salesAfter);
    expect(r2.days[0].requiredTarget).toBe(day1Target);
    expect(r2.days[1].requiredTarget).toBe(day2Target);
  });

  it("Test 14: No early rounding causes calculation drift", () => {
    const res = computeEngine("2026-10-05", cfg, {});
    // Sum of Day 5 target and remaining 26 days equals total remaining target
    const remainingMonth = 93.50;
    const day5Target = res.todayFinalTarget;
    expect(day5Target * 27).toBeCloseTo(remainingMonth, 10);
  });
});
