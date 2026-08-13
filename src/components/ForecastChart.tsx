"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface YearPoint {
  age: number;
  totalSavings: number;
  contributions: number;
}

interface ScenarioPoint {
  age: number;
  value: number;
}

interface ForecastChartProps {
  deterministic: YearPoint[];
  scenarios: { percentile: number; years: ScenarioPoint[] }[];
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
}

interface ForecastTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number | string;
}

const currencyFormatter = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function ForecastTooltip({ active, payload, label }: ForecastTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <p className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">Age {label}</p>
        {payload.map((item, idx) => {
          const val = typeof item.value === "number" ? item.value : 0;
          return (
            <p key={idx} className="text-zinc-600 dark:text-zinc-400">
              {item.name}: {currencyFormatter(val)}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
}

export function ForecastChart({ deterministic, scenarios }: ForecastChartProps) {
  // Merge deterministic + percentile scenarios into rows keyed by age.
  const ages = new Set<number>();
  deterministic.forEach((d) => ages.add(d.age));
  scenarios.forEach((s) => s.years.forEach((y) => ages.add(y.age)));

  const data = Array.from(ages)
    .sort((a, b) => a - b)
    .map((age) => {
      const row: Record<string, number> = { age };
      const det = deterministic.find((d) => d.age === age);
      if (det) row["Expected (deterministic)"] = det.totalSavings;
      scenarios.forEach((s) => {
        const pt = s.years.find((y) => y.age === age);
        if (pt) row[`${s.percentile}th percentile`] = pt.value;
      });
      return row;
    });

  const colors = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"];
  const keys = [
    "10th percentile",
    "25th percentile",
    "Expected (deterministic)",
    "50th percentile",
    "75th percentile",
    "90th percentile",
  ];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="age" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<ForecastTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={key === "Expected (deterministic)" || key === "50th percentile" ? 2 : 1}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
