"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  pageViews: { date: string; views: number }[];
}

export default function AnalyticsCharts({ pageViews }: Props) {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">Page Views (Last 30 days)</h3>
      {pageViews.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-[var(--muted)] text-sm">
          No page view data yet. Analytics will appear once visitors start
          browsing.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pageViews}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5A623" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "#888", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#888", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#F5A623"
                fill="url(#viewsGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
