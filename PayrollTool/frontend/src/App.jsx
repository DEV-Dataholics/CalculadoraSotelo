import { useState } from 'react'
import FileUpload from './components/FileUpload'
import TripList from './components/TripList'
import SummaryBar from './components/SummaryBar'
import PeriodSelector from './components/PeriodSelector'
import DashboardKPIs from './components/DashboardKPIs'
import { buildApiUrl } from './api'

function App() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [activeTab, setActiveTab] = useState('PENDING') // 'NEEDS_INPUT' | 'PENDING' | 'APPROVED'

  // Derive available weeks from trips
  const availableWeeks = [...new Set(trips.map(t => t.Payroll_Week || 0))].filter(w => w > 0)

  // Filter trips based on selection
  const visibleTrips = selectedWeek
    ? (selectedWeek === 'ALL' ? trips : trips.filter(t => t.Payroll_Week === selectedWeek && t.Status === activeTab))
    : []

  const handleFileUpload = async (file) => {
    setLoading(true)
    setSelectedWeek(null) // Reset selection on new upload
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(buildApiUrl('/api/upload'), {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      // console.log("DEBUG: API Response:", data)
      if (!data.trips || data.trips.length === 0) {
        alert("Warning: Backend returned 0 trips. Ensure file has valid data.")
      }
      setTrips(data.trips)
    } catch (err) {
      alert("Error uploading file: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculate = async (updatedTrips) => {
    // Optimistic update
    // If a trip changed status, it might disappear from current view - handle gracefully
    // Merge updated trips into main state
    const updatedIds = new Set(updatedTrips.map(t => t.id))
    const newTrips = trips.map(t => updatedIds.has(t.id) ? updatedTrips.find(ut => ut.id === t.id) : t)
    setTrips(newTrips)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">Dataholics <span className="text-blue-400">Payroll Tool</span></h1>
          <div className="text-xs text-slate-400">
            v1.1 (Finance Control)
            {selectedWeek && <span className="ml-2 bg-blue-900 px-2 py-1 rounded text-blue-200">Week {selectedWeek}</span>}
            {selectedWeek && (
              <button onClick={() => setSelectedWeek(null)} className="ml-2 hover:text-white underline">
                Change
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-32">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <FileUpload onUpload={handleFileUpload} loading={loading} />
          </div>
        ) : !selectedWeek ? (
          <PeriodSelector weeks={availableWeeks} onSelect={setSelectedWeek} />
        ) : (
          <>
            <DashboardKPIs trips={trips.filter(t => t.Payroll_Week === selectedWeek)} />

            {/* Status Tabs */}
            <div className="flex space-x-1 mb-6 bg-slate-200 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('NEEDS_INPUT')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'NEEDS_INPUT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Incomplete ({trips.filter(t => t.Payroll_Week === selectedWeek && t.Status === 'NEEDS_INPUT').length})
              </button>
              <button
                onClick={() => setActiveTab('PENDING')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Pending Review ({trips.filter(t => t.Payroll_Week === selectedWeek && t.Status === 'PENDING').length})
              </button>
              <button
                onClick={() => setActiveTab('APPROVED')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'APPROVED' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Approved ({trips.filter(t => t.Payroll_Week === selectedWeek && t.Status === 'APPROVED').length})
              </button>
            </div>

            <TripList trips={visibleTrips} onUpdate={handleRecalculate} />
          </>
        )}
      </main>

      {selectedWeek && visibleTrips.length > 0 && <SummaryBar trips={visibleTrips} />}
    </div >
  )
}

export default App
