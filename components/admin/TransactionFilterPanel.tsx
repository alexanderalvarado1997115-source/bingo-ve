"use client";
import { useState } from "react";
import { Filter, X, Search, Calendar, ChevronDown } from "lucide-react";
import { TransactionFilters } from "@/lib/firebase/financial-actions";

interface FilterPanelProps {
    onFilterChange: (filters: TransactionFilters) => void;
    onClearFilters: () => void;
    totalResults: number;
}

export default function TransactionFilterPanel({ onFilterChange, onClearFilters, totalResults }: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<TransactionFilters>({
        type: 'all',
        category: 'all',
        searchText: '',
        sortBy: 'date',
        sortOrder: 'desc'
    });

    const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearFilters = () => {
        const defaultFilters: TransactionFilters = {
            type: 'all',
            category: 'all',
            searchText: '',
            sortBy: 'date',
            sortOrder: 'desc'
        };
        setFilters(defaultFilters);
        onClearFilters();
    };

    const hasActiveFilters = filters.type !== 'all' || filters.category !== 'all' || filters.searchText !== '' || filters.startDate || filters.endDate;

    return (
        <div className="space-y-4">
            {/* Header con botón de toggle */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30 transition-all"
                >
                    <Filter size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">
                        {isOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </span>
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-black rounded-full">
                            Activos
                        </span>
                    )}
                </button>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                        {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
                    </span>
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={14} />
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Panel de filtros */}
            {isOpen && (
                <div className="bg-[#161822] rounded-2xl border border-white/5 p-6 space-y-6">
                    {/* Búsqueda por texto */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Buscar
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                value={filters.searchText || ''}
                                onChange={(e) => handleFilterChange('searchText', e.target.value)}
                                placeholder="Buscar por descripción, usuario..."
                                className="w-full bg-[#0f111a] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Filtro por tipo */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                Tipo
                            </label>
                            <select
                                value={filters.type || 'all'}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="w-full bg-[#0f111a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Todos</option>
                                <option value="income">Ingresos</option>
                                <option value="expense">Egresos</option>
                            </select>
                        </div>

                        {/* Filtro por categoría */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                Categoría
                            </label>
                            <select
                                value={filters.category || 'all'}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full bg-[#0f111a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Todas</option>
                                <option value="ticket_sale">Venta de Cartones</option>
                                <option value="prize_payout">Pago de Premios</option>
                                <option value="hoya_reset">Reset de Hoya</option>
                                <option value="system_adjustment">Ajuste del Sistema</option>
                            </select>
                        </div>

                        {/* Ordenar por */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                Ordenar por
                            </label>
                            <select
                                value={filters.sortBy || 'date'}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="w-full bg-[#0f111a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="date">Fecha</option>
                                <option value="amount">Monto</option>
                            </select>
                        </div>

                        {/* Orden */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                Orden
                            </label>
                            <select
                                value={filters.sortOrder || 'desc'}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                                className="w-full bg-[#0f111a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="desc">Descendente</option>
                                <option value="asc">Ascendente</option>
                            </select>
                        </div>
                    </div>

                    {/* Filtros de fecha */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} />
                                Desde
                            </label>
                            <input
                                type="date"
                                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                                className="w-full bg-[#0f111a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} />
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                                className="w-full bg-[#0f111a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
