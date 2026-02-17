import { useState, useEffect } from 'react'
import { getDigests } from '../api'
import DigestCard from '../components/DigestCard'

export default function DigestList() {
  const [digests, setDigests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDigests().then(data => {
      setDigests(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading">Loading digests</div>

  if (digests.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2>Digests</h2>
          <p>Browse your AI news digest history</p>
        </div>
        <div className="empty-state">
          No digests yet. Run the pipeline to generate your first digest.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Digests</h2>
        <p>{digests.length} digest{digests.length !== 1 ? 's' : ''} in archive</p>
      </div>
      <div className="digest-grid">
        {digests.map(d => (
          <DigestCard key={d.id} digest={d} />
        ))}
      </div>
    </div>
  )
}
