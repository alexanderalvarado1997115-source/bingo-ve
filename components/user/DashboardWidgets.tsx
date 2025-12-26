"use client";
import { useEffect, useState } from "react";
import { Ticket } from "@/utils/types";
import { motion } from "framer-motion";
import { Ticket as TicketIcon } from "lucide-react";

export function TicketList({ tickets }: { tickets: any[] }) {
    if (tickets.length === 0) {
        return (
            <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-3xl p-8 text-center">
                <TicketIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No tienes cartones activos.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket, i) => (
                <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg border-2 border-slate-200"
                >
                    <div className="flex justify-between items-center mb-2 border-b-2 border-slate-100 pb-2">
                        <span className="font-bold text-lg">Cartón #{ticket.id.slice(-4)}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACTIVO</span>
                    </div>
                    {/* Mini visual representation of the grid just for show */}
                    <div className="grid grid-cols-5 gap-1">
                        {ticket.numbers.slice(0, 15).map((num: number, idx: number) => (
                            <div key={idx} className="aspect-square bg-slate-100 rounded-md flex items-center justify-center text-xs font-bold text-slate-600">
                                {num}
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export function PaymentHistory({ payments }: { payments: any[] }) {
    if (payments.length === 0) return null;

    return (
        <div className="mt-8">
            <h3 className="text-slate-400 text-sm font-medium mb-4">Historial de Pagos</h3>
            <div className="bg-slate-800 rounded-2xl overflow-hidden">
                {payments.map((p) => (
                    <div key={p.id} className="p-4 border-b border-white/5 flex justify-between items-center last:border-0">
                        <div>
                            <div className="font-medium text-white">{p.ticketsCount} Cartones</div>
                            <div className="text-xs text-slate-500">Ref: {p.reference}</div>
                        </div>
                        <div>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize
                                ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    p.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'}`}>
                                {p.status === 'pending' ? 'Pendiente' : p.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
