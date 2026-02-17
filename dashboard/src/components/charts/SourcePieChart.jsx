import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const SOURCE_COLORS = {
  reddit: '#FF4500',
  youtube: '#FF0000',
  github: '#8b949e',
  news: '#1a73e8',
}

export default function SourcePieChart({ data }) {
  if (!data.length) return <p style={{ color: 'var(--text-muted)' }}>No data</p>

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] || '#6366f1'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', borderRadius: 6 }}
          labelStyle={{ color: '#f1f5f9' }}
          itemStyle={{ color: '#cbd5e1' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
