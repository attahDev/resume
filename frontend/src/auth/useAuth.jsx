import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister, getMe } from '../api/auth.js'
import { getAccessToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading]                 = useState(true)

  // On mount: try to restore session if a token already exists in memory
  useEffect(() => {
    if (getAccessToken()) {
      getMe()
        .then(u => { setUser(u); setIsAuthenticated(true) })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    await apiLogin(email, password)
    const u = await getMe()
    setUser(u)
    setIsAuthenticated(true)
    return u
  }

  async function register(email, password) {
    return await apiRegister(email, password)
  }

  async function logout() {
    await apiLogout()
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