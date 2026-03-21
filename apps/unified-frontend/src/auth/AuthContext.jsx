/**
 * NeuroOps Platform — Auth Context
 *
 * Lightweight session management for the unified shell.
 * Stores a JWT in localStorage. The token is issued by the
 * gateway-api /auth/token endpoint.
 *
 * This is an internal platform auth layer — not production SSO.
 * It protects the unified UI shell and demonstrates a realistic
 * login-gated deployment experience.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY   = 'neuroops_access_token'
const USER_KEY    = 'neuroops_user'
const EXPIRY_KEY  = 'neuroops_token_expiry'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isTokenExpired(expiryIso) {
  if (!expiryIso) return true
  return Date.now() >= new Date(expiryIso).getTime()
}

function readStoredSession() {
  try {
    const token  = localStorage.getItem(TOKEN_KEY)
    const user   = localStorage.getItem(USER_KEY)
    const expiry = localStorage.getItem(EXPIRY_KEY)
    if (token && user && !isTokenExpired(expiry)) {
      return { token, user, expiry }
    }
  } catch {
    // localStorage unavailable
  }
  return null
}

function clearStoredSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXPIRY_KEY)
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const stored  = readStoredSession()
  const [token,   setToken]   = useState(stored?.token   || null)
  const [user,    setUser]    = useState(stored?.user    || null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const isAuthenticated = !!(token && user)

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/gateway/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Login failed (HTTP ${res.status})`)
      }
      const data = await res.json()
      const expiryDate = new Date(Date.now() + data.expires_in * 1000).toISOString()

      setToken(data.access_token)
      setUser(data.user)
      try {
        localStorage.setItem(TOKEN_KEY,  data.access_token)
        localStorage.setItem(USER_KEY,   data.user)
        localStorage.setItem(EXPIRY_KEY, expiryDate)
      } catch { /* ignore */ }

      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    clearStoredSession()
  }, [])

  // Auto-logout on expiry
  useEffect(() => {
    const expiry = localStorage.getItem(EXPIRY_KEY)
    if (!expiry) return
    const msLeft = new Date(expiry).getTime() - Date.now()
    if (msLeft <= 0) {
      logout()
      return
    }
    const timer = setTimeout(logout, msLeft)
    return () => clearTimeout(timer)
  }, [token, logout])

  return (
    <AuthContext.Provider value={{
      token, user, loading, error,
      isAuthenticated,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
