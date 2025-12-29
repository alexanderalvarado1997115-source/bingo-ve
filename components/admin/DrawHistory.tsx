"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Calendar, Ticket, Trophy, ChevronDown, ChevronUp, DollarSign, Ban } from "lucide-react";
import { getDrawHistory } from "@/lib/firebase/admin-actions";

export default function DrawHistory() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedgameId, setExpandedGameId] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getDrawHistory();
        setHistory(data);
        setLoading(false);
    };

    const formatDate = (date: any) => {
        if (!date) return "Fecha desconocida";
        // Handle Firestore Timestamp or standard Date
        const d = date instanceof Date ? date : new Date(date.seconds * 1000);
        return d.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl h-full flex flex-col"
        >
            <div className="p-8 border-b border-white/5 bg-[#13151f]">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <History className="text-indigo-400" />
                    Historial de Sorteos
                </h3>
                <p className="text-xs text-slate-500 mt-1 pl-9">Registro auditable de todos los juegos finalizados.</p>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar bg-[#0f111a] p-8">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700">
                            <Ban size={40} />
                        </div>
                        <p className="text-slate-500 font-medium">No hay sorteos archivados aún.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((game, index) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${expandedgameId === game.id ? 'bg-white/[0.03] border-indigo-500/30' : 'bg-[#161822] hover:bg-white/[0.02]'}`}
                            >
                                <div
                                    onClick={() => setExpandedGameId(expandedgameId === game.id ? null : game.id)}
                                    className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm">
                                            #{history.length - index}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                                                <Calendar size={12} />
                                                {formatDate(game.archivedAt)}
                                            </div>
                                            <div className="text-white font-bold text-sm tracking-wide">
                                                ID: <span className="font-mono text-slate-400">{game.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 text-sm">
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase text-slate-500 font-black tracking-wider">Cartones</div>
                                            <div className="font-bold text-white flex items-center justify-end gap-1">
                                                <Ticket size={14} className="text-orange-500" />
                                                {game.totalTickets || 0}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase text-slate-500 font-black tracking-wider">Premios</div>
                                            <div className="font-bold text-white flex items-center justify-end gap-1">
                                                <Trophy size={14} className="text-yellow-500" />
                                                {game.winners?.length || 0}
                                            </div>
                                        </div>
                                        <div className="text-right hidden md:block">
                                            <div className="text-[10px] uppercase text-slate-500 font-black tracking-wider">Bolas</div>
                                            <div className="font-bold text-slate-300 flex items-center justify-end gap-1">
                                                {game.history?.length || 0} / 75
                                            </div>
                                        </div>

                                        <div className={`transition-transform duration-300 ${expandedgameId === game.id ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="text-slate-500" />
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedgameId === game.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5 bg-[#0a0b10]/50"
                                        >
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Winners Section */}
                                                <div>
                                                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <Trophy size={14} className="text-yellow-500" />
                                                        Lista de Ganadores
                                                    </h4>
                                                    {game.winners && game.winners.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {game.winners.map((winner: any, i: number) => (
                                                                <div key={i} className="bg-white/5 p-3 rounded-xl flex items-center justify-between border border-white/5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-xs font-bold">
                                                                            {i + 1}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-xs font-bold text-white">ID: {winner.userId?.slice(0, 8)}</div>
                                                                            <div className="text-[10px] text-slate-500 font-mono">Cartón: {winner.ticketId?.slice(0, 8)}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-sm font-black text-emerald-400">{winner.prize} Bs</div>
                                                                        <div className="text-[10px] text-slate-500">Premio</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-500 text-xs italic">No hubo ganadores registrados.</div>
                                                    )}
                                                </div>

                                                {/* Config & Stats */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <DollarSign size={14} className="text-emerald-500" />
                                                            Datos Financieros
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                                <div className="text-[10px] text-slate-500 uppercase font-bold">Recaudación (Est.)</div>
                                                                <div className="text-lg font-black text-white">
                                                                    {/* Estimado basado en precio x tickets */}
                                                                    {(game.totalTickets || 0) * (game.config?.price || 0)} Bs
                                                                </div>
                                                            </div>
                                                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                                <div className="text-[10px] text-slate-500 uppercase font-bold">Precio Cartón</div>
                                                                <div className="text-lg font-black text-white">{game.config?.price || 0} Bs</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Secuencia de Bolas</h4>
                                                        <div className="flex flex-wrap gap-1">
                                                            {game.history?.map((num: number, idx: number) => (
                                                                <div
                                                                    key={idx}
                                                                    className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300"
                                                                    title={`Bola #${idx + 1}`}
                                                                >
                                                                    {num}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
