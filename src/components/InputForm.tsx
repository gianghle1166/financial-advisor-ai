"use client";

import { useState } from "react";
import { UserProfile, RiskProfile } from "@/lib/finance";

export interface InputFormProps {
  onSubmit: (profile: UserProfile) => void;
  loading: boolean;
}

export function InputForm({ onSubmit, loading }: InputFormProps) {
  const [profile, setProfile] = useState<UserProfile>({
    currentAge: 30,
    retirementAge: 65,
    annualSalary: 75000,
    currentSavings: 25000,
    monthlyContribution: 500,
    employerMatch: 0.03,
    monthlyExpenses: 3500,
    targetNestEgg: undefined,
    monthlyIncomeInRetirement: 2000,
    riskProfile: "moderate",
  });

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function numValue(v: number | undefined): string {
    return v === undefined || v === 0 ? "" : String(v);
  }

  function handleNum<K extends keyof UserProfile>(key: K, raw: string) {
    const parsed = raw === "" ? 0 : Number(raw);
    update(key, parsed as UserProfile[K]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(profile);
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your financial profile
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Current age</label>
          <input
            type="number"
            min={18}
            max={90}
            value={numValue(profile.currentAge)}
            onChange={(e) => handleNum("currentAge", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Desired retirement age</label>
          <input
            type="number"
            min={profile.currentAge + 1}
            max={100}
            value={numValue(profile.retirementAge)}
            onChange={(e) => handleNum("retirementAge", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Annual salary (USD)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={numValue(profile.annualSalary)}
            onChange={(e) => handleNum("annualSalary", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Current savings / investments</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={numValue(profile.currentSavings)}
            onChange={(e) => handleNum("currentSavings", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Monthly contribution</label>
          <input
            type="number"
            min={0}
            step={50}
            value={numValue(profile.monthlyContribution)}
            onChange={(e) => handleNum("monthlyContribution", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Employer 401(k) match (% of salary)</label>
          <input
            type="number"
            min={0}
            max={0.5}
            step={0.01}
            value={profile.employerMatch || ""}
            onChange={(e) => handleNum("employerMatch", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Monthly expenses today</label>
          <input
            type="number"
            min={0}
            step={100}
            value={profile.monthlyExpenses ?? ""}
            onChange={(e) =>
              update("monthlyExpenses", e.target.value ? Number(e.target.value) : undefined)
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Expected monthly retirement income (SS/pension)</label>
          <input
            type="number"
            min={0}
            step={100}
            value={profile.monthlyIncomeInRetirement ?? ""}
            onChange={(e) =>
              update("monthlyIncomeInRetirement", e.target.value ? Number(e.target.value) : undefined)
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Target nest egg (optional)</label>
          <input
            type="number"
            min={0}
            step={10000}
            value={profile.targetNestEgg ?? ""}
            onChange={(e) =>
              update("targetNestEgg", e.target.value ? Number(e.target.value) : undefined)
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Risk profile</label>
          <select
            value={profile.riskProfile}
            onChange={(e) => update("riskProfile", e.target.value as RiskProfile)}
            className={inputClass}
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Running projections..." : "Calculate my plan"}
      </button>
    </form>
  );
}
