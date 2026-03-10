/**
 * api/client.js
 * Axios instance — JWT tokens live in MEMORY only.
 * NEVER written to localStorage or sessionStorage.
 * withCredentials: true sends httpOnly gfp guest cookie automatically.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── In-memory token store ──────────────────────────────────
let _accessToken  = null
let _refreshToken = null
let _refreshing   = null    // shared promise prevents concurrent refresh storms

export const setTokens      = (a, r) => { _accessToken = a; _refreshToken = r }
export const clearTokens    = ()      => { _accessToken = null; _refreshToken = null }
export const getAccessToken = ()      => _accessToken

// ── Axios instance ─────────────────────────────────────────
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
})

// ── Request: attach Bearer header ─────────────────────────
client.interceptors.request.use(config => {
  if (_accessToken) config.headers['Authorization'] = `Bearer ${_accessToken}`
  return config
})

// ── Response: auto-refresh on 401 ─────────────────────────
client.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry && _refreshToken) {
      original._retry = true
      if (!_refreshing) {
        _refreshing = client
          .post('/auth/refresh', { refresh_token: _refreshToken })
          .then(res => setTokens(res.data.access_token, res.data.refresh_token))
          .catch(() => { clearTokens(); window.location.href = '/login' })
          .finally(() => { _refreshing = null })
      }
      try {
        await _refreshing
        original.headers['Authorization'] = `Bearer ${_accessToken}`
        return client(original)
      } catch { return Promise.reject(err) }
    }
    return Promise.reject(err)
  }
)

export default client