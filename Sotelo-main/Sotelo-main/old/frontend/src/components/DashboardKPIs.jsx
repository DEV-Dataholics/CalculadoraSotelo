import React, { useMemo } from 'react'

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function DashboardKPIs({ trips, dieselPrice, onDieselPriceChange }) {
  const stats = useMemo(() => {
    let totalPay = 0
    let dataErrorCount = 0

    trips.forEach(t => {
      totalPay += (t.Base_Pay || 0) + (t.Incentive_Pay || 0)
      if (t.Total_Kms_Paid === 0 || t.Total_Kms_Raw === 0) dataErrorCount++
    })

    return { totalPay, dataErrorCount }
  }, [trips])

  return (
    <div className="kpi-row">
      <div className="kpi-c">
        <div className="kpi-c-label">Nómina Total</div>
        <div className="kpi-c-value">{fmt(stats.totalPay)}</div>
        <div className="kpi-c-sub">{trips.length} viajes procesados</div>
        <hr className="kpi-c-divider" />
        <div className="diesel-lbl">Precio Diesel ($/L)</div>
        <input
          className="diesel-in"
          type="number"
          step="0.01"
          value={dieselPrice || ''}
          onChange={e => onDieselPriceChange(e.target.value)}
          placeholder="Ej. 24.50"
        />
        <div className="diesel-hint">Se aplica a todos los cálculos de diésel</div>
      </div>

      <div className={`kpi-c ${stats.dataErrorCount > 0 ? 'alert' : ''}`}>
        <div className="kpi-c-label">Aclaraciones de Datos</div>
        <div className="kpi-c-value">{stats.dataErrorCount}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>Viajes con 0 Kms detectados</div>
      </div>
    </div>
  )
}
