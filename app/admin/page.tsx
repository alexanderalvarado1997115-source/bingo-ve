"use client";
import { useEffect, useState } from "react";
import { getPendingPayments, approvePayment, rejectPayment, getAllUsers } from "@/lib/firebase/admin-actions";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Check, X, RefreshCw, Users, CreditCard, LayoutDashboard, History, Settings, LogOut, Bell, ShieldCheck, Zap, Search, Circle, User, DollarSign } from "lucide-react";
import DrawControl from "@/components/admin/DrawControl";
import FinancialCenter from "@/components/admin/FinancialCenter";
import PaymentManagement from "@/components/admin/PaymentManagement";
import DrawHistory from "@/components/admin/DrawHistory";
import UserManagement from "@/components/admin/UserManagement";
import GlobalSettings from "@/components/admin/GlobalSettings";
import { subscribeToPendingPayments } from "@/lib/firebase/payment-listener";
import { subscribeToPresence } from "@/lib/firebase/presence";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [payments, setPayments] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [presenceMap, setPresenceMap] = useState<Record<string, any>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [drawId, setDrawId] = useState<string>("ACTIVE_DRAW");
    const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'history' | 'users' | 'finanzas' | 'settings'>('dashboard');

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

        const unsubPresence = subscribeToPresence((statusMap) => {
            setPresenceMap(statusMap);
        });

        // Initial fetch for users
        getAllUsers().then(setAllUsers);

        return () => {
            unsubGame();
            unsubPayments();
            unsubPresence();
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
                        active={activeTab === 'finanzas'}
                        onClick={() => setActiveTab('finanzas')}
                        icon={<DollarSign size={20} />}
                        label="Centro Financiero"
                    />
                    <SidebarLink
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                        icon={<Users size={20} />}
                        label="Usuarios Registrados"
                        badge={Object.values(presenceMap).filter(s => s.state === 'online').length || undefined}
                        badgeColor="bg-green-500"
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
                    <div className="h-px bg-white/5 my-2" />
                    <SidebarLink
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                        icon={<Settings size={20} />}
                        label="Configuración Global"
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
                            {activeTab === 'dashboard' ? 'Control de Sorteo' :
                                activeTab === 'finanzas' ? 'Centro Financiero' :
                                    activeTab === 'payments' ? 'Validación de Pagos' :
                                        activeTab === 'users' ? 'Gestión de Usuarios' : 'Historial de Juegos'}
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

                                    {/* Right Side: Quick Stats & Server Status */}
                                    <div className="xl:col-span-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Support Tip Widget */}
                                            <div className="bg-[#0f111a] p-8 rounded-[2.5rem] border border-white/5 shadow-xl h-full">
                                                <div className="flex items-center gap-3 text-indigo-400 mb-6">
                                                    <div className="p-3 bg-indigo-500/10 rounded-2xl"><Zap size={20} /></div>
                                                    <h4 className="font-black text-sm uppercase tracking-widest">Consejo de Soporte</h4>
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed italic">
                                                    "Mantén el sorteo controlado. Si tienes muchos pagos pendientes, es mejor pausar el sorteo unos minutos, aprobar todo en la pestaña 'Pagos', y luego continuar."
                                                </p>
                                            </div>

                                            {/* Server Status Widget */}
                                            <div className="bg-[#0f111a] p-8 rounded-[2.5rem] border border-white/5 shadow-xl h-full">
                                                <div className="flex items-center gap-3 text-green-400 mb-6">
                                                    <div className="p-3 bg-green-500/10 rounded-2xl"><ShieldCheck size={20} /></div>
                                                    <h4 className="font-black text-sm uppercase tracking-widest">Estado del Sistema</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Firebase Realtime</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase text-green-400">Online</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Bot de WhatsApp</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                            <span className="text-[10px] font-black uppercase text-green-400">Activo</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payments Summary Mini-Widget (Optional Link) */}
                                        <div
                                            onClick={() => setActiveTab('payments')}
                                            className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-8 rounded-[2.5rem] border border-indigo-500/20 cursor-pointer hover:border-indigo-500/40 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <CreditCard size={100} />
                                            </div>
                                            <div className="relative z-10 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-indigo-400 transition-colors">
                                                        Gestión de Pagos
                                                    </h3>
                                                    <p className="text-sm text-slate-400 font-medium">
                                                        Tienes <span className="text-white font-bold">{payments.length}</span> pagos pendientes de revisión.
                                                    </p>
                                                </div>
                                                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                                                    <Check size={24} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === 'payments' ? (
                                <motion.div
                                    key="payments"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full"
                                >
                                    <PaymentManagement
                                        payments={payments}
                                        onAction={handleAction}
                                        onRefresh={() => setPayments([...payments])}
                                    />
                                </motion.div>
                            ) : activeTab === 'users' ? (
                                <motion.div
                                    key="users"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full"
                                >
                                    <UserManagement
                                        users={allUsers}
                                        presenceMap={presenceMap}
                                        onRefresh={() => getAllUsers().then(setAllUsers)}
                                    />
                                </motion.div>
                            ) : activeTab === 'finanzas' ? (
                                <motion.div
                                    key="finanzas"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <FinancialCenter />
                                </motion.div>
                            ) : activeTab === 'history' ? (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full"
                                >
                                    <DrawHistory />
                                </motion.div>
                            ) : activeTab === 'settings' ? (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full"
                                >
                                    <GlobalSettings />
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

function SidebarLink({ active, onClick, icon, label, badge, badgeColor = "bg-red-500" }: { active: boolean, onClick: () => void, icon: any, label: string, badge?: number, badgeColor?: string }) {
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
                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white text-indigo-600' : badgeColor + ' text-white'}`}>
                    {badge}
                </div>
            )}
        </button>
    );
}
