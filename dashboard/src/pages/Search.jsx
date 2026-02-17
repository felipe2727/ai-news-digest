import { useState, useCallback, useRef } from 'react'
import Fuse from 'fuse.js'
import { getAllDigests } from '../api'
import SearchBar from '../components/SearchBar'
import NewsItemCard from '../components/NewsItemCard'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Search() {
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const fuseRef = useRef(null)
  const allItemsRef = useRef(null)

  const loadData = useCallback(async () => {
    if (allItemsRef.current) return
    setLoading(true)
    const digests = await getAllDigests()
    const items = []
    for (const d of digests) {
      const dateStr = formatDate(d.generated_at)
      for (const section of d.sections) {
        for (const item of section.items) {
          items.push({ ...item, digestDate: dateStr, digestId: d.id })
        }
      }
    }
    allItemsRef.current = items
    fuseRef.current = new Fuse(items, {
      keys: ['title', 'summary', 'source_name'],
      threshold: 0.4,
      includeScore: true,
    })
    setLoading(false)
  }, [])

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    await loadData()
    setSearched(true)
    const fuseResults = fuseRef.current.search(query, { limit: 30 })
    setResults(fuseResults.map(r => r.item))
  }, [loadData])

  return (
    <div>
      <div className="page-header">
        <h2>Search</h2>
        <p>Search across all digest items</p>
      </div>

      <SearchBar onSearch={handleSearch} />

      {loading && <div className="loading">Loading digest data</div>}

      {searched && !loading && (
        <p className="search-results-count">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </p>
      )}

      {results.map((item, i) => (
        <NewsItemCard key={i} item={item} digestDate={item.digestDate} />
      ))}

      {searched && !loading && results.length === 0 && (
        <div className="empty-state">No items match your search.</div>
      )}
    </div>
  )
}
