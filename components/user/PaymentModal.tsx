"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, Ticket, ShieldCheck, Wallet, Info, Clock, Trophy, Users, Copy, CheckCheck } from "lucide-react";
import { createPaymentRequest } from "@/lib/firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import CartonPlaceholder from "./CartonPlaceholder";
import { subscribeToGame, GameState } from "@/lib/firebase/game-actions";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Generate unique payment reference
const generateReference = (): string => {
    const prefix = 'BVE';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
};

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
    const { user } = useAuth();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [step, setStep] = useState(1);
    const [ticketsCount, setTicketsCount] = useState(1);
    const [paymentReference, setPaymentReference] = useState(() => generateReference()); // Initialize once immediately
    const [last4Digits, setLast4Digits] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmedTransfer, setConfirmedTransfer] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const unsub = subscribeToGame((state) => {
            setGameState(state);
        });
        return () => unsub();
    }, []);

    const PRICE_PER_TICKET = gameState?.config?.price || 100;
    const TOTAL = ticketsCount * PRICE_PER_TICKET;
    const PAYMENT_INFO = gameState?.config?.paymentInfo || {
        bank: "Venezuela (BDV)",
        phone: "0414-2747550",
        ci: "V-30826974",
        name: "Administrador"
    };

    // Copy reference to clipboard
    const copyReference = async () => {
        try {
            await navigator.clipboard.writeText(paymentReference);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleSubmit = async () => {
        if (!user || !last4Digits || !phone || !confirmedTransfer) return;
        setLoading(true);
        try {
            await createPaymentRequest(user.uid, ticketsCount, TOTAL, paymentReference, phone, last4Digits);
            // Close modal immediately
            onClose();
            // Trigger success callback (will show approval loader)
            onSuccess();
            // Reset form
            setStep(1);
            setPaymentReference(generateReference());
            setLast4Digits("");
            setPhone("");
            setConfirmedTransfer(false);
            setCopied(false);
        } catch (error) {
            console.error(error);
            alert("Error al enviar el reporte. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const ticketOptions = [
        { count: 1, label: "1 CARTÓN", desc: "Ideal para probar suerte", price: PRICE_PER_TICKET },
        { count: 2, label: "2 CARTONES", desc: "Doble oportunidad de ganar", price: PRICE_PER_TICKET * 2, recommended: true },
        { count: 3, label: "3 CARTONES", desc: "Máxima probabilidad (3x)", price: PRICE_PER_TICKET * 3 },
    ];


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                            🛒 Compra tus Cartones
                        </h2>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${step >= i ? 'w-6 bg-orange-500' : 'w-2 bg-slate-700'}`} />
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-6"
                            >
                                {/* Draw Data Info */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                                            <Clock size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Inicia en</span>
                                        </div>
                                        <div className="text-sm font-black text-white">{gameState?.config?.startTime || "Próximamente"}</div>
                                    </div>
                                    <div className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                                            <Trophy size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Premios</span>
                                        </div>
                                        <div className="text-sm font-black text-orange-500">{gameState?.config?.prizes[0] || 500} Bs Max</div>
                                    </div>
                                    <div className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                                            <Users size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Jugadores</span>
                                        </div>
                                        <div className="text-sm font-black text-white">En espera</div>
                                    </div>
                                    <div className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                                            <Ticket size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Disponibles</span>
                                        </div>
                                        <div className="text-sm font-black text-white">
                                            {gameState?.config?.maxTickets || 90}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {ticketOptions.map((opt) => (
                                        <button
                                            key={opt.count}
                                            onClick={() => setTicketsCount(opt.count)}
                                            className={`w-full group relative p-5 rounded-3xl border-2 text-left transition-all
                                            ${ticketsCount === opt.count
                                                    ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20'
                                                    : 'bg-slate-800/50 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Ticket className={ticketsCount === opt.count ? 'text-white' : 'text-slate-500'} size={18} />
                                                        <span className={`font-black tracking-tight ${ticketsCount === opt.count ? 'text-white' : 'text-slate-300'}`}>
                                                            {opt.count} CARTÓN{opt.count > 1 ? 'ES' : ''}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs ${ticketsCount === opt.count ? 'text-indigo-100' : 'text-slate-500'}`}>
                                                        {opt.desc}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-lg font-black ${ticketsCount === opt.count ? 'text-white' : 'text-slate-200'}`}>
                                                        {opt.price} Bs
                                                    </div>
                                                    {ticketsCount === opt.count && <Check className="text-white ml-auto mt-1" size={16} />}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={nextStep}
                                    className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 mt-4"
                                >
                                    CONTINUAR AL RESUMEN <ChevronRight size={18} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h3 className="text-white font-black text-xl mb-1">✅ Resumen de tu Compra</h3>
                                    <p className="text-slate-400 text-xs">Revisa tu compra antes de confirmar</p>
                                </div>

                                <CartonPlaceholder count={ticketsCount} />

                                <div className="bg-slate-800/80 p-5 rounded-3xl border border-white/5 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Precio unitario</span>
                                        <span className="text-white font-bold">{PRICE_PER_TICKET} Bs</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black border-t border-white/5 pt-3">
                                        <span className="text-white">TOTAL A PAGAR</span>
                                        <span className="text-orange-500">{TOTAL} Bs</span>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-indigo-500/20 p-4 rounded-2xl text-[10px] text-slate-500 italic text-center">
                                    ⚠️ Los números mostrados son de EJEMPLO.
                                    Tuz números reales se asignarán una vez el administrador apruebe tu pago.
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={prevStep} className="bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition-colors uppercase text-xs tracking-widest">
                                        Atrás
                                    </button>
                                    <button onClick={nextStep} className="bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 uppercase text-xs tracking-widest">
                                        Confirmar y Pagar
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-indigo-600 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4 opacity-80 uppercase text-[10px] font-black tracking-widest">
                                            <Wallet size={14} /> Datos para el Pago
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[10px] opacity-60 font-bold">MONTO EXACTO A TRANSFERIR</div>
                                                <div className="text-4xl font-black tracking-tighter">{TOTAL} Bs</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div>
                                                    <div className="text-[10px] opacity-60 font-bold">BANCO</div>
                                                    <div className="font-bold text-sm">{PAYMENT_INFO.bank}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] opacity-60 font-bold">PAGO MÓVIL</div>
                                                    <div className="font-bold text-sm">{PAYMENT_INFO.phone}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] opacity-60 font-bold">CÉDULA / RIF (V-)</div>
                                                <div className="font-bold text-sm tracking-widest">{PAYMENT_INFO.ci}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                </div>

                                {/* Reference to use in payment */}
                                <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-2xl p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">
                                                🔖 TU REFERENCIA DE PAGO
                                            </div>
                                            <div className="text-2xl font-black text-white tracking-wider">
                                                {paymentReference}
                                            </div>
                                            <div className="text-[10px] text-orange-300 mt-1">
                                                Usa esta referencia en el concepto de tu pago móvil
                                            </div>
                                        </div>
                                        <button
                                            onClick={copyReference}
                                            className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                        >
                                            {copied ? <CheckCheck size={20} /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            📌 <strong className="text-slate-400">Instrucciones:</strong> Realiza la transferencia usando la referencia <strong className="text-orange-400">{paymentReference}</strong> en el concepto. Luego ingresa los últimos 4 dígitos de tu transacción y tu teléfono.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Últimos 4 dígitos de la transacción</label>
                                        <input
                                            type="text"
                                            placeholder="0000"
                                            maxLength={4}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-orange-500 outline-none transition-colors font-bold text-center text-2xl tracking-[0.5em]"
                                            value={last4Digits}
                                            onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Teléfono de origen del pago</label>
                                        <input
                                            type="text"
                                            placeholder="0414-XXXXXXX"
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-orange-500 outline-none transition-colors font-bold"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>

                                    <label className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-2xl border border-white/5 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-white/10 bg-slate-950 text-indigo-600 focus:ring-0"
                                            checked={confirmedTransfer}
                                            onChange={(e) => setConfirmedTransfer(e.target.checked)}
                                        />
                                        <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                                            Confirmo que transferí los {TOTAL} Bs exactos.
                                        </span>
                                    </label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={prevStep} className="text-slate-500 font-bold py-4 hover:text-white transition-colors uppercase text-xs tracking-widest">
                                            Regresar
                                        </button>
                                        <button
                                            disabled={loading || !paymentReference || !phone || !last4Digits || !confirmedTransfer}
                                            onClick={handleSubmit}
                                            className="bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
                                        >
                                            {loading ? "PROCESANDO..." : "¡YA REALICÉ MI PAGO!"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Security Badge */}
                <div className="p-4 bg-slate-950/50 flex items-center justify-center gap-2 text-slate-600">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Cifrado y Protegido por BingoVE</span>
                </div>
            </motion.div>
        </div>
    );
}
