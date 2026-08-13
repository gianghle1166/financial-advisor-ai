import { NextRequest, NextResponse } from "next/server";
import {
  projectRetirement,
  monteCarloRetirement,
  type UserProfile,
  type RiskProfile,
} from "@/lib/finance";
import { recommendAllocation } from "@/lib/allocations";
import { generateSavingsTips } from "@/lib/tips";

const validRiskProfiles: RiskProfile[] = ["conservative", "moderate", "aggressive"];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<UserProfile>;

    const currentAge = Number(body.currentAge);
    const retirementAge = Number(body.retirementAge);
    const annualSalary = Number(body.annualSalary);
    const currentSavings = Number(body.currentSavings ?? 0);
    const monthlyContribution = Number(body.monthlyContribution ?? 0);
    const employerMatch = Number(body.employerMatch ?? 0);
    const monthlyExpenses = body.monthlyExpenses !== undefined ? Number(body.monthlyExpenses) : undefined;
    const targetNestEgg = body.targetNestEgg !== undefined ? Number(body.targetNestEgg) : undefined;
    const monthlyIncomeInRetirement =
      body.monthlyIncomeInRetirement !== undefined ? Number(body.monthlyIncomeInRetirement) : undefined;
    const riskProfile = validRiskProfiles.includes(body.riskProfile as RiskProfile)
      ? (body.riskProfile as RiskProfile)
      : "moderate";

    if (
      !Number.isFinite(currentAge) ||
      !Number.isFinite(retirementAge) ||
      !Number.isFinite(annualSalary) ||
      retirementAge <= currentAge ||
      currentAge < 13 ||
      annualSalary < 0 ||
      currentSavings < 0 ||
      monthlyContribution < 0
    ) {
      return NextResponse.json(
        { error: "Invalid profile data. Check ages, salary, savings, and contribution values." },
        { status: 400 }
      );
    }

    const profile: UserProfile = {
      currentAge,
      retirementAge,
      annualSalary,
      currentSavings,
      monthlyContribution,
      employerMatch,
      monthlyExpenses,
      targetNestEgg,
      monthlyIncomeInRetirement,
      riskProfile,
    };

    const projection = projectRetirement(profile);
    const monteCarlo = monteCarloRetirement(profile);
    const allocation = recommendAllocation(profile);
    const tips = generateSavingsTips(profile);

    return NextResponse.json({
      profile,
      projection: {
        ...projection,
        years: projection.years.map((y) => ({
          ...y,
          totalSavings: Number(y.totalSavings.toFixed(0)),
          contributions: Number(y.contributions.toFixed(0)),
          returns: Number(y.returns.toFixed(0)),
        })),
      },
      monteCarlo: {
        scenarios: monteCarlo.scenarios.map((s) => ({
          percentile: s.percentile,
          finalAmount: Number(s.finalAmount.toFixed(0)),
          years: s.years.map((y) => ({ age: y.age, value: Number(y.value.toFixed(0)) })),
        })),
        probabilityOfSuccess: Number(monteCarlo.probabilityOfSuccess.toFixed(1)),
        medianFinalAmount: Number(monteCarlo.medianFinalAmount.toFixed(0)),
      },
      allocation,
      tips,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Calculate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
