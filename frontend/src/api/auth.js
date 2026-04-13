import client, { setTokens, clearTokens } from './client.js'

export async function login(email, password) {
  const res = await client.post('/auth/login', { email, password })
  // NOTE: do NOT call setTokens here — useAuth.login() is the single source of truth.
  // Calling it here AND in useAuth caused a double-set where the second call
  // used res.access_token (undefined) instead of res.data.access_token.
  return res.data
}

export async function register(email, password) {
  const res = await client.post('/auth/register', { email, password })
  return res.data
}

export async function logout() {
  try { await client.post('/auth/logout') } catch {}
  clearTokens()
}

export async function getMe() {
  const res = await client.get('/auth/me')
  return res.data
}
