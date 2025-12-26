"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, PartyPopper } from "lucide-react";

export default function WinnersDisplay({ winners }: { winners: any[] }) {
    if (!winners || winners.length === 0) return null;

    return (
        <div className="mt-8">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-500" /> ¡Ganadores del Sorteo!
            </h3>
            <div className="space-y-3">
                <AnimatePresence>
                    {winners.map((w, i) => (
                        <motion.div
                            key={w.ticketId}
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ type: "spring", delay: i * 0.1 }}
                            className="bg-gradient-to-r from-yellow-500/20 to-transparent border-l-4 border-yellow-500 p-4 rounded-r-xl flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-yellow-500/30">
                                    {w.prizePosition}º
                                </div>
                                <div>
                                    <div className="text-white font-bold">Ganador Detectado</div>
                                    <div className="text-xs text-yellow-500 uppercase font-black">Ticket: #{w.ticketId.slice(-6)}</div>
                                </div>
                            </div>
                            <PartyPopper className="text-yellow-500 animate-bounce" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
