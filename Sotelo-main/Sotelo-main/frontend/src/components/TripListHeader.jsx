import React, { useState } from 'react';
import WorkflowGuide from './WorkflowGuide';

export default function TripListHeader({ totalTrips, approvedCount, onFilterChange, searchTerm, onSearchChange }) {
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('PENDING');

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (onFilterChange) onFilterChange(tab);
    };

    return (
        <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cálculo de Nómina</h1>
                    <p className="text-sm text-slate-500 mt-1">Revisa y aprueba las boletas de los operadores</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsGuideOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-semibold transition-colors border border-blue-200"
                    >
                        <i className="fas fa-info-circle"></i>
                        Ver Guía de Flujo
                    </button>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-end shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Aprobados</span>
                        <span className="text-sm font-bold text-emerald-600">{approvedCount} / {totalTrips}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <i className="fas fa-search text-sm"></i>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar operador o boleta..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                    />
                </div>

                {/* Status Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                    <button 
                        onClick={() => handleTabChange('ALL')}
                        className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button 
                        onClick={() => handleTabChange('PENDING')}
                        className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'PENDING' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pendientes
                    </button>
                    <button 
                        onClick={() => handleTabChange('APPROVED')}
                        className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'APPROVED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Aprobados
                    </button>
                </div>

            </div>

            <WorkflowGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </div>
    );
}
