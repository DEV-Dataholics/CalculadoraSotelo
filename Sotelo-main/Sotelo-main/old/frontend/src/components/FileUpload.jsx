import React, { useState, useRef } from 'react'

export default function FileUpload({ onUpload, loading }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef()

  return (
    <div
      className={`upload-card ${drag ? 'over' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { 
        e.preventDefault()
        setDrag(false)
        const f = e.dataTransfer.files[0]
        if (f) onUpload(f) 
      }}
      onClick={() => ref.current.click()}
    >
      <div className="upload-icon-wrap">📂</div>
      <div className="upload-title">Sube el Excel de Génesis</div>
      <div className="upload-sub">Arrastra el archivo aquí o haz clic para buscar</div>
      <div className="upload-cta">{loading ? '⏳ Procesando…' : '📁 Seleccionar Archivo'}</div>
      <div className="upload-hint">.xlsx · .xls — Movimientos Génesis con Boleta</div>
      <input 
        ref={ref} 
        type="file" 
        accept=".xlsx,.xls,.csv" 
        style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onUpload(e.target.files[0])} 
      />
    </div>
  )
}
