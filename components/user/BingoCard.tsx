"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCircle, Target, Trophy, Star } from "lucide-react";
import confetti from "canvas-confetti";

interface BingoCardProps {
    id: string;
    numbers: number[];
    drawnNumbers: number[];
    onStateChange?: (id: string, isWinner: boolean, missing: number) => void;
    hasWon?: boolean;
}

export default function BingoCard({ id, numbers, drawnNumbers, onStateChange, hasWon = false }: BingoCardProps) {
    const [marked, setMarked] = useState<number[]>([0]);
    const [isWinner, setIsWinner] = useState(false);
    const [missingCount, setMissingCount] = useState(24);

    // Reconstruct 5x5 Matrix from flat array or props
    const gridNumbers: number[] = [];
    if (numbers.length === 24) {
        // Insert 0 at index 12
        gridNumbers.push(...numbers.slice(0, 12), 0, ...numbers.slice(12));
    } else if (numbers.length === 25) {
        gridNumbers.push(...numbers);
    } else {
        gridNumbers.push(...numbers);
    }

    // Check for win condition - NOW STRICTLY 25 NUMBERS (FULL HOUSE)
    const checkWinCondition = useCallback((currentMarked: number[]) => {
        const fullHouse = gridNumbers.every(num => currentMarked.includes(num));
        return fullHouse;
    }, [gridNumbers]);

    const getMissingCount = useCallback((currentMarked: number[]) => {
        return gridNumbers.filter(num => !currentMarked.includes(num)).length;
    }, [gridNumbers]);

    useEffect(() => {
        const saved = localStorage.getItem(`marks_${id}`);
        if (saved) {
            const loadedMarked = JSON.parse(saved);
            setMarked(loadedMarked);
        } else {
            setMarked([0]);
        }
    }, [id]);

    // Update isWinner whenever marked changes
    useEffect(() => {
        const win = checkWinCondition(marked);
        const missing = getMissingCount(marked);

        setIsWinner(win);
        setMissingCount(missing);

        if (onStateChange) {
            onStateChange(id, win, missing);
        }
    }, [marked, checkWinCondition, getMissingCount, id]);

    const toggleMark = (num: number) => {
        if (num === 0) return; // Cannot toggle free space

        // Only allow marking if drawn
        if (!drawnNumbers.includes(num)) return;

        let newMarked;
        if (marked.includes(num)) {
            newMarked = marked.filter(n => n !== num);
        } else {
            newMarked = [...marked, num];
        }

        setMarked(newMarked);
        localStorage.setItem(`marks_${id}`, JSON.stringify(newMarked));
    };

    // Proximity visuals logic
    const isClose = missingCount <= 3 && !isWinner;
    const isExtremelyClose = missingCount === 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: 0,
                scale: isExtremelyClose ? [1, 1.02, 1] : 1,
            }}
            transition={{
                duration: 0.5,
                scale: { repeat: Infinity, duration: 1 }
            }}
            className={`
                bg-slate-800/80 border rounded-[2.8rem] p-4 shadow-2xl relative overflow-hidden group transition-all duration-700
                ${hasWon ? 'border-green-500 shadow-green-500/20' :
                    isExtremelyClose ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.3)]' :
                        isClose ? 'border-indigo-500/50 shadow-indigo-500/10' : 'border-white/5'}
            `}
        >
            {/* Pulsing Aura for close cards */}
            <AnimatePresence>
                {isClose && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 bg-gradient-to-t pointer-events-none opacity-20
                        ${isExtremelyClose ? 'from-orange-600/40' : 'from-indigo-600/20'}`}
                    />
                )}
            </AnimatePresence>
            {/* Glossy Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className={`relative bg-slate-800 rounded-3xl p-4 border-2 shadow-xl transition-all duration-300 ${isWinner ? 'border-yellow-400 shadow-yellow-500/50 scale-[1.02] z-10' : 'border-slate-700'}`}>
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CARTÓN BINGO</div>
                        <div className="text-xs font-mono text-slate-400">ID: {id.slice(-6).toUpperCase()}</div>
                    </div>
                    {/* Status Badge */}
                    {isWinner && !hasWon && (
                        <div className="px-3 py-1 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-green-500/20">
                            LISTO PARA GANAR
                        </div>
                    )}
                    {isExtremelyClose && (
                        <div className="px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg animate-pulse">
                            ¡A SÓLO 1!
                        </div>
                    )}
                </div>

                {/* Bingo Header */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                    {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
                        <div key={i} className="text-center font-black text-orange-500 text-sm mb-1">{letter}</div>
                    ))}
                </div>

                {/* Numbers Grid 5x5 */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                    {gridNumbers.map((num, i) => {
                        const isFree = num === 0;
                        const isMarked = marked.includes(num);
                        const isDrawn = drawnNumbers.includes(num);

                        return (
                            <button
                                key={i}
                                onClick={() => toggleMark(num)}
                                disabled={isFree || !isDrawn || hasWon}
                                className={`
                                    relative aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200
                                    ${isFree
                                        ? 'bg-orange-500 text-white cursor-default'
                                        : isMarked
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                                            : isDrawn
                                                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 active:scale-95'
                                                : 'bg-slate-800/30 text-slate-500 cursor-not-allowed'
                                    }
                                    ${hasWon && 'cursor-not-allowed'}
                                `}
                            >
                                {isFree ? <Star size={14} fill="currentColor" /> : num}
                                {isMarked && !isFree && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-0.5 right-0.5"
                                    >
                                        <Check size={8} className="text-orange-200" />
                                    </motion.div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Stats Info */}
                {!isWinner && !hasWon && (
                    <div className="flex justify-between items-center mb-0 px-1 opacity-60">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                            {isClose ? '¡Casi lo tienes!' : 'En camino...'}
                        </span>
                        <span className="text-[10px] font-black text-white">{25 - missingCount}/25</span>
                    </div>
                )}

                {/* Already Claimed Badge */}
                {hasWon && (
                    <div className="w-full bg-green-500/20 border border-green-500 text-green-400 font-bold py-3 rounded-xl text-center uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> Bingo Validado
                    </div>
                )}
            </div>
        </motion.div >
    );
}
