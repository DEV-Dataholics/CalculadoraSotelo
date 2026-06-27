import React, { useState, useEffect } from 'react'
import { buildApiUrl } from '../api'

// ── SBadge ───────────────────────────────────────────────────────────────
function SBadge({ status }) {
  const cfg = {
    APPROVED:    { cls: 'sbadge sb-approved', dot: '#22c55e', label: 'Aprobada' },
    NEEDS_INPUT: { cls: 'sbadge sb-needs',    dot: '#f59e0b', label: 'Sin capturar' },
    PENDING:     { cls: 'sbadge sb-pending',  dot: '#94a3b8', label: 'Pendiente' },
  }
  const s = cfg[status] || cfg.PENDING
  return (
    <span className={s.cls}>
      <span className="sbadge-dot" style={{ background: s.dot }}></span>
      {s.label}
    </span>
  )
}

// ── PillToggle ────────────────────────────────────────────────────────────────
function PillToggle({ checked, onChange, label, amount }) {
  return (
    <div className={`bonus-pill ${checked ? 'active' : ''}`} onClick={() => onChange(!checked)}>
      <div>
        <div className="bonus-pill-lbl">{label}</div>
        {amount && <div className="bonus-pill-amt">{amount}</div>}
      </div>
      <div className={`pill-toggle ${checked ? 'on' : ''}`}>
        <div className="pill-toggle-thumb"></div>
      </div>
    </div>
  )
}

// ── StepperPill ───────────────────────────────────────────────────────────────
function StepperPill({ value, onChange, label, amount }) {
  return (
    <div className="bonus-pill">
      <div>
        <div className="bonus-pill-lbl">{label}</div>
        {amount && <div className="bonus-pill-amt">{amount}</div>}
      </div>
      <div className="stepper-inline">
        <button className="stepper-btn" onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, value - 1)) }}>−</button>
        <span className="stepper-num">{value}</span>
        <button className="stepper-btn" onClick={(e) => { e.stopPropagation(); onChange(value + 1) }}>+</button>
      </div>
    </div>
  )
}

// ── RouteStep ──────────────────────────────────────────────────────────────
function RouteStep({ row, index, total, isExpanded, onToggle, onFieldChange, dp, unitYield }) {
  const kms = parseFloat(row.Kms) || 0
  const diesel = parseFloat(row.Diesel_A_Favor) || 0
  const isLast = index === total - 1
  const cvpCls = row.CVP === 'C' ? 'cvp-c' : 'cvp-v'
  const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="route-step">
      <div className="step-spine">
        <div className={`step-dot ${isExpanded ? 'expanded-dot' : (kms > 0 ? 'active' : '')}`}></div>
        {!isLast && <div className="step-line"></div>}
      </div>

      <div className={`step-content ${isExpanded ? 'open' : ''}`} onClick={onToggle}>
        <div className="step-row">
          <div className="step-labels">
            <div className="step-factura">{row.Factura || 'N/A'}</div>
            <div className="step-route-text">
              <span>{row.Origen || '—'}</span>
              <span className="step-arrow">→</span>
              <span>{row.Destino || '—'}</span>
              {row.Km_Source === 'FALLBACK' && <span className="step-cruce-tag" style={{background: 'var(--amber-100)', color: 'var(--amber-700)'}}>⚠ KM Fallback</span>}
              {row.Cruce && <span className="step-cruce-tag">{row.Cruce}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {row.CVP && <span className={`step-cvp ${cvpCls}`}>{row.CVP === 'C' ? 'Cargado' : 'Vacío'}</span>}
            <span className="step-kms">{kms} km</span>
            <button className="step-expand-btn" onClick={(e) => { e.stopPropagation(); onToggle() }}>
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="step-detail" onClick={e => e.stopPropagation()}>
            <div className="sdf-group">
              <label className="sdf-label edit">KMS</label>
              <input className="sdf-input" type="number" value={row.Kms || ''} onChange={e => onFieldChange('Kms', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="sdf-group">
              <label className="sdf-label edit">Recarga</label>
              <input className="sdf-input amber" type="number" step="0.01" value={row.Recarga || ''} onChange={e => onFieldChange('Recarga', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="sdf-group">
              <label className="sdf-label edit">Peso Carga</label>
              <input className="sdf-input amber" type="number" value={row.Peso_Carga || ''} onChange={e => onFieldChange('Peso_Carga', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="sdf-group">
              <label className="sdf-label edit">Tipo</label>
              <select className="sdf-select" value={row.CVP || ''} onChange={e => onFieldChange('CVP', e.target.value)}>
                <option value="">—</option>
                <option value="C">C (Cargado)</option>
                <option value="V">V (Vacío)</option>
                <option value="PT">PT</option>
              </select>
            </div>
            <div className="sdf-group">
              <label className="sdf-label ro">Litros Pago</label>
              <div className="sdf-ro">{(parseFloat(row.Litros_A_Pago) || 0).toFixed(2)}</div>
            </div>
            <div className="sdf-group">
              <label className="sdf-label hi">Diésel Favor</label>
              <div className={`sdf-ro ${diesel >= 0 ? 'green' : 'red'}`}>{fmt(diesel)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── BoletaDetail (expandable content) ────────────────────────────────────────
function BoletaDetail({ trip, onUpdate, dieselPrice, unitYields, defaultYield }) {
  const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Universal states
  const [bonoQuimico, setBonoQuimico] = useState(trip.Manual_Bono_Quimico ?? false)

  // Pacifico states
  const [pacLoaded, setPacLoaded] = useState(trip.Manual_Pac_Loaded ?? true)
  const [bonoSierra, setBonoSierra] = useState(trip.Manual_Pac_Bono_Sierra ?? false)
  const [bonoDoble, setBonoDoble] = useState(trip.Manual_Pac_Bono_Doble ?? false)
  const [estObregon, setEstObregon] = useState(trip.Manual_Pac_Estancia_Obregon ?? 0)
  const [estMochis, setEstMochis] = useState(trip.Manual_Pac_Estancia_Mochis ?? 0)

  // Accordion state
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const dp = parseFloat(dieselPrice) || 24.5
  const unitYield = unitYields[trip.Unit] || defaultYield

  // Editable row data
  const [rowsData, setRowsData] = useState(() => {
    return (trip.Rows || []).map(row => ({
        Kms: row.Kms || 0,
        Recarga: row.Recarga || 0,
        Rendimiento: row.Rendimiento || 0,
        Peso_Carga: row.Peso_Carga || 0,
        CVP: row.CVP || '',
        Pago_Por_Km: row.Pago_Por_Km || 0,
        Litros_A_Pago: row.Litros_A_Pago || 0,
        Diesel_A_Favor: row.Diesel_A_Favor || 0,
        ...row
    }))
  })

  const calculateDependentFields = (rowData, allRows) => {
    const currentDieselPrice = dp
    const recarga = parseFloat(rowData.Recarga) || 0
    const totalKms = (allRows || rowsData).reduce((sum, r) => sum + (parseFloat(r.Kms) || 0), 0)
    const rendimientoReal = recarga > 0 ? (totalKms / recarga) : 0
    // Litros a pago depends on individual row distance or total? The old logic was totalKms / unitYield - recarga (wait, per row?)
    // Actually the old logic did:
    // const litrosAPago = unitYield > 0 ? (totalKms / unitYield) - recarga : 0
    // which applies the TOTAL distance to EACH row if recarga > 0? No, that was a bug or specific logic. We preserve it.
    const litrosAPago = unitYield > 0 ? (totalKms / unitYield) - recarga : 0
    const dieselAFavor = litrosAPago * currentDieselPrice

    return {
        Rendimiento: parseFloat(rendimientoReal.toFixed(2)),
        Litros_A_Pago: parseFloat(litrosAPago.toFixed(2)),
        Diesel_A_Favor: parseFloat(dieselAFavor.toFixed(2))
    }
  }

  useEffect(() => {
    const initialCalculations = rowsData.map(row => ({
        ...row,
        ...calculateDependentFields(row, rowsData)
    }))
    setRowsData(initialCalculations)
  }, [])

  const recalcAndNotify = (currentRowsData) => {
    const quimico = bonoQuimico ? 250 : 0
    let bonos = 0
    if (trip.Is_Pacifico) {
        if (bonoSierra) bonos += 500
        if (bonoDoble) bonos += 1726
        bonos += (parseInt(estObregon) || 0) * 600
        bonos += (parseInt(estMochis) || 0) * 300
    }

    const pagoCruceVal = parseFloat(trip.Pago_Cruce) || 0
    const incentivePay = quimico + bonos + pagoCruceVal
    const basePay = parseFloat(trip.Base_Pay) || 0
    const updatedRows = (trip.Rows || []).map((or, i) => ({ ...or, ...currentRowsData[i] }))

    onUpdate({
        ...trip,
        Rows: updatedRows,
        Incentive_Pay: parseFloat(incentivePay.toFixed(2)),
        Total_Pay: parseFloat((basePay + incentivePay).toFixed(2)),
    })
  }

  useEffect(() => {
    const newRowsData = rowsData.map(row => ({
        ...row,
        ...calculateDependentFields(row, rowsData)
    }))
    setRowsData(newRowsData)
    recalcAndNotify(newRowsData)
  }, [dieselPrice])

  useEffect(() => {
    recalcAndNotify(rowsData)
  }, [bonoQuimico, bonoSierra, bonoDoble, estObregon, estMochis, pacLoaded])

  const toggleRow = (index) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) newExpanded.delete(index)
    else newExpanded.add(index)
    setExpandedRows(newExpanded)
  }

  const handleRowFieldChange = (rowIndex, field, value) => {
    const newRowsData = [...rowsData]
    newRowsData[rowIndex] = { ...newRowsData[rowIndex], [field]: value }
    
    const updatedRows = newRowsData.map(row => ({
        ...row,
        ...calculateDependentFields(row, newRowsData)
    }))

    setRowsData(updatedRows)
    recalcAndNotify(updatedRows)
  }

  const toggleStatus = () => {
    const newStatus = trip.Status === 'APPROVED' ? 'PENDING' : 'APPROVED'
    onUpdate({ ...trip, Status: newStatus })
  }

  const handleSave = async () => {
    setSaving(true)
    const updatedRows = (trip.Rows || []).map((originalRow, i) => ({
        ...originalRow,
        ...rowsData[i]
    }))

    const payload = {
        ...trip,
        Rows: updatedRows,
        Manual_Bono_Quimico: bonoQuimico,
        Manual_Pac_Loaded: pacLoaded,
        Manual_Pac_Bono_Sierra: bonoSierra,
        Manual_Pac_Bono_Doble: bonoDoble,
        Manual_Pac_Estancia_Obregon: parseInt(estObregon) || 0,
        Manual_Pac_Estancia_Mochis: parseInt(estMochis) || 0,
        Status: 'PENDING'
    }
    try {
        const res = await fetch(buildApiUrl('/api/calculate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trips: [payload] })
        })
        const data = await res.json()
        if (data.trips && data.trips.length > 0) {
            const t = data.trips[0]
            onUpdate(t)
            // Sync local state from API response so displayed calculations stay correct
            setRowsData((t.Rows || []).map(r => ({ ...r })))
            setBonoQuimico(t.Manual_Bono_Quimico ?? false)
            setPacLoaded(t.Manual_Pac_Loaded ?? true)
            setBonoSierra(t.Manual_Pac_Bono_Sierra ?? false)
            setBonoDoble(t.Manual_Pac_Bono_Doble ?? false)
            setEstObregon(t.Manual_Pac_Estancia_Obregon ?? 0)
            setEstMochis(t.Manual_Pac_Estancia_Mochis ?? 0)
        }
    } catch (err) {
        alert('Error al guardar: ' + err.message)
    } finally {
        setSaving(false)
    }
  }

  const totalKmsBoleta = rowsData.reduce((sum, r) => sum + (parseFloat(r.Kms) || 0), 0)
  const totalRecarga = rowsData.reduce((sum, r) => sum + (parseFloat(r.Recarga) || 0), 0)
  const rendReal = totalRecarga > 0 ? (totalKmsBoleta / totalRecarga).toFixed(2) : '—'
  const litrosPago = unitYield > 0 ? (totalKmsBoleta / unitYield) - totalRecarga : 0
  const totalDiésel = litrosPago * dp

  const quimicoVal = bonoQuimico ? 250 : 0
  let pacificoBonosVal = 0
  if (trip.Is_Pacifico) {
      if (bonoSierra) pacificoBonosVal += 500
      if (bonoDoble) pacificoBonosVal += 1726
      pacificoBonosVal += (parseInt(estObregon) || 0) * 600
      pacificoBonosVal += (parseInt(estMochis) || 0) * 300
  }
  const pagoCruceVal = parseFloat(trip.Pago_Cruce) || 0
  const incentives = quimicoVal + pacificoBonosVal

  return (
    <div className="boleta-body">
      {/* Finance */}
      <div className="finance-section">
        <div className="finance-chips-row">
          <div className="fc fc-base">
            <span className="fc-lbl">Base</span>
            <span className="fc-val">{fmt(trip.Base_Pay)}</span>
          </div>
          <div className="fc fc-cruce">
            <span className="fc-lbl">Cruce</span>
            <span className="fc-val">+{fmt(pagoCruceVal)}</span>
          </div>
          <div className="fc fc-inc">
            <span className="fc-lbl">Incentivos</span>
            <span className="fc-val">+{fmt(incentives)}</span>
          </div>
          <div className="fc fc-total">
            <span className="fc-lbl">Total Boleta</span>
            <span className="fc-val">{fmt(trip.Total_Pay)}</span>
          </div>
        </div>

        <div className="kpi-strip">
          <div className="kpi-strip-item">
            <span className="kpi-strip-lbl">KMS Totales</span>
            <span className="kpi-strip-val">{totalKmsBoleta.toFixed(0)} km</span>
          </div>
          <div className="kpi-strip-item">
            <span className="kpi-strip-lbl">Rendimiento</span>
            <span className="kpi-strip-val copper">{rendReal} km/L</span>
          </div>
          <div className="kpi-strip-item">
            <span className="kpi-strip-lbl">Litros a Pago</span>
            <span className="kpi-strip-val">{litrosPago.toFixed(2)}</span>
          </div>
          <div className="kpi-strip-item">
            <span className="kpi-strip-lbl">Diésel Favor</span>
            <span className={`kpi-strip-val ${totalDiésel >= 0 ? 'green' : 'red'}`}>{fmt(totalDiésel)}</span>
          </div>
          <div className="kpi-strip-item">
            <span className="kpi-strip-lbl">Unidad</span>
            <span className="kpi-strip-val">U-{trip.Unit}</span>
          </div>
        </div>
      </div>

      {/* Bonuses */}
      <div className="bonuses-section">
        <div className="bonuses-label">Bonos & Incentivos Manuales</div>
        <div className="bonuses-pills">
          <PillToggle checked={bonoQuimico} onChange={setBonoQuimico} label="Químico" amount="+$250" />
          {trip.Is_Pacifico && (
            <>
              <PillToggle checked={bonoSierra} onChange={setBonoSierra} label="Sierra" amount="+$500" />
              <PillToggle checked={bonoDoble}  onChange={setBonoDoble} label="Doble"  amount="+$1,726" />
              <StepperPill value={estObregon} onChange={setEstObregon} label="Estancia Obregón" amount="+$600/cu" />
              <StepperPill value={estMochis} onChange={setEstMochis} label="Estancia Mochis"  amount="+$300/cu" />
            </>
          )}
        </div>
        {trip.Fuente_Tarifa === 'TABULADOR_BD' && (
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', borderRadius: 'var(--r)', fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
            📋 Tarifa desde Tabulador BD — {fmt(pagoCruceVal)}
          </div>
        )}
      </div>

      {/* Route Timeline */}
      {(trip.Rows || []).length > 0 && (
        <div className="trayectos-section">
          <div className="trayectos-head">
            <span className="trayectos-title">
              <span className="trayectos-icon">⇌</span>
              Desglose de Trayectos
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 20 }}>
              {trip.Rows.length} tramos
            </span>
          </div>
          <div className="route-timeline">
            {rowsData.map((row, i) => (
              <RouteStep
                key={i}
                row={row}
                index={i}
                total={rowsData.length}
                isExpanded={expandedRows.has(i)}
                onToggle={() => toggleRow(i)}
                onFieldChange={(field, val) => handleRowFieldChange(i, field, val)}
                dp={dp}
                unitYield={unitYield}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="boleta-actions">
        <div className="approve-row">
          <div className="approve-toggle-wrap" onClick={toggleStatus}>
            <div className={`pill-toggle ${trip.Status === 'APPROVED' ? 'on' : ''}`}>
              <div className="pill-toggle-thumb"></div>
            </div>
            <span className="approve-lbl">{trip.Status === 'APPROVED' ? 'Aprobada ✓' : 'Marcar como Aprobada'}</span>
          </div>
        </div>
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? '⏳ Guardando…' : '💾 Guardar y Recalcular'}
        </button>
      </div>
    </div>
  )
}

// ── BoletaCard (trigger + expandable) ────────────────────────────────────────
export default function BoletaCard({ trip, index, isOpen, onToggle, onUpdate, dieselPrice, unitYields, defaultYield }) {
  const needsCls  = trip.Status === 'NEEDS_INPUT' ? 'needs' : trip.Status === 'APPROVED' ? 'approved' : ''
  const openClass = isOpen ? 'open' : ''
  const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handleToggleApprove = (e) => {
    e.stopPropagation()
    const newStatus = trip.Status === 'APPROVED' ? 'PENDING' : 'APPROVED'
    onUpdate({ ...trip, Status: newStatus })
  }

  return (
    <div className="boleta-card">
      <div className={`boleta-trigger ${needsCls} ${openClass}`} onClick={onToggle} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onToggle()}>
        <span className="bt-num">{index + 1}</span>
        <div className="bt-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="bt-id">{trip.Boleta}</span>
            <span className="bt-route">{trip.Route}</span>
          </div>
          <div className="bt-meta">{trip.Start_Date} · U-{trip.Unit}</div>
        </div>
        <div className="bt-controls">
          <SBadge status={trip.Status} />
          <button
            className={`card-approve-btn ${trip.Status === 'APPROVED' ? 'on' : ''}`}
            onClick={handleToggleApprove}
            title={trip.Status === 'APPROVED' ? 'Quitar aprobación' : 'Aprobar boleta'}
          >
            {trip.Status === 'APPROVED' ? '✓' : '○'}
          </button>
          <span className="bt-total">{fmt(trip.Total_Pay)}</span>
          <span className="bt-chevron">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <BoletaDetail
          trip={trip}
          onUpdate={onUpdate}
          dieselPrice={dieselPrice}
          unitYields={unitYields}
          defaultYield={defaultYield}
        />
      )}
    </div>
  )
}
