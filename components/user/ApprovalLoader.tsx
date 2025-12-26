"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, XCircle, CheckCircle } from "lucide-react";

interface ApprovalLoaderProps {
    isVisible: boolean;
    status: 'pending' | 'approved' | 'rejected';
    onRetry?: () => void;
    onApproved?: () => void;
}

export default function ApprovalLoader({ isVisible, status, onRetry, onApproved }: ApprovalLoaderProps) {

    useEffect(() => {
        if (status === 'approved' && onApproved) {
            // Small delay to show success state before closing
            setTimeout(() => {
                onApproved();
            }, 1500);
        }
    }, [status, onApproved]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl"
            >
                <div className="max-w-md w-full mx-4">
                    {status === 'pending' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-800 rounded-[2.5rem] border border-white/10 p-12 text-center shadow-2xl"
                        >
                            {/* Animated Spinner */}
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-4 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                                <Loader2 className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={32} />
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                                ⏳ Validando tu pago
                            </h2>

                            <p className="text-slate-400 text-sm mb-2">
                                Tu pago está siendo verificado por nuestro equipo.
                            </p>

                            {/* Estimated time */}
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-6">
                                <p className="text-indigo-400 text-sm font-bold">
                                    ⏱️ Tiempo estimado: 2-5 minutos
                                </p>
                                <p className="text-indigo-300/60 text-xs mt-1">
                                    Recibirás una notificación automática
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-2 bg-slate-700/50 px-6 py-3 rounded-2xl border border-white/5">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    No cierres esta ventana
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {status === 'approved' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-[2.5rem] border border-white/20 p-12 text-center shadow-2xl"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm"
                            >
                                <CheckCircle className="text-white" size={48} />
                            </motion.div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
                                ¡Pago Aprobado!
                            </h2>

                            <p className="text-white/90 text-sm mb-2">
                                Tus cartones están listos
                            </p>
                            <p className="text-white/70 text-xs">
                                Redirigiendo al sorteo...
                            </p>
                        </motion.div>
                    )}

                    {status === 'rejected' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-800 rounded-[2.5rem] border border-red-500/20 p-12 text-center shadow-2xl"
                        >
                            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                <XCircle className="text-red-500" size={48} />
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                                Pago no verificado
                            </h2>

                            <p className="text-slate-400 text-sm mb-2">
                                Tu pago no pudo ser verificado.
                            </p>
                            <p className="text-slate-500 text-xs mb-8">
                                Por favor, revisa los datos e intenta nuevamente.
                            </p>

                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 text-sm uppercase tracking-[0.2em]"
                                >
                                    Intentar de Nuevo
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
