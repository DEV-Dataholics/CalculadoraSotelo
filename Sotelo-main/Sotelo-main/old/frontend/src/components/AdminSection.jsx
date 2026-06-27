import React, { useEffect, useMemo, useState } from 'react'
import { adminApi, uploadTabulador, activateTabuladorVersion, deactivateTabuladorVersion, deleteTabuladorVersion, listTabuladorVersiones } from '../api'

// ── Admin Tabs Config ────────────────────────────────────────────────────────
const ADMIN_TABS_CFG = [
  { id: 'unidades',  label: 'Unidades',  icon: '🚛', desc: 'Rendimiento por tractor' },
  { id: 'rutas',     label: 'Rutas',     icon: '🗺️', desc: 'Distancias origen-destino' },
  { id: 'keywords',  label: 'Keywords',  icon: '🏷️', desc: 'Palabras clave Pacífico' },
  { id: 'tabulador', label: 'Tabulador', icon: '📋', desc: 'Tarifas de pago' },
  { id: 'audit',     label: 'Audit',     icon: '📜', desc: 'Registro de actividad' },
]

// ── AdminFormModal ────────────────────────────────────────────────────────────
function AdminFormModal({ isOpen, onClose, mode, tab, data, onSave, loading }) {
  const [form, setForm] = useState({})

  useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && data) { setForm({ ...data }); return }
    if (tab === 'unidades')  setForm({ tractor: '', yield_km_l: '' })
    if (tab === 'rutas')     setForm({ origen_normalizado: '', destino_normalizado: '', distancia_km: '', region: 'GENERAL' })
    if (tab === 'keywords')  setForm({ keyword: '' })
    if (tab === 'tabulador') setForm({ tipo: '', cruce: '', origen: '', destino: '', pago_operador: '', version: 1, prioridad: 0 })
  }, [isOpen, mode, data, tab])

  if (!isOpen) return null
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const isEdit = mode === 'edit'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(15,23,42,.60)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn .15s ease'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-2xl)',
        boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 520,
        overflow: 'hidden', animation: 'scaleIn .18s ease'
      }} onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{
          background: 'var(--primary)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r-lg)',
              background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>
              {isEdit ? '✏️' : '➕'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'white', textTransform: 'capitalize' }}>
                {isEdit ? `Editar ${tab}` : `Nuevo registro: ${tab}`}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.50)', marginTop: 2 }}>
                Completa la información requerida
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 'var(--r-sm)',
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)',
            color: 'rgba(255,255,255,.70)', fontSize: 14, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'background .15s'
          }}>✕</button>
        </div>

        {/* Form body */}
        <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {tab === 'unidades' && (<>
              <div className="am-field">
                <label className="am-label">Tractor</label>
                <input className="am-input" value={form.tractor||''} onChange={e=>set('tractor',e.target.value)} placeholder="Ej: F-123" required />
              </div>
              <div className="am-field">
                <label className="am-label">Rendimiento (km/L)</label>
                <input className="am-input" type="number" step="0.00001" value={form.yield_km_l||''} onChange={e=>set('yield_km_l',e.target.value)} placeholder="Ej: 2.45" required />
              </div>
            </>)}

            {tab === 'rutas' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="am-field" style={{ gridColumn: '1/-1' }}>
                  <label className="am-label">Origen</label>
                  <input className="am-input" value={form.origen_normalizado||''} onChange={e=>set('origen_normalizado',e.target.value)} placeholder="Ciudad Origen" required />
                </div>
                <div className="am-field" style={{ gridColumn: '1/-1' }}>
                  <label className="am-label">Destino</label>
                  <input className="am-input" value={form.destino_normalizado||''} onChange={e=>set('destino_normalizado',e.target.value)} placeholder="Ciudad Destino" required />
                </div>
                <div className="am-field">
                  <label className="am-label">Distancia (KM)</label>
                  <input className="am-input" type="number" step="0.1" value={form.distancia_km||''} onChange={e=>set('distancia_km',e.target.value)} placeholder="KM" required />
                </div>
                <div className="am-field">
                  <label className="am-label">Región</label>
                  <select className="am-select" value={form.region||'GENERAL'} onChange={e=>set('region',e.target.value)}>
                    <option value="GENERAL">GENERAL</option>
                    <option value="PACIFICO">PACIFICO</option>
                    <option value="CLIENTE">CLIENTE</option>
                  </select>
                </div>
              </div>
            )}

            {tab === 'keywords' && (
              <div className="am-field">
                <label className="am-label">Palabra Clave</label>
                <input className="am-input" value={form.keyword||''} onChange={e=>set('keyword',e.target.value)} placeholder="Ej: PACIFICO" required />
              </div>
            )}

            {tab === 'tabulador' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="am-field">
                  <label className="am-label">Tipo Movimiento</label>
                  <input className="am-input" value={form.tipo||''} onChange={e=>set('tipo',e.target.value)} placeholder="Ej: EXP-02" required />
                </div>
                <div className="am-field">
                  <label className="am-label">Cruce</label>
                  <input className="am-input" value={form.cruce||''} onChange={e=>set('cruce',e.target.value)} placeholder="Opcional" />
                </div>
                <div className="am-field">
                  <label className="am-label">Origen</label>
                  <input className="am-input" value={form.origen||''} onChange={e=>set('origen',e.target.value)} placeholder="Opcional" />
                </div>
                <div className="am-field">
                  <label className="am-label">Destino</label>
                  <input className="am-input" value={form.destino||''} onChange={e=>set('destino',e.target.value)} placeholder="Opcional" />
                </div>
                <div className="am-field">
                  <label className="am-label">Pago Operador ($)</label>
                  <input className="am-input" type="number" step="0.01" value={form.pago_operador||''} onChange={e=>set('pago_operador',e.target.value)} required />
                </div>
                <div className="am-field">
                  <label className="am-label">Prioridad</label>
                  <input className="am-input" type="number" value={form.prioridad??0} onChange={e=>set('prioridad',e.target.value)} />
                </div>
                <div className="am-field" style={{ gridColumn: '1/-1' }}>
                  <label className="am-label">Versión</label>
                  <input className="am-input" type="number" value={form.version??1} onChange={e=>set('version',e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px', borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)', display: 'flex',
            alignItems: 'center', justifyContent: 'flex-end', gap: 10
          }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: 'var(--r-lg)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{
              padding: '9px 22px', borderRadius: 'var(--r-lg)',
              background: isEdit ? 'var(--blue)' : 'var(--primary)', color: 'white',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(15,23,42,.22)',
              border: 'none', display: 'flex', alignItems: 'center', gap: 7,
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? '⌛ Guardando...' : (isEdit ? '💾 Guardar cambios' : '✓ Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── VersionCard ───────────────────────────────────────────────────────────────
function VersionCard({ v, tabActivating, onActivar, onDesactivar, onEliminar }) {
  const [confirm, setConfirm] = useState(false)
  const isActive = Number(v.activa) === 1

  return (
    <div style={{
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      border: `1.5px solid ${isActive ? 'var(--emerald-bd)' : 'var(--border)'}`,
      background: 'var(--surface)',
    }}>
      <div style={{
        padding: '14px 16px',
        background: isActive ? 'var(--emerald-bg)' : 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--ink-1)' }}>v{v.version}</span>
              {isActive && (
                <span style={{
                  background: 'var(--emerald)', color: 'white',
                  fontSize: 9, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.05em'
                }}>● Activa</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 3 }}>{Number(v.total).toLocaleString()} tarifas</div>
            {v.fecha_carga && (
              <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>
                {new Date(v.fecha_carga).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}
              </div>
            )}
          </div>
          <div style={{ fontSize: 22, opacity: .6 }}>🗄️</div>
        </div>

        {confirm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', flex: 1 }}>¿Eliminar v{v.version}?</span>
            <button className="am-action-btn am-btn-danger" disabled={tabActivating} onClick={() => { onEliminar(v.version); setConfirm(false) }}>Sí</button>
            <button className="am-action-btn am-btn-ghost" disabled={tabActivating} onClick={() => setConfirm(false)}>No</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {!isActive && <button className="am-action-btn am-btn-success" disabled={tabActivating} onClick={() => onActivar(v.version)}>✓ Activar</button>}
            {isActive  && <button className="am-action-btn am-btn-warn"    disabled={tabActivating} onClick={() => onDesactivar(v.version)}>⏸ Desactivar</button>}
            <button className="am-action-btn am-btn-danger" disabled={tabActivating} onClick={() => setConfirm(true)}>🗑</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── AdminTable ────────────────────────────────────────────────────────────────
function AdminTable({ rows, tab, onToggle, onDelete, onEdit }) {
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [sort, setSort]       = useState({ key: null, dir: 'asc' })
  const [confirmId, setConf]  = useState(null)
  const PER = 20

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter(r => Object.values(r).some(v => String(v??'').toLowerCase().includes(q)))
  }, [rows, search])

  const sorted = useMemo(() => {
    if (!sort.key) return filtered
    return [...filtered].sort((a,b) => {
      const av=a[sort.key], bv=b[sort.key]
      return sort.dir==='asc' ? (av<bv?-1:av>bv?1:0) : (av>bv?-1:av<bv?1:0)
    })
  }, [filtered, sort])

  const totalPages = Math.ceil(sorted.length / PER)
  const paged = sorted.slice((page-1)*PER, page*PER)
  useEffect(() => setPage(1), [search, tab])
  const toggleSort = k => setSort(p => p.key===k ? { key:k, dir:p.dir==='asc'?'desc':'asc' } : { key:k, dir:'asc' })

  const hasActions = ['unidades','rutas','keywords','tabulador'].includes(tab)

  // Column config per tab
  const colCfg = {
    unidades:  [
      { key: 'id',          label: '#',           w: 50 },
      { key: 'tractor',     label: 'Tractor',     mono: true },
      { key: 'yield_km_l',  label: 'Rend. km/L',  mono: true, fmt: v => Number(v).toFixed(5) },
      { key: 'is_active',   label: 'Estado',      badge: true },
    ],
    rutas: [
      { key: 'id',           label: '#',      w: 50 },
      { key: 'origen_normalizado',       label: 'Origen' },
      { key: 'destino_normalizado',      label: 'Destino' },
      { key: 'distancia_km', label: 'KM',     mono: true, fmt: v => `${Number(v).toFixed(0)} km` },
      { key: 'region',       label: 'Región', tag: true },
      { key: 'is_active',    label: 'Estado', badge: true },
    ],
    keywords: [
      { key: 'id',       label: '#',        w: 50 },
      { key: 'keyword',  label: 'Keyword',  mono: true },
      { key: 'is_active',label: 'Estado',   badge: true },
    ],
    tabulador: [
      { key: 'id',            label: '#',      w: 60, mono: true },
      { key: 'tipo',          label: 'Tipo',   mono: true },
      { key: 'cruce',         label: 'Cruce' },
      { key: 'origen',        label: 'Origen' },
      { key: 'destino',       label: 'Destino' },
      { key: 'pago_operador', label: 'Pago',   mono: true, fmt: v => `$${Number(v).toFixed(2)}`, color: 'var(--emerald)' },
      { key: 'version',       label: 'Ver.',   mono: true },
      { key: 'is_active',     label: 'Estado', badge: true },
    ],
    audit: [
      { key: 'id',          label: '#',        w: 50, mono: true },
      { key: 'action',      label: 'Acción',   audit: true },
      { key: 'entity_type', label: 'Tipo' },
      { key: 'details',     label: 'Detalles', truncate: true },
      { key: 'ip_address',  label: 'IP',       mono: true },
      { key: 'created_at',  label: 'Fecha',    mono: true },
    ],
  }
  const cols = colCfg[tab] || []

  const renderCell = (row, col) => {
    const v = row[col.key]
    if (col.badge) {
      const isOn = Number(v) === 1
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: isOn ? 'var(--emerald-bg)' : 'var(--red-bg)',
          color: isOn ? 'oklch(38% 0.14 162)' : 'var(--red)',
          border: `1px solid ${isOn ? 'var(--emerald-bd)' : 'oklch(87% .06 27)'}`,
        }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background: isOn?'var(--emerald)':'var(--red)', flexShrink:0 }}></span>
          {isOn ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
    if (col.audit) {
      const isCSV  = String(v).includes('CSV')
      const isCalc = String(v).includes('CALC')
      return (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          display: 'inline-block', textTransform: 'uppercase', letterSpacing: '.04em',
          background: isCSV ? 'var(--blue-bg)' : isCalc ? 'var(--primary-muted)' : 'var(--bg-2)',
          color: isCSV ? 'var(--blue)' : isCalc ? 'var(--primary)' : 'var(--ink-3)',
          border: `1px solid ${isCSV ? 'var(--blue-bd)' : isCalc ? 'var(--primary-border)' : 'var(--border)'}`,
        }}>{v}</span>
      )
    }
    if (col.tag) {
      return (
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 4,
          background: 'var(--primary-muted)', color: 'var(--primary)',
          border: '1px solid var(--primary-border)',
        }}>{v}</span>
      )
    }
    if (col.truncate) {
      return <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--ink-3)', maxWidth:280, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(v??'')}</span>
    }
    const display = col.fmt ? col.fmt(v) : String(v??'')
    return <span style={{
      fontFamily: col.mono ? 'var(--mono)' : 'inherit',
      fontWeight: col.mono ? 600 : 400,
      fontSize: col.mono ? 12 : 13,
      color: col.color || 'var(--ink-2)',
    }}>{display}</span>
  }

  return (
    <div>
      {/* Search bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-4)', fontSize:13, pointerEvents:'none' }}>🔍</span>
          <input
            className="am-search"
            type="text"
            placeholder={`Buscar en ${filtered.length} registros…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{
          fontSize:12, fontWeight:700, color:'var(--ink-3)',
          background:'var(--bg-2)', border:'1px solid var(--border)',
          padding:'4px 12px', borderRadius:20, whiteSpace:'nowrap'
        }}>{filtered.length} resultados</span>
      </div>

      {/* Table */}
      <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--sh-xs)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--primary)' }}>
                {cols.map(col => (
                  <th key={col.key}
                    onClick={() => toggleSort(col.key)}
                    style={{
                      padding:'10px 14px', textAlign:'left', cursor:'pointer',
                      fontSize:9.5, fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.07em', color:'rgba(255,255,255,.75)',
                      whiteSpace:'nowrap', width: col.w || 'auto',
                      userSelect:'none',
                      transition:'background .12s',
                    }}
                  >
                    {col.label}
                    {sort.key === col.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
                {hasActions && (
                  <th style={{ padding:'10px 14px', textAlign:'right', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'rgba(255,255,255,.75)' }}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={99} style={{ textAlign:'center', padding:'48px 0', color:'var(--ink-4)', fontStyle:'italic', fontSize:13 }}>
                    Sin resultados para "{search}"
                  </td>
                </tr>
              ) : paged.map((row, i) => (
                <tr key={row.id||i} style={{
                  borderBottom:'1px solid var(--border)',
                  background: i%2===0 ? 'var(--surface)' : 'var(--surface-2)',
                  transition:'background .1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--primary-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background= i%2===0 ? 'var(--surface)' : 'var(--surface-2)'}
                >
                  {cols.map(col => (
                    <td key={col.key} style={{ padding:'10px 14px', verticalAlign:'middle' }}>
                      {renderCell(row, col)}
                    </td>
                  ))}
                  {hasActions && (
                    <td style={{ padding:'10px 14px', textAlign:'right', whiteSpace:'nowrap' }}>
                      {confirmId === row.id ? (
                        <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                          <span style={{ fontSize:11, fontWeight:600, color:'var(--red)' }}>¿Eliminar?</span>
                          <button className="am-action-btn am-btn-danger" onClick={() => { onDelete(row); setConf(null) }}>Sí</button>
                          <button className="am-action-btn am-btn-ghost"  onClick={() => setConf(null)}>No</button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                          {'is_active' in row && (
                            <button
                              className={`am-action-btn ${Number(row.is_active)===1 ? 'am-btn-warn' : 'am-btn-success'}`}
                              onClick={() => onToggle(row)}
                            >
                              {Number(row.is_active)===1 ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                          <button className="am-action-btn am-btn-blue"   onClick={() => onEdit(row)}>Editar</button>
                          <button className="am-action-btn am-btn-danger" onClick={() => setConf(row.id)}>Borrar</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 2px', flexWrap:'wrap', gap:8 }}>
          <span style={{ fontSize:11, color:'var(--ink-4)', fontStyle:'italic' }}>
            Mostrando {Math.min(filtered.length, PER)} de {filtered.length} registros
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button className="am-pag-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-2)', background:'var(--bg-2)', border:'1px solid var(--border)', padding:'5px 14px', borderRadius:'var(--r-sm)' }}>
              Página {page} de {totalPages}
            </span>
            <button className="am-pag-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── AdminSection ──────────────────────────────────────────────────────────────
export default function AdminSection() {
  const [tab, setTab]             = useState('unidades')
  const [rows, setRows]           = useState([])
  const [versiones, setVersiones] = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editRecord, setEdit]     = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const [verOpen, setVerOpen]     = useState(false)

  // CSV
  const [tabUploadFile, setTabUploadFile] = useState(null)
  const [tabUploadResult, setTabUploadResult] = useState(null)
  const [tabUploadLoading, setTabUploadLoading] = useState(false)
  const [tabActivating, setTabActivating] = useState(false)
  const [tabCsvPreview, setTabCsvPreview] = useState(null) // { headers, rows, total, file }

  const tabCfg = ADMIN_TABS_CFG.find(t => t.id === tab) || {}

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      let result
      if (tab === 'unidades') result = await adminApi.listUnidades('')
      if (tab === 'rutas') result = await adminApi.listRutas('')
      if (tab === 'keywords') result = await adminApi.listKeywords('')
      if (tab === 'tabulador') {
        result = await adminApi.listTabulador('include_inactive=1')
        const ver = await listTabuladorVersiones()
        setVersiones(ver.versiones ?? [])
      }
      if (tab === 'audit') result = await adminApi.listAuditLogs('limit=200')
      setRows(result?.data || [])
    } catch (err) {
      setError(err.message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tab])

  const handleToggle = async row => {
    const nextActive = Number(row.is_active) === 1 ? 0 : 1
    if (tab === 'unidades') await adminApi.updateUnidad(row.id, { is_active: nextActive })
    if (tab === 'rutas') await adminApi.updateRuta(row.id, { is_active: nextActive })
    if (tab === 'keywords') await adminApi.updateKeyword(row.id, { is_active: nextActive })
    if (tab === 'tabulador') await adminApi.updateTabulador(row.id, { is_active: nextActive })
    await loadData()
  }

  const handleDelete = async row => {
    try {
      if (tab === 'unidades') await adminApi.deleteUnidad(row.id)
      if (tab === 'rutas') await adminApi.deleteRuta(row.id)
      if (tab === 'keywords') await adminApi.deleteKeyword(row.id)
      if (tab === 'tabulador') await adminApi.deleteTabulador(row.id)
      await loadData()
    } catch (err) {
      setError(`Error al borrar: ${err.message}`)
    }
  }

  const handleEdit   = row => { setEdit(row); setModalMode('edit'); setModalOpen(true) }
  const handleCreate = ()  => { setEdit(null); setModalMode('create'); setModalOpen(true) }
  
  const handleSave   = async formData => {
    setFormLoading(true)
    setError('')
    try {
      if (modalMode === 'create') {
        const payload = { ...formData, is_active: 1 }
        if (tab === 'unidades') payload.yield_km_l = Number(payload.yield_km_l)
        if (tab === 'rutas') payload.distancia_km = Number(payload.distancia_km)
        if (tab === 'tabulador') {
          payload.pago_operador = Number(payload.pago_operador)
          payload.version = Number(payload.version)
          payload.prioridad = Number(payload.prioridad)
        }

        if (tab === 'unidades') await adminApi.createUnidad(payload)
        if (tab === 'rutas') await adminApi.createRuta(payload)
        if (tab === 'keywords') await adminApi.createKeyword(payload)
        if (tab === 'tabulador') await adminApi.createTabulador(payload)
      } else {
        const id = editRecord.id
        const payload = { ...formData }
        delete payload.id; delete payload.created_at; delete payload.updated_at

        if (tab === 'unidades') payload.yield_km_l = Number(payload.yield_km_l)
        if (tab === 'rutas') payload.distancia_km = Number(payload.distancia_km)
        if (tab === 'tabulador') {
          payload.pago_operador = Number(payload.pago_operador)
          payload.version = Number(payload.version)
          payload.prioridad = Number(payload.prioridad)
        }

        if (tab === 'unidades') await adminApi.updateUnidad(id, payload)
        if (tab === 'rutas') await adminApi.updateRuta(id, payload)
        if (tab === 'keywords') await adminApi.updateKeyword(id, payload)
        if (tab === 'tabulador') await adminApi.updateTabulador(id, payload)
      }
      
      setModalOpen(false)
      await loadData()
    } catch (err) {
      setError(`Error al guardar: ${err.message}`)
    } finally {
      setFormLoading(false)
    }
  }

  const handleActivar    = async v => {
    setTabActivating(true)
    try { await activateTabuladorVersion(v); await loadData() }
    catch (err) { setError(err.message) }
    finally { setTabActivating(false) }
  }
  const handleDesactivar = async v => {
    setTabActivating(true)
    try { await deactivateTabuladorVersion(v); await loadData() }
    catch (err) { setError(err.message) }
    finally { setTabActivating(false) }
  }
  const handleEliminar   = async v => {
    setTabActivating(true)
    try { await deleteTabuladorVersion(v); await loadData() }
    catch (err) { setError(err.message) }
    finally { setTabActivating(false) }
  }

  // Stats for hero
  const activeCount   = rows.filter(r => 'is_active' in r ? Number(r.is_active)===1 : true).length
  const inactiveCount = rows.filter(r => 'is_active' in r && Number(r.is_active)===0).length
  const activeVersion = versiones.find(v => Number(v.activa)===1)

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', background:'var(--bg)' }}>

      {/* ── Admin Hero ────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--primary)', padding: '28px 32px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', right:-40, top:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}></div>
        <div style={{ position:'absolute', right:80, top:20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.03)' }}></div>

        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, gap:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{
                width:48, height:48, borderRadius:'var(--r-lg)',
                background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.18)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22
              }}>⚙️</div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'white', letterSpacing:'-.3px' }}>
                  Sección Administrativa
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.45)', marginTop:3 }}>
                  Gestión de bases de datos operativas
                </div>
              </div>
            </div>
            <a href="/" style={{
              display:'flex', alignItems:'center', gap:7, textDecoration: 'none',
              background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.18)',
              color:'white', padding:'8px 16px', borderRadius:'var(--r-lg)',
              fontSize:13, fontWeight:600, cursor:'pointer',
              transition:'background .15s',
            }}>← Módulo Operativo</a>
          </div>

          <div style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',
            gap:0, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
            borderRadius:'var(--r-lg)', overflow:'hidden',
          }}>
            {[
              { label:'Total Registros',  value: rows.length, mono: true },
              { label:'Activos',          value: activeCount, color:'oklch(80% .12 162)' },
              { label:'Inactivos',        value: inactiveCount, color:'rgba(255,255,255,.45)' },
              ...(tab==='tabulador' ? [{ label:'Versión Activa', value: activeVersion ? `v${activeVersion.version}` : '—' }] : []),
              { label:'Módulo Activo',    value: tabCfg.label || tab, tag: true },
            ].map((s, i) => (
              <div key={i} style={{
                padding:'14px 18px',
                borderRight:'1px solid rgba(255,255,255,.08)',
              }}>
                <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'rgba(255,255,255,.40)', marginBottom:4 }}>{s.label}</div>
                <div style={{
                  fontFamily: s.mono || typeof s.value === 'number' ? 'var(--mono)' : 'var(--font-display)',
                  fontSize: typeof s.value === 'number' ? 20 : 15,
                  fontWeight:700, color: s.color || 'white',
                }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs + Content ────────────────────────────────────────────── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 28px 60px' }}>

        {error && (
          <div style={{ marginBottom: 16, padding: 12, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid oklch(87% .06 27)', borderRadius: 'var(--r-lg)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{
          display:'flex', gap:4, background:'var(--surface)',
          border:'1px solid var(--border)', borderRadius:'var(--r-lg)',
          padding:4, marginBottom:24, flexWrap:'wrap', boxShadow:'var(--sh-xs)',
        }}>
          {ADMIN_TABS_CFG.map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'8px 16px', borderRadius:'var(--r)',
                fontSize:13, fontWeight:600, cursor:'pointer', border:'none',
                background: tab===t.id ? 'var(--primary)' : 'transparent',
                color: tab===t.id ? 'white' : 'var(--ink-3)',
                boxShadow: tab===t.id ? '0 2px 8px rgba(15,23,42,.20)' : 'none',
                transition:'all .15s',
              }}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--r-2xl)', overflow:'hidden', boxShadow:'var(--sh-sm)',
        }}>
          <div style={{
            padding:'20px 24px', borderBottom:'1px solid var(--border)',
            background:'var(--surface-2)',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                width:40, height:40, borderRadius:'var(--r-lg)',
                background:'var(--primary-muted)', border:'1px solid var(--primary-border)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              }}>{tabCfg.icon}</div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--ink-1)', letterSpacing:'-.2px' }}>
                  {tabCfg.label}
                </div>
                <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:2 }}>{tabCfg.desc}</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => { setLoading(true); loadData() }}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:'var(--primary-muted)', color:'var(--primary)',
                  border:'1px solid var(--primary-border)', padding:'8px 14px',
                  borderRadius:'var(--r-lg)', fontSize:12, fontWeight:700, cursor:'pointer',
                }}>
                ↻ Sincronizar
              </button>
              {['unidades','rutas','keywords','tabulador'].includes(tab) && (
                <button onClick={handleCreate} style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:'var(--primary)', color:'white',
                  border:'none', padding:'8px 16px', borderRadius:'var(--r-lg)',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                  boxShadow:'0 2px 8px rgba(15,23,42,.20)',
                }}>+ Crear</button>
              )}
            </div>
          </div>

          <div style={{ padding:'24px' }}>
            {tab === 'tabulador' && (
              <div style={{ marginBottom:24, display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{
                  border:'2px dashed var(--border-md)', borderRadius:'var(--r-xl)',
                  background:'var(--surface-2)', padding:'20px 22px',
                  display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
                  transition:'border-color .2s',
                }}>
                  <div style={{
                    width:44, height:44, borderRadius:'var(--r-lg)',
                    background:'var(--primary-muted)', border:'1px solid var(--primary-border)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
                  }}>📄</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-1)' }}>Importar Tabulador desde CSV</div>
                    <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:3 }}>Columnas: tipo, cruce, origen, destino, pago_operador, prioridad</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <button
                      onClick={() => {
                        const header = 'tipo,cruce,origen,destino,pago_operador,prioridad'
                        const example = 'LOCAL,,Ciudad A,Ciudad B,1500.00,1\nCRUCE,Puente Norte,Ciudad C,Ciudad D,2800.50,2'
                        const blob = new Blob([header + '\n' + example], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url; a.download = 'plantilla_tabulador.csv'
                        a.click(); URL.revokeObjectURL(url)
                      }}
                      style={{
                        display:'inline-flex', alignItems:'center', gap:7,
                        background:'var(--surface)', color:'var(--ink-2)',
                        border:'1px solid var(--border)', padding:'9px 16px',
                        borderRadius:'var(--r-lg)', fontSize:12, fontWeight:700, cursor:'pointer',
                        whiteSpace:'nowrap',
                      }}
                    >
                      ⬇ Descargar Plantilla
                    </button>
                    <label style={{
                      display:'inline-flex', alignItems:'center', gap:7,
                      background:'var(--blue)', color:'white',
                      padding:'9px 18px', borderRadius:'var(--r-lg)',
                      fontSize:12, fontWeight:700, cursor:'pointer',
                      boxShadow:'0 2px 8px rgba(59,130,246,.25)',
                      whiteSpace:'nowrap',
                    }}>
                      📤 Seleccionar CSV
                      <input type="file" accept=".csv" style={{ display:'none' }} onChange={e => {
                        const file = e.target.files[0]
                        if (!file) return
                        setTabUploadFile(file)
                        setTabUploadResult(null)
                        const reader = new FileReader()
                        reader.onload = ev => {
                          const lines = ev.target.result.split('\n').filter(l => l.trim())
                          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
                          const dataRows = lines.slice(1, 51).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')))
                          setTabCsvPreview({ headers, rows: dataRows, total: lines.length - 1, file })
                        }
                        reader.readAsText(file)
                      }} />
                    </label>
                  </div>
                </div>

                {tabUploadResult && (
                  <div style={{ padding: '12px 16px', borderRadius: 'var(--r-lg)', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 12, background: tabUploadResult.ok ? 'var(--emerald-bg)' : 'var(--red-bg)', color: tabUploadResult.ok ? 'oklch(38% 0.14 162)' : 'var(--red)', border: `1px solid ${tabUploadResult.ok ? 'var(--emerald-bd)' : 'oklch(87% .06 27)'}` }}>
                    <div style={{ marginTop: 2 }}>{tabUploadResult.ok ? '✓' : '✕'}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{tabUploadResult.mensaje || (tabUploadResult.ok ? 'Carga exitosa' : 'Error en carga')}</div>
                      {tabUploadResult.ok && (
                        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>✓ {tabUploadResult.filas_ok} filas importadas · {tabUploadResult.filas_rechazadas} rechazadas</div>
                      )}
                      {tabUploadResult.errores?.length > 0 && (
                        <ul style={{ fontSize: 11, marginTop: 8, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {tabUploadResult.errores.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                          {tabUploadResult.errores.length > 5 && <li style={{ opacity: 0.6 }}>...y {tabUploadResult.errores.length - 5} errores más</li>}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r-xl)', overflow:'hidden' }}>
                  <button onClick={() => setVerOpen(p=>!p)} style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'14px 18px', background:'var(--surface)', cursor:'pointer', border:'none',
                    transition:'background .15s', textAlign:'left',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{
                        width:36, height:36, borderRadius:'var(--r)',
                        background:'var(--blue-bg)', border:'1px solid var(--blue-bd)',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                      }}>📦</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-1)' }}>Versiones del Tabulador</div>
                        <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:1 }}>
                          {versiones.length} versiones · {versiones.reduce((s,v)=>s+Number(v.total),0).toLocaleString()} tarifas totales
                          {activeVersion && <span style={{ color:'var(--emerald)', fontWeight:700, marginLeft:8 }}>· v{activeVersion.version} activa</span>}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:'var(--ink-4)' }}>{verOpen ? '▲' : '▼'}</span>
                  </button>
                  {verOpen && (
                    <div style={{
                      padding:16, borderTop:'1px solid var(--border)',
                      background:'var(--bg)', display:'grid',
                      gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12,
                    }}>
                      {versiones.map(v => (
                        <VersionCard key={v.version} v={v} tabActivating={tabActivating}
                          onActivar={handleActivar} onDesactivar={handleDesactivar} onEliminar={handleEliminar} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--ink-4)', fontStyle:'italic', fontSize:14 }}>
                Sincronizando…
              </div>
            ) : (
              <AdminTable
                rows={rows} tab={tab}
                onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit}
              />
            )}
          </div>
        </div>
      </div>

      <AdminFormModal isOpen={modalOpen} onClose={()=>setModalOpen(false)}
        mode={modalMode} tab={tab} data={editRecord} loading={formLoading} onSave={handleSave} />

      {tabCsvPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(15,23,42,.60)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-2xl)', boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 900, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-lg)', background: 'var(--blue-bg)', border: '1px solid var(--blue-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📊</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-1)' }}>{tabCsvPreview.file?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{tabCsvPreview.total.toLocaleString()} registros detectados · mostrando primeros 50</div>
                </div>
              </div>
              <button onClick={() => { setTabCsvPreview(null); setTabUploadFile(null) }} style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--primary)', color: 'white' }}>
                  <tr>
                    {tabCsvPreview.headers.map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabCsvPreview.rows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '8px 14px', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Verifica que los datos sean correctos antes de importar.</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setTabCsvPreview(null); setTabUploadFile(null) }} style={{ padding: '9px 18px', borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button disabled={tabUploadLoading} onClick={async () => {
                  if (!tabUploadFile || tabUploadLoading) return
                  setTabUploadLoading(true)
                  setTabUploadResult(null)
                  try {
                    const result = await uploadTabulador(tabUploadFile)
                    setTabUploadResult({ ok: true, ...result })
                    setTabUploadFile(null)
                    setTabCsvPreview(null)
                    await loadData()
                  } catch (err) {
                    setTabUploadResult({ ok: false, mensaje: err.message })
                    setTabCsvPreview(null)
                  } finally {
                    setTabUploadLoading(false)
                  }
                }} style={{ padding: '9px 20px', borderRadius: 'var(--r-lg)', background: 'var(--blue)', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: tabUploadLoading ? 0.7 : 1 }}>
                  {tabUploadLoading ? 'Importando...' : '✓ Confirmar e Importar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
