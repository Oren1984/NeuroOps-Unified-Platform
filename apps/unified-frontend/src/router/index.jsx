import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'
import Dashboard from '../modules/dashboard/Dashboard.jsx'
import AutopilotPage from '../modules/autopilot/index.jsx'
import ControlRoomPage from '../modules/control-room/index.jsx'
import LiveControlPage from '../modules/live-control/index.jsx'
import IncidentReplayPage from '../modules/incident-replay/index.jsx'
import CareerAgentPage from '../modules/career-agent/CareerAgentPage.jsx'
import InsightEnginePage from '../modules/insight-engine/InsightEnginePage.jsx'
import WarehouseCopilotPage from '../modules/warehouse-copilot/WarehouseCopilotPage.jsx'
import LoginPage from '../modules/login/LoginPage.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

// ---------------------------------------------------------------------------
// Guard: redirects unauthenticated users to /login
// ---------------------------------------------------------------------------
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

// ---------------------------------------------------------------------------
// App Router
// ---------------------------------------------------------------------------
export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected shell */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/"                  element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"         element={<Dashboard />} />
                <Route path="/autopilot"         element={<AutopilotPage />} />
                <Route path="/control-room"      element={<ControlRoomPage />} />
                <Route path="/live-control"      element={<LiveControlPage />} />
                <Route path="/incident-replay"   element={<IncidentReplayPage />} />
                <Route path="/career-agent"      element={<CareerAgentPage />} />
                <Route path="/insight-engine"    element={<InsightEnginePage />} />
                <Route path="/warehouse-copilot" element={<WarehouseCopilotPage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
