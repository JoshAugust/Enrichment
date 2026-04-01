import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import Emails from './pages/Emails'
import Calls from './pages/Calls'
import Pipeline from './pages/Pipeline'
// import Journal from './pages/Journal' // Removed: notes are inline in Companies now

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/companies" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="companies" element={<Companies />} />
            <Route path="companies/:id" element={<CompanyDetail />} />
            <Route path="emails" element={<Emails />} />
            <Route path="calls" element={<Calls />} />
            <Route path="pipeline" element={<Pipeline />} />
            {/* Journal removed — notes are inline in Companies */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
