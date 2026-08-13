import type { UserProfile } from "./finance";

export interface SavingsTip {
  category: string;
  title: string;
  description: string;
}

function salaryBracket(annualSalary: number): string {
  if (annualSalary < 40000) return "low";
  if (annualSalary < 80000) return "mid";
  if (annualSalary < 150000) return "high";
  return "very-high";
}

function ageBracket(age: number): string {
  if (age < 25) return "young";
  if (age < 40) return "early-career";
  if (age < 55) return "mid-career";
  if (age < 65) return "pre-retirement";
  return "retirement";
}

export function generateSavingsTips(profile: UserProfile): SavingsTip[] {
  const tips: SavingsTip[] = [];
  const age = ageBracket(profile.currentAge);
  const salary = salaryBracket(profile.annualSalary);
  const savingRate = profile.monthlyContribution * 12 / Math.max(1, profile.annualSalary);

  // Core universal tip
  tips.push({
    category: "Foundation",
    title: "Capture the full employer match",
    description:
      "If your employer offers a 401(k) match, contribute at least enough to get it. It is an immediate 50-100% return on your money.",
  });

  // Age-specific tips
  if (age === "young") {
    tips.push({
      category: "Age-based",
      title: "Start now and automate",
      description:
        "Time is your biggest asset. Even small monthly contributions compound powerfully over 30+ years. Automate deposits so you never miss them.",
    });
    tips.push({
      category: "Age-based",
      title: "Prioritize Roth IRA/401k",
      description:
        "Pay taxes now while your tax rate is likely lower. Roth accounts give decades of tax-free growth.",
    });
  } else if (age === "early-career") {
    tips.push({
      category: "Age-based",
      title: "Aim to save 15% of income",
      description:
        "Gradually raise contributions until you hit 15% of gross income, including any employer match.",
    });
    tips.push({
      category: "Age-based",
      title: "Build an emergency fund",
      description:
        "Set aside 3-6 months of expenses in a high-yield savings account before chasing aggressive returns.",
    });
  } else if (age === "mid-career") {
    tips.push({
      category: "Age-based",
      title: "Catch up on retirement savings",
      description:
        "Review your nest egg vs goal. Increase 401k/IRA contributions and trim lifestyle expenses if short.",
    });
    tips.push({
      category: "Age-based",
      title: "Diversify across tax treatments",
      description:
        "Hold a mix of traditional, Roth, and taxable accounts to manage taxes in retirement.",
    });
  } else if (age === "pre-retirement") {
    tips.push({
      category: "Age-based",
      title: "Use catch-up contributions",
      description:
        "At 50+, 401(k) and IRA catch-up limits let you turbo-charge savings before retirement.",
    });
    tips.push({
      category: "Age-based",
      title: "Shift toward stability",
      description:
        "Consider bonds, CDs, and annuities to lock in part of your income and reduce sequence-of-returns risk.",
    });
  } else {
    tips.push({
      category: "Age-based",
      title: "Focus on withdrawal strategy",
      description:
        "Plan which accounts to draw from first to minimize taxes and make savings last.",
    });
  }

  // Salary-specific tips
  if (salary === "low") {
    tips.push({
      category: "Income-based",
      title: "Make the most of tax credits",
      description:
        "Look into the Saver's Credit. Even modest retirement contributions can earn a federal tax credit.",
    });
    tips.push({
      category: "Income-based",
      title: "Budget with the 50/30/20 rule",
      description:
        "Aim for 50% needs, 30% wants, and 20% savings/debt payoff. Track spending to find hidden savings.",
    });
  } else if (salary === "mid") {
    tips.push({
      category: "Income-based",
      title: "Maximize tax-advantaged space",
      description:
        "Increase 401k/IRA contributions before investing in a taxable account. Lower taxable income now.",
    });
    tips.push({
      category: "Income-based",
      title: "Eliminate high-interest debt",
      description:
        "Pay off credit cards and high-rate loans; the guaranteed return often beats investment gains.",
    });
  } else {
    tips.push({
      category: "Income-based",
      title: "Max out tax-advantaged accounts",
      description:
        "Fill 401k, IRA, and HSA buckets first. Consider backdoor Roth if income exceeds Roth limits.",
    });
    tips.push({
      category: "Income-based",
      title: "Use taxable brokerage for flexibility",
      description:
        "After tax-advantaged accounts are maxed, add low-cost index ETFs in a taxable brokerage for early retirement or big goals.",
    });
  }

  // Saving-rate feedback
  if (savingRate < 0.1) {
    tips.push({
      category: "Action",
      title: "Increase your savings rate",
      description:
        `You are saving ${(savingRate * 100).toFixed(0)}% of income. Try to reach at least 10-15% to keep retirement on track.`,
    });
  } else if (savingRate >= 0.2) {
    tips.push({
      category: "Action",
      title: "Great saving habits",
      description:
        `You are saving ${(savingRate * 100).toFixed(0)}% of income. Keep going and review asset allocation annually.`,
    });
  }

  return tips;
}
