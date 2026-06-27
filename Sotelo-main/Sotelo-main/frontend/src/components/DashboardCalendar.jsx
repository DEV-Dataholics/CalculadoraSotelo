import React, { useState, useEffect } from 'react'
import { fetchLiquidacionesSummary } from '../api'

export default function DashboardCalendar({ onSelectWeek, onUploadClick }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [liquidaciones, setLiquidaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      setLoading(true)
      const data = await fetchLiquidacionesSummary()
      setLiquidaciones(data.liquidaciones || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Helpers para generar las semanas del mes
  const getWeeksOfMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1)
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0)
    
    // Retroceder al lunes anterior o actual (0 es domingo, queremos que la semana empiece en lunes)
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    const startDate = new Date(year, month, 1 - startOffset)
    
    const weeks = []
    let currentWeekStart = new Date(startDate)
    
    while (currentWeekStart <= lastDay) {
      const currentWeekEnd = new Date(currentWeekStart)
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(currentWeekEnd),
        label: `${currentWeekStart.toLocaleDateString('es-MX', {day:'numeric', month:'short'})} - ${currentWeekEnd.toLocaleDateString('es-MX', {day:'numeric', month:'short'})}`,
        startStr: currentWeekStart.toISOString().split('T')[0],
        endStr: currentWeekEnd.toISOString().split('T')[0]
      })
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    }
    
    return weeks
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const weeks = getWeeksOfMonth(currentDate)
  
  const getWeekStatus = (week) => {
    // Buscar si hay una liquidacion que coincida con esta semana aprox
    // La logica es que se solapen al menos 3 dias o simplemente buscar por start_date
    const match = liquidaciones.find(liq => {
      return liq.start_date >= week.startStr && liq.start_date <= week.endStr
    })
    
    if (!match) return { status: 'EMPTY', color: 'bg-white', border: 'border-slate-200', liq: null }
    
    if (match.estado === 'PENDIENTE') {
      return { status: 'PENDING', color: 'bg-amber-50', border: 'border-amber-300', liq: match }
    }
    
    return { status: 'CLOSED', color: 'bg-emerald-50', border: 'border-emerald-300', liq: match }
  }

  const handleWeekClick = (weekInfo) => {
    if (weekInfo.status === 'EMPTY') {
      onUploadClick(weekInfo)
    } else {
      onSelectWeek(weekInfo.liq)
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0)
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendario de Liquidaciones</h2>
          <p className="text-slate-500 mt-1">Selecciona una semana para revisar o subir nueva nómina</p>
        </div>
        <button 
          onClick={() => onUploadClick(null)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-upload"></i> Subir Archivo Manual
        </button>
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
        <button onClick={prevMonth} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 className="text-lg font-bold text-slate-700 capitalize">
          {currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <i className="fas fa-spinner fa-spin text-2xl mb-3"></i>
          <p>Cargando estado del mes...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map((week, idx) => {
            const info = getWeekStatus(week)
            return (
              <div 
                key={idx} 
                onClick={() => handleWeekClick(info)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${info.color} ${info.border} hover:shadow-md`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-sm ${
                    info.status === 'EMPTY' ? 'bg-white text-slate-300' :
                    info.status === 'PENDING' ? 'bg-amber-100 text-amber-500' :
                    'bg-emerald-100 text-emerald-500'
                  }`}>
                    <i className={`fas ${
                      info.status === 'EMPTY' ? 'fa-calendar-plus' :
                      info.status === 'PENDING' ? 'fa-clock' :
                      'fa-check-circle'
                    }`}></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Semana del {week.label}</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      {info.status === 'EMPTY' && 'Sin información cargada'}
                      {info.status === 'PENDING' && <span className="text-amber-600">Revisión Pendiente</span>}
                      {info.status === 'CLOSED' && <span className="text-emerald-600">Nómina Cerrada</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {info.liq && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-800">{formatCurrency(info.liq.total_general)}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Neto</div>
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-slate-800 group-hover:bg-slate-200 transition-colors border border-slate-200">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
