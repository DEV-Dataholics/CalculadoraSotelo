import { useEffect, useState } from 'react'
import { usersApi } from '../../api'

// ── UserFormModal ─────────────────────────────────────────────────────────────
function UserFormModal({ isOpen, onClose, onSave, mode, record, roles, loading }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [roleIds,  setRoleIds]  = useState([])
  const isEdit = mode === 'edit'

  useEffect(() => {
    if (!isOpen) return
    if (isEdit && record) {
      setEmail(record.email || '')
      setPassword('')
      setRoleIds(record.role_ids || [])
    } else {
      setEmail('')
      setPassword('')
      setRoleIds([])
    }
  }, [isOpen, mode, record])

  if (!isOpen) return null

  const toggleRole = (id) =>
    setRoleIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { email, role_ids: roleIds }
    if (password) payload.password = password
    if (!isEdit)  payload.password = password   // required on create
    onSave(payload)
  }

  const canSubmit = email && (isEdit || password) && !loading

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(15,23,42,.60)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-2xl)',
        boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 480,
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: 'var(--primary)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r-lg)',
              background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {isEdit ? '✏️' : '👤'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'white' }}>
                {isEdit ? 'Editar usuario' : 'Crear usuario'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.50)', marginTop: 2 }}>
                {isEdit ? `ID #${record?.id}` : 'Nuevo acceso al sistema'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 'var(--r-sm)',
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)',
            color: 'rgba(255,255,255,.70)', fontSize: 14, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div className="am-field">
              <label className="am-label">Correo electrónico</label>
              <input
                className="am-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@sotelo.local"
                required
                autoFocus
              />
            </div>

            <div className="am-field">
              <label className="am-label">
                {isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              </label>
              <input
                className="am-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Mínimo 8 caracteres'}
                required={!isEdit}
                autoComplete="new-password"
              />
            </div>

            <div className="am-field">
              <label className="am-label">Roles</label>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
                padding: '12px 14px', background: 'var(--bg)',
              }}>
                {roles.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--ink-4)', fontStyle: 'italic' }}>Cargando roles…</span>
                )}
                {roles.map(role => (
                  <label key={role.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '6px 8px', borderRadius: 'var(--r)',
                    background: roleIds.includes(role.id) ? 'var(--primary-muted)' : 'transparent',
                    border: `1px solid ${roleIds.includes(role.id) ? 'var(--primary-border)' : 'transparent'}`,
                    transition: 'all .12s',
                  }}>
                    <input
                      type="checkbox"
                      checked={roleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', textTransform: 'capitalize' }}>
                        {role.name}
                      </div>
                      {role.description && (
                        <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 1 }}>{role.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px', borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)', display: 'flex',
            alignItems: 'center', justifyContent: 'flex-end', gap: 10,
          }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: 'var(--r-lg)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Cancelar</button>
            <button type="submit" disabled={!canSubmit} style={{
              padding: '9px 22px', borderRadius: 'var(--r-lg)',
              background: isEdit ? 'var(--blue)' : 'var(--primary)', color: 'white',
              fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
              border: 'none', display: 'flex', alignItems: 'center', gap: 7,
              opacity: !canSubmit ? 0.6 : 1,
              boxShadow: canSubmit ? '0 3px 10px rgba(15,23,42,.22)' : 'none',
            }}>
              {loading ? '⌛ Guardando...' : (isEdit ? '💾 Guardar cambios' : '✓ Crear usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Role badge ────────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  admin:      { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  supervisor: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  operador:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  auditor:    { bg: '#fefce8', color: '#a16207', border: '#fde68a' },
}

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || { bg: 'var(--bg-2)', color: 'var(--ink-3)', border: 'var(--border)' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      display: 'inline-block', textTransform: 'uppercase', letterSpacing: '.04em',
    }}>{role}</span>
  )
}

// ── UsersTab ──────────────────────────────────────────────────────────────────
export default function UsersTab() {
  const [users,       setUsers]      = useState([])
  const [roles,       setRoles]      = useState([])
  const [loading,     setLoading]    = useState(true)
  const [error,       setError]      = useState('')
  const [search,      setSearch]     = useState('')
  const [modalOpen,   setModalOpen]  = useState(false)
  const [modalMode,   setModalMode]  = useState('create')
  const [editRecord,  setEdit]       = useState(null)
  const [saveLoading, setSave]       = useState(false)
  const [confirmId,   setConfirmId]  = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [usersRes, rolesRes] = await Promise.all([usersApi.list(), usersApi.listRoles()])
      setUsers(usersRes.data || [])
      setRoles(rolesRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = search
    ? users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.roles || []).join(' ').toLowerCase().includes(search.toLowerCase())
      )
    : users

  const handleCreate = () => { setEdit(null); setModalMode('create'); setModalOpen(true) }
  const handleEdit   = (u)  => { setEdit(u);  setModalMode('edit');   setModalOpen(true) }

  const handleSave = async (payload) => {
    setSave(true); setError('')
    try {
      if (modalMode === 'create') await usersApi.create(payload)
      else                        await usersApi.update(editRecord.id, payload)
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSave(false)
    }
  }

  const handleToggle = async (user) => {
    try {
      await usersApi.update(user.id, { is_active: Number(user.is_active) === 1 ? 0 : 1 })
      await load()
    } catch (err) { setError(err.message) }
  }

  const handleDelete = async (id) => {
    try {
      await usersApi.remove(id)
      setConfirmId(null)
      await load()
    } catch (err) { setError(err.message) }
  }

  return (
    <div>
      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--r-lg)',
          background: 'var(--red-bg)', color: 'var(--red)',
          border: '1px solid oklch(87% .06 27)', fontSize: 13,
        }}>{error}</div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', fontSize: 13 }}>🔍</span>
          <input
            className="am-search"
            type="text"
            placeholder={`Buscar en ${filtered.length} usuarios…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, color: 'var(--ink-3)',
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          padding: '4px 12px', borderRadius: 20,
        }}>{filtered.length} usuarios</span>
        <button onClick={handleCreate} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--primary)', color: 'white',
          border: 'none', padding: '8px 16px', borderRadius: 'var(--r-lg)',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(15,23,42,.20)',
        }}>+ Crear usuario</button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-4)', fontStyle: 'italic', fontSize: 14 }}>
          Cargando usuarios…
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--sh-xs)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--primary)' }}>
                {['#', 'Email', 'Roles', 'Estado', 'Último acceso', 'Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: h === 'Acciones' ? 'right' : 'left',
                    fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.07em', color: 'rgba(255,255,255,.75)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-4)', fontStyle: 'italic', fontSize: 13 }}>
                    {search ? `Sin resultados para "${search}"` : 'No hay usuarios registrados'}
                  </td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)'}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-4)' }}>{u.id}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)' }}>{u.email}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(u.roles || []).length === 0
                        ? <span style={{ fontSize: 11, color: 'var(--ink-4)', fontStyle: 'italic' }}>sin rol</span>
                        : (u.roles || []).map(r => <RoleBadge key={r} role={r} />)
                      }
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: Number(u.is_active) === 1 ? 'var(--emerald-bg)' : 'var(--red-bg)',
                      color: Number(u.is_active) === 1 ? 'oklch(38% 0.14 162)' : 'var(--red)',
                      border: `1px solid ${Number(u.is_active) === 1 ? 'var(--emerald-bd)' : 'oklch(87% .06 27)'}`,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: Number(u.is_active) === 1 ? 'var(--emerald)' : 'var(--red)', flexShrink: 0 }}></span>
                      {Number(u.is_active) === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Nunca'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {confirmId === u.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)' }}>¿Eliminar?</span>
                        <button className="am-action-btn am-btn-danger" onClick={() => handleDelete(u.id)}>Sí</button>
                        <button className="am-action-btn am-btn-ghost"  onClick={() => setConfirmId(null)}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                        <button
                          className={`am-action-btn ${Number(u.is_active) === 1 ? 'am-btn-warn' : 'am-btn-success'}`}
                          onClick={() => handleToggle(u)}
                        >
                          {Number(u.is_active) === 1 ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="am-action-btn am-btn-blue"   onClick={() => handleEdit(u)}>Editar</button>
                        <button className="am-action-btn am-btn-danger" onClick={() => setConfirmId(u.id)}>Borrar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        mode={modalMode}
        record={editRecord}
        roles={roles}
        loading={saveLoading}
      />
    </div>
  )
}
