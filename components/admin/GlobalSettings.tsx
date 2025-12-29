"use client";
import { useState, useEffect } from "react";
import { Save, RefreshCw, AlertTriangle, Settings, DollarSign, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { updateGameConfig, fullResetSystem, GameState } from "@/lib/firebase/game-actions";
import { updateFinancialConfig } from "@/lib/firebase/financial-actions";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "@/lib/firebase/config";

export default function GlobalSettings() {
    const [config, setConfig] = useState<any>({
        price: 0,
        paymentInfo: { bank: "", phone: "", ci: "", name: "" },
        prizes: [0, 0, 0, 0, 0]
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const configRef = ref(realtimeDb, "game/active/config");
        const unsub = onValue(configRef, (snapshot) => {
            if (snapshot.exists()) {
                setConfig(snapshot.val());
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const handleChange = (section: string, field: string, value: any) => {
        if (section === 'root') {
            setConfig((prev: any) => ({ ...prev, [field]: value }));
        } else if (section === 'paymentInfo') {
            setConfig((prev: any) => ({
                ...prev,
                paymentInfo: { ...prev.paymentInfo, [field]: value }
            }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update Game Config
            await updateGameConfig({
                price: Number(config.price),
                paymentInfo: config.paymentInfo
            });

            // Update Financial Config (Sync)
            await updateFinancialConfig({
                ticketPrice: Number(config.price)
            });

            alert("Configuración guardada correctamente");
        } catch (error) {
            console.error(error);
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleSystemReset = async () => {
        if (confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsto reiniciará TODO el sistema:\n- Borrará cartones actuales\n- Limpiará la lista de ganadores\n- Reseteará el sorteo\n\nNo se puede deshacer.")) {
            await fullResetSystem();
            alert("Sistema reiniciado correctamente.");
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Cargando configuración...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl h-full flex flex-col"
        >
            <div className="p-8 border-b border-white/5 bg-[#13151f] flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Settings className="text-slate-400" />
                        Configuración Global
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 pl-9">Ajustes críticos del sistema y economía.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-8 space-y-8">
                {/* Economy Section */}
                <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <DollarSign size={18} /> Economía del Juego
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Precio del Cartón (Bs)</label>
                            <input
                                type="number"
                                value={config.price}
                                onChange={(e) => handleChange('root', 'price', e.target.value)}
                                className="w-full bg-[#0a0b10] border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-indigo-500 outline-none transition-colors"
                            />
                            <p className="text-[10px] text-slate-600 mt-2">
                                Esto actualizará automáticamente el precio en la web y el bot.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Payment Info Section */}
                <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Smartphone size={18} /> Datos Pago Móvil
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Banco</label>
                            <input
                                type="text"
                                value={config.paymentInfo?.bank || ''}
                                onChange={(e) => handleChange('paymentInfo', 'bank', e.target.value)}
                                className="w-full bg-[#0a0b10] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
                                placeholder="Ej: Venezuela (BDV)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Cédula</label>
                            <input
                                type="text"
                                value={config.paymentInfo?.ci || ''}
                                onChange={(e) => handleChange('paymentInfo', 'ci', e.target.value)}
                                className="w-full bg-[#0a0b10] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
                                placeholder="Ej: V-12345678"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Teléfono</label>
                            <input
                                type="text"
                                value={config.paymentInfo?.phone || ''}
                                onChange={(e) => handleChange('paymentInfo', 'phone', e.target.value)}
                                className="w-full bg-[#0a0b10] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
                                placeholder="Ej: 0414-0000000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Titular</label>
                            <input
                                type="text"
                                value={config.paymentInfo?.name || ''}
                                onChange={(e) => handleChange('paymentInfo', 'name', e.target.value)}
                                className="w-full bg-[#0a0b10] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
                                placeholder="Nombre completo"
                            />
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 mt-8">
                    <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <AlertTriangle size={18} /> Zona de Peligro
                    </h4>
                    <div className="flex items-center justify-between">
                        <div>
                            <h5 className="font-bold text-white mb-1">Reinicio de Fábrica del Sorteo</h5>
                            <p className="text-xs text-slate-400">Úsalo solo si el juego se traba o necesitas empezar desde cero absoluto.</p>
                        </div>
                        <button
                            onClick={handleSystemReset}
                            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-colors shadow-lg shadow-red-500/20"
                        >
                            <RefreshCw size={16} />
                            Reset Total
                        </button>
                    </div>
                </section>
            </div>
        </motion.div>
    );
}
