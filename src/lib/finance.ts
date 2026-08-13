// Financial projection engine: deterministic & Monte Carlo retirement forecasts.
// All amounts are in nominal USD unless otherwise noted.

export type RiskProfile = "conservative" | "moderate" | "aggressive";

export interface UserProfile {
  currentAge: number;
  retirementAge: number;
  annualSalary: number;
  currentSavings: number;
  monthlyContribution: number; // total monthly dollars saved/invested today
  employerMatch?: number; // e.g. 0.03 for 3% of salary
  monthlyExpenses?: number; // used to estimate retirement income need
  targetNestEgg?: number; // optional explicit goal; otherwise inferred
  riskProfile?: RiskProfile;
  monthlyIncomeInRetirement?: number; // e.g. Social Security or pension
}

export interface MarketAssumptions {
  expectedReturn: number; // annual geometric mean (e.g. 0.07 for 7%)
  volatility: number; // annual standard deviation (e.g. 0.16 for 16%)
  inflation: number; // annual inflation (e.g. 0.03 for 3%)
  riskFreeRate: number; // for cash/CDs/bonds baseline (e.g. 0.04)
}

export interface YearProjection {
  age: number;
  year: number;
  totalSavings: number;
  contributions: number;
  returns: number;
}

export interface ProjectionResult {
  years: YearProjection[];
  nestEggAtRetirement: number;
  totalContributed: number;
  totalReturns: number;
  requiredMonthlySavings: number; // to hit targetNestEgg (or inferred target)
  targetNestEgg: number;
  yearsInRetirement: number;
  safeAnnualWithdrawal: number; // 4% rule of projected nest egg
  incomeGap: number; // shortfall/surplus vs desired retirement income
}

// Default assumptions tuned to long-run US market data.
export const DEFAULT_ASSUMPTIONS: Record<RiskProfile, MarketAssumptions> = {
  conservative: { expectedReturn: 0.05, volatility: 0.08, inflation: 0.03, riskFreeRate: 0.04 },
  moderate: { expectedReturn: 0.07, volatility: 0.14, inflation: 0.03, riskFreeRate: 0.04 },
  aggressive: { expectedReturn: 0.09, volatility: 0.20, inflation: 0.03, riskFreeRate: 0.04 },
};

export function getAssumptions(riskProfile: RiskProfile = "moderate"): MarketAssumptions {
  return DEFAULT_ASSUMPTIONS[riskProfile];
}

// Estimate a target nest egg based on desired retirement income.
// Uses the 4% rule (25x annual income need) plus an adjustment for known retirement income.
export function estimateTargetNestEgg(profile: UserProfile): number {
  if (profile.targetNestEgg && profile.targetNestEgg > 0) return profile.targetNestEgg;

  const monthlyNeed =
    profile.monthlyExpenses && profile.monthlyExpenses > 0
      ? profile.monthlyExpenses
      : Math.max(profile.annualSalary * 0.7 / 12, 2000);

  const monthlyIncome = profile.monthlyIncomeInRetirement ?? 0;
  const monthlyShortfall = Math.max(0, monthlyNeed - monthlyIncome);
  const annualShortfall = monthlyShortfall * 12;
  return annualShortfall * 25; // 4% safe withdrawal rule
}

// Deterministic projection using a real (inflation-adjusted) geometric mean.
export function projectRetirement(
  profile: UserProfile,
  assumptions: MarketAssumptions = getAssumptions(profile.riskProfile)
): ProjectionResult {
  const realReturn = (1 + assumptions.expectedReturn) / (1 + assumptions.inflation) - 1;
  const monthlyRate = realReturn / 12;
  const months = (profile.retirementAge - profile.currentAge) * 12;
  const employerMatchMonthly = profile.employerMatch
    ? profile.annualSalary * profile.employerMatch / 12
    : 0;
  const totalMonthly = profile.monthlyContribution + employerMatchMonthly;

  const years: YearProjection[] = [];
  let balance = profile.currentSavings;
  let totalContributed = profile.currentSavings;
  let totalReturns = 0;
  const now = new Date().getFullYear();

  for (let m = 1; m <= months; m++) {
    const contribution = totalMonthly;
    const startBalance = balance;
    balance = balance * (1 + monthlyRate) + contribution;
    const monthlyReturn = balance - startBalance - contribution;
    totalContributed += contribution;
    totalReturns += monthlyReturn;

    if (m % 12 === 0) {
      const age = profile.currentAge + Math.floor(m / 12);
      years.push({
        age,
        year: now + Math.floor(m / 12),
        totalSavings: balance,
        contributions: totalContributed,
        returns: totalReturns,
      });
    }
  }

  const target = estimateTargetNestEgg(profile);
  const requiredMonthlySavings = solveRequiredMonthlyContribution(
    profile.currentSavings,
    profile.retirementAge - profile.currentAge,
    target,
    realReturn
  );

  const nestEggAtRetirement = balance;
  const yearsInRetirement = Math.max(0, 95 - profile.retirementAge);
  const safeAnnualWithdrawal = nestEggAtRetirement * 0.04;
  const annualIncomeNeed = target / 25;
  const incomeGap = safeAnnualWithdrawal - annualIncomeNeed;

  return {
    years,
    nestEggAtRetirement,
    totalContributed,
    totalReturns,
    requiredMonthlySavings,
    targetNestEgg: target,
    yearsInRetirement,
    safeAnnualWithdrawal,
    incomeGap,
  };
}

// Solve PMT (monthly contribution) required to reach a future value.
// Handles edge cases where r=0 or the goal is already met.
export function solveRequiredMonthlyContribution(
  pv: number,
  years: number,
  fv: number,
  annualRate: number
): number {
  const n = years * 12;
  const r = annualRate / 12;
  if (fv <= pv) return 0;
  if (n <= 0) return 0;
  if (Math.abs(r) < 1e-9) {
    return (fv - pv) / n;
  }
  const pmt = (fv - pv * Math.pow(1 + r, n)) / ((Math.pow(1 + r, n) - 1) / r);
  return Math.max(0, pmt);
}

export interface MonteCarloScenario {
  percentile: number; // 10, 50, 90 etc.
  finalAmount: number;
  years: { age: number; value: number }[];
}

export interface MonteCarloResult {
  scenarios: MonteCarloScenario[];
  probabilityOfSuccess: number; // % of runs reaching the target
  medianFinalAmount: number;
}

// Geometric Brownian Motion simulation for portfolio growth.
// Uses real returns (inflation-adjusted) so outputs are in today's dollars.
export function monteCarloRetirement(
  profile: UserProfile,
  assumptions: MarketAssumptions = getAssumptions(profile.riskProfile),
  simulations = 1000
): MonteCarloResult {
  const realReturn = (1 + assumptions.expectedReturn) / (1 + assumptions.inflation) - 1;
  const monthlyReturn = realReturn / 12;
  const monthlyVol = assumptions.volatility / Math.sqrt(12);
  const months = (profile.retirementAge - profile.currentAge) * 12;
  const employerMatchMonthly = profile.employerMatch
    ? profile.annualSalary * profile.employerMatch / 12
    : 0;
  const totalMonthly = profile.monthlyContribution + employerMatchMonthly;
  const target = estimateTargetNestEgg(profile);

  const finalAmounts: number[] = [];
  const allRuns: { age: number; value: number }[][] = [];

  for (let s = 0; s < simulations; s++) {
    let balance = profile.currentSavings;
    const run: { age: number; value: number }[] = [];
    for (let m = 1; m <= months; m++) {
      const randomReturn =
        monthlyReturn + monthlyVol * boxMullerRandom();
      balance = balance * (1 + randomReturn) + totalMonthly;
      if (m % 12 === 0) {
        run.push({
          age: profile.currentAge + Math.floor(m / 12),
          value: Math.max(0, balance),
        });
      }
    }
    finalAmounts.push(balance);
    allRuns.push(run);
  }

  finalAmounts.sort((a, b) => a - b);
  const successCount = finalAmounts.filter((v) => v >= target).length;
  const median = percentile(finalAmounts, 0.5);

  const percentiles = [0.1, 0.25, 0.5, 0.75, 0.9];
  const scenarios: MonteCarloScenario[] = percentiles.map((p) => {
    const idx = Math.floor(p * (simulations - 1));
    const run = allRuns[idx];
    return {
      percentile: Math.round(p * 100),
      finalAmount: percentile(finalAmounts, p),
      years: run,
    };
  });

  return {
    scenarios,
    probabilityOfSuccess: (successCount / simulations) * 100,
    medianFinalAmount: median,
  };
}

function boxMullerRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}
