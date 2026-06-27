import React from 'react'

export default function PeriodSelector({ weeks, onSelect }) {
  return (
    <div className="period-screen">
      <div className="period-eyebrow">Módulo Operativo</div>
      <div className="period-heading">Seleccionar Semana</div>
      <div className="period-sub">Elige el período de nómina que deseas revisar y capturar</div>
      <div className="period-cards">
        {weeks.map(w => (
          <div key={w} className="period-card-item" onClick={() => onSelect(w)}>
            <div className="period-week-label">Semana</div>
            <div className="period-week-num">{w}</div>
            <div className="period-week-sub">Payroll Week</div>
          </div>
        ))}
      </div>
    </div>
  )
}
