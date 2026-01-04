"use client";
import React from 'react';
import Navbar from '@/components/common/Navbar';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Send, Globe, MapPin, Clock } from 'lucide-react';

export default function ContactoPage() {
    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar />

            <main className="container mx-auto px-4 py-20 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 mb-4">
                            <MessageCircle size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic">
                            Contacto & <span className="text-indigo-500">Soporte</span>
                        </h1>
                        <p className="text-slate-400 font-medium max-w-2xl mx-auto">
                            Estamos aquí para ayudarte. Nuestro equipo técnico está disponible 24/7 para resolver tus dudas y asegurar tu mejor experiencia de juego.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Canales de Comunicación */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-8">
                                <h2 className="text-xl font-black text-white italic">Nuestros Canales</h2>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl text-indigo-400 border border-white/5">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Correo Electrónico</p>
                                            <p className="text-white font-bold text-sm">soporte@bingove.com</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl text-green-400 border border-white/5">
                                            <MessageCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">WhatsApp Business</p>
                                            <p className="text-white font-bold text-sm">+1 (555) BINGO-VE</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl text-blue-400 border border-white/5">
                                            <Send size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Comunidad Telegram</p>
                                            <p className="text-white font-bold text-sm">@BingoVeOficial</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                                        <Clock size={14} className="text-indigo-500" />
                                        <span>Respuesta promedio: &lt; 30 min</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                                        <Globe size={14} className="text-indigo-500" />
                                        <span>Soporte Global 24/7</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formulario de Contacto (Mock para propósitos profesionales) */}
                        <div className="md:col-span-2">
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12">
                                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Juan Pérez"
                                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/50 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                placeholder="tu@email.com"
                                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Asunto</label>
                                        <select className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-indigo-500/50 transition-all font-medium appearance-none cursor-pointer">
                                            <option>Problema con un Depósito</option>
                                            <option>Duda sobre los Juegos</option>
                                            <option>Soporte de Retiros</option>
                                            <option>Otros</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mensaje</label>
                                        <textarea
                                            rows={5}
                                            placeholder="¿En qué podemos ayudarte?"
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/50 transition-all font-medium resize-none"
                                        />
                                    </div>

                                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                                        <Send size={18} />
                                        Enviar Mensaje
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
