"use client";

import { useState } from "react";
import { InputForm } from "@/components/InputForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import type { UserProfile } from "@/lib/finance";
import type { SavingsTip } from "@/lib/tips";

interface ApiResponse {
  projection: {
    years: { age: number; totalSavings: number; contributions: number; returns: number }[];
    nestEggAtRetirement: number;
    requiredMonthlySavings: number;
    targetNestEgg: number;
    safeAnnualWithdrawal: number;
    incomeGap: number;
  };
  monteCarlo: {
    scenarios: { percentile: number; finalAmount: number; years: { age: number; value: number }[] }[];
    probabilityOfSuccess: number;
    medianFinalAmount: number;
  };
  allocation: {
    strategySummary: string;
    buckets: { name: string; percent: number; description?: string }[];
    assetMix: { name: string; percent: number }[];
    rationale: string[];
  };
  tips: SavingsTip[];
}

export default function Home() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [advice, setAdvice] = useState<string>("");
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(profile: UserProfile) {
    setLoading(true);
    setError(null);
    setCurrentProfile(profile);
    try {
      const calcRes = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const calcData = (await calcRes.json()) as ApiResponse & { error?: string };
      if (!calcRes.ok) {
        throw new Error(calcData.error || "Calculation failed");
      }
      setResult(calcData);

      const adviceRes = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          projection: {
            nestEggAtRetirement: calcData.projection.nestEggAtRetirement,
            requiredMonthlySavings: calcData.projection.requiredMonthlySavings,
            safeAnnualWithdrawal: calcData.projection.safeAnnualWithdrawal,
            targetNestEgg: calcData.projection.targetNestEgg,
            incomeGap: calcData.projection.incomeGap,
          },
          monteCarlo: { probabilityOfSuccess: calcData.monteCarlo.probabilityOfSuccess },
          allocation: {
            strategySummary: calcData.allocation.strategySummary,
            buckets: calcData.allocation.buckets,
          },
        }),
      });
      const adviceData = (await adviceRes.json()) as { advice?: string; error?: string };
      setAdvice(adviceData.advice || "Personalized advice unavailable.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            AI Financial Advisor
          </h1>
          <p className="mt-1 text-sm font-bold text-zinc-500 dark:text-zinc-400">
            Designed by Giang Le
          </p>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Plan, predict, and optimize your retirement — at any age, any salary.
          </p>
        </div>

        <InputForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {result && (
          <ResultsDashboard
            projection={result.projection}
            monteCarlo={result.monteCarlo}
            allocation={result.allocation}
            tips={result.tips}
            advice={advice}
            profile={currentProfile as unknown as Record<string, unknown>}
          />
        )}
      </div>
    </main>
  );
}
