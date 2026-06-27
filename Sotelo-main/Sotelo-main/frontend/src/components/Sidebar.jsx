import React from 'react';

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const initials = (name) => name ? name.substring(0, 2).toUpperCase() : 'DR';

export default function Sidebar({ grouped, selectedDriver, onSelectDriver, activeTab, onTabChange, search, onSearchChange, selectedWeek, tabCounts = {} }) {
  const counts = { ALL: 0, NEEDS_INPUT: 0, APPROVED: 0, ...tabCounts }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-head-top">
          <span className="sidebar-title">Conductores</span>
          <span className="week-badge-sm">Sem. {selectedWeek}</span>
        </div>
        <div className="sidebar-search">
          <span className="sidebar-search-icon">🔍</span>
          <input
            className="sidebar-search-input"
            type="text"
            placeholder="Buscar conductor…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-tabs">
        {[
          { id: 'ALL',         label: `Requiere Captura (${counts.ALL})`,         cls: '' },
          { id: 'NEEDS_INPUT', label: `Pendiente (${counts.NEEDS_INPUT})`,         cls: 't-needs' },
          { id: 'APPROVED',    label: `Aprobado (${counts.APPROVED})`,             cls: 't-ok' },
        ].map(({ id, label, cls }) => (
          <button
            key={id}
            className={`sidebar-tab ${activeTab === id ? `active ${cls}` : ''}`}
            onClick={() => onTabChange(id)}
          >{label}</button>
        ))}
      </div>

      <div className="sidebar-list">
        {grouped.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-4)', fontSize: 13 }}>
            Sin resultados
          </div>
        )}
        {grouped.map(([driverName, trips]) => {
          const total    = trips.reduce((s, t) => s + parseFloat(t.Total_Pay || 0), 0)
          const approved = trips.filter(t => t.Status === 'APPROVED').length
          const needs    = trips.filter(t => t.Status === 'NEEDS_INPUT').length
          const progress = trips.length > 0 ? (approved / trips.length) * 100 : 0
          const isSelected = selectedDriver === driverName
          const hasNeeds   = needs > 0

          return (
            <div
              key={driverName}
              className={`driver-row ${isSelected ? 'selected' : ''} ${hasNeeds ? 'has-needs' : ''}`}
              onClick={() => onSelectDriver(driverName)}
            >
              <div className="driver-avatar">{initials(driverName)}</div>
              <div className="driver-row-info">
                <div className="driver-row-name">{driverName}</div>
                <div className="driver-row-meta">
                  <span className="dr-badge dr-badge-boletas">{trips.length} boletas</span>
                  {needs > 0    && <span className="dr-badge dr-badge-needs">⚠ {needs}</span>}
                  {approved > 0 && <span className="dr-badge dr-badge-ok">✓ {approved}</span>}
                </div>
                <div className="driver-progress">
                  <div
                    className={`driver-progress-fill ${progress === 0 ? 'zero' : ''}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="driver-row-total">
                <span className="driver-row-total-val">{fmt(total)}</span>
                <span className="driver-row-total-label">total</span>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
