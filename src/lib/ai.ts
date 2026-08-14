import type { UserProfile } from "./finance";

export interface AdvicePayload {
  profile: UserProfile;
  projection: {
    nestEggAtRetirement: number;
    requiredMonthlySavings: number;
    safeAnnualWithdrawal: number;
    probabilityOfSuccess?: number;
    targetNestEgg: number;
    incomeGap: number;
  };
  allocation: {
    strategySummary: string;
    buckets: { name: string; percent: number }[];
  };
}

// Generates rule-based fallback advice. This runs locally with no API key.
export function generateFallbackAdvice(payload: AdvicePayload): string {
  const { profile, projection, allocation } = payload;
  const years = profile.retirementAge - profile.currentAge;
  const savingRate = (profile.monthlyContribution * 12 / Math.max(1, profile.annualSalary)) * 100;
  const needIncrease = projection.requiredMonthlySavings - profile.monthlyContribution;

  let advice = `You are ${profile.currentAge} years old and plan to retire at ${profile.retirementAge}, giving you ${years} years to save. `;

  if (projection.incomeGap >= 0) {
    advice += `Based on your inputs, you are on track for a projected nest egg of ${formatCurrency(
      projection.nestEggAtRetirement
    )}. Your projected safe annual withdrawal is ${formatCurrency(
      projection.safeAnnualWithdrawal
    )}, which covers your estimated retirement income need. `;
  } else {
    advice += `Your projected nest egg is ${formatCurrency(
      projection.nestEggAtRetirement
    )}, short of the ${formatCurrency(
      projection.targetNestEgg
    )} target. To close the gap, consider saving ${formatCurrency(
      projection.requiredMonthlySavings
    )}/month instead of your current ${formatCurrency(profile.monthlyContribution)}/month. `;
  }

  if (projection.probabilityOfSuccess !== undefined) {
    advice += `Monte Carlo analysis estimates a ${projection.probabilityOfSuccess.toFixed(
      1
    )}% probability of reaching your goal. `;
  }

  advice += `Your current savings rate is ${savingRate.toFixed(
    0
  )}% of salary. ${
    savingRate < 10
      ? "Try to raise it to at least 10-15% by trimming discretionary spending or automating raises into savings. "
      : savingRate < 20
      ? "Good start — aim for 20% if you can, especially during peak earning years. "
      : "Excellent savings discipline. Keep it up and focus on optimizing taxes and investment costs. "
  }`;

  advice += `\n\nInvestment strategy: ${allocation.strategySummary}\n`;
  advice += allocation.buckets
    .map((b) => `- ${b.name}: ${b.percent}%`)
    .join("\n");

  if (needIncrease > 0) {
    advice += `\n\nQuick win: increase monthly contributions by ${formatCurrency(
      needIncrease
    )} and direct them first to your 401(k) match, then HSA/Roth IRA, then taxable brokerage.`;
  }

  return advice;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// Optional LLM integration. Falls back to local generator if no API key or on error.
export async function generatePersonalizedAdvice(
  payload: AdvicePayload,
  openAiApiKey?: string,
  googleApiKey?: string
): Promise<string> {
  const prompt = buildPrompt(payload);

  // Prefer Google Gemini when available; otherwise try OpenAI; finally fall back to local advice.
  if (googleApiKey && googleApiKey.length >= 10) {
    try {
      return await generateGeminiAdvice(prompt, googleApiKey);
    } catch (err) {
      console.error("Gemini advice failed, falling back:", err);
    }
  }

  if (openAiApiKey && openAiApiKey.length >= 10) {
    try {
      return await generateOpenAiAdvice(prompt, openAiApiKey);
    } catch (err) {
      console.error("OpenAI advice failed, falling back to local advice:", err);
      return generateFallbackAdvice(payload);
    }
  }

  return generateFallbackAdvice(payload);
}

async function generateOpenAiAdvice(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful, cautious financial planning assistant. Provide concise, actionable retirement and savings advice. Avoid specific stock picks. Include a brief disclaimer that this is not professional financial advice.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("Unexpected OpenAI response format");
  }
  return text.trim();
}

async function generateGeminiAdvice(prompt: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "You are a helpful, cautious financial planning assistant. Provide concise, actionable retirement and savings advice. Avoid specific stock picks. Include a brief disclaimer that this is not professional financial advice.\n\n" +
                    prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1500,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string") {
      throw new Error("Unexpected Gemini response format");
    }
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(payload: AdvicePayload): string {
  const { profile, projection, allocation } = payload;
  const years = profile.retirementAge - profile.currentAge;
  return `
User profile:
- Age: ${profile.currentAge}
- Retirement age: ${profile.retirementAge} (${years} years away)
- Annual salary: $${profile.annualSalary.toLocaleString()}
- Current savings: $${profile.currentSavings.toLocaleString()}
- Monthly contribution: $${profile.monthlyContribution.toLocaleString()}
- Employer match: ${((profile.employerMatch ?? 0) * 100).toFixed(0)}%
- Risk profile: ${profile.riskProfile ?? "moderate"}

Projections:
- Nest egg at retirement: $${projection.nestEggAtRetirement.toLocaleString()}
- Target nest egg: $${projection.targetNestEgg.toLocaleString()}
- Required monthly savings to hit target: $${projection.requiredMonthlySavings.toLocaleString()}
- Safe annual withdrawal (4% rule): $${projection.safeAnnualWithdrawal.toLocaleString()}
- Probability of success: ${(projection.probabilityOfSuccess ?? 0).toFixed(1)}%

Recommended allocation:
${allocation.strategySummary}
${allocation.buckets.map((b) => `- ${b.name}: ${b.percent}%`).join("\n")}

Please write a short, personalized financial plan (3-5 bullets) covering savings rate, investment allocation, and one concrete next step. Keep it under 200 words. Add a brief disclaimer.
`.trim();
}
