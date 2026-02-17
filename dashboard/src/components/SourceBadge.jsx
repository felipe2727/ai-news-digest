export default function SourceBadge({ sourceType }) {
  const label = sourceType.toUpperCase()
  return <span className={`source-badge ${sourceType}`}>{label}</span>
}
