"use client";
import React from 'react';
import Navbar from '@/components/common/Navbar';
import { motion } from 'framer-motion';
import { Shield, FileText, CheckCircle } from 'lucide-react';

export default function TerminosPage() {
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
                        <div className="inline-flex p-3 bg-orange-500/10 rounded-2xl text-orange-500 mb-4">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic">
                            Términos de <span className="text-orange-500">Servicio</span>
                        </h1>
                        <p className="text-slate-400 font-medium">Última actualización: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <CheckCircle className="text-orange-500" size={20} />
                                1. Aceptación de los Términos
                            </h2>
                            <p>
                                Al acceder y utilizar la plataforma BINGO VE, el usuario acepta de manera íntegra y sin reservas los presentes Términos de Servicio. Si no está de acuerdo con alguna de las disposiciones aquí establecidas, deberá abstenerse de utilizar el sitio.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <CheckCircle className="text-orange-500" size={20} />
                                2. Requisitos de Usuario
                            </h2>
                            <p>
                                El uso de esta plataforma está restringido exclusivamente a personas mayores de 18 años (o la mayoría de edad legal en su jurisdicción). BINGO VE se reserva el derecho de solicitar pruebas de identidad y edad en cualquier momento para verificar el cumplimiento de este requisito.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <CheckCircle className="text-orange-500" size={20} />
                                3. Naturaleza de los Juegos
                            </h2>
                            <p>
                                BINGO VE es una plataforma de juegos de azar y habilidad. El usuario reconoce que existe un riesgo inherente de pérdida de capital al participar en los juegos. La plataforma garantiza la aleatoriedad y transparencia a través de su motor de sorteos automatizado.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <CheckCircle className="text-orange-500" size={20} />
                                4. Responsabilidad y Riesgo
                            </h2>
                            <p>
                                El usuario es el único responsable de la gestión de sus fondos y de la seguridad de su cuenta. BINGO VE no se hace responsable por pérdidas derivadas de negligencia en la protección de credenciales de acceso o decisiones de juego del usuario.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <CheckCircle className="text-orange-500" size={20} />
                                5. Modificaciones del Servicio
                            </h2>
                            <p>
                                BINGO VE se reserva el derecho de modificar, suspender o interrumpir cualquier aspecto del servicio en cualquier momento sin previo aviso, con el fin de realizar mejoras técnicas o de seguridad.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-white/5">
                            <div className="flex items-center gap-4 p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                                <Shield className="text-orange-500 shrink-0" size={24} />
                                <p className="text-xs font-bold text-slate-400">
                                    Promovemos el Juego Responsable. Si siente que necesita ayuda, por favor contacte con organizaciones especializadas.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
