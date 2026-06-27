import React, { useState, useEffect } from 'react'

export default function DuplicateWarningModal({ warnings, trips, onConfirm, onCancel }) {
  const [decisions, setDecisions] = useState({})
  
  useEffect(() => {
    // Default a 'IGNORAR' para proteger los datos
    const initialDecisions = {}
    warnings.forEach(w => {
      initialDecisions[w.driver] = 'IGNORAR'
    })
    setDecisions(initialDecisions)
  }, [warnings])

  const handleSelectAll = (action) => {
    const newDecisions = {}
    warnings.forEach(w => {
      newDecisions[w.driver] = action
    })
    setDecisions(newDecisions)
  }

  const handleConfirm = () => {
    // Filtrar los viajes según la decisión
    const ignoredDrivers = new Set(
      Object.keys(decisions).filter(d => decisions[d] === 'IGNORAR')
    )
    
    // Dejar solo los trips que no pertenezcan a conductores ignorados
    const filteredTrips = trips.filter(t => !ignoredDrivers.has(t.Driver))
    
    onConfirm(filteredTrips)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Duplicados Detectados</h3>
              <p className="text-sm text-slate-500">Ya existen liquidaciones para estos conductores en fechas similares.</p>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Seleccionar todos como:</span>
          <div className="flex gap-2">
            <button 
              onClick={() => handleSelectAll('SOBRESCRIBIR')}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sobrescribir Todos
            </button>
            <button 
              onClick={() => handleSelectAll('IGNORAR')}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Ignorar Todos
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800">{w.driver}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">{w.start_date}</span> al <span className="font-medium text-slate-700">{w.end_date}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    Estado actual: <span className="font-semibold text-amber-600">{w.estado}</span>
                  </p>
                </div>
                <div>
                  <select 
                    value={decisions[w.driver] || 'IGNORAR'} 
                    onChange={e => setDecisions({...decisions, [w.driver]: e.target.value})}
                    className="form-input text-sm font-medium pr-8"
                    style={{ 
                      borderColor: decisions[w.driver] === 'SOBRESCRIBIR' ? 'var(--primary)' : 'var(--slate-200)',
                      backgroundColor: decisions[w.driver] === 'SOBRESCRIBIR' ? 'var(--blue-50)' : 'white',
                      color: decisions[w.driver] === 'SOBRESCRIBIR' ? 'var(--primary-dark)' : 'var(--slate-700)'
                    }}
                  >
                    <option value="IGNORAR">Ignorar (Omitir)</option>
                    <option value="SOBRESCRIBIR">Continuar / Sobrescribir</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button 
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar Carga
          </button>
          <button 
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
          >
            Continuar con la Selección
          </button>
        </div>
      </div>
    </div>
  )
}
