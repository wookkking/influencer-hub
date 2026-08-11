import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { nf } from "@/lib/influencers";

export type PerfPoint = {
  label: string;
  date: string;
  views: number;
  reactions: number;
  viewRate: number | null;
  followerRate: number | null;
};

type Props = { points: PerfPoint[] };

export function PerformanceChart({ points }: Props) {
  const data = useMemo(
    () => [...points].sort((a, b) => a.date.localeCompare(b.date)),
    [points],
  );

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        업로드일과 조회수를 입력하면 성과 추이가 그려집니다.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">성과 추이</h2>
        <p className="text-xs text-muted-foreground">
          막대 = 조회수 · 선 = 반응률(좋아요+댓글÷조회수) / 팔로워 대비 반응률
        </p>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(value: number | string, name: string) =>
                typeof value === "number"
                  ? name === "조회수"
                    ? nf.format(value)
                    : `${value.toFixed(2)}%`
                  : value
              }
            />
            <Bar
              yAxisId="left"
              dataKey="views"
              name="조회수"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="viewRate"
              name="반응률"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="followerRate"
              name="팔로워 대비 반응률"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
