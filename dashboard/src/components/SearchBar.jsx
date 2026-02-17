import { useState, useEffect } from 'react'

export default function SearchBar({ onSearch, placeholder = 'Search news items...' }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
    </div>
  )
}
