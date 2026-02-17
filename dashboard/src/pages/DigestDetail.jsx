import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDigest } from '../api'
import NewsItemCard from '../components/NewsItemCard'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DigestDetail() {
  const { id } = useParams()
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDigest(id).then(data => {
      setDigest(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="loading">Loading digest</div>
  if (!digest) return <div className="empty-state">Digest not found.</div>

  return (
    <div>
      <Link to="/" className="back-link">
        &larr; Back to digests
      </Link>

      <div className="digest-detail-header">
        <h2>Digest &mdash; {formatDate(digest.generated_at)}</h2>
        <div className="digest-detail-meta">
          <span>{digest.total_items} items</span>
          <span>{digest.sources_checked} sources checked</span>
        </div>
      </div>

      {digest.intro_summary && (
        <div className="tldr-box">
          <div className="label">TL;DR</div>
          <p>{digest.intro_summary}</p>
        </div>
      )}

      {digest.sections.map((section, i) => (
        <div key={i} className="section">
          <h3 className="section-title">{section.title}</h3>
          {section.items.map((item, j) => (
            <NewsItemCard key={j} item={item} />
          ))}
        </div>
      ))}

      {digest.project_recommendations && (
        <div className="projects-box">
          <div className="label">Top 3 Projects to Explore</div>
          <p>{digest.project_recommendations}</p>
        </div>
      )}
    </div>
  )
}
