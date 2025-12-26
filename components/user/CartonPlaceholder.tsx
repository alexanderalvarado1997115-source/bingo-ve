"use client";
import { motion } from "framer-motion";
import { Ticket } from "lucide-react";

export default function CartonPlaceholder({ count }: { count: number }) {
    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {[...Array(count)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[200px] aspect-[4/5] bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-3xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden"
                >
                    <div className="bg-slate-800 p-3 rounded-full mb-3 text-slate-500">
                        <Ticket size={24} />
                    </div>
                    <div className="text-slate-500 font-black text-xs uppercase tracking-tight">Cartón #{i + 1}</div>
                    <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Asignación pendiente</div>

                    {/* Fake Grid 5x5 */}
                    <div className="grid grid-cols-5 gap-1 mt-4 opacity-20">
                        {[...Array(25)].map((_, j) => (
                            <div key={j} className="w-5 h-5 bg-slate-700 rounded-md" />
                        ))}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
                </motion.div>
            ))}
        </div>
    );
}
