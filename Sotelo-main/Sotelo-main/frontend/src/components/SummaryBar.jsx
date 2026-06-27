import React from 'react'
import { exportToExcel } from '../utils/exportExcel'

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SummaryBar({ trips, selectedWeek }) {
  const t = trips.reduce((acc, trip) => {
    acc.base      += parseFloat(trip.Base_Pay     || 0)
    acc.cruce     += parseFloat(trip.Pago_Cruce   || 0)
    acc.incentive += parseFloat(trip.Incentive_Pay || 0)
    acc.total     += parseFloat(trip.Total_Pay    || 0)

    const rows = trip.Rows ?? []
    for (const row of rows) {
      const tipo  = (row.Tipo ?? '').toUpperCase()
      const cruce = row.Cruce ?? null
      if (cruce) acc.cruces++
      else if (/^(LOC|MDC)/.test(tipo)) acc.locales++
      else if (/^PTT/.test(tipo)) acc.ptt++
    }

    if (trip.Fuente_Tarifa === 'TABULADOR_BD') acc.conTabulador++
    return acc
  }, { base: 0, cruce: 0, incentive: 0, total: 0, cruces: 0, locales: 0, ptt: 0, conTabulador: 0 })

  return (
    <div className="sum-bar">
      <div className="sum-bar-inner">
        <div className="sum-metrics">
          <div className="sum-item">
            <div className="sum-lbl">Total Base</div>
            <div className="sum-val muted">{fmt(t.base)}</div>
          </div>
          <div className="sum-item">
            <div className="sum-lbl">Incentivos</div>
            <div className="sum-val copper">{fmt(t.incentive)}</div>
          </div>
          <div className="sum-divider"></div>
          <div className="sum-item">
            <div className="sum-lbl">Cruces</div>
            <div className="sum-val">{t.cruces}</div>
          </div>
          <div className="sum-item">
            <div className="sum-lbl">Locales</div>
            <div className="sum-val">{t.locales}</div>
          </div>
          <div className="sum-item">
            <div className="sum-lbl">PTT</div>
            <div className="sum-val muted">{t.ptt}</div>
          </div>
        </div>
        <div className="sum-right">
          <div>
            <div className="sum-total-lbl">Neto a Pagar</div>
            <div className="sum-total-val">{fmt(t.total)}</div>
          </div>
          <button className="export-btn" onClick={() => exportToExcel(trips, selectedWeek)}>
            📊 Exportar Excel
          </button>
        </div>
      </div>
    </div>
  )
}
