import React, { useState } from 'react'

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function isoToday() {
  return new Date().toISOString().substring(0, 10)
}

function isoOffset(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().substring(0, 10)
}

function startOfWeek(offset = 0) {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1 + offset * 7)
  return d.toISOString().substring(0, 10)
}

export default function PeriodSelector({ availableDates, onSelect }) {
  const today = isoToday()
  const [from, setFrom] = useState(availableDates?.min || isoOffset(-13))
  const [to, setTo]     = useState(availableDates?.max || today)
  const [error, setError] = useState('')

  const handleSelect = () => {
    if (!from || !to) { setError('Selecciona ambas fechas.'); return }
    if (from > to) { setError('La fecha de inicio debe ser anterior al fin.'); return }
    setError('')
    onSelect({ from, to })
  }

  const applyPreset = (f, t) => { setFrom(f); setTo(t); setError('') }

  const PRESETS = [
    { label: 'Esta semana',      from: startOfWeek(0),   to: isoOffset(0) },
    { label: 'Semana pasada',    from: startOfWeek(-1),  to: isoOffset(-new Date().getDay() || -7) },
    { label: 'Últimos 14 días',  from: isoOffset(-13),   to: today },
    { label: 'Último mes',       from: isoOffset(-29),   to: today },
  ]

  return (
    <div className="period-screen">
      <div className="period-eyebrow">Módulo Operativo</div>
      <div className="period-heading">Seleccionar Período</div>
      <div className="period-sub">Elige el rango de fechas que deseas revisar y liquidar</div>

      {/* Date range card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-2xl)', padding: '28px 32px',
        width: '100%', maxWidth: 480, boxShadow: 'var(--sh-md)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-3)' }}>
              Desde
            </label>
            <input
              type="date"
              className="am-input"
              value={from}
              min={availableDates?.min}
              max={availableDates?.max || today}
              onChange={e => { setFrom(e.target.value); setError('') }}
              style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-3)' }}>
              Hasta
            </label>
            <input
              type="date"
              className="am-input"
              value={to}
              min={from || availableDates?.min}
              max={availableDates?.max || today}
              onChange={e => { setTo(e.target.value); setError('') }}
              style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Presets */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-3)', marginBottom: 8 }}>
            Acceso rápido
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p.from, p.to)} style={{
                padding: '5px 12px', borderRadius: 'var(--r-lg)',
                background: (from === p.from && to === p.to) ? 'var(--primary-muted)' : 'var(--bg-2)',
                color: (from === p.from && to === p.to) ? 'var(--primary)' : 'var(--ink-3)',
                border: `1px solid ${(from === p.from && to === p.to) ? 'var(--primary-border)' : 'var(--border)'}`,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {from && to && from <= to && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--r-lg)',
            background: 'var(--primary-muted)', border: '1px solid var(--primary-border)',
            fontSize: 13, color: 'var(--primary)', fontWeight: 600,
          }}>
            {fmtDate(from)} → {fmtDate(to)}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{error}</div>
        )}

        <button onClick={handleSelect} style={{
          padding: '12px 24px', borderRadius: 'var(--r-lg)',
          background: 'var(--primary)', color: 'white',
          border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(15,23,42,.22)', letterSpacing: '-.1px',
        }}>
          Ver nómina →
        </button>
      </div>
    </div>
  )
}
