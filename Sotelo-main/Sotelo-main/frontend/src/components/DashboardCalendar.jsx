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
    <div className="max-w-5xl mx-auto mt-10 p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">
            Nómina Semanal
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Selecciona un período para revisar detalles o calcula una nueva liquidación.</p>
        </div>
        <button 
          onClick={() => onUploadClick(null)}
          className="px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Nueva Liquidación
        </button>
      </div>

      <div className="flex items-center justify-between bg-white/60 p-2 rounded-2xl border border-slate-100 shadow-sm mb-8 w-max mx-auto backdrop-blur-sm">
        <button onClick={prevMonth} className="p-3 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 className="text-lg font-bold text-slate-700 capitalize px-8 min-w-[200px] text-center tracking-wide">
          {currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-3 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200">
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <i className="fas fa-spinner fa-spin text-2xl mb-3"></i>
          <p>Cargando estado del mes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
          {weeks.map((week, idx) => {
            const info = getWeekStatus(week)
            return (
              <div 
                key={idx} 
                onClick={() => handleWeekClick(info)}
                className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group 
                  ${info.status === 'EMPTY' ? 'bg-white hover:bg-slate-50/50 border-slate-100 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1' :
                    info.status === 'PENDING' ? 'bg-gradient-to-br from-white to-amber-50 border-amber-200 hover:shadow-xl hover:shadow-amber-100 hover:-translate-y-1' :
                    'bg-gradient-to-br from-white to-emerald-50 border-emerald-200 hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1'
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-colors ${
                      info.status === 'EMPTY' ? 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600' :
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
                      <h4 className="font-bold text-slate-800 text-lg">Semana del {week.label.split(' - ')[0]}</h4>
                      <p className="text-sm text-slate-500 font-medium">al {week.label.split(' - ')[1]}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-3 py-1 text-xs font-bold rounded-full ${
                    info.status === 'EMPTY' ? 'bg-slate-100 text-slate-500' :
                    info.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {info.status === 'EMPTY' && 'Sin Datos'}
                    {info.status === 'PENDING' && 'En Revisión'}
                    {info.status === 'CLOSED' && 'Cerrada'}
                  </div>
                </div>

                <div className="flex items-end justify-between mt-2 pt-4 border-t border-slate-100/60">
                  {info.liq ? (
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Neto a Pagar</div>
                      <div className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(info.liq.total_general)}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-slate-400 font-medium italic">Sube tu Excel para iniciar</div>
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    info.status === 'EMPTY' ? 'bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white' :
                    'bg-white shadow-sm text-slate-400 group-hover:bg-slate-900 group-hover:text-white'
                  }`}>
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
