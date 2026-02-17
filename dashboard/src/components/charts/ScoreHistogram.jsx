import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ScoreHistogram({ data }) {
  if (!data.length) return <p style={{ color: 'var(--text-muted)' }}>No data</p>

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="range" stroke="#a0aec0" fontSize={12} />
        <YAxis stroke="#a0aec0" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', borderRadius: 6 }}
          labelStyle={{ color: '#f1f5f9' }}
          itemStyle={{ color: '#cbd5e1' }}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
