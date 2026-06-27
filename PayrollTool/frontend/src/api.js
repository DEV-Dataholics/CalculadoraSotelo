const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '')

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}