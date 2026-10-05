"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTaka, monthLabel, titleCase } from "@/lib/utils";

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const tooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 12,
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "var(--foreground)", padding: 0 },
  cursor: { fill: "var(--muted)", opacity: 0.6 },
};

function LegendText(value: string) {
  return <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{value}</span>;
}

export function RegistrationsChart({ data }: { data: { month: string; registrations: number; attended: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={3}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" iconSize={8} formatter={LegendText} wrapperStyle={{ paddingTop: 8 }} />
        <Bar dataKey="registrations" name="Registered" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="attended" name="Attended" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data }: { data: { club_name: string; fee_income: number; sponsorship: number; total: number }[] }) {
  const rows = data.filter((d) => d.total > 0);
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 34 + 40)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barSize={14}>
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis
          type="number"
          tick={axis}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
        />
        <YAxis type="category" dataKey="club_name" tick={axis} tickLine={false} axisLine={false} width={128} />
        <Tooltip {...tooltipStyle} formatter={(v) => formatTaka(Number(v))} />
        <Legend iconType="circle" iconSize={8} formatter={LegendText} wrapperStyle={{ paddingTop: 8 }} />
        <Bar dataKey="sponsorship" name="Sponsorship" stackId="a" fill="var(--chart-1)" />
        <Bar dataKey="fee_income" name="Ticket fees" stackId="a" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function CategoryChart({ data }: { data: { category: string; registrations: number }[] }) {
  const total = data.reduce((s, d) => s + d.registrations, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="registrations"
              nameKey="category"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell key={d.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v, n) => [String(v), titleCase(String(n))]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="tabular text-xl font-semibold">{total}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">sign-ups</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d, i) => (
          <li key={d.category} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              {titleCase(d.category)}
            </span>
            <span className="tabular text-muted-foreground">
              {d.registrations} <span className="text-xs">({total ? Math.round((100 * d.registrations) / total) : 0}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
