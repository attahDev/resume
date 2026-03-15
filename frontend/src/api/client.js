/**
 * api/client.js
 * Axios instance — access token in MEMORY only.
 * Refresh token lives in httpOnly cookie — never accessible to JS.
 * withCredentials: true sends cookies automatically on every request.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── In-memory access token store ──────────────────────────
let _accessToken = null
let _refreshing  = null   // shared promise prevents concurrent refresh storms

export const setTokens      = (a) => { _accessToken = a }
export const clearTokens    = ()  => { _accessToken = null }
export const getAccessToken = ()  => _accessToken

// ── Axios instance ─────────────────────────────────────────
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,   // sends httpOnly rt cookie automatically
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
    // Attempt silent refresh if 401 and not already retrying
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!_refreshing) {
        _refreshing = client
          .post('/auth/refresh')   // no body — cookie is sent automatically
          .then(res => { _accessToken = res.data.access_token })
          .catch(() => { clearTokens(); window.location.href = '/login' })
          .finally(() => { _refreshing = null })
      }
      try {
        await _refreshing
        original.headers['Authorization'] = `Bearer ${_accessToken}`
        return client(original)
      } catch {
        return Promise.reject(err)
      }
    }
    return Promise.reject(err)
  }
)

export default client