import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">성과 추이</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            업로드일 기준 조회수와 반응률 변화
          </p>
        </div>
        <p className="tabular text-xs text-muted-foreground">
          총 {nf.format(data.reduce((a, b) => a + b.views, 0))} 조회 · {data.length}건
        </p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 24, left: 4 }}>
            <defs>
              <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval={0}
              angle={data.length > 5 ? -18 : 0}
              textAnchor={data.length > 5 ? "end" : "middle"}
              height={48}
            />
            <YAxis
              yAxisId="left"
              width={48}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={48}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${Math.round(v)}%`}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              contentStyle={{
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
              }}
              formatter={(value: number | string, name: string) =>
                typeof value === "number"
                  ? name === "조회수"
                    ? nf.format(value)
                    : `${value.toFixed(2)}%`
                  : value
              }
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={28}
              iconType="plainline"
              wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="views"
              name="조회수"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              fill="url(#viewsFill)"
              dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="viewRate"
              name="반응률"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--chart-2)", strokeWidth: 0 }}
              connectNulls
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="followerRate"
              name="팔로워 대비 반응률"
              stroke="var(--chart-5)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 2.5, fill: "var(--chart-5)", strokeWidth: 0 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
