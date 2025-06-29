import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'
import Layout from './components/Layout'

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports/:deviceId" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App