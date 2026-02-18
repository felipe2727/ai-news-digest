"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#F5A623", "#60A5FA", "#EF4444", "#34D399", "#A78BFA"];

interface Props {
  digestsOverTime: { id: string; generated_at: string; total_items: number }[];
  sources: { name: string; value: number }[];
  topics: { name: string; value: number }[];
}

export default function DashboardCharts({
  digestsOverTime,
  sources,
  topics,
}: Props) {
  const digestData = digestsOverTime.map((d) => ({
    date: new Date(d.generated_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    items: d.total_items,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Digests over time */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Articles per Digest</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={digestData}>
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
              <Bar dataKey="items" fill="#F5A623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source distribution */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Sources</h3>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sources}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {sources.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1a1b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topics */}
      <div className="glass rounded-xl p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold mb-4">Top Topics</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topics} layout="vertical">
              <XAxis
                type="number"
                tick={{ fill: "#888", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#888", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="#60A5FA" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
