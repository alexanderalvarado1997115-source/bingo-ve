"use client";
import React, { useState, useEffect } from "react";
import {
    RefreshCw, TrendingUp, DollarSign, BarChart3, Zap, Shield,
    CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight,
    Settings, ChevronLeft, ChevronRight, Trophy, Search, Filter, X
} from "lucide-react";
import { onValue, ref } from "firebase/database";
import { db, realtimeDb } from "@/lib/firebase/config";
import { getTransactionHistory, getTodayStats, updateFinancialConfig, Transaction, getWeeklyChartData, getFilteredTransactions, TransactionFilters, getKPIMetrics, getProjections, getComparativeData, checkAndGenerateAlerts } from "@/lib/firebase/financial-actions";
import { collection, query, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { CashFlowChart, DistributionChart } from "./FinancialCharts";
import TransactionFilterPanel from "./TransactionFilterPanel";
import ReportGenerator from "./ReportGenerator";

interface FinancialData {
    totalRevenue: number;
    hoya: number;
    totalPaid?: number;
    config?: {
        ticketPrice: number;
        bingoReward: number;
        hoyaPercentage: number;
    };
}

export default function FinancialCenter() {
    const [financials, setFinancials] = useState<FinancialData>({
        totalRevenue: 0,
        hoya: 0,
        totalPaid: 0,
        config: { ticketPrice: 100, bingoReward: 500, hoyaPercentage: 20 }
    });

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [todayStats, setTodayStats] = useState({ income: 0, expenses: 0, net: 0, transactionCount: 0 });
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingConfig, setIsEditingConfig] = useState(false);
    const [editConfig, setEditConfig] = useState(financials.config);

    // Estados para filtros y paginación
    const [filters, setFilters] = useState<TransactionFilters>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    // Estado para auditoría
    const [auditResult, setAuditResult] = useState<any>(null);
    const [isAuditing, setIsAuditing] = useState(false);

    // Estado para KPIs
    const [kpis, setKpis] = useState({
        roi: 0,
        avgTicketPrice: 0,
        conversionRate: 0,
        salesVelocity: 0,
        totalTicketsSold: 0,
        totalIncome: 0,
        totalExpenses: 0
    });

    // Estado para Proyecciones
    const [projections, setProjections] = useState({
        ticketsToBreakEven: 0,
        ticketsToGoal: 0,
        projectedDailyIncome: 0,
        projectedWeeklyIncome: 0,
        hoursToGoal: 0,
        currentProgress: 0
    });

    // Estado para Comparativas
    const [comparative, setComparative] = useState({
        weekOverWeek: { currentWeek: 0, lastWeek: 0, growth: 0, growthPercentage: 0 },
        monthOverMonth: { currentMonth: 0, lastMonth: 0, growth: 0, growthPercentage: 0 },
        bestDay: { day: 'N/A', income: 0 },
        worstDay: { day: 'N/A', income: 0 }
    });


    const [alerts, setAlerts] = useState<any[]>([]);

    // Escuchar alertas en tiempo real
    useEffect(() => {
        const alertsRef = collection(db, 'system_alerts');
        const unsub = onSnapshot(alertsRef, (snapshot) => {
            const alertsList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as any))
                .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                .slice(0, 5);
            setAlerts(alertsList);
        }, (error) => {
            console.error('Error listening alerts:', error);
        });
        return () => unsub();
    }, []);

    const [dailyGoal, setDailyGoal] = useState(1000); // Meta diaria configurable

    const loadData = async () => {
        setLoading(true);
        try {
            const [weekly, comp, kpiData, projData, today] = await Promise.all([
                getWeeklyChartData(),
                getComparativeData(),
                getKPIMetrics(),
                getProjections(dailyGoal),
                getTodayStats()
            ]);

            setWeeklyData(weekly);
            setComparative(comp);
            setKpis(kpiData);
            setProjections(projData);
            setTodayStats(today);

            await loadTransactions();
            await loadAlerts();
        } catch (error) {
            console.error("Error loading financial data:", error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        // Escuchar datos financieros en tiempo real
        const unsubFinancials = onValue(ref(realtimeDb, 'financials'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setFinancials(data);
                setEditConfig(data.config || { ticketPrice: 100, bingoReward: 500, hoyaPercentage: 20 });
            }
            setLoading(false);
        });

        loadData();

        return () => unsubFinancials();
    }, []);

    const loadAlerts = async () => {
        try {
            const alertsSnap = await getDocs(
                query(
                    collection(db, 'system_alerts'),
                    orderBy('timestamp', 'desc'),
                    limit(5)
                )
            );
            const alertsList = alertsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAlerts(alertsList);
        } catch (error) {
            console.error('Error cargando alertas:', error);
        }
    };

    // Exportar alertas a CSV
    const exportAlertsCSV = () => {
        if (!alerts.length) return;
        const headers = ['ID', 'Tipo', 'Mensaje', 'Severidad', 'Fecha'];
        const rows = alerts.map(a => [
            a.id,
            a.type || 'N/A',
            a.message?.replace(/\n/g, ' ') || '',
            a.severity || 'N/A',
            a.timestamp?.seconds ? new Date(a.timestamp.seconds * 1000).toLocaleString() : ''
        ]);
        const csvContent = [headers, ...rows]
            .map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `alertas_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const loadTransactions = async (page = currentPage) => {
        const result = await getFilteredTransactions({
            ...filters,
            page,
            pageSize: 20
        });

        setTransactions(result.transactions as Transaction[]);
        setTotalResults(result.total);
        setHasMore(result.hasMore);
        setCurrentPage(page);
    };

    const handleSaveConfig = async () => {
        if (!editConfig) return;

        const result = await updateFinancialConfig(editConfig);
        if (result.success) {
            setIsEditingConfig(false);
            alert("✅ Configuración actualizada correctamente");
        } else {
            alert("❌ Error al actualizar la configuración");
        }
    };

    const exportToCSV = () => {
        if (transactions.length === 0) {
            alert("No hay transacciones para exportar");
            return;
        }

        const headers = ["Fecha", "Hora", "Tipo", "Categoría", "Descripción", "Monto (Bs)"];
        const rows = transactions.map(tx => {
            const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
            return [
                date.toLocaleDateString('es-VE'),
                date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
                tx.type === 'income' ? 'Ingreso' : 'Egreso',
                tx.category.replace('_', ' '),
                tx.description,
                tx.amount.toFixed(2)
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transacciones_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFilterChange = async (newFilters: TransactionFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        const result = await getFilteredTransactions({
            ...newFilters,
            page: 1,
            pageSize: 20
        });
        setTransactions(result.transactions);
        setTotalResults(result.total);
        setHasMore(result.hasMore);
    };

    const handleClearFilters = async () => {
        setFilters({});
        setCurrentPage(1);
        await loadTransactions(1);
    };

    const handlePageChange = async (newPage: number) => {
        await loadTransactions(newPage);
    };

    const runAudit = async () => {
        setIsAuditing(true);
        setAuditResult(null);
        try {
            const response = await fetch('/api/admin/audit');
            const data = await response.json();
            setAuditResult(data.audit);

            if (data.audit.isValid) {
                console.log('✅ Auditoría exitosa:', data.audit);
            } else {
                console.error('❌ Discrepancia detectada:', data.audit);
            }
        } catch (error) {
            console.error('Error ejecutando auditoría:', error);
            setAuditResult({ isValid: false, error: String(error) });
        } finally {
            setIsAuditing(false);
        }
    };

    const utilidad = financials.totalRevenue - financials.hoya - (financials.totalPaid || 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Centro Financiero</h2>
                    <p className="text-sm text-slate-500 mt-1">Monitoreo y control de todas las transacciones</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={runAudit}
                        disabled={isAuditing}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isAuditing ? (
                            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Shield size={18} />
                        )}
                        {isAuditing ? 'Auditando...' : 'Auditar Ahora'}
                    </button>
                    <button
                        onClick={loadData}
                        className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Resultado de Auditoría */}
            {auditResult && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${auditResult.isValid
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {auditResult.isValid ? (
                            <CheckCircle2 size={20} className="mt-0.5" />
                        ) : (
                            <AlertTriangle size={20} className="mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className="font-semibold">
                                {auditResult.isValid ? '✅ Auditoría Exitosa' : '❌ Discrepancia Detectada'}
                            </p>
                            <p className="text-sm opacity-80 mt-1">
                                {auditResult.transactionCount} transacciones verificadas
                            </p>
                            {!auditResult.isValid && auditResult.discrepancies && (
                                <ul className="text-sm mt-2 space-y-1">
                                    {auditResult.discrepancies.map((disc: string, idx: number) => (
                                        <li key={idx}>• {disc}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Dashboard de KPIs en Tiempo Real */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* ROI del Día */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <TrendingUp size={20} className="text-emerald-400" />
                        </div>
                        <span className={`text-sm font-semibold ${kpis.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {kpis.roi >= 0 ? '+' : ''}{kpis.roi}%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{kpis.roi.toFixed(1)}%</h3>
                    <p className="text-sm text-slate-400 mt-1">ROI del Día</p>
                </motion.div>

                {/* Ticket Promedio */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <DollarSign size={20} className="text-blue-400" />
                        </div>
                        <span className="text-sm font-semibold text-blue-400">
                            {kpis.totalTicketsSold} ventas
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{kpis.avgTicketPrice.toFixed(0)} Bs</h3>
                    <p className="text-sm text-slate-400 mt-1">Ticket Promedio</p>
                </motion.div>

                {/* Tasa de Conversión */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                            <BarChart3 size={20} className="text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold text-purple-400">
                            Conversión
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{kpis.conversionRate.toFixed(1)}%</h3>
                    <p className="text-sm text-slate-400 mt-1">Pagos Aprobados</p>
                </motion.div>

                {/* Velocidad de Ventas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl">
                            <Zap size={20} className="text-orange-400" />
                        </div>
                        <span className="text-sm font-semibold text-orange-400">
                            /hora
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{kpis.salesVelocity.toFixed(1)}</h3>
                    <p className="text-sm text-slate-400 mt-1">Velocidad de Ventas</p>
                </motion.div>
            </div>

            {/* Panel de Proyecciones y Metas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-2xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Proyección de Ganancias</h3>
                        <p className="text-sm text-slate-400 mt-1">Meta diaria: {dailyGoal} Bs</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={dailyGoal}
                            onChange={(e) => setDailyGoal(Number(e.target.value))}
                            onBlur={loadData}
                            className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-sm text-slate-400">Bs</span>
                    </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Progreso hacia la meta</span>
                        <span className="text-sm font-semibold text-white">{projections.currentProgress.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, projections.currentProgress)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${projections.currentProgress >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : projections.currentProgress >= 50
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                                }`}
                        />
                    </div>
                </div>

                {/* Métricas de Proyección */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Para Cubrir Gastos</p>
                        <p className="text-2xl font-bold text-white">{projections.ticketsToBreakEven}</p>
                        <p className="text-xs text-slate-500 mt-1">cartones necesarios</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Para Alcanzar Meta</p>
                        <p className="text-2xl font-bold text-indigo-400">{projections.ticketsToGoal}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {projections.hoursToGoal > 0 ? `~${projections.hoursToGoal}h restantes` : 'Meta alcanzada'}
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Proyección Semanal</p>
                        <p className="text-2xl font-bold text-emerald-400">{projections.projectedWeeklyIncome.toFixed(0)} Bs</p>
                        <p className="text-xs text-slate-500 mt-1">a ritmo actual</p>
                    </div>
                </div>
            </motion.div>

            {/* Panel de Comparativas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-gray-500/5 to-slate-500/5 border border-gray-500/20 rounded-2xl p-6 mt-8"
            >
                <h3 className="text-xl font-bold text-white mb-4">Comparativas de Rendimiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Semana vs Semana */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Semana Actual vs Anterior</p>
                        <p className="text-2xl font-bold text-white">{comparative.weekOverWeek.currentWeek} Bs</p>
                        <p className="text-xs text-slate-500 mt-1">Crecimiento: {comparative.weekOverWeek.growthPercentage.toFixed(1)}% ({comparative.weekOverWeek.growth >= 0 ? '+' : ''}{comparative.weekOverWeek.growth} Bs)</p>
                    </div>
                    {/* Mes vs Mes */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Mes Actual vs Anterior</p>
                        <p className="text-2xl font-bold text-white">{comparative.monthOverMonth.currentMonth} Bs</p>
                        <p className="text-xs text-slate-500 mt-1">Crecimiento: {comparative.monthOverMonth.growthPercentage.toFixed(1)}% ({comparative.monthOverMonth.growth >= 0 ? '+' : ''}{comparative.monthOverMonth.growth} Bs)</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mejor Día */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Mejor Día (última semana)</p>
                        <p className="text-2xl font-bold text-emerald-400">{comparative.bestDay.day}</p>
                        <p className="text-xs text-slate-500 mt-1">Ingresos: {comparative.bestDay.income} Bs</p>
                    </div>
                    {/* Peor Día */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-sm text-slate-400 mb-2">Peor Día (última semana)</p>
                        <p className="text-2xl font-bold text-red-400">{comparative.worstDay.day}</p>
                        <p className="text-xs text-slate-500 mt-1">Ingresos: {comparative.worstDay.income} Bs</p>
                    </div>
                </div>
            </motion.div>

            {/* Panel de Alertas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-red-500/5 to-pink-500/5 border border-red-500/20 rounded-2xl p-6 mt-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Alertas del Sistema</h3>
                    <button
                        onClick={exportAlertsCSV}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-md text-sm"
                    >Exportar CSV</button>
                </div>
                {alerts.length === 0 ? (
                    <p className="text-sm text-slate-400">No hay alertas recientes.</p>
                ) : (
                    <ul className="space-y-3">
                        {alerts.map(alert => (
                            <li key={alert.id} className="flex items-start gap-3">
                                {alert.severity === 'high' && <AlertTriangle className="text-red-400 mt-0.5" size={20} />}
                                {alert.severity === 'medium' && <AlertTriangle className="text-amber-400 mt-0.5" size={20} />}
                                {alert.severity === 'low' && <AlertTriangle className="text-yellow-400 mt-0.5" size={20} />}
                                <div className="flex-1">
                                    <p className="font-medium text-white">{alert.message}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{new Date(alert.timestamp?.seconds * 1000).toLocaleString()}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </motion.div>

            {/* Cards de Resumen Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FinancialCard
                    title="La Hoya (20%)"
                    amount={financials.hoya}
                    trend={todayStats.income > 0 ? `+${((todayStats.income * 0.2 / financials.hoya) * 100).toFixed(1)}%` : "0%"}
                    icon={<Zap size={24} />}
                    color="indigo"
                    subtitle="Acumulado semanal"
                />
                <FinancialCard
                    title="Caja Total"
                    amount={financials.totalRevenue}
                    trend={todayStats.income > 0 ? `+${todayStats.income.toFixed(2)} Bs hoy` : "Sin movimientos"}
                    icon={<DollarSign size={24} />}
                    color="blue"
                    subtitle="Ingresos totales"
                />
                <FinancialCard
                    title="Utilidad Neta"
                    amount={utilidad}
                    trend={todayStats.net > 0 ? `+${todayStats.net.toFixed(2)} Bs hoy` : "0 Bs"}
                    icon={<Trophy size={24} />}
                    color="emerald"
                    subtitle="Ganancia real"
                />
            </div>

            {/* Estadísticas del Día */}
            <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 p-8">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <BarChart3 size={24} className="text-indigo-400" />
                    Resumen del Día
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <ArrowUpRight className="text-green-400" size={20} />
                            <span className="text-xs font-black text-green-400 uppercase tracking-widest">Ingresos</span>
                        </div>
                        <div className="text-3xl font-black text-white">{todayStats.income.toFixed(2)} Bs</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <ArrowDownRight className="text-red-400" size={20} />
                            <span className="text-xs font-black text-red-400 uppercase tracking-widest">Egresos</span>
                        </div>
                        <div className="text-3xl font-black text-white">{todayStats.expenses.toFixed(2)} Bs</div>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-indigo-400" size={20} />
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Balance</span>
                        </div>
                        <div className="text-3xl font-black text-white">{todayStats.net.toFixed(2)} Bs</div>
                    </div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CashFlowChart data={weeklyData} />
                <DistributionChart data={[
                    { name: 'La Hoya', value: financials.hoya, color: '#6366f1' },
                    { name: 'Premios Pagados', value: financials.totalPaid || 0, color: '#ef4444' },
                    { name: 'Utilidad', value: utilidad > 0 ? utilidad : 0, color: '#10b981' }
                ]} />
            </div>

            {/* Historial de Transacciones */}
            <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-white">📋 Historial de Transacciones</h3>
                        <p className="text-xs text-slate-500 mt-1">Filtrar y buscar operaciones</p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        disabled={transactions.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                        <FileDown size={16} />
                        Exportar CSV
                    </button>
                </div>

                {/* Panel de Filtros */}
                <div className="p-8 border-b border-white/5">
                    <TransactionFilterPanel
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        totalResults={totalResults}
                    />
                </div>

                <div className="overflow-x-auto">
                    {transactions.length === 0 ? (
                        <div className="p-20 text-center text-slate-500">
                            No hay transacciones que coincidan con los filtros.
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-[#161822] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">Fecha</th>
                                    <th className="px-8 py-5">Tipo</th>
                                    <th className="px-8 py-5">Concepto</th>
                                    <th className="px-8 py-5 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.map((tx) => {
                                    const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
                                    const isIncome = tx.type === 'income';

                                    return (
                                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-bold text-white">
                                                    {date.toLocaleDateString('es-VE')}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase ${isIncome ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                    {isIncome ? 'Ingreso' : 'Egreso'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-bold text-white">{tx.description}</div>
                                                <div className="text-xs text-slate-500 uppercase">{tx.category.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className={`text-lg font-black ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isIncome ? '+' : ''}{tx.amount.toFixed(2)} Bs
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Paginación */}
                {totalResults > 20 && (
                    <div className="p-6 border-t border-white/5 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalResults)} de {totalResults} transacciones
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl border border-white/5 transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-bold text-white px-4">
                                Página {currentPage} de {Math.ceil(totalResults / 20)}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!hasMore}
                                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl border border-white/5 transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Configuración Financiera */}
            <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Settings size={24} className="text-indigo-400" />
                        Configuración Financiera
                    </h3>
                    {!isEditingConfig && (
                        <button
                            onClick={() => setIsEditingConfig(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                            Editar
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Precio por Cartón</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={editConfig?.ticketPrice || 100}
                                onChange={(e) => setEditConfig(prev => ({ ...prev!, ticketPrice: Number(e.target.value) }))}
                                disabled={!isEditingConfig}
                                className="w-full bg-[#161822] border border-white/5 rounded-2xl py-3 px-4 text-lg font-black text-white outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Bs</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Premio por Bingo</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={editConfig?.bingoReward || 500}
                                onChange={(e) => setEditConfig(prev => ({ ...prev!, bingoReward: Number(e.target.value) }))}
                                disabled={!isEditingConfig}
                                className="w-full bg-[#161822] border border-white/5 rounded-2xl py-3 px-4 text-lg font-black text-white outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Bs</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">% para La Hoya</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={editConfig?.hoyaPercentage || 20}
                                onChange={(e) => setEditConfig(prev => ({ ...prev!, hoyaPercentage: Number(e.target.value) }))}
                                disabled={!isEditingConfig}
                                className="w-full bg-[#161822] border border-white/5 rounded-2xl py-3 px-4 text-lg font-black text-white outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                        </div>
                    </div>
                </div>

                {isEditingConfig && (
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => {
                                setIsEditingConfig(false);
                                setEditConfig(financials.config);
                            }}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveConfig}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-600/20"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function FinancialCard({ title, amount, trend, icon, color, subtitle }: {
    title: string;
    amount: number;
    trend: string;
    icon: React.ReactNode;
    color: 'indigo' | 'blue' | 'emerald';
    subtitle: string;
}) {
    const colors = {
        indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${colors[color]} border rounded-[2rem] p-6 relative overflow-hidden`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 ${colors[color]} rounded-2xl`}>
                    {icon}
                </div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{trend}</div>
            </div>
            <div className="text-4xl font-black text-white mb-1">{amount.toFixed(2)} <span className="text-lg text-slate-500">Bs</span></div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</div>
            <div className="text-[10px] text-slate-600 mt-1">{subtitle}</div>
        </motion.div>
    );
}
