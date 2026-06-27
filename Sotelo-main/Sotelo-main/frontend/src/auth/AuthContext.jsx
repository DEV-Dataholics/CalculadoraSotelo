import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { buildApiUrl } from '../api'

const AuthContext = createContext(null)

const STORAGE = {
  access:  'sotelo_access',
  refresh: 'sotelo_refresh',
  user:    'sotelo_user',
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE.user)) } catch { return null }
  })
  const [ready, setReady] = useState(false)

  // Verifica al montar que el token guardado sigue siendo válido
  useEffect(() => {
    const token = localStorage.getItem(STORAGE.access)
    if (!token) { setReady(true); return }

    fetch(buildApiUrl('/api/v1/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => _clear())
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await fetch(buildApiUrl('/api/v1/auth/login'), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Credenciales inválidas')

    localStorage.setItem(STORAGE.access,  data.access)
    localStorage.setItem(STORAGE.refresh, data.refresh)
    localStorage.setItem(STORAGE.user,    JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem(STORAGE.refresh)
    const access  = localStorage.getItem(STORAGE.access)
    try {
      await fetch(buildApiUrl('/api/v1/auth/logout'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body:    JSON.stringify({ refresh }),
      })
    } catch { /* silenciar errores de red al hacer logout */ }
    _clear()
  }, [])

  // Rota el refresh token y devuelve el nuevo access token, o null si falla
  const refreshAccess = useCallback(async () => {
    const refresh = localStorage.getItem(STORAGE.refresh)
    if (!refresh) return null
    try {
      const res  = await fetch(buildApiUrl('/api/v1/auth/refresh'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh }),
      })
      if (!res.ok) { _clear(); return null }
      const data = await res.json()
      localStorage.setItem(STORAGE.access,  data.access)
      localStorage.setItem(STORAGE.refresh, data.refresh)
      return data.access
    } catch { _clear(); return null }
  }, [])

  const hasPermission = useCallback((perm) => {
    return Array.isArray(user?.permissions) && user.permissions.includes(perm)
  }, [user])

  function _clear() {
    localStorage.removeItem(STORAGE.access)
    localStorage.removeItem(STORAGE.refresh)
    localStorage.removeItem(STORAGE.user)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, refreshAccess, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

export function getAccessToken() {
  return localStorage.getItem('sotelo_access')
}
