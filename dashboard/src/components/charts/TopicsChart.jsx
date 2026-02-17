import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function TopicsChart({ data, topics }) {
  if (!data.length) return <p style={{ color: 'var(--text-muted)' }}>Not enough data</p>

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" stroke="#a0aec0" fontSize={12} />
        <YAxis stroke="#a0aec0" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', borderRadius: 6 }}
          labelStyle={{ color: '#f1f5f9' }}
          itemStyle={{ color: '#cbd5e1' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {topics.map((topic, i) => (
          <Line
            key={topic}
            type="monotone"
            dataKey={topic}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
