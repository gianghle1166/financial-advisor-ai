# AI Financial Advisor

A Next.js web app that helps people of any age and salary plan for retirement. It combines deterministic projections, Monte Carlo simulation, investment-allocation recommendations, and an optional LLM-powered personalized advice engine.

## Features

- **Retirement calculator** — input age, salary, current savings, monthly contributions, employer match, expenses, and risk tolerance.
- **Projected nest egg** — see how much you are likely to have at retirement.
- **Goal-based savings solver** — calculates the monthly savings needed to reach your target nest egg.
- **Monte Carlo forecast** — thousands of market-return simulations produce percentile bands (10th, 25th, 50th, 75th, 90th) and a probability-of-success score.
- **Investment allocation recommender** — suggests how to split money across 401(k), IRA/Roth IRA, HSA, taxable brokerage, stocks, bonds, CDs, annuities, and high-yield savings based on your age, time to retirement, and risk profile.
- **Tailored savings tips** — age- and income-specific guidance.
- **AI personalized advice** — optional OpenAI integration for a human-readable financial plan; falls back to a deterministic local advisor if no API key is provided.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS 4
- [Recharts](https://recharts.org) for charts
- [Lucide React](https://lucide.dev) for icons

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Optional: enable AI advice

The app works without any external API. To use an LLM for advice, add one of these environment variables to `.env.local`:

```bash
# Google Gemini (preferred, generous free tier)
GOOGLE_API_KEY=...

# Or OpenAI
OPENAI_API_KEY=sk-...
```

Priority: if `GOOGLE_API_KEY` is set, Gemini is used first; otherwise OpenAI is tried. If neither key is set or the API call fails, the app automatically falls back to the built-in local advisor.

## Build and lint

```bash
npm run build
npm run lint
```

## API routes

- `POST /api/calculate` — accepts a user profile and returns projections, Monte Carlo scenarios, allocation, and savings tips.
- `POST /api/advice` — accepts a subset of the calculate response and returns personalized AI/local advice.

## Methodology and assumptions

This app uses standard financial-planning math for estimates. It is **not** professional financial advice.

### Market assumptions by risk profile

| Profile | Expected annual return | Volatility (std dev) | Inflation | Risk-free rate |
|---|---|---|---|---|
| Conservative | 5% | 8% | 3% | 4% |
| Moderate | 7% | 14% | 3% | 4% |
| Aggressive | 9% | 20% | 3% | 4% |

### Projection model

- Real returns are calculated as `(1 + nominal return) / (1 + inflation) - 1`.
- Monthly compounding with monthly contributions and optional employer match.
- Employer match is treated as additional monthly contributions.

### Monte Carlo model

- Geometric Brownian Motion with monthly time steps.
- Random shocks drawn from a normal distribution parameterized by the profile’s volatility.
- 1,000 simulation runs by default.

### Goal / target nest egg

- If you enter an explicit target, the app uses it.
- Otherwise it estimates an annual income need as the greater of 70% of current salary or entered monthly expenses × 12, then subtracts expected retirement income (Social Security/pension).
- The target nest egg = income shortfall × 25 (the classic 4% rule).

### Required monthly savings

- Solves the future-value-of-an-annuity equation for the monthly payment needed to reach the target from the current balance over the remaining working years.

### Investment allocation logic

- A glide path reduces equity exposure as retirement approaches.
- Younger/long-horizon investors receive more aggressive, growth-first recommendations (401k, IRA, Roth IRA, HSA, taxable brokerage).
- Near-retirees receive capital-preservation recommendations with more bonds, CDs, annuities, and cash reserves.

## Disclaimer

All projections are estimates based on simplified models and historical assumptions. Past performance does not guarantee future results. Consult a licensed financial advisor before making major investment or retirement decisions.
