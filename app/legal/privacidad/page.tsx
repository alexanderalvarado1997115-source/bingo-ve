"use client";
import React from 'react';
import Navbar from '@/components/common/Navbar';
import { motion } from 'framer-motion';
import { Lock, Eye, ShieldCheck, Database } from 'lucide-react';

export default function PrivacidadPage() {
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
                        <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-4">
                            <Lock size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic">
                            Política de <span className="text-blue-500">Privacidad</span>
                        </h1>
                        <p className="text-slate-400 font-medium">Última actualización: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-8 text-slate-300 leading-relaxed text-sm md:text-base">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <Eye className="text-blue-500" size={20} />
                                1. Recolección de Información
                            </h2>
                            <p>
                                BINGO VE recopila información necesaria para el funcionamiento de la plataforma, incluyendo: datos de registro (nombre, correo electrónico), información técnica (dirección IP, tipo de navegador) y datos de transacciones. Nunca almacenamos llaves privadas o claves de acceso directas a sus billeteras externas.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <Database className="text-blue-500" size={20} />
                                2. Uso de los Datos
                            </h2>
                            <p>
                                Sus datos son utilizados exclusivamente para: procesar sus transacciones de depósito y retiro, verificar su identidad para prevenir fraude (KYC), y mejorar la experiencia de usuario personalizada en nuestros juegos.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <ShieldCheck className="text-blue-500" size={20} />
                                3. Seguridad de la Información
                            </h2>
                            <p>
                                Implementamos protocolos de seguridad industrial, incluyendo cifrado SSL/TLS de 256 bits y autenticación robusta mediante Firebase Auth, para garantizar que su información personal y sus fondos estén protegidos contra accesos no autorizados.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <Lock className="text-blue-500" size={20} />
                                4. Cookies y Tecnologías de Seguimiento
                            </h2>
                            <p>
                                Utilizamos cookies esenciales para mantener sus sesiones activas y recordar sus preferencias de juego. Puede gestionar el uso de cookies desde la configuración de su navegador, aunque esto puede afectar el funcionamiento de algunas características del sitio.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-white/5">
                            <div className="flex items-center gap-4 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                <Lock className="text-blue-500 shrink-0" size={24} />
                                <p className="text-xs font-bold text-slate-400">
                                    Sus datos están protegidos bajo estándares internacionales. No vendemos ni compartimos su información con terceros para fines publicitarios.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
