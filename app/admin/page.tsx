"use client";
import { useEffect, useState } from "react";
import { getPendingPayments, approvePayment, rejectPayment } from "@/lib/firebase/admin-actions";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Check, X, RefreshCw, Users, CreditCard, LayoutDashboard, History, Settings, LogOut, Bell, ShieldCheck, Zap } from "lucide-react";
import DrawControl from "@/components/admin/DrawControl";
import { subscribeToPendingPayments } from "@/lib/firebase/payment-listener";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawId, setDrawId] = useState<string>("ACTIVE_DRAW");
    const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'history'>('dashboard');

    const ADMIN_EMAIL = "admin@bingove.suport.com";

    // Subscriptions
    useEffect(() => {
        const { subscribeToGame } = require("@/lib/firebase/game-actions");
        const unsubGame = subscribeToGame((state: any) => {
            if (state?.drawId) setDrawId(state.drawId);
        });

        const unsubPayments = subscribeToPendingPayments((updatedPayments) => {
            setPayments(updatedPayments);
            setLoading(false);
        });

        return () => {
            unsubGame();
            unsubPayments();
        };
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.email !== ADMIN_EMAIL) {
                router.push('/');
            }
        }
    }, [user, authLoading, router]);

    const handleAction = async (id: string, userId: string, count: number, action: 'approve' | 'reject') => {
        if (action === 'approve') {
            await approvePayment(id, userId, count, drawId);
        } else {
            await rejectPayment(id);
        }
    };

    if (authLoading || !user || user.email !== ADMIN_EMAIL) {
        return (
            <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-400 font-medium animate-pulse">Verificando acceso de administrador...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0b10] flex text-slate-200 overflow-hidden">
            {/* --- SIDEBAR --- */}
            <aside className="w-64 bg-[#0f111a] border-r border-white/5 flex flex-col hidden lg:flex">
                <div className="p-8">
                    <div className="text-2xl font-black italic bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        BINGO<span className="text-white">VE</span>
                    </div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Console v2.0</div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <SidebarLink
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                    />
                    <SidebarLink
                        active={activeTab === 'payments'}
                        onClick={() => setActiveTab('payments')}
                        icon={<CreditCard size={20} />}
                        label="Pagos Pendientes"
                        badge={payments.length > 0 ? payments.length : undefined}
                    />
                    <SidebarLink
                        active={activeTab === 'history'}
                        onClick={() => setActiveTab('history')}
                        icon={<History size={20} />}
                        label="Historial de Sorteos"
                    />
                </nav>

                <div className="p-4 mt-auto">
                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black">
                                AD
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white truncate w-32">{user.displayName || "Administrador"}</div>
                                <div className="text-[10px] text-slate-500 font-medium">Soporte BingoVE</div>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/5"
                        >
                            <LogOut size={12} /> Salir de Consola
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-20 bg-[#0f111a]/50 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between z-40">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-white uppercase tracking-tighter">
                            {activeTab === 'dashboard' ? 'Control de Sorteo' : activeTab === 'payments' ? 'Validación de Pagos' : 'Historial de Juegos'}
                        </h1>
                        <div className="h-4 w-px bg-white/10 mx-2" />
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Servidor Online</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2 mr-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f111a] bg-slate-800" />
                            ))}
                        </div>
                        <button className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 border border-white/5 transition-all">
                            <Bell size={20} />
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        >
                            Ver Sitio Público
                        </button>
                    </div>
                </header>

                {/* Dashboard Scroll Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_40%)]">
                    <div className="max-w-[1600px] mx-auto">
                        <AnimatePresence mode="wait">
                            {activeTab === 'dashboard' ? (
                                <motion.div
                                    key="dash"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start"
                                >
                                    {/* Left Side: Real-time Monitor & Controls */}
                                    <div className="xl:col-span-4 sticky top-0">
                                        <DrawControl />
                                    </div>

                                    {/* Right Side: Quick Lists */}
                                    <div className="xl:col-span-8 space-y-8">
                                        {/* Payments Quick Glance */}
                                        <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Validación de Pagos</h3>
                                                    <p className="text-xs text-slate-500 mt-1">Revisa y aprueba las transferencias de los usuarios.</p>
                                                </div>
                                                <button onClick={() => setPayments([])} className="p-3 text-slate-400 hover:text-white bg-white/5 rounded-2xl border border-white/5">
                                                    <RefreshCw size={18} />
                                                </button>
                                            </div>

                                            <div className="min-h-[300px]">
                                                {payments.length === 0 ? (
                                                    <div className="p-20 text-center space-y-4">
                                                        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700">
                                                            <ShieldCheck size={32} />
                                                        </div>
                                                        <p className="text-slate-500 font-medium">Bandeja de entrada vacía por ahora.</p>
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left">
                                                            <thead className="bg-[#161822] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                                                <tr>
                                                                    <th className="px-8 py-5">Usuario / Teléfono</th>
                                                                    <th className="px-8 py-5">Referencia Pago</th>
                                                                    <th className="px-8 py-5">Monto</th>
                                                                    <th className="px-8 py-5 text-right">Acciones</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5">
                                                                {payments.map((p) => (
                                                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                                                        <td className="px-8 py-6">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold font-mono">
                                                                                    {p.userId.slice(0, 2).toUpperCase()}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-black text-white">{p.phone || 'Sin Teléfono'}</div>
                                                                                    <div className="text-[10px] text-slate-500 font-bold uppercase overflow-hidden w-24 text-ellipsis">ID: {p.userId}</div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-8 py-6">
                                                                            <div className="inline-block px-3 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-black tracking-widest border border-orange-500/10 mb-1">
                                                                                {p.reference}
                                                                            </div>
                                                                            {p.last4Digits && <div className="text-[10px] text-slate-500 font-bold ml-1">CONFIRMACIÓN: ****{p.last4Digits}</div>}
                                                                        </td>
                                                                        <td className="px-8 py-6">
                                                                            <div className="text-lg font-black text-white">
                                                                                {p.amount} <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Bs</span>
                                                                            </div>
                                                                            <div className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">{p.ticketsCount} Cartones</div>
                                                                        </td>
                                                                        <td className="px-8 py-6">
                                                                            <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                                                <button
                                                                                    onClick={() => handleAction(p.id, p.userId, p.ticketsCount, 'reject')}
                                                                                    className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl border border-red-500/10 transition-all shadow-lg shadow-red-500/5"
                                                                                >
                                                                                    <X size={20} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleAction(p.id, p.userId, p.ticketsCount, 'approve')}
                                                                                    className="p-3 bg-green-500 text-white hover:bg-green-400 rounded-2xl border border-green-500/10 transition-all shadow-lg shadow-green-500/20"
                                                                                >
                                                                                    <Check size={20} strokeWidth={3} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Secondary Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-[#0f111a] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                                                <div className="flex items-center gap-3 text-indigo-400 mb-6">
                                                    <div className="p-3 bg-indigo-500/10 rounded-2xl"><Zap size={20} /></div>
                                                    <h4 className="font-black text-sm uppercase tracking-widest">Consejo de Soporte</h4>
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed italic">
                                                    "Asegúrate de verificar que el monto transferido coincida exactamente con lo solicitado antes de aprobar el cartón para evitar desajustes en la recaudación."
                                                </p>
                                            </div>
                                            <div className="bg-[#0f111a] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                                                <div className="flex items-center gap-3 text-green-400 mb-6">
                                                    <div className="p-3 bg-green-500/10 rounded-2xl"><Users size={20} /></div>
                                                    <h4 className="font-black text-sm uppercase tracking-widest">Estado de Servidores</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Firebase Realtime</span>
                                                        <span className="text-[10px] font-black uppercase text-green-400">Excelente</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Auth & Storage</span>
                                                        <span className="text-[10px] font-black uppercase text-green-400">Sincronizado</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="p-20 text-center text-slate-500 bg-[#0f111a] rounded-[2.5rem] border border-white/5">
                                    Esta sección estará disponible próximamente.
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarLink({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: any, label: string, badge?: number }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group
                ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} transition-colors`}>
                    {icon}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : ''}`}>
                    {label}
                </span>
            </div>
            {badge && (
                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                    {badge}
                </div>
            )}
        </button>
    );
}
