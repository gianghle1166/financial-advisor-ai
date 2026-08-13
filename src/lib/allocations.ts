import type { RiskProfile, UserProfile } from "./finance";

export type AccountType =
  | "401k"
  | "IRA"
  | "Roth IRA"
  | "Taxable Brokerage"
  | "HSA"
  | "CDs"
  | "Bonds"
  | "Annuity"
  | "High-Yield Savings";

export interface AllocationBucket {
  name: AccountType;
  percent: number;
  description: string;
}

export interface AllocationRecommendation {
  strategySummary: string;
  buckets: AllocationBucket[];
  // Separate growth vs safety view
  assetMix: { name: string; percent: number }[];
  rationale: string[];
}

function yearsToRetirement(profile: UserProfile): number {
  return Math.max(0, profile.retirementAge - profile.currentAge);
}

function riskScore(profile: UserProfile): number {
  const riskMap: Record<RiskProfile, number> = {
    conservative: 1,
    moderate: 2,
    aggressive: 3,
  };
  return riskMap[profile.riskProfile ?? "moderate"];
}

export function recommendAllocation(profile: UserProfile): AllocationRecommendation {
  const years = yearsToRetirement(profile);
  const risk = riskScore(profile);

  // Stock/bond split: age-based glide path adjusted by risk tolerance.
  // Base rule: 110 - age, then shift +/- 10% by risk profile.
  const baseEquity = Math.min(90, Math.max(20, 110 - profile.currentAge));
  const riskAdjustment = (risk - 2) * 10; // conservative -10, moderate 0, aggressive +10
  const stockPercent = Math.min(90, Math.max(20, baseEquity + riskAdjustment));
  // Cash reserve shrinks as horizon lengthens, then grows near retirement.
  const cashPercent = Math.min(25, Math.max(3, 15 - years / 3));
  const bondPercent = Math.max(0, 100 - stockPercent - cashPercent);

  let buckets: AllocationBucket[];

  if (years >= 20) {
    // Long horizon: maximize tax-advantaged growth.
    buckets = [
      { name: "401k", percent: 20, description: "Max employer match; low-cost target-date/index funds." },
      { name: "Roth IRA", percent: 15, description: "Tax-free withdrawals in retirement." },
      { name: "IRA", percent: 10, description: "Tax-deferred growth if income allows deductible contributions." },
      { name: "HSA", percent: 5, description: "Triple tax-advantaged if eligible for HDHP." },
      { name: "Taxable Brokerage", percent: 40, description: "Broad index ETFs after tax-advantaged accounts are filled." },
      { name: "Bonds", percent: 10, description: "High-quality bonds/bond index for stability." },
      { name: "High-Yield Savings", percent: 5, description: "Emergency fund & short-term goals." },
    ];
  } else if (years >= 10) {
    // Mid-career: balance growth and stability, start annuitizing a little if desired.
    buckets = [
      { name: "401k", percent: 25, description: "Increase contributions; rebalance toward target-date fund." },
      { name: "IRA", percent: 10, description: "Catch-up contributions if age 50+." },
      { name: "Roth IRA", percent: 10, description: "Tax diversification." },
      { name: "Taxable Brokerage", percent: 20, description: "Diversified stock/bond mix." },
      { name: "Bonds", percent: 20, description: "Stabilize portfolio as retirement approaches." },
      { name: "CDs", percent: 5, description: "Ladder CDs for known expenses." },
      { name: "Annuity", percent: 5, description: "Optional fixed annuity for guaranteed income floor." },
      { name: "High-Yield Savings", percent: 5, description: "Liquidity buffer." },
    ];
  } else {
    // Near/early retirement: preserve capital and secure income.
    buckets = [
      { name: "401k", percent: 20, description: "Preserve balance; shift to conservative target-date fund." },
      { name: "IRA", percent: 15, description: "Consider Roth conversions strategically." },
      { name: "Bonds", percent: 25, description: "High-quality bonds & Treasury ladder." },
      { name: "CDs", percent: 10, description: "Short-term CDs for predictable withdrawals." },
      { name: "Annuity", percent: 15, description: "Single-premium immediate annuity for guaranteed lifetime income." },
      { name: "High-Yield Savings", percent: 10, description: "Larger cash reserve for 2-4 years of expenses." },
      { name: "Taxable Brokerage", percent: 5, description: "Remainder in diversified equities." },
    ];
  }

  // Normalize to 100% and round to 1 decimal.
  const total = buckets.reduce((sum, b) => sum + b.percent, 0);
  const normalized = buckets.map((b) => ({
    ...b,
    percent: Number(((b.percent / total) * 100).toFixed(1)),
  }));

  // Simplify asset mix for charts.
  const assetMix = [
    { name: "Stocks/Equities", percent: Number(stockPercent.toFixed(1)) },
    { name: "Bonds/Fixed Income", percent: Number((bondPercent + normalized.filter((b) => b.name === "Annuity").reduce((s, b) => s + b.percent, 0)).toFixed(1)) },
    { name: "Cash/CDs/Savings", percent: Number(cashPercent.toFixed(1)) },
  ];

  const rationale: string[] = [
    `You are ${profile.currentAge} and plan to retire at ${profile.retirementAge} (${years} years).`,
    `Risk profile: ${profile.riskProfile ?? "moderate"}.`,
    `Glide-path equity allocation: ${stockPercent.toFixed(0)}% stocks.`,
    years >= 20
      ? "Long horizon favors tax-advantaged growth accounts (401k, IRA, Roth IRA, HSA)."
      : years >= 10
      ? "Mid-horizon balances growth with capital preservation and income guarantees."
      : "Short horizon prioritizes stable income, capital preservation, and guaranteed income via annuities/CDs.",
  ];

  const strategySummary = years >= 20
    ? "Growth-first strategy: maximize tax-advantaged accounts and broad equity index exposure."
    : years >= 10
    ? "Balanced strategy: lock in gains, increase bonds/CDs, and add optional annuity income."
    : "Capital-preservation strategy: secure income, reduce volatility, and protect principal.";

  return {
    strategySummary,
    buckets: normalized,
    assetMix,
    rationale,
  };
}
