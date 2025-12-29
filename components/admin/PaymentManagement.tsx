"use client";
import { Check, X, RefreshCw, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface PaymentManagementProps {
    payments: any[];
    onAction: (id: string, userId: string, count: number, action: 'approve' | 'reject') => Promise<void>;
    onRefresh: () => void;
}

export default function PaymentManagement({ payments, onAction, onRefresh }: PaymentManagementProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl h-full flex flex-col"
        >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#13151f]">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Validación de Pagos</h3>
                    <p className="text-xs text-slate-500 mt-1">Revisa y aprueba las transferencias de los usuarios.</p>
                </div>
                <button
                    onClick={onRefresh}
                    className="p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors"
                    title="Actualizar lista"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar bg-[#0f111a]">
                {payments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700 animate-pulse">
                            <ShieldCheck size={40} />
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold text-lg">Todo al día</p>
                            <p className="text-slate-600 font-medium text-sm mt-1">No hay pagos pendientes por revisar en este momento.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#161822] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-8 py-5 bg-[#161822]">Usuario / Datos</th>
                                    <th className="px-8 py-5 bg-[#161822]">Referencia</th>
                                    <th className="px-8 py-5 bg-[#161822]">Detalles Compra</th>
                                    <th className="px-8 py-5 bg-[#161822] text-right">Validación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-400 text-xs font-black shadow-inner border border-white/5">
                                                    {p.userId.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white mb-0.5">{p.phone || 'Sin Teléfono'}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500 font-bold bg-slate-800/50 px-1.5 py-0.5 rounded">ID</span>
                                                        <span className="text-[10px] text-slate-500 font-mono">{p.userId}</span>
                                                    </div>
                                                    {p.name && <div className="text-[10px] text-slate-400 font-medium mt-1">{p.name}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="inline-block px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-black tracking-widest border border-orange-500/10">
                                                    {p.reference}
                                                </div>
                                                {p.last4Digits && (
                                                    <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                        <span>CONFIRMACIÓN:</span>
                                                        <span className="font-mono text-slate-400">****{p.last4Digits}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="text-xl font-black text-white flex items-baseline gap-1">
                                                    {p.amount} <span className="text-[10px] text-slate-500 font-bold uppercase">Bs</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                                                        {p.ticketsCount} Cartones
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-3 transition-all">
                                                <button
                                                    onClick={() => onAction(p.id, p.userId, p.ticketsCount, 'reject')}
                                                    className="group/btn flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/10 transition-all active:scale-95"
                                                    title="Rechazar Pago"
                                                >
                                                    <X size={18} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider hidden group-hover/btn:block">Rechazar</span>
                                                </button>
                                                <button
                                                    onClick={() => onAction(p.id, p.userId, p.ticketsCount, 'approve')}
                                                    className="group/btn flex items-center gap-2 px-6 py-3 bg-green-500 text-white hover:bg-green-400 rounded-xl border border-green-500/10 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                                                    title="Aprobar Pago"
                                                >
                                                    <Check size={18} strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">Aprobar</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
