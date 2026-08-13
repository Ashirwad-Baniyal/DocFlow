import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/store'
import { clearCredentials } from './store/authSlice'
import { authApi } from './utils/api'
import { getToken, isTokenExpired } from './utils/auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'

// ─── Protected Route ──────────────────────────────────────────────────────────
interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// ─── App Router ───────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  // On startup, validate the stored token is still accepted by the server.
  // If the backend restarted (H2 wiped) or token expired, log out automatically.
  useEffect(() => {
    const token = getToken()
    if (!token || isTokenExpired(token)) {
      dispatch(clearCredentials())
      return
    }
    // Verify token is still valid server-side
    authApi.getMe().catch(() => {
      dispatch(clearCredentials())
    })
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor/:docId"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      {/* OAuth2 callback — handled by frontend before redirect */}
      <Route
        path="/oauth2/callback"
        element={<OAuth2Callback />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// OAuth2 callback: extract tokens from URL and redirect to dashboard
const OAuth2Callback: React.FC = () => {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const refreshToken = params.get('refreshToken')
    if (token) {
      localStorage.setItem('docflow_access_token', token)
    }
    if (refreshToken) {
      localStorage.setItem('docflow_refresh_token', refreshToken)
    }
    window.location.href = '/dashboard'
  }, [])
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Completing sign-in…</p>
      </div>
    </div>
  )
}

export default App
