import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      // AuthContext actualiza `user`, App reacciona y muestra la app
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-wordmark">Sotelo <em>Nómina</em></span>
          <span className="login-subtitle">Sistema de nómina foránea</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              placeholder="usuario@sotelo.local"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !email || !password}
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
