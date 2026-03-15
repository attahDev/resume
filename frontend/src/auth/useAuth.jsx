import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister, getMe } from '../api/auth.js'
import { getAccessToken, setTokens, clearTokens } from '../api/client.js'
import client from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading]                 = useState(true)

  // On mount: try to restore session
  // 1. If access token in memory → fetch /me directly
  // 2. If no access token → attempt silent refresh via httpOnly cookie
  // 3. If both fail → user is a guest
  useEffect(() => {
    async function restoreSession() {
      try {
        if (getAccessToken()) {
          const u = await getMe()
          setUser(u)
          setIsAuthenticated(true)
        } else {
          // No token in memory — try silent refresh via cookie
          const res = await client.post('/auth/refresh')
          setTokens(res.data.access_token)
          const u = await getMe()
          setUser(u)
          setIsAuthenticated(true)
        }
      } catch {
        clearTokens()
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  async function login(email, password) {
    const res = await apiLogin(email, password)
    setTokens(res.access_token)
    const u = await getMe()
    setUser(u)
    setIsAuthenticated(true)
    return u
  }

  async function register(email, password) {
    await apiRegister(email, password)
    const res = await apiLogin(email, password)
    setTokens(res.access_token)
    const u = await getMe()
    setUser(u)
    setIsAuthenticated(true)
    return u
  }

  async function logout() {
    await apiLogout()
    clearTokens()
    setUser(null)
    setIsAuthenticated(false)
  }

  async function refreshUser() {
    try {
      const u = await getMe()
      setUser(u)
      return u
    } catch { return null }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isGuest: !isAuthenticated,
      loading,
      login,
      logout,
      register,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}