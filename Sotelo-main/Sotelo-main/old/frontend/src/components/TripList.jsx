import React, { useState } from 'react'
import BoletaCard from './BoletaCard'
import TripCard from './TripCard'

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const initials = (name) => name ? name.substring(0, 2).toUpperCase() : 'DR';

export default function TripList({ driverName, trips, onUpdate, dieselPrice, unitYields, defaultYield }) {
  const [openBoleta, setOpenBoleta] = useState(null)

  const handleUpdate = (updated) => onUpdate([updated])

  const totals = trips.reduce((acc, t) => {
    acc.base      += parseFloat(t.Base_Pay || 0)
    acc.incentivos += parseFloat(t.Incentive_Pay || 0)
    acc.cruce     += parseFloat(t.Pago_Cruce || 0)
    acc.total     += parseFloat(t.Total_Pay || 0)
    return acc
  }, { base: 0, incentivos: 0, cruce: 0, total: 0 })

  const statusCounts = {
    approved:   trips.filter(t => t.Status === 'APPROVED').length,
    needsInput: trips.filter(t => t.Status === 'NEEDS_INPUT').length,
    pending:    trips.filter(t => t.Status === 'PENDING').length,
  }

  return (
    <>
      <div className="driver-hero">
        <div className="driver-hero-top">
          <div className="driver-hero-identity">
            <div className="driver-hero-avatar">{initials(driverName)}</div>
            <div>
              <div className="driver-hero-name">{driverName}</div>
              <div className="driver-hero-badges">
                <span className="hero-badge hero-badge-default">
                  {trips.length} {trips.length === 1 ? 'boleta' : 'boletas'}
                </span>
                {statusCounts.needsInput > 0 && (
                  <span className="hero-badge hero-badge-needs">⚠ {statusCounts.needsInput} sin capturar</span>
                )}
                {statusCounts.approved > 0 && (
                  <span className="hero-badge hero-badge-ok">✓ {statusCounts.approved} aprobadas</span>
                )}
                {statusCounts.pending > 0 && (
                  <span className="hero-badge hero-badge-default">{statusCounts.pending} pendientes</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="driver-hero-financials">
          <div className="hero-fin-item">
            <div className="hero-fin-label">Base</div>
            <div className="hero-fin-val muted">{fmt(totals.base)}</div>
          </div>
          <div className="hero-fin-item">
            <div className="hero-fin-label">Cruce</div>
            <div className="hero-fin-val muted">{fmt(totals.cruce)}</div>
          </div>
          <div className="hero-fin-item">
            <div className="hero-fin-label">Incentivos</div>
            <div className="hero-fin-val accent">{fmt(totals.incentivos)}</div>
          </div>
          <div className="hero-fin-total">
            <div className="hero-fin-label">Total del Período</div>
            <div className="hero-fin-val">{fmt(totals.total)}</div>
          </div>
        </div>
      </div>

      <div className="boleta-stack">
        {trips.map((trip, i) => {
          if (trip.source_type === 'GENESIS_BOLETA') {
            return (
              <BoletaCard
                key={trip.id}
                trip={trip}
                index={i}
                isOpen={openBoleta === trip.id}
                onToggle={() => setOpenBoleta(prev => prev === trip.id ? null : trip.id)}
                onUpdate={handleUpdate}
                dieselPrice={dieselPrice}
                unitYields={unitYields}
                defaultYield={defaultYield}
              />
            )
          } else {
            return (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onUpdate={handleUpdate} 
                dieselPrice={dieselPrice} 
              />
            )
          }
        })}
      </div>
    </>
  )
}
