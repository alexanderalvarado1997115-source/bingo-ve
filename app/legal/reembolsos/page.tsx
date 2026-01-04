"use client";
import React from 'react';
import Navbar from '@/components/common/Navbar';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';

export default function ReembolsosPage() {
    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar />

            <main className="container mx-auto px-4 py-20 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-3 bg-red-500/10 rounded-2xl text-red-500 mb-4">
                            <RefreshCw size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic">
                            Política de <span className="text-red-500">Reembolso</span>
                        </h1>
                        <p className="text-slate-400 font-medium">Última actualización: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <CreditCard className="text-red-500" size={20} />
                                1. Naturaleza de las Transacciones
                            </h2>
                            <p>
                                Todas las transacciones realizadas en BINGO VE a través de criptomonedas (USDT, BTC, etc.) son finales debido a la naturaleza irreversible de la tecnología blockchain. Una vez que un depósito es confirmado en la red, los fondos se acreditan automáticamente al saldo del usuario.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <AlertCircle className="text-red-500" size={20} />
                                2. Errores en el Depósito
                            </h2>
                            <p>
                                El usuario es responsable de enviar los fondos a la dirección correcta y mediante la red compatible (ej. USDT TRC20). BINGO VE no se hace responsable por fondos enviados a direcciones incorrectas o mediante redes no soportadas.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <CheckCircle className="text-red-500" size={20} />
                                3. Política de Retiro
                            </h2>
                            <p>
                                Los usuarios pueden retirar sus ganancias y saldos disponibles en cualquier momento, sujetos a una verificación de seguridad mínima. Los retiros se procesan en un plazo máximo de 24 horas hábiles tras la solicitud.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <RefreshCw className="text-red-500" size={20} />
                                4. Excepciones y Soporte
                            </h2>
                            <p>
                                En caso de fallos técnicos demostrables por parte de nuestra plataforma que afecten la acreditación de un saldo, BINGO VE realizará el ajuste correspondiente de forma manual tras verificar el hash de la transacción en el explorador de bloques.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-white/5">
                            <div className="flex items-center gap-4 p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                                <AlertCircle className="text-red-500 shrink-0" size={24} />
                                <p className="text-xs font-bold text-slate-400">
                                    Para cualquier disputa o error técnico, por favor tenga a mano su ID de transacción y contacte a nuestro equipo de soporte de inmediato.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
