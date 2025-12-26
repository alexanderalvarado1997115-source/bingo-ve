"use client";
import { motion } from "framer-motion";
import { Play, Clock, Zap, ShoppingCart, CheckCircle, Trophy, Users } from "lucide-react";
import { GameState } from "@/lib/firebase/game-actions";

interface DrawStatusCardProps {
    gameState: GameState | null;
    onEnterDraw: () => void;
    ticketsCount?: number;
}

export default function DrawStatusCard({ gameState, onEnterDraw, ticketsCount = 0 }: DrawStatusCardProps) {

    // No active draw
    if (!gameState || gameState.status === 'waiting' || gameState.status === 'finished') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
            >
                <div className="bg-slate-800 rounded-[2.5rem] border border-white/5 p-12 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="text-slate-500" size={40} />
                    </div>

                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                        No hay sorteo activo
                    </h2>

                    <p className="text-slate-400 text-sm mb-6">
                        Próximo sorteo: <span className="text-white font-bold">Hoy a las {gameState?.config?.startTime || '8:00 PM'}</span>
                    </p>

                    <div className="inline-block bg-slate-700/30 px-6 py-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                            Te notificaremos cuando esté disponible
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Countdown or Active draw
    const isCountdown = gameState.status === 'countdown';
    const isActive = gameState.status === 'active';

    // Calculate countdown time
    let timeLeft = '';
    if (isCountdown && gameState.countdownStartTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - gameState.countdownStartTime) / 1000);
        const remaining = Math.max(0, 300 - elapsed);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        timeLeft = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const howItWorks = [
        { icon: ShoppingCart, text: "Compra 1-3 cartones (100 Bs c/u)", color: "text-blue-400" },
        { icon: Clock, text: "Espera confirmación (2-5 min)", color: "text-purple-400" },
        { icon: Zap, text: "Juega en vivo automáticamente", color: "text-orange-400" },
        { icon: Trophy, text: "Gana y retira al instante", color: "text-green-400" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
        >
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] border border-white/10 p-12 text-center shadow-2xl relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
                        <Zap className="text-white" size={48} />
                    </div>

                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                        🎰 Sorteo Activo
                    </h2>

                    {isCountdown && (
                        <div className="mb-6">
                            <p className="text-white/80 text-sm mb-3">Inicia en:</p>
                            <div className="text-6xl font-black text-white mb-2 font-mono">
                                {timeLeft}
                            </div>
                        </div>
                    )}

                    {isActive && (
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-400/30 mb-4">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-xs font-black uppercase tracking-widest">En Vivo</span>
                            </div>
                        </div>
                    )}

                    {/* User tickets status */}
                    {ticketsCount > 0 && (
                        <div className="mb-4 inline-flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-400/30">
                            <CheckCircle size={16} className="text-green-400" />
                            <span className="text-green-400 text-xs font-black uppercase tracking-widest">
                                Tienes {ticketsCount} {ticketsCount === 1 ? 'cartón' : 'cartones'}
                            </span>
                        </div>
                    )}

                    {/* Main CTA Button */}
                    <button
                        onClick={onEnterDraw}
                        className="group relative bg-white hover:bg-slate-100 text-slate-900 font-black py-6 px-12 rounded-2xl text-lg uppercase tracking-wider shadow-2xl transition-all transform hover:scale-105 active:scale-95 mb-8"
                    >
                        <span className="flex items-center justify-center gap-3">
                            <Play size={24} fill="currentColor" />
                            {ticketsCount > 0 ? 'ENTRAR A LA SALA' : 'INGRESAR AL SORTEO'}
                        </span>
                    </button>

                    {/* Info */}
                    <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Precio</p>
                            <p className="text-white text-lg font-black">{gameState.config?.price || 100} Bs</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">1er Premio</p>
                            <p className="text-white text-lg font-black">{gameState.config?.prizes?.[0] || 500} Bs</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Cartones</p>
                            <p className="text-white text-lg font-black">{gameState.config?.totalTickets || 0}/{gameState.config?.maxTickets || 90}</p>
                        </div>
                    </div>

                    {/* How it works */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-4">💡 Cómo funciona</p>
                        <div className="grid grid-cols-2 gap-3">
                            {howItWorks.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-left">
                                    <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-black text-white/60">{index + 1}</span>
                                    </div>
                                    <span className="text-[11px] text-white/80">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

