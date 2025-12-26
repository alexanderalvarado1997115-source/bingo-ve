"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, User, Loader2, CheckCircle2, MessageCircle } from "lucide-react";

interface WinnerFormProps {
    onSubmit: (details: { bank: string, phone: string, ci: string, name: string, whatsapp: string }) => void;
    isSubmitting: boolean;
}

export default function WinnerForm({ onSubmit, isSubmitting }: WinnerFormProps) {
    const [bank, setBank] = useState("");
    const [phone, setPhone] = useState("");
    const [ci, setCi] = useState("");
    const [name, setName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [sameAsPhone, setSameAsPhone] = useState(false);

    const handleSameAsPhone = (checked: boolean) => {
        setSameAsPhone(checked);
        if (checked) {
            setWhatsapp(phone);
        } else {
            setWhatsapp("");
        }
    };

    const handlePhoneChange = (val: string) => {
        setPhone(val);
        if (sameAsPhone) setWhatsapp(val);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ bank, phone, ci, name, whatsapp });
    };

    return (
        <div className="bg-slate-900 border-2 border-green-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />

            <div className="text-center mb-6">
                <div className="inline-block bg-green-500 text-slate-900 font-black px-4 py-1 rounded-full text-xs uppercase tracking-widest mb-3 animate-pulse">
                    ¡Felicidades, Ganaste!
                </div>
                <h3 className="text-2xl font-black text-white">Datos para tu Pago</h3>
                <p className="text-slate-400 text-xs mt-2">Ingresa tus datos de Pago Móvil para recibir tu premio de inmediato.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Banco</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-3 text-slate-500" size={16} />
                        <select
                            required
                            value={bank}
                            onChange={(e) => setBank(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-green-500 outline-none appearance-none font-bold"
                        >
                            <option value="">Selecciona tu Banco</option>
                            <option value="0102 - Banco de Venezuela">0102 - Banco de Venezuela</option>
                            <option value="0105 - Banco Mercantil">0105 - Banco Mercantil</option>
                            <option value="0108 - Banco Provincial">0108 - Banco Provincial</option>
                            <option value="0134 - Banesco">0134 - Banesco</option>
                            <option value="0114 - Bancaribe">0114 - Bancaribe</option>
                            <option value="0191 - BNC">0191 - BNC</option>
                            <option value="0163 - Banco del Tesoro">0163 - Banco del Tesoro</option>
                            <option value="0128 - Banco Caroni">0128 - Banco Caroni</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Nombre Titular</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-500" size={16} />
                        <input
                            type="text"
                            required
                            placeholder="Nombre y Apellido"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-green-500 outline-none font-bold"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Cédula</label>
                        <input
                            type="text"
                            required
                            placeholder="V-12345678"
                            value={ci}
                            onChange={(e) => setCi(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-green-500 outline-none font-bold text-center"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Teléfono Pago Móvil</label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                type="tel"
                                required
                                placeholder="0414123..."
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-green-500 outline-none font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="text-green-500" size={16} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tu WhatsApp (Para el Grupo)</span>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sameAsPhone}
                                onChange={(e) => handleSameAsPhone(e.target.checked)}
                                className="accent-green-500"
                            />
                            <span>Es el mismo número del Pago Móvil</span>
                        </label>

                        <input
                            type="tel"
                            required
                            placeholder="0412..."
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            disabled={sameAsPhone}
                            className={`w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-green-500 outline-none font-bold ${sameAsPhone ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                        *Usaremos este número para que la comunidad te felicite.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-green-500/20 transform active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 mt-4"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" /> ENVIANDO...
                        </>
                    ) : (
                        "RECIBIR PAGO AHORA"
                    )}
                </button>
            </form>
        </div>
    );
}
