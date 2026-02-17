import { useState, useEffect, useMemo } from 'react'
import { getAllDigests } from '../api'
import TopicsChart from '../components/charts/TopicsChart'
import SourcePieChart from '../components/charts/SourcePieChart'
import ScoreHistogram from '../components/charts/ScoreHistogram'
import DigestsOverTimeChart from '../components/charts/DigestsOverTimeChart'

export default function Analytics() {
  const [digests, setDigests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllDigests().then(data => {
      setDigests(data)
      setLoading(false)
    })
  }, [])

  const analytics = useMemo(() => {
    if (!digests.length) return null

    // Items per topic over time
    const topicsByDate = {}
    const sourceDistribution = {}
    const scoreBuckets = { '0-10': 0, '10-20': 0, '20-30': 0, '30-50': 0, '50-100': 0, '100+': 0 }
    const digestsOverTime = []

    for (const d of digests) {
      const date = new Date(d.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      digestsOverTime.push({ date, items: d.total_items })

      for (const section of d.sections) {
        // Topic counts
        if (!topicsByDate[date]) topicsByDate[date] = {}
        topicsByDate[date][section.title] = (topicsByDate[date][section.title] || 0) + section.items.length

        for (const item of section.items) {
          // Source distribution
          sourceDistribution[item.source_type] = (sourceDistribution[item.source_type] || 0) + 1

          // Score histogram
          const score = item.score
          if (score >= 100) scoreBuckets['100+']++
          else if (score >= 50) scoreBuckets['50-100']++
          else if (score >= 30) scoreBuckets['30-50']++
          else if (score >= 20) scoreBuckets['20-30']++
          else if (score >= 10) scoreBuckets['10-20']++
          else scoreBuckets['0-10']++
        }
      }
    }

    // Build topics time series
    const allTopics = new Set()
    for (const dateData of Object.values(topicsByDate)) {
      for (const topic of Object.keys(dateData)) allTopics.add(topic)
    }
    const topicsTimeSeries = Object.entries(topicsByDate)
      .map(([date, topics]) => ({ date, ...topics }))
      .reverse()

    // Build source data for pie chart
    const sourceData = Object.entries(sourceDistribution).map(([name, value]) => ({ name, value }))

    // Build score data for histogram
    const scoreData = Object.entries(scoreBuckets)
      .filter(([, count]) => count > 0)
      .map(([range, count]) => ({ range, count }))

    return {
      topicsTimeSeries,
      allTopics: [...allTopics],
      sourceData,
      scoreData,
      digestsOverTime: digestsOverTime.reverse(),
    }
  }, [digests])

  if (loading) return <div className="loading">Loading analytics</div>

  if (!analytics) {
    return (
      <div>
        <div className="page-header">
          <h2>Analytics</h2>
          <p>Insights from your digest history</p>
        </div>
        <div className="empty-state">No digest data available yet.</div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Insights from {digests.length} digest{digests.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Items per Topic Over Time</h3>
          <TopicsChart data={analytics.topicsTimeSeries} topics={analytics.allTopics} />
        </div>

        <div className="chart-card">
          <h3>Source Distribution</h3>
          <SourcePieChart data={analytics.sourceData} />
        </div>

        <div className="chart-card">
          <h3>Score Distribution</h3>
          <ScoreHistogram data={analytics.scoreData} />
        </div>

        <div className="chart-card">
          <h3>Items per Digest</h3>
          <DigestsOverTimeChart data={analytics.digestsOverTime} />
        </div>
      </div>
    </div>
  )
}
