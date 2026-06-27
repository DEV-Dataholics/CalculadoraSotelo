const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8081' : '')

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}

export async function fetchRendimientos() {
  const res = await fetch(buildApiUrl('/api/catalogs/rendimientos'))
  if (!res.ok) throw new Error('No se pudo cargar catalogo de rendimientos')
  return res.json()
}

export async function fetchRutas(params = {}) {
  const query = new URLSearchParams(params).toString()
  const path = query ? `/api/catalogs/rutas?${query}` : '/api/catalogs/rutas'
  const res = await fetch(buildApiUrl(path))
  if (!res.ok) throw new Error('No se pudo cargar catalogo de rutas')
  return res.json()
}

async function adminRequest(path, options = {}) {
  const res = await fetch(buildApiUrl(`/api/admin/${path}`), {
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
  const res = await fetch(buildApiUrl(`/api/tabulador?${query}`))
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
  const res = await fetch(buildApiUrl('/api/tabulador/upload'), {
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
  const res = await fetch(buildApiUrl('/api/tabulador/activar'), {
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
  const res = await fetch(buildApiUrl('/api/tabulador/versiones'))
  if (!res.ok) throw new Error('No se pudieron cargar las versiones del tabulador')
  return res.json()
}

/**
 * Desactiva todos los registros de una versión específica.
 * @param {number} version
 */
export async function deactivateTabuladorVersion(version) {
  const res = await fetch(buildApiUrl('/api/tabulador/desactivar'), {
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
  const res = await fetch(buildApiUrl(`/api/tabulador/version/${version}`), {
    method: 'DELETE',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`)
  return data
}