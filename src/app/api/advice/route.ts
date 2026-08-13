import { NextRequest, NextResponse } from "next/server";
import { type UserProfile, projectRetirement, monteCarloRetirement } from "@/lib/finance";
import { recommendAllocation } from "@/lib/allocations";
import { generatePersonalizedAdvice } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const { profile, projection, monteCarlo, allocation } = (await request.json()) as {
      profile?: Partial<UserProfile>;
      projection?: {
        nestEggAtRetirement: number;
        requiredMonthlySavings: number;
        safeAnnualWithdrawal: number;
        targetNestEgg: number;
        incomeGap: number;
      };
      monteCarlo?: { probabilityOfSuccess: number };
      allocation?: { strategySummary: string; buckets: { name: string; percent: number }[] };
    };

    if (!profile || !projection || !allocation) {
      return NextResponse.json(
        { error: "Missing profile, projection, or allocation in request body." },
        { status: 400 }
      );
    }

    const payload = {
      profile: profile as UserProfile,
      projection: {
        ...projection,
        probabilityOfSuccess: monteCarlo?.probabilityOfSuccess,
      },
      allocation,
    };

    const advice = await generatePersonalizedAdvice(
      payload,
      process.env.OPENAI_API_KEY,
      process.env.GOOGLE_API_KEY
    );

    return NextResponse.json({ advice });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Advice error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Convenience route: if caller only has a profile, compute everything server-side.
export async function PUT(request: NextRequest) {
  try {
    const profile = (await request.json()) as UserProfile;
    const projection = projectRetirement(profile);
    const monteCarlo = monteCarloRetirement(profile);
    const allocation = recommendAllocation(profile);

    const payload = {
      profile,
      projection: {
        nestEggAtRetirement: projection.nestEggAtRetirement,
        requiredMonthlySavings: projection.requiredMonthlySavings,
        safeAnnualWithdrawal: projection.safeAnnualWithdrawal,
        targetNestEgg: projection.targetNestEgg,
        incomeGap: projection.incomeGap,
        probabilityOfSuccess: monteCarlo.probabilityOfSuccess,
      },
      allocation: {
        strategySummary: allocation.strategySummary,
        buckets: allocation.buckets,
      },
    };

    const advice = await generatePersonalizedAdvice(
      payload,
      process.env.OPENAI_API_KEY,
      process.env.GOOGLE_API_KEY
    );
    return NextResponse.json({ advice, payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Advice PUT error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
