import { useAuth } from './AuthContext'

// Renderiza children solo si el usuario tiene el permiso requerido.
// La autorización real vive en el backend — esto es solo UX (ocultar acciones).
export default function RoleGate({ permission, fallback = null, children }) {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? children : fallback
}
