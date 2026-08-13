"use client";

import { ForecastChart } from "./ForecastChart";
import { AllocationCharts } from "./AllocationChart";
import { ChatPanel } from "./ChatPanel";
import { SavingsTip } from "@/lib/tips";

interface Scenario {
  percentile: number;
  finalAmount: number;
  years: { age: number; value: number }[];
}

interface YearPoint {
  age: number;
  totalSavings: number;
  contributions: number;
  returns: number;
}

interface AllocationBucket {
  name: string;
  percent: number;
  description?: string;
}

interface Allocation {
  strategySummary: string;
  buckets: AllocationBucket[];
  assetMix: { name: string; percent: number }[];
  rationale: string[];
}

interface ResultsDashboardProps {
  projection: {
    years: YearPoint[];
    nestEggAtRetirement: number;
    requiredMonthlySavings: number;
    targetNestEgg: number;
    safeAnnualWithdrawal: number;
    incomeGap: number;
  };
  monteCarlo: {
    scenarios: Scenario[];
    probabilityOfSuccess: number;
    medianFinalAmount: number;
  };
  allocation: Allocation;
  tips: SavingsTip[];
  advice: string;
  profile?: Record<string, unknown>;
}

function currency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ResultsDashboard({
  projection,
  monteCarlo,
  allocation,
  tips,
  advice,
  profile,
}: ResultsDashboardProps) {
  const onTrack = projection.incomeGap >= 0;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projected nest egg"
          value={currency(projection.nestEggAtRetirement)}
          tone={onTrack ? "good" : "warning"}
        />
        <StatCard
          label="Target nest egg"
          value={currency(projection.targetNestEgg)}
          tone="neutral"
        />
        <StatCard
          label="Required monthly savings"
          value={currency(projection.requiredMonthlySavings)}
          tone={projection.requiredMonthlySavings > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Probability of success"
          value={`${monteCarlo.probabilityOfSuccess.toFixed(0)}%`}
          tone={monteCarlo.probabilityOfSuccess >= 80 ? "good" : monteCarlo.probabilityOfSuccess >= 50 ? "warning" : "bad"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Retirement forecast
          </h3>
          <ForecastChart deterministic={projection.years} scenarios={monteCarlo.scenarios} />
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            Shaded Monte Carlo percentile bands show possible outcomes based on historical volatility.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Retirement income
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Safe 4% withdrawal</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {currency(projection.safeAnnualWithdrawal)}/yr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Estimated need</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {currency(projection.targetNestEgg / 25)}/yr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Income gap</span>
                <span
                  className={`font-medium ${
                    projection.incomeGap >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {projection.incomeGap >= 0 ? "+" : ""}
                  {currency(projection.incomeGap)}/yr
                </span>
              </div>
            </div>
            {projection.incomeGap < 0 && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                To reach your goal, save at least{" "}
                <strong>{currency(projection.requiredMonthlySavings)}</strong> per month.
              </p>
            )}
            {projection.incomeGap >= 0 && (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                You are on track. Keep saving and review annually.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Key insight
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {onTrack
                ? `Your projected nest egg of ${currency(
                    projection.nestEggAtRetirement
                  )} should support an annual safe withdrawal of ${currency(
                    projection.safeAnnualWithdrawal
                  )}.`
                : `You need to increase monthly savings by about ${currency(
                    Math.max(0, projection.requiredMonthlySavings - (projection.years[projection.years.length - 1]?.contributions || 0) / 12)
                  )} to close the gap.`}
            </p>
          </div>
        </div>
      </div>

      {/* Allocation */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Recommended investment allocation
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          {allocation.strategySummary}
        </p>
        <AllocationCharts buckets={allocation.buckets} assetMix={allocation.assetMix} />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allocation.buckets.map((bucket) => (
            <div
              key={bucket.name}
              className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {bucket.name}
                </span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {bucket.percent.toFixed(1)}%
                </span>
              </div>
              {bucket.description && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {bucket.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI advice */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          AI-powered personalized advice
        </h3>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {advice || "Submit your profile to generate personalized advice."}
        </div>
      </div>

      {/* Chat with AI advisor */}
      <ChatPanel
        context={{
          profile: profile,
          projection: {
            nestEggAtRetirement: projection.nestEggAtRetirement,
            requiredMonthlySavings: projection.requiredMonthlySavings,
            targetNestEgg: projection.targetNestEgg,
            safeAnnualWithdrawal: projection.safeAnnualWithdrawal,
            incomeGap: projection.incomeGap,
            probabilityOfSuccess: monteCarlo.probabilityOfSuccess,
          },
          allocation: {
            strategySummary: allocation.strategySummary,
            buckets: allocation.buckets,
          },
        }}
      />

      {/* Savings tips */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Tailored savings tips
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="rounded-lg border-l-4 border-emerald-500 bg-zinc-50 p-4 dark:bg-zinc-800/50"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {tip.category}
              </span>
              <h4 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {tip.title}
              </h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warning" | "bad" | "neutral";
}) {
  const toneClasses = {
    good: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20",
    warning: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20",
    bad: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20",
    neutral: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
