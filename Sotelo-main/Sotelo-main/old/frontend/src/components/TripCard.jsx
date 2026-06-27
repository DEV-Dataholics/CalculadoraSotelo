import React, { useState, useEffect } from 'react'
import { buildApiUrl } from '../api'

// Compact iOS-style Toggle Switch
const ToggleSwitch = ({ checked, onChange, label, amountLabel }) => (
    <label className="flex items-center justify-between cursor-pointer group bg-white border border-slate-200 px-3 py-2 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{label}</span>
            {amountLabel && <span className="text-[10px] font-semibold text-emerald-600">{amountLabel}</span>}
        </div>
        <div className="relative ml-2">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="peer sr-only" />
            <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-focus:ring-1 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
        </div>
    </label>
);

// Compact Stepper Component
const Stepper = ({ value, onChange, label, amountLabel }) => (
    <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">{label}</span>
            {amountLabel && <span className="text-[10px] font-semibold text-emerald-600">{amountLabel}</span>}
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded p-0.5 ml-2">
            <button onClick={() => onChange(Math.max(0, value - 1))} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"><i className="fas fa-minus text-[8px]"></i></button>
            <span className="w-6 text-center text-xs font-bold text-slate-900">{value}</span>
            <button onClick={() => onChange(value + 1)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"><i className="fas fa-plus text-[8px]"></i></button>
        </div>
    </div>
);

export default function TripCard({ trip, onUpdate, dieselPrice }) {
    const [liters, setLiters] = useState(trip.Manual_Refuel_Liters || '')
    const [priceInput, setPriceInput] = useState(trip.Manual_Actual_Price_Per_Liter || '')
    const [bonoQuimico, setBonoQuimico] = useState(trip.Manual_Bono_Quimico ?? false)
    const [showLegs, setShowLegs] = useState(false)

    // Pacifico states
    const [pacLoaded, setPacLoaded] = useState(trip.Manual_Pac_Loaded ?? true)
    const [bonoSierra, setBonoSierra] = useState(trip.Manual_Pac_Bono_Sierra ?? false)
    const [bonoDoble, setBonoDoble] = useState(trip.Manual_Pac_Bono_Doble ?? false)
    const [estObregon, setEstObregon] = useState(trip.Manual_Pac_Estancia_Obregon ?? 0)
    const [estMochis, setEstMochis] = useState(trip.Manual_Pac_Estancia_Mochis ?? 0)

    const calc = (inLiters, inPrice, inQuimico) => {
        const allowed = trip.Allowed_Liters
        const actual = parseFloat(inLiters) || 0
        const savings = allowed - actual

        // Use manual price if set, otherwise global dieselPrice, otherwise trip's original Diesel_Rate
        const price = parseFloat(inPrice) > 0 ? parseFloat(inPrice) : (parseFloat(dieselPrice) || trip.Diesel_Rate)
        const incentive = savings * price

        let extras = 0
        if (inQuimico) extras += 250

        const total = trip.Base_Pay + incentive + extras
        return { savings, incentive, total }
    }

    const { incentive } = calc(liters, priceInput, bonoQuimico)
    const isPositive = incentive >= 0

    // React to diesel price changes
    useEffect(() => {
        if (!priceInput) {
            const results = calc(liters, priceInput, bonoQuimico)
            onUpdate({
                ...trip,
                Incentive_Pay: results.incentive,
                Total_Pay: results.total,
                Diesel_Savings: results.savings
            })
        }
    }, [dieselPrice])

    const handleInputs = (newLiters, newPrice, newQuimico) => {
        setLiters(newLiters)
        setPriceInput(newPrice)
        setBonoQuimico(newQuimico)

        const results = calc(newLiters, newPrice, newQuimico)
        const updatedTrip = {
            ...trip,
            Manual_Refuel_Liters: parseFloat(newLiters) || 0,
            Manual_Actual_Price_Per_Liter: parseFloat(newPrice) || 0,
            Manual_Bono_Quimico: newQuimico,
            Calculated_Incentive: results.incentive,
            Calculated_Total: results.total,
            Calculated_Savings: results.savings
        }
        onUpdate(updatedTrip)
    }

    const toggleStatus = () => {
        const newStatus = trip.Status === 'APPROVED' ? 'PENDING' : 'APPROVED'
        onUpdate({ ...trip, Status: newStatus })
    }

    const handleSave = async () => {
        const payload = {
            ...trip,
            Manual_Refuel_Liters: parseFloat(liters) || 0,
            Manual_Actual_Price_Per_Liter: parseFloat(priceInput) || 0,
            Manual_Bono_Quimico: bonoQuimico,
            Manual_Pac_Loaded: pacLoaded,
            Manual_Pac_Bono_Sierra: bonoSierra,
            Manual_Pac_Bono_Doble: bonoDoble,
            Manual_Pac_Estancia_Obregon: parseInt(estObregon) || 0,
            Manual_Pac_Estancia_Mochis: parseInt(estMochis) || 0,
            Status: 'PENDING'
        };
        try {
            const res = await fetch(buildApiUrl('/api/calculate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trips: [payload] })
            });
            const data = await res.json();
            if (data.trips && data.trips.length > 0) {
                onUpdate(data.trips[0]);
            }
        } catch (err) {
            alert('Error recalculating trip: ' + err.message);
        }
    }

    const routeParts = trip.Route ? trip.Route.split(' - ') : ['Origen Indefinido', 'Destino Indefinido'];
    const origin = routeParts[0];
    const destination = routeParts.length > 1 ? routeParts[routeParts.length - 1] : 'No Especificado';
    const initials = trip.Driver ? trip.Driver.substring(0, 2).toUpperCase() : 'DR';

    const quimicoVal = bonoQuimico ? 250 : 0;
    let pacificoBonosVal = 0;
    if (trip.Is_Pacifico) {
        if (bonoSierra) pacificoBonosVal += 500;
        if (bonoDoble) pacificoBonosVal += 1726;
        pacificoBonosVal += (parseInt(estObregon) || 0) * 600;
        pacificoBonosVal += (parseInt(estMochis) || 0) * 300;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm hover:shadow-md transition-shadow">

            {/* ── 1. Header (Identity & Status) ── */}
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0">
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold tracking-tight text-slate-900 leading-tight">{trip.Driver}</h2>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
                                <i className="fas fa-hashtag text-[9px]"></i> {trip.Trip_ID}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
                                <i className="fas fa-truck text-[9px]"></i> U-{trip.Unit}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                                {trip.Start_Date || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto mt-1 md:mt-0 justify-between md:justify-center">
                    {trip.Status === 'APPROVED' ? (
                        <div className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <i className="fas fa-check-circle"></i> Aprobado
                        </div>
                    ) : trip.Status === 'NEEDS_INPUT' ? (
                        <div className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-help" title="Presiona el botón para aprobar la boleta">
                            <i className="fas fa-exclamation-circle"></i> Sin capturar
                        </div>
                    ) : (
                        <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <i className="fas fa-clock"></i> Pendiente
                        </div>
                    )}

                    <div className="border-l border-slate-200 pl-3">
                        <label className="flex items-center gap-1.5 cursor-pointer group" title={trip.Status === 'APPROVED' ? 'Quitar aprobación' : 'Marcar como aprobada'}>
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={trip.Status === 'APPROVED'} onChange={toggleStatus} className="peer sr-only" />
                                <div className="w-7 h-4 bg-red-400 rounded-full peer peer-focus:ring-1 peer-focus:ring-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors select-none">
                                {trip.Status === 'APPROVED' ? 'Aprobada' : 'Aprobar'}
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* ── Route & Finance Dashboard ── */}
            <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
                
                {/* Route Overview */}
                <div className="px-4 py-4 xl:w-4/12 flex flex-col justify-between bg-white">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex flex-col items-center mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                            <div className="w-px h-8 bg-slate-200 my-0.5"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
                        </div>
                        <div>
                            <div className="mb-3">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Origen</p>
                                <p className="text-xs font-bold text-slate-800 whitespace-pre-wrap leading-tight">{origin}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Destino Final</p>
                                <p className="text-xs font-bold text-slate-800 whitespace-pre-wrap leading-tight">{destination}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-auto items-center">
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Distancia</p>
                            <p className="text-sm font-mono font-bold text-slate-900">{trip.Total_Kms_Paid} <span className="text-xs font-sans font-normal text-slate-500">km</span></p>
                        </div>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Rend.</p>
                            <p className="text-sm font-mono font-bold text-slate-900">{trip.Yield_Used} <span className="text-xs font-sans font-normal text-slate-500">km/l</span></p>
                        </div>
                    </div>
                </div>

                {/* Finance Panel */}
                <div className="px-4 py-4 xl:w-8/12 flex flex-col bg-white">
                    <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                        <i className="fas fa-calculator text-slate-400"></i> Cálculo de Nómina
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Pay</span>
                            <span className="text-sm font-bold text-slate-800 leading-none">${trip.Base_Pay?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1" title="Límite teórico sugerido">LT. PERMIT</span>
                            <span className="text-sm font-bold text-amber-800 leading-none">{trip.Allowed_Liters} L</span>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Tarifa/Cruce</span>
                            <span className="text-sm font-bold text-indigo-800 leading-none">
                                ${trip.Suggested_Cost?.toFixed(2) || (trip.Allowed_Liters * trip.Diesel_Rate).toFixed(2)}
                            </span>
                        </div>
                        <div className={`${isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} border rounded-lg p-2.5 flex flex-col justify-center relative overflow-hidden transition-colors`}>
                            {isPositive && (
                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                    <i className="fas fa-leaf text-xl text-emerald-500"></i>
                                </div>
                            )}
                            <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 relative z-10 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                INCENTIVO
                            </span>
                            <span className={`text-sm font-bold relative z-10 leading-none ${isPositive ? 'text-emerald-800' : 'text-red-800'}`}>
                                {isPositive ? '+' : ''}${incentive.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Inputs & Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Litros Reales</label>
                            <input
                                type="number"
                                value={liters}
                                onChange={(e) => handleInputs(e.target.value, priceInput, bonoQuimico)}
                                placeholder="0.00"
                                className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-mono rounded-lg focus:ring-1 focus:ring-blue-500 outline-none px-2.5 py-1.5 shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Precio por Litro</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-bold text-xs">$</span>
                                <input
                                    type="number"
                                    value={priceInput}
                                    onChange={(e) => handleInputs(liters, e.target.value, bonoQuimico)}
                                    placeholder={trip.Diesel_Rate}
                                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-mono rounded-lg focus:ring-1 focus:ring-blue-500 outline-none pl-6 pr-2.5 py-1.5 shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <ToggleSwitch checked={bonoQuimico} onChange={(val) => handleInputs(liters, priceInput, val)} label="Aplica Químico" amountLabel="+$250.00" />
                        </div>
                    </div>
                    
                    {trip.Fuente_Tarifa === 'TABULADOR_BD' && (
                        <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2 flex items-center gap-3">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">Tarifa Cruce</span>
                            <span className="font-mono font-bold text-sm text-indigo-800">${(trip.Pago_Cruce ?? 0).toFixed(2)}</span>
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider ml-auto">
                                {trip.Regla_Aplicada}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Pacifico Bonuses Toggles ── */}
            {trip.Is_Pacifico && trip.Status === 'NEEDS_INPUT' && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Incentivos Pacífico Manuales</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        <ToggleSwitch checked={pacLoaded} onChange={setPacLoaded} label="Viaje Cargado" />
                        <ToggleSwitch checked={bonoSierra} onChange={setBonoSierra} label="Bono Sierra" amountLabel="+$500.00" />
                        <ToggleSwitch checked={bonoDoble} onChange={setBonoDoble} label="Bono Doble" amountLabel="+$1,726.00" />
                        <Stepper value={estObregon} onChange={setEstObregon} label="Obregón" amountLabel="+$600/cu" />
                        <Stepper value={estMochis} onChange={setEstMochis} label="Mochis" amountLabel="+$300/cu" />
                    </div>
                </div>
            )}

            {/* Detailed Table Section (Legs) */}
            {trip.Legs && trip.Legs.length > 0 && (
                <div className="border-t border-slate-200">
                    <div className="px-4 py-3 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setShowLegs(!showLegs)}>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <i className={`fas fa-chevron-${showLegs ? 'up' : 'down'} text-slate-400 w-4`}></i> Desglose de Trayectos
                        </h4>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {trip.Legs.length} Piernas
                        </span>
                    </div>

                    {showLegs && (
                        <div className="px-4 pb-4 pt-1 bg-slate-50 border-t border-slate-100">
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm mt-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200">
                                            <th className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider w-10">#</th>
                                            <th className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Trayecto</th>
                                            <th className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Estado Carga</th>
                                            <th className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cruce</th>
                                            <th className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-right">KMS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {trip.Legs.map((leg, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2 font-mono text-xs text-slate-400 font-bold">{i + 1}</td>
                                                <td className="px-4 py-2">
                                                    <div className="font-bold text-slate-800 text-xs">{leg.Origin}</div>
                                                    <div className="text-[10px] text-slate-400">Hacia: {leg.Destination}</div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {leg.Is_Loaded ? (
                                                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Cargado</span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Vacío/Transito</span>
                                                    )}
                                                    <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 bg-white px-1 py-0.5 rounded">{leg.Type}</span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {leg.Cruce ? (
                                                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                                            {leg.Cruce}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 text-[10px]">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 font-mono text-slate-800 text-right font-bold text-xs">{leg.Kms}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Final Action ── */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button onClick={handleSave} className="w-full md:w-auto px-6 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5">
                    <i className="fas fa-save"></i> Guardar y Calcular
                </button>
            </div>
        </div>
    )
}
