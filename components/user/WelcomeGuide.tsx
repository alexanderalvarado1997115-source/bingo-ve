"use client";
import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Trophy, Clock, Zap, CheckCircle, ArrowRight, SkipForward } from "lucide-react";

interface WelcomeGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
}

export default function WelcomeGuide({ isOpen, onClose, onContinue }: WelcomeGuideProps) {

    const handleContinue = useCallback(() => {
        // Mark guide as seen
        localStorage.setItem('bingove_seen_guide', 'true');
        onContinue();
    }, [onContinue]);

    useEffect(() => {
        if (isOpen) {
            // Check if user has seen guide before
            const hasSeenGuide = localStorage.getItem('bingove_seen_guide');

            if (hasSeenGuide === 'true') {
                // Auto-skip for returning users
                const timer = setTimeout(() => {
                    handleContinue();
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [isOpen, handleContinue]);


    if (!isOpen) return null;

    const steps = [
        {
            icon: Play,
            title: "Compra tus Cartones",
            description: "Elige entre 1, 2 o 3 cartones. Realiza el pago móvil y envía la referencia.",
            color: "from-blue-600 to-indigo-600"
        },
        {
            icon: Clock,
            title: "Espera la Aprobación",
            description: "Nuestro equipo verificará tu pago. Esto toma solo unos minutos.",
            color: "from-purple-600 to-pink-600"
        },
        {
            icon: Zap,
            title: "Entra a la Sala",
            description: "Una vez aprobado, entrarás automáticamente a la sala del sorteo en vivo.",
            color: "from-orange-600 to-red-600"
        },
        {
            icon: Trophy,
            title: "¡Juega y Gana!",
            description: "Marca los números que salgan. Completa una línea horizontal y gana premios.",
            color: "from-green-600 to-emerald-600"
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-white/10 w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
                {/* Skip Button */}
                <button
                    onClick={handleContinue}
                    className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-sm"
                >
                    <SkipForward size={14} />
                    Saltar
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
                        >
                            <Zap className="text-white" size={40} />
                        </motion.div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                            ¡Bienvenido al Sorteo!
                        </h2>
                        <p className="text-white/80 text-sm">
                            Así es como funciona todo. Es muy fácil 👇
                        </p>
                    </div>
                </div>

                {/* Steps */}
                <div className="p-8 space-y-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex gap-4 items-start bg-slate-800/50 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                <step.icon className="text-white" size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        Paso {index + 1}
                                    </span>
                                </div>
                                <h3 className="text-white font-black text-lg mb-1">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                            </div>
                            <CheckCircle className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                        </motion.div>
                    ))}
                </div>

                {/* Important Notes */}
                <div className="px-8 pb-6">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                        <p className="text-xs text-orange-400 font-bold leading-relaxed">
                            ⚠️ <strong>Importante:</strong> Solo podrás ver la sala del sorteo después de que tu pago sea aprobado.
                            Asegúrate de enviar la referencia correcta para una aprobación rápida.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 pt-0 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all uppercase text-xs tracking-widest"
                    >
                        Volver
                    </button>
                    <button
                        onClick={handleContinue}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all uppercase text-xs tracking-widest"
                    >
                        Entendido, Continuar <ArrowRight size={16} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
