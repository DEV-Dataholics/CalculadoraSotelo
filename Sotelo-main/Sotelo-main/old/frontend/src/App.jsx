import { useEffect, useMemo, useState } from 'react'
import FileUpload from './components/FileUpload'
import TripList from './components/TripList'
import SummaryBar from './components/SummaryBar'
import PeriodSelector from './components/PeriodSelector'
import DashboardKPIs from './components/DashboardKPIs'
import AdminSection from './components/AdminSection'
import Sidebar from './components/Sidebar'
import { buildApiUrl, fetchRendimientos } from './api'

function App() {
  const isAdminView = window.location.pathname.startsWith('/admin')

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [unitYields, setUnitYields] = useState({})
  const [defaultYield, setDefaultYield] = useState(2.37341)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'NEEDS_INPUT' | 'APPROVED'
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

  // Derive available weeks from trips
  const availableWeeks = useMemo(() => [...new Set(trips.map(t => t.Payroll_Week || 0))].filter(w => w > 0), [trips])

  const handleFileUpload = async (file) => {
    setLoading(true)
    setSelectedWeek(null) // Reset selection on new upload
    setActiveTab('ALL')
    setDriverFilter('')
    setSelectedDriver(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(buildApiUrl('/api/upload'), {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!data.trips || data.trips.length === 0) {
        alert(data.detail || "Advertencia: El backend devolvió 0 viajes. Asegúrese de que el archivo tenga datos válidos.");
        setLoading(false);
        return;
      }
      setTrips(data.trips)
    } catch (err) {
      alert("Error al subir el archivo: " + err.message)
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

  const groupedTrips = useMemo(() => {
    const map = new Map()
    trips.filter(t => t.Payroll_Week === selectedWeek).forEach(t => {
      const d = t.Driver || 'Sin Nombre'
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(t)
    })

    let entries = Array.from(map.entries())
    // Cada pestaña es exclusiva por status
    if (activeTab === 'ALL')         entries = entries.filter(([, ts]) => ts.some(t => t.Status === 'NEEDS_INPUT'))
    if (activeTab === 'NEEDS_INPUT') entries = entries.filter(([, ts]) => ts.some(t => t.Status === 'PENDING'))
    if (activeTab === 'APPROVED')   entries = entries.filter(([, ts]) => ts.some(t => t.Status === 'APPROVED'))
    if (driverFilter) entries = entries.filter(([d]) => d.toLowerCase().includes(driverFilter.toLowerCase()))

    return entries.sort((a,b) => a[0].localeCompare(b[0]))
  }, [trips, selectedWeek, activeTab, driverFilter])

  // Conteos por pestaña (sin filtro de pestaña activa ni búsqueda)
  const tabCounts = useMemo(() => {
    const weekTrips = trips.filter(t => t.Payroll_Week === selectedWeek)
    const map = new Map()
    weekTrips.forEach(t => {
      const d = t.Driver || 'Sin Nombre'
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(t)
    })
    const allEntries = Array.from(map.entries())
    return {
      ALL:         weekTrips.filter(t => t.Status === 'NEEDS_INPUT').length,
      NEEDS_INPUT: weekTrips.filter(t => t.Status === 'PENDING').length,
      APPROVED:    weekTrips.filter(t => t.Status === 'APPROVED').length,
    }
  }, [trips, selectedWeek])

  // Clear selected driver when they're no longer visible in the current tab filter
  useEffect(() => {
    if (selectedDriver && !groupedTrips.some(([d]) => d === selectedDriver)) {
      setSelectedDriver(null)
    }
  }, [groupedTrips, selectedDriver])

  // Get current driver's trips, filtered by active tab
  const currentDriverTrips = useMemo(() => {
    if (!selectedDriver) return []
    let driverTrips = trips.filter(t => t.Payroll_Week === selectedWeek && (t.Driver || 'Sin Nombre') === selectedDriver)
    if (activeTab === 'ALL')         driverTrips = driverTrips.filter(t => t.Status === 'NEEDS_INPUT')
    if (activeTab === 'NEEDS_INPUT') driverTrips = driverTrips.filter(t => t.Status === 'PENDING')
    if (activeTab === 'APPROVED')   driverTrips = driverTrips.filter(t => t.Status === 'APPROVED')
    return driverTrips
  }, [trips, selectedWeek, selectedDriver, activeTab])

  if (isAdminView) {
    return <AdminSection />
  }

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-wordmark">Sotelo <em>Nómina</em></div>
        <div className="topbar-sep"></div>
        <span className="topbar-tag">v1.1 · Control Financiero</span>
        <div className="topbar-spacer"></div>

        {selectedWeek && (
          <div className="week-pill">
            <span className="week-pill-label">Semana</span>
            {selectedWeek}
            <button className="week-pill-change" onClick={() => setSelectedWeek(null)}>Cambiar</button>
          </div>
        )}

        <nav className="topbar-nav">
          <a href="/admin" className="topbar-nav-link">Administración</a>
        </nav>
      </header>

      {trips.length === 0 ? (
        <div className="fullscreen-center">
          <FileUpload onUpload={handleFileUpload} loading={loading} />
        </div>
      ) : !selectedWeek ? (
        <div className="fullscreen-center">
          <PeriodSelector weeks={availableWeeks} onSelect={setSelectedWeek} />
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
            selectedWeek={selectedWeek}
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

      {catalogLoading && (
        <div className="catalog-loading-toast">
          Cargando catalogos...
        </div>
      )}

      {selectedWeek && trips.length > 0 && (() => {
        const weekTrips = trips.filter(t => t.Payroll_Week === selectedWeek)
        const statusMap = { ALL: 'NEEDS_INPUT', NEEDS_INPUT: 'PENDING', APPROVED: 'APPROVED' }
        const filteredTrips = weekTrips.filter(t => t.Status === statusMap[activeTab])
        return (
          <SummaryBar
            trips={filteredTrips}
            selectedWeek={selectedWeek}
          />
        )
      })()}
    </>
  )
}

export default App
