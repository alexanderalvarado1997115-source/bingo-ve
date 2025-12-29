"use client";
import { useState } from "react";
import { User, Search, Circle, MoreVertical, Gift, Ban, Shield, Trash2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toggleUserBan, giveFreeTicket, updateUserRole } from "@/lib/firebase/admin-actions";

interface UserManagementProps {
    users: any[];
    presenceMap: Record<string, any>;
    onRefresh: () => void;
}

export default function UserManagement({ users, presenceMap, onRefresh }: UserManagementProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);

    const handleAction = async (userId: string, action: 'ban' | 'gift' | 'role', value?: any) => {
        setProcessing(userId);
        setActiveMenu(null);

        try {
            if (action === 'ban') {
                await toggleUserBan(userId, value); // value = current ban status
            } else if (action === 'gift') {
                if (confirm("¿Estás seguro de regalar 1 cartón a este usuario?")) {
                    await giveFreeTicket(userId, 1);
                }
            } else if (action === 'role') {
                await updateUserRole(userId, value); // value = 'admin' or 'user'
            }
            onRefresh(); // Trigger reload
        } catch (e) {
            console.error(e);
            alert("Error ejecutando acción");
        } finally {
            setProcessing(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl h-full flex flex-col">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#13151f]">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Directorio de Jugadores</h3>
                    <p className="text-xs text-slate-500 mt-1">Gestión avanzada de permisos y recompensas.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0f111a] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar bg-[#0f111a]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#161822] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-8 py-5 bg-[#161822]">Jugador</th>
                            <th className="px-8 py-5 bg-[#161822]">Estado</th>
                            <th className="px-8 py-5 bg-[#161822]">Rol / Permisos</th>
                            <th className="px-8 py-5 bg-[#161822] text-right">Opciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((u) => {
                            const status = presenceMap[u.uid]?.state || 'offline';
                            const isOnline = status === 'online';
                            const isBanned = u.banned === true;
                            const isAdmin = u.role === 'admin';
                            const isProcessing = processing === u.id;

                            return (
                                <tr key={u.id} className={`hover:bg-white/[0.02] transition-colors group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-inner border border-white/5 text-lg
                                                ${isBanned ? 'bg-red-500/10 text-red-500' : isAdmin ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-slate-400'}`}>
                                                {isBanned ? <Ban size={20} /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-white flex items-center gap-2">
                                                    {u.displayName || 'Sin Nombre'}
                                                    {isBanned && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded uppercase tracking-wider">Suspendido</span>}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase overflow-hidden w-full max-w-[150px] truncate">
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5
                                            ${isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800/50 text-slate-500'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                                            {isOnline ? 'En Línea' : 'Offline'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {isAdmin ? (
                                                <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-[10px] font-black uppercase tracking-wider border border-yellow-500/20 flex items-center gap-1.5">
                                                    <Shield size={12} fill="currentColor" /> Admin
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-500">Usuario</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {activeMenu === u.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    className="absolute right-8 top-12 z-50 min-w-[180px] bg-[#1a1d26] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1"
                                                >
                                                    <button
                                                        onClick={() => handleAction(u.id, 'gift')}
                                                        className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                                                    >
                                                        <Gift size={14} className="text-indigo-400" />
                                                        Regalar Cartón
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(u.id, 'role', isAdmin ? 'user' : 'admin')}
                                                        className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                                                    >
                                                        <Shield size={14} className={isAdmin ? "text-slate-400" : "text-yellow-500"} />
                                                        {isAdmin ? "Quitar Admin" : "Hacer Admin"}
                                                    </button>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <button
                                                        onClick={() => handleAction(u.id, 'ban', isBanned)}
                                                        className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-3 transition-colors ${isBanned ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                                                    >
                                                        {isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
                                                        {isBanned ? "Reactivar Cuenta" : "Suspender Usuario"}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Overlay to close menu on click outside */}
                                        {activeMenu === u.id && (
                                            <div
                                                className="fixed inset-0 z-40 bg-transparent"
                                                onClick={() => setActiveMenu(null)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700">
                            <User size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No se encontraron usuarios.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
