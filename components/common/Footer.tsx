"use client";
import Link from 'next/link';
import { Shield, Mail, Globe, Lock, RefreshCw, Smartphone } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative z-10 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="text-3xl font-black italic bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            BINGO<span className="text-white">VE</span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            La plataforma líder en entretenimiento digital con sorteos en tiempo real y transacciones seguras.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-slate-400">
                                <Shield size={18} />
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-slate-400">
                                <Lock size={18} />
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-slate-400">
                                <Smartphone size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Legal Section */}
                    <div className="space-y-6">
                        <h4 className="text-white font-black uppercase tracking-widest text-xs">Cumplimiento</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/legal/terminos" className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2">
                                    <Globe size={14} /> Términos de Servicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/privacidad" className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2">
                                    <Lock size={14} /> Política de Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/reembolsos" className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2">
                                    <RefreshCw size={14} /> Política de Reembolso
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Section */}
                    <div className="space-y-6">
                        <h4 className="text-white font-black uppercase tracking-widest text-xs">Soporte</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/legal/contacto" className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-2">
                                    <Mail size={14} /> Contacto & Soporte
                                </Link>
                            </li>
                            <li>
                                <span className="text-slate-400 text-sm block">Soporte 24/7 vía WhatsApp</span>
                            </li>
                            <li>
                                <span className="text-slate-400 text-sm block">Comunidad de Telegram</span>
                            </li>
                        </ul>
                    </div>

                    {/* Platform Info */}
                    <div className="space-y-6">
                        <h4 className="text-white font-black uppercase tracking-widest text-xs">Plataforma</h4>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mb-2">Estado del Sistema</p>
                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                - Operativo
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <span>© {currentYear} BINGO VE - Juego Responsable</span>
                    <div className="flex gap-6">
                        <span>+18 Años</span>
                        <span>Juega con Responsabilidad</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
