import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Reservations from './pages/Reservations'
import Revenue from './pages/Revenue'
import Expenses from './pages/Expenses'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/revenue" element={<Revenue />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
