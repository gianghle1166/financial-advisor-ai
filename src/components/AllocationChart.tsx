"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Bucket {
  name: string;
  percent: number;
}

interface AllocationChartsProps {
  buckets: Bucket[];
  assetMix: { name: string; percent: number }[];
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#64748b",
];

interface TooltipPayloadItem {
  name?: string;
  value?: number;
}

interface PctTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function PctTooltip({ active, payload }: PctTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const name = item.name ?? "";
    const value = typeof item.value === "number" ? item.value : 0;
    return (
      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{name}</p>
        <p className="text-zinc-600 dark:text-zinc-400">{value.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
}

function pieLabel(entry: { name?: string; percent?: number }) {
  const name = entry.name ?? "";
  const pct = typeof entry.percent === "number" ? entry.percent : 0;
  return `${name}: ${pct.toFixed(0)}%`;
}

export function AllocationCharts({ buckets, assetMix }: AllocationChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-2 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Account allocation
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={buckets}
                dataKey="percent"
                nameKey="name"
                outerRadius={80}
                label={pieLabel}
              >
                {buckets.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PctTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-2 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Asset mix
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={assetMix}
                dataKey="percent"
                nameKey="name"
                outerRadius={80}
                label={pieLabel}
              >
                {assetMix.map((_, i) => (
                  <Cell key={`asset-${i}`} fill={COLORS[(i + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PctTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
