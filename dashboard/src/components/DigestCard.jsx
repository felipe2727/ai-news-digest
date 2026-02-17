import { useNavigate } from 'react-router-dom'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DigestCard({ digest }) {
  const navigate = useNavigate()

  return (
    <div className="digest-card" onClick={() => navigate(`/digest/${digest.id}`)}>
      <div className="digest-card-date">{formatDate(digest.generated_at)}</div>
      <div className="digest-card-stats">
        <span className="digest-card-stat"><strong>{digest.total_items}</strong> items</span>
        <span className="digest-card-stat"><strong>{digest.sources_checked}</strong> sources</span>
      </div>
      <p className="digest-card-snippet">{digest.intro_snippet}</p>
    </div>
  )
}
