import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DigestList from './pages/DigestList'
import DigestDetail from './pages/DigestDetail'
import Search from './pages/Search'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DigestList />} />
        <Route path="/digest/:id" element={<DigestDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
