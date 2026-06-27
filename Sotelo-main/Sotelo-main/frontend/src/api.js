const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8080' : '')

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}

// ── Cliente HTTP autenticado ─────────────────────────────────────────────────

let _refreshing = null  // Promise compartida para evitar refrescar en paralelo

export async function authFetch(path, options = {}) {
  const token = localStorage.getItem('sotelo_access')
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let res = await fetch(buildApiUrl(path), { ...options, headers })

  // Intento único de refresh automático ante 401
  if (res.status === 401 && localStorage.getItem('sotelo_refresh')) {
    if (!_refreshing) {
      _refreshing = fetch(buildApiUrl('/api/v1/auth/refresh'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh: localStorage.getItem('sotelo_refresh') }),
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          localStorage.setItem('sotelo_access',  data.access)
          localStorage.setItem('sotelo_refresh', data.refresh)
          return data.access
        })
        .catch(() => {
          localStorage.removeItem('sotelo_access')
          localStorage.removeItem('sotelo_refresh')
          localStorage.removeItem('sotelo_user')
          window.dispatchEvent(new Event('sotelo:logout'))
          return null
        })
        .finally(() => { _refreshing = null })
    }

    const newToken = await _refreshing
    if (newToken) {
      res = await fetch(buildApiUrl(path), {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${newToken}` },
      })
    }
  }

  return res
}

export async function fetchRendimientos() {
  const res = await authFetch('/api/catalogs/rendimientos')
  if (!res.ok) throw new Error('No se pudo cargar catalogo de rendimientos')
  return res.json()
}

export async function fetchRutas(params = {}) {
  const query = new URLSearchParams(params).toString()
  const path = query ? `/api/catalogs/rutas?${query}` : '/api/catalogs/rutas'
  const res = await authFetch(path)
  if (!res.ok) throw new Error('No se pudo cargar catalogo de rutas')
  return res.json()
}

async function adminRequest(path, options = {}) {
  const res = await authFetch(`/api/admin/${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  if (!res.ok) {
    let detail = `Error ${res.status}`
    try {
      const payload = await res.json()
      detail = payload?.detail || detail
    } catch {
      // Keep default detail if response body is not JSON.
    }
    throw new Error(detail)
  }

  return res.json()
}

export const adminApi = {
  listUnidades: (params = '') => adminRequest(`unidades${params ? `?${params}` : ''}`),
  createUnidad: (payload) => adminRequest('unidades', { method: 'POST', body: JSON.stringify(payload) }),
  updateUnidad: (id, payload) => adminRequest(`unidades/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUnidad: (id) => adminRequest(`unidades/${id}`, { method: 'DELETE' }),

  listRutas: (params = '') => adminRequest(`rutas${params ? `?${params}` : ''}`),
  createRuta: (payload) => adminRequest('rutas', { method: 'POST', body: JSON.stringify(payload) }),
  updateRuta: (id, payload) => adminRequest(`rutas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRuta: (id) => adminRequest(`rutas/${id}`, { method: 'DELETE' }),

  listKeywords: (params = '') => adminRequest(`keywords${params ? `?${params}` : ''}`),
  createKeyword: (payload) => adminRequest('keywords', { method: 'POST', body: JSON.stringify(payload) }),
  updateKeyword: (id, payload) => adminRequest(`keywords/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteKeyword: (id) => adminRequest(`keywords/${id}`, { method: 'DELETE' }),

  listTabulador: (params = '') => adminRequest(`tabulador${params ? `?${params}` : ''}`),
  createTabulador: (payload) => adminRequest('tabulador', { method: 'POST', body: JSON.stringify(payload) }),
  updateTabulador: (id, payload) => adminRequest(`tabulador/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTabulador: (id) => adminRequest(`tabulador/${id}`, { method: 'DELETE' }),

  listAuditLogs: (params = '') => adminRequest(`audit-logs${params ? `?${params}` : ''}`),

  listExclusiones:  (params = '') => adminRequest(`exclusiones${params ? `?${params}` : ''}`),
  createExclusion:  (payload)     => adminRequest('exclusiones',      { method: 'POST', body: JSON.stringify(payload) }),
  updateExclusion:  (id, payload) => adminRequest(`exclusiones/${id}`, { method: 'PUT',  body: JSON.stringify(payload) }),
  deleteExclusion:  (id)          => adminRequest(`exclusiones/${id}`, { method: 'DELETE' }),
}

// ── Funciones del tabulador de tarifas (cruces) ─────────────────────────────

/**
 * Consulta la tarifa aplicable para un movimiento específico.
 * @param {{ tipo: string, cruce?: string, origen?: string, destino?: string }} params
 */
export async function getTarifaPreview(params) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString()
  const res = await authFetch(`/api/tabulador?${query}`)
  if (!res.ok) throw new Error('No se pudo consultar la tarifa')
  return res.json()
}

/**
 * Sube un archivo CSV con las tarifas del tabulador.
 * La versión se crea como inactiva; activar con activateTabuladorVersion().
 * @param {File} file
 */
export async function uploadTabulador(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await authFetch('/api/tabulador/upload', {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`)
  return data
}

/**
 * Activa una versión específica del tabulador (desactiva las demás).
 * @param {number} version
 */
export async function activateTabuladorVersion(version) {
  const res = await authFetch('/api/tabulador/activar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`)
  return data
}

/**
 * Lista las versiones disponibles del tabulador con resumen de tarifas.
 */
export async function listTabuladorVersiones() {
  const res = await authFetch('/api/tabulador/versiones')
  if (!res.ok) throw new Error('No se pudieron cargar las versiones del tabulador')
  return res.json()
}

/**
 * Desactiva todos los registros de una versión específica.
 * @param {number} version
 */
export async function deactivateTabuladorVersion(version) {
  const res = await authFetch('/api/tabulador/desactivar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`)
  return data
}

/**
 * Elimina físicamente todos los registros de una versión.
 * @param {number} version
 */
export async function deleteTabuladorVersion(version) {
  const res = await authFetch(`/api/tabulador/version/${version}`, { method: 'DELETE' })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`)
  return data
}

// ── API de gestión de usuarios ───────────────────────────────────────────────

async function usersRequest(path, options = {}) {
  const res = await authFetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`)
  return data
}

export const usersApi = {
  list:      ()         => usersRequest('/api/v1/users'),
  listRoles: ()         => usersRequest('/api/v1/users/roles'),
  create:    (payload)  => usersRequest('/api/v1/users',      { method: 'POST', body: JSON.stringify(payload) }),
  update:    (id, data) => usersRequest(`/api/v1/users/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  remove:    (id)       => usersRequest(`/api/v1/users/${id}`, { method: 'DELETE' }),
}