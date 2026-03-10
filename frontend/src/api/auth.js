import client, { setTokens, clearTokens } from './client.js'

export async function login(email, password) {
  const res = await client.post('/auth/login', { email, password })
  setTokens(res.data.access_token, res.data.refresh_token)
  return res.data
}

export async function register(email, password) {
  const res = await client.post('/auth/register', { email, password })
  return res.data
}

export async function logout() {
  try { await client.post('/auth/logout') } catch { /* ignore network errors on logout */ }
  clearTokens()
}

export async function getMe() {
  const res = await client.get('/auth/me')
  return res.data
}