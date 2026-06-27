import { useEffect, useMemo, useState } from 'react'
import FileUpload from './components/FileUpload'
import TripList from './components/TripList'
import SummaryBar from './components/SummaryBar'
import PeriodSelector from './components/PeriodSelector'
import DashboardKPIs from './components/DashboardKPIs'
import AdminSection from './components/AdminSection'
import Sidebar from './components/Sidebar'
import { authFetch, fetchRendimientos } from './api'
import { useAuth } from './auth/AuthContext'
import LoginPage from './pages/LoginPage'

// ── Contenido principal (todos los hooks aquí, sin returns condicionales previos) ──
function AppContent() {
  const { user, logout, hasPermission } = useAuth()
  const isAdminView = window.location.pathname.startsWith('/admin')
  const canAccessAdmin = hasPermission('catalog.manage') || hasPermission('audit.view') || hasPermission('user.manage')

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [unitYields, setUnitYields] = useState({})
  const [defaultYield, setDefaultYield] = useState(2.37341)
  const [dateRange, setDateRange] = useState(null) // { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  const [activeTab, setActiveTab] = useState('ALL')
  const [dieselPrice, setDieselPrice] = useState(24.50)
  const [driverFilter, setDriverFilter] = useState('')
  const [selectedDriver, setSelectedDriver] = useState(null)

  useEffect(() => {
    fetchRendimientos()
      .then(catalogData => {
        setUnitYields(catalogData.rendimientos || {})
        setDefaultYield(catalogData.default_yield || 2.37341)
      })
      .catch(err => console.warn('No se pudo cargar catalogos:', err))
      .finally(() => setCatalogLoading(false))
  }, [])

  const availableDates = useMemo(() => {
    const dates = trips.map(t => (t.Start_Date || '').substring(0, 10)).filter(d => d && d !== 'Desconocido')
    if (dates.length === 0) return { min: null, max: null }
    return { min: dates.reduce((a, b) => a < b ? a : b), max: dates.reduce((a, b) => a > b ? a : b) }
  }, [trips])

  const handleFileUpload = async (file) => {
    setLoading(true)
    setDateRange(null)
    setActiveTab('ALL')
    setDriverFilter('')
    setSelectedDriver(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await authFetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!data.trips || data.trips.length === 0) {
        alert(data.detail || 'Advertencia: El backend devolvió 0 viajes.')
        return
      }
      setTrips(data.trips)
    } catch (err) {
      alert('Error al subir el archivo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculate = (updatedTrips) => {
    setTrips(prev => {
      const updatedIds = new Set(updatedTrips.map(t => t.id))
      return prev.map(t => updatedIds.has(t.id) ? updatedTrips.find(ut => ut.id === t.id) : t)
    })
  }

  const inRange = (trip) => {
    if (!dateRange) return false
    const d = (trip.Start_Date || '').substring(0, 10)
    return d >= dateRange.from && d <= dateRange.to
  }

  const groupedTrips = useMemo(() => {
    const map = new Map()
    trips.filter(inRange).forEach(t => {
      const d = t.Driver || 'Sin Nombre'
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(t)
    })
    let entries = Array.from(map.entries())
    if (activeTab === 'ALL')         entries = entries.filter(([, ts]) => ts.some(t => t.Status === 'NEEDS_INPUT'))
    if (activeTab === 'NEEDS_INPUT') entries = entries.filter(([, ts]) => ts.some(t => t.Status === 'PENDING'))
    if (activeTab === 'APPROVED')    entries = entries.filter(([, ts]) => ts.some(t => t.Status === 'APPROVED'))
    if (driverFilter) entries = entries.filter(([d]) => d.toLowerCase().includes(driverFilter.toLowerCase()))
    return entries.sort((a, b) => a[0].localeCompare(b[0]))
  }, [trips, dateRange, activeTab, driverFilter])

  const tabCounts = useMemo(() => {
    const weekTrips = trips.filter(inRange)
    return {
      ALL:         weekTrips.filter(t => t.Status === 'NEEDS_INPUT').length,
      NEEDS_INPUT: weekTrips.filter(t => t.Status === 'PENDING').length,
      APPROVED:    weekTrips.filter(t => t.Status === 'APPROVED').length,
    }
  }, [trips, dateRange])

  useEffect(() => {
    if (selectedDriver && !groupedTrips.some(([d]) => d === selectedDriver)) {
      setSelectedDriver(null)
    }
  }, [groupedTrips, selectedDriver])

  const currentDriverTrips = useMemo(() => {
    if (!selectedDriver) return []
    let driverTrips = trips.filter(t => inRange(t) && (t.Driver || 'Sin Nombre') === selectedDriver)
    if (activeTab === 'ALL')         driverTrips = driverTrips.filter(t => t.Status === 'NEEDS_INPUT')
    if (activeTab === 'NEEDS_INPUT') driverTrips = driverTrips.filter(t => t.Status === 'PENDING')
    if (activeTab === 'APPROVED')    driverTrips = driverTrips.filter(t => t.Status === 'APPROVED')
    return driverTrips
  }, [trips, dateRange, selectedDriver, activeTab])

  if (isAdminView) {
    if (!canAccessAdmin) return (
      <div className="fullscreen-center" style={{ flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>Acceso restringido</div>
        <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>No tienes permisos para acceder al panel de administración.</div>
        <a href="/" style={{ marginTop: 8, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>← Volver al módulo operativo</a>
      </div>
    )
    return <AdminSection />
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-wordmark">Sotelo <em>Nómina</em></div>
        <div className="topbar-sep"></div>
        <span className="topbar-tag">v1.1 · Control Financiero</span>
        <div className="topbar-spacer"></div>

        {dateRange && (
          <div className="week-pill">
            <span className="week-pill-label">Período</span>
            {dateRange.from} → {dateRange.to}
            <button className="week-pill-change" onClick={() => setDateRange(null)}>Cambiar</button>
          </div>
        )}

        <nav className="topbar-nav">
          {canAccessAdmin && <a href="/admin" className="topbar-nav-link">Administración</a>}
          <span className="topbar-user">{user?.email}</span>
          <button className="topbar-logout" onClick={logout}>Salir</button>
        </nav>
      </header>

      {trips.length === 0 ? (
        <div className="fullscreen-center">
          <FileUpload onUpload={handleFileUpload} loading={loading} />
        </div>
      ) : !dateRange ? (
        <div className="fullscreen-center">
          <PeriodSelector availableDates={availableDates} onSelect={setDateRange} />
        </div>
      ) : (
        <div className="app-shell">
          <Sidebar
            grouped={groupedTrips}
            selectedDriver={selectedDriver}
            onSelectDriver={setSelectedDriver}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            search={driverFilter}
            onSearchChange={setDriverFilter}
            selectedWeek={dateRange ? `${dateRange.from} → ${dateRange.to}` : ''}
            tabCounts={tabCounts}
          />
          <div className="detail-panel">
            {!selectedDriver ? (
              <div className="empty-detail">
                <div className="empty-detail-icon">👈</div>
                <div className="empty-detail-text">Selecciona un conductor para ver sus boletas</div>
              </div>
            ) : (
              <>
                <DashboardKPIs
                  trips={currentDriverTrips}
                  dieselPrice={dieselPrice}
                  onDieselPriceChange={setDieselPrice}
                />
                <TripList
                  driverName={selectedDriver}
                  trips={currentDriverTrips}
                  onUpdate={handleRecalculate}
                  dieselPrice={dieselPrice}
                  unitYields={unitYields}
                  defaultYield={defaultYield}
                />
              </>
            )}
          </div>
        </div>
      )}

      {catalogLoading && <div className="catalog-loading-toast">Cargando catalogos...</div>}

      {dateRange && trips.length > 0 && (() => {
        const rangeTrips = trips.filter(inRange)
        const statusMap = { ALL: 'NEEDS_INPUT', NEEDS_INPUT: 'PENDING', APPROVED: 'APPROVED' }
        return <SummaryBar trips={rangeTrips.filter(t => t.Status === statusMap[activeTab])} selectedWeek={`${dateRange.from} → ${dateRange.to}`} />
      })()}
    </>
  )
}

// ── Shell de autenticación (pocos hooks, returns condicionales seguros aquí) ──
function App() {
  const { ready, user } = useAuth()

  useEffect(() => {
    const handler = () => window.location.reload()
    window.addEventListener('sotelo:logout', handler)
    return () => window.removeEventListener('sotelo:logout', handler)
  }, [])

  if (!ready) return <div className="fullscreen-center"><span style={{ color: 'var(--ink-3)' }}>Cargando…</span></div>
  if (!user)  return <LoginPage />
  return <AppContent />
}

export default App
