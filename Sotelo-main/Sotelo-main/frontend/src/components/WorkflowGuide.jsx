import React, { useState } from 'react';

export default function WorkflowGuide({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-8 py-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <i className="fas fa-project-diagram text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">Guía de Flujo de Nómina</h2>
              <p className="text-sm text-slate-400 mt-1">Cómo funciona el procesamiento de viajes y cálculos</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-red-400 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="space-y-12 max-w-4xl mx-auto">

            {/* Step 1 */}
            <div className="relative">
              <div className="absolute left-6 top-10 bottom-[-3rem] w-0.5 bg-blue-200 hidden md:block"></div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-12 md:h-12 w-10 h-10 shrink-0 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30 z-10">
                  1
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Carga de Archivo Genesis</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    El proceso inicia al subir el archivo CSV generado por el sistema Genesis. El backend agrupa los registros por <strong>Operador</strong> y <strong>Boleta</strong>, generando "Piernas" (Legs) para cada trayecto.
                  </p>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                    <i className="fas fa-file-csv text-3xl text-emerald-500"></i>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">CSV Crudo</p>
                      <p className="text-xs text-slate-500">Múltiples filas por viaje (Ej: vacío, cargado, retornos).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute left-6 top-10 bottom-[-3rem] w-0.5 bg-blue-200 hidden md:block"></div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-12 md:h-12 w-10 h-10 shrink-0 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30 z-10">
                  2
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Lógica Base y Detección de Región</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Cada pierna de la boleta se evalúa para saber a qué región pertenece (Pacífico vs Foráneo).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-map-marker-alt text-blue-600"></i>
                        <span className="font-bold text-blue-900 text-sm">Rutas Pacífico</span>
                      </div>
                      <p className="text-xs text-blue-800">
                        Si una pierna pasa por la región Pacífico, activa automáticamente los bonos manuales específicos (Bono Sierra, Bono Doble, Estancias). La deducción de cruce (-40km) <strong>NO aplica</strong>.
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-truck text-amber-600"></i>
                        <span className="font-bold text-amber-900 text-sm">Rutas Foráneas</span>
                      </div>
                      <p className="text-xs text-amber-800">
                        Aplica deducción de cruce ELP (-40km) si se detecta. El pago base se calcula normalmente y no se muestran los toggles de Bonos Pacífico.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute left-6 top-10 bottom-[-3rem] w-0.5 bg-blue-200 hidden md:block"></div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-12 md:h-12 w-10 h-10 shrink-0 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30 z-10">
                  3
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Resolución de Tarifas y Kilometraje</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    El sistema intenta buscar la ruta en el <strong>Tabulador Maestro BD</strong>.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-start gap-3">
                      <i className="fas fa-check-circle text-emerald-500 mt-0.5"></i>
                      <span><strong>Con Tabulador:</strong> Usa la distancia oficial y el pago fijo definido en BD. Garantiza exactitud.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fas fa-exclamation-triangle text-amber-500 mt-0.5"></i>
                      <span><strong>Fallback a Odómetro:</strong> Si la ruta no existe en BD, el sistema usa los kilómetros brutos del CSV. Se mostrará una alerta visual <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold">⚠ KM</span> indicando que es un cálculo estimado.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-12 md:h-12 w-10 h-10 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/30 z-10">
                  4
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Cálculo de Pagos (UI)</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    La tarjeta de la boleta separa el pago en tres bloques principales para mayor claridad:
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Base Pay</p>
                      <p className="text-xs text-slate-600">Calculado por KMs o Tabulador fijo. No incluye diésel.</p>
                    </div>
                    <div className="flex items-center justify-center text-slate-400"><i className="fas fa-plus"></i></div>
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bonos Manuales</p>
                      <p className="text-xs text-slate-600">Bono Sierra, Químico, Doble. Se añaden al total.</p>
                    </div>
                    <div className="flex items-center justify-center text-slate-400"><i className="fas fa-equals"></i></div>
                    <div className="flex-1 bg-slate-900 text-white rounded-xl p-4 text-center shadow-lg">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pagable</p>
                      <p className="text-xs text-slate-300">Total a depositar. <br/>(Diésel a favor se muestra aparte).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 p-6 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
