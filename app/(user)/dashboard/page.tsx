"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Gamepad2, Coins, Zap } from "lucide-react";
import Image from "next/image";

export default function Lobby() {
    const games = [
        {
            id: "bingo",
            name: "BINGO MULTIPLAYER",
            description: "Sorteos en vivo cada 5 minutos. ¡Gana premios instantáneos!",
            status: "active",
            href: "/dashboard/bingo",
            color: "from-orange-500 to-red-600",
            icon: <Gamepad2 size={40} className="text-white" />,
            players: 128
        },
        {
            id: "slots",
            name: "SLOTS FORTUNA",
            description: "Tragamonedas clásicas con jackpots progresivos.",
            status: "coming_soon",
            href: "#",
            color: "from-purple-500 to-indigo-600",
            icon: <Coins size={40} className="text-white" />,
            players: 0
        },
        {
            id: "crash",
            name: "CRASH AVIATOR",
            description: "Retírate antes de que el avión se estrelle. Multiplicadores x100.",
            status: "coming_soon",
            href: "#",
            color: "from-emerald-500 to-teal-600",
            icon: <Zap size={40} className="text-white" />,
            players: 0
        }
    ];

    return (
        <div className="space-y-8 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">LOBBY DE JUEGOS</h1>
                    <p className="text-slate-400">Selecciona tu sala y comienza a ganar</p>
                </div>
                <Link href="/dashboard/wallet">
                    <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/40">
                        <Coins className="w-5 h-5" />
                        Mi Billetera / Recargar
                    </button>
                </Link>
            </div>

            {/* Grid de Juegos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative group overflow-hidden rounded-[2rem] border border-white/5 bg-[#161822] hover:border-white/20 transition-all duration-300 ${game.status === 'active' ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                    >
                        <Link href={game.status === 'active' ? game.href : '#'} className={game.status !== 'active' ? 'pointer-events-none' : ''}>
                            {/* Banner / Gradiente */}
                            <div className={`h-32 bg-gradient-to-br ${game.color} p-6 flex flex-col justify-between relative`}>
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                <div className="flex justify-between items-start z-10">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${game.status === 'active' ? 'bg-white text-black' : 'bg-black/30 text-white'}`}>
                                        {game.status === 'active' ? 'EN VIVO' : 'PRÓXIMAMENTE'}
                                    </span>
                                    {game.status === 'active' && (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-black/20 px-2 py-1 rounded-lg backdrop-blur-md">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            {game.players} Jugando
                                        </span>
                                    )}
                                </div>

                                <div className="z-10 transform translate-y-8 group-hover:translate-y-6 transition-transform duration-300">
                                    {game.icon}
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-6 pt-10 space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-white mb-1">{game.name}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{game.description}</p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        disabled={game.status !== 'active'}
                                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2
                      ${game.status === 'active'
                                                ? 'bg-white text-black hover:bg-slate-200 shadow-xl shadow-white/5'
                                                : 'bg-white/5 text-slate-500 border border-white/5'}`}
                                    >
                                        {game.status === 'active' ? 'JUGAR AHORA' : 'BLOQUEADO'}
                                    </button>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
