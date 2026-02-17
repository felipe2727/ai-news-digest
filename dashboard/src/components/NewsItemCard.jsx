import SourceBadge from './SourceBadge'

export default function NewsItemCard({ item, digestDate }) {
  return (
    <div className="news-item">
      <div className="news-item-header">
        <SourceBadge sourceType={item.source_type} />
        <span className="news-item-source">{item.source_name}</span>
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-item-title">
        {item.title}
      </a>
      {item.summary && (
        <p className="news-item-summary">{item.summary}</p>
      )}
      {item.extra?.stars && (
        <p className="news-item-meta">
          &#11088; {item.extra.stars} stars
          {item.extra.language && ` · ${item.extra.language}`}
        </p>
      )}
      {digestDate && (
        <p className="search-result-digest-date">From digest: {digestDate}</p>
      )}
    </div>
  )
}
