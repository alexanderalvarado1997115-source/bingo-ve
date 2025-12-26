"use client";
import { useState, useEffect, useRef } from "react";
import { subscribeToGame, GameState, claimBingo, submitWinnerPaymentDetails } from "@/lib/firebase/game-actions";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Ticket, Loader2, CheckCircle2, DollarSign, Trophy, Volume2, VolumeX, Zap, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import BingoCard from "./BingoCard";
import { useAuth } from "@/components/providers/AuthProvider";
import WinnerForm from "./WinnerForm";
import { useAudio } from "@/hooks/use-audio";
import confetti from "canvas-confetti";
import { checkWinner } from "@/utils/game-logic";

interface LiveDrawViewProps {
    gameState?: GameState | null;
    tickets: any[];
    onExit: () => void;
    onBuyTickets: () => void;
}

export default function LiveDrawView({ gameState: initialGameState, tickets, onExit, onBuyTickets }: LiveDrawViewProps) {
    const { user } = useAuth();
    const [gameState, setGameState] = useState<GameState | null>(initialGameState || null);
    const [countdownLocal, setCountdownLocal] = useState(300);
    const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
    const { playSound, isMuted, toggleMute } = useAudio();
    const lastNumberRef = useRef<number | null>(null);

    // Dynamic State for Multi-Card Strategy
    const [ticketStats, setTicketStats] = useState<Record<string, { isWinner: boolean, missing: number }>>({});
    const [pressureMessage, setPressureMessage] = useState("Sorteo en curso...");

    // Sound logic references
    const hasPlayedNearWin = useRef(false);

    useEffect(() => {
        if (!initialGameState) {
            const unsub = subscribeToGame((state) => {
                setGameState(state);
            });
            return () => unsub();
        } else {
            setGameState(initialGameState);
        }
    }, [initialGameState]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState?.status === 'countdown' && gameState.countdownStartTime) {
            timer = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - gameState.countdownStartTime!) / 1000);
                const remaining = Math.max(0, 300 - elapsed);
                setCountdownLocal(remaining);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState]);

    const handleCardStateChange = (id: string, isWinner: boolean, missing: number) => {
        setTicketStats(prev => ({ ...prev, [id]: { isWinner, missing } }));
    };

    const handleBingo = async () => {
        if (!user) return;

        // Find all winning cards for THIS user
        const winners = tickets.filter(t => ticketStats[t.id]?.isWinner);

        if (winners.length === 0) {
            alert("¡Aún no tienes un cartón lleno!");
            return;
        }

        const claims = winners.map(t => ({ ticketId: t.id, numbers: t.numbers }));

        console.log("¡RECLAMO DE BINGO MULTIPLE!", claims.length);
        const res = await claimBingo(user.uid, claims);

        if (res.success) {
            playSound('win');
        }
    };

    // --- Neuromarketing Logic: Tension Barometer ---
    useEffect(() => {
        if (gameState?.status !== 'active') return;

        const allMissing = Object.values(ticketStats).map(s => s.missing);
        const minMissing = Math.min(...allMissing, 25);

        if (minMissing === 1) {
            setPressureMessage("🔥 ¡TENSIÓN MÁXIMA! Estás a un solo paso de la gloria.");
        } else if (minMissing <= 3) {
            setPressureMessage("⚠️ ¡ATENCIÓN! El sistema detecta ganadores inminentes.");
        } else if (gameState.history?.length > 30) {
            setPressureMessage("⏳ El botín está buscando dueño. ¿Serás tú?");
        } else {
            setPressureMessage("🎰 Sorteo en curso... La suerte está en el aire.");
        }
    }, [ticketStats, gameState?.status, gameState?.history?.length]);

    const handlePaymentSubmit = async (details: { bank: string, phone: string, ci: string, name: string, whatsapp: string }) => {
        if (!user || !gameState) return;

        // Find the specific winning ticket for this user
        const myWin = gameState.winners?.find(w => w.userId === user.uid && w.verified && (!w.payoutStatus || w.payoutStatus === 'pending_info'));

        if (myWin) {
            setIsSubmittingDetails(true);
            await submitWinnerPaymentDetails(myWin.ticketId, details);
            setIsSubmittingDetails(false);
        }
    };

    // --- Sound Effects Logic ---
    useEffect(() => {
        if (gameState?.currentNumber && gameState.currentNumber !== lastNumberRef.current) {
            if (gameState.status === 'active') {
                playSound('draw');
            }
            lastNumberRef.current = gameState.currentNumber;
        }
    }, [gameState?.currentNumber, gameState?.status, playSound]);

    useEffect(() => {
        const myWin = gameState?.winners?.find(w => w.userId === user?.uid && w.verified);
        if (myWin && myWin.payoutStatus === 'pending_info') {
            playSound('win');
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22c55e', '#ffffff', '#eab308']
            });
        }
    }, [gameState?.winners, user?.uid, playSound]);

    if (!gameState) return null;

    // Check if user is a verified winner and needs action
    const myWinnerData = gameState.winners?.find(w => w.userId === user?.uid && w.verified);
    const showPayoutModal = !!myWinnerData;
    const lastWinner = gameState.winners?.[gameState.winners.length - 1];

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const myWinners = Object.values(ticketStats).filter(s => s.isWinner).length;
    const canClaim = myWinners > 0 && gameState?.status === 'active';

    return (
        <div className="space-y-8 relative pb-32">
            {/* PRESSURE BAROMETER (Neuromarketing Sticky Top) */}
            <AnimatePresence>
                {gameState.status === 'active' && (
                    <motion.div
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        exit={{ y: -100 }}
                        className="fixed top-20 left-0 right-0 z-40 px-4"
                    >
                        <div className="max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between overflow-hidden">
                            <div className="absolute inset-0 bg-indigo-500/5 transition-colors" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                                    <Zap size={20} className={myWinners > 0 ? 'animate-bounce' : 'animate-pulse'} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Radar de Premios</div>
                                    <div className="text-sm font-black text-white italic">{pressureMessage}</div>
                                </div>
                            </div>
                            <div className="text-right relative z-10 hidden sm:block">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Botín en Juego</div>
                                <div className="text-lg font-black text-orange-500">500 Bs</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mute Toggle Floating Button */}
            <button
                onClick={toggleMute}
                className="fixed bottom-6 right-6 z-[60] bg-slate-800/80 hover:bg-slate-700 text-white p-4 rounded-full shadow-2xl backdrop-blur-md border border-white/10 transition-all active:scale-90"
            >
                {isMuted ? <VolumeX size={24} className="text-red-400" /> : <Volume2 size={24} className="text-green-400" />}
            </button>

            {/* PAYOUT OVERLAY MODAL (Only for the Winner) */}
            <AnimatePresence>
                {showPayoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
                    >
                        {/* CASE 1: PENDING INFO - SHOW FORM */}
                        {(!myWinnerData.payoutStatus || myWinnerData.payoutStatus === 'pending_info') && (
                            <WinnerForm onSubmit={handlePaymentSubmit} isSubmitting={isSubmittingDetails} />
                        )}

                        {/* CASE 2: PROCESSING - SHOW LOADER */}
                        {myWinnerData.payoutStatus === 'processing_payment' && (
                            <div className="text-center space-y-6">
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                                    <div className="bg-slate-900 border-2 border-green-500 rounded-full p-8 relative z-10">
                                        <Loader2 className="animate-spin text-green-500" size={64} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Procesando tu Pago...</h3>
                                    <p className="text-slate-400 max-w-xs mx-auto mt-2">
                                        El administrador está verificando tus datos y enviando el pago móvil. Por favor espera, esto suele ser rápido.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* CASE 3: PAID - SHOW SUCCESS */}
                        {myWinnerData.payoutStatus === 'paid' && (
                            <div className="bg-green-600 rounded-[2rem] p-8 text-center max-w-sm mx-auto shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/confetti.png')] opacity-30 bg-cover mix-blend-overlay" />

                                <div className="relative z-10 space-y-6">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                                        <CheckCircle2 className="text-green-600" size={40} />
                                    </div>

                                    <div>
                                        <h3 className="text-3xl font-black text-white">¡PAGO ENVIADO!</h3>
                                        <p className="text-green-100 font-bold mt-2">Tu premio ha sido transferido exitosamente.</p>
                                    </div>

                                    <div className="bg-black/20 rounded-xl p-4 text-sm text-green-50 text-left space-y-2">
                                        <div className="flex justify-between">
                                            <span className="opacity-75">Banco:</span>
                                            <span className="font-bold">{myWinnerData.paymentDetails?.bank.split('-')[0]}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="opacity-75">Telf:</span>
                                            <span className="font-bold">{myWinnerData.paymentDetails?.phone}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={onExit}
                                        className="w-full bg-white text-green-700 font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-green-50 transition-colors shadow-lg"
                                    >
                                        Volver al Inicio
                                    </button>

                                    <a
                                        href="https://wa.me/584142747550"
                                        target="_blank"
                                        className="inline-block text-[10px] text-green-200 uppercase font-bold tracking-wider hover:text-white transition-colors underline decoration-green-500/50 underline-offset-4"
                                    >
                                        ¿Dudas? Contacta al Admin por WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Draw Area / Results Area */}
            <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-1 shadow-2xl overflow-hidden relative min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="bg-slate-800/40 rounded-[2.8rem] p-8 md:p-12 h-full flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {/* STATE: COUNTDOWN */}
                        {gameState.status === 'countdown' && (
                            <motion.div
                                key="countdown"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="text-center space-y-8"
                            >
                                <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-6 py-2 rounded-full border border-orange-500/20">
                                    <Radio size={16} className="animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">En Espera del Sorteo</span>
                                </div>

                                <div className="relative inline-block">
                                    <motion.div
                                        className="text-[8rem] md:text-[12rem] font-black text-white leading-none tracking-tighter drop-shadow-2xl"
                                        animate={{ scale: [1, 1.02, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        {formatTime(countdownLocal)}
                                    </motion.div>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-orange-500"
                                            animate={{ width: `${(countdownLocal / 300) * 100}%` }}
                                            transition={{ duration: 1, ease: "linear" }}
                                        />
                                    </div>
                                </div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                                    El bingo comenzará automáticamente
                                </p>
                            </motion.div>
                        )}

                        {/* STATE: FINISHED (LOSER VIEW) */}
                        {gameState.status === 'finished' && (
                            <motion.div
                                key="finished"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-6"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20" />
                                    <Trophy size={80} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
                                </div>

                                <div>
                                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-2">¡Sorteo Finalizado!</h2>
                                    <p className="text-slate-400 font-medium">Ya tenemos un ganador para esta ronda.</p>
                                </div>

                                {lastWinner && (
                                    <div className="w-full max-w-sm space-y-4">
                                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-500/20 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
                                            <div className="relative z-10">
                                                <div className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.2em] mb-2">Ganador del Premio Mayor</div>
                                                <div className="text-3xl font-black text-white mb-1">
                                                    {lastWinner.paymentDetails?.name ? lastWinner.paymentDetails.name.split(' ')[0] : 'Usuario'} ...{lastWinner.userId.slice(-4)}
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-mono bg-black/20 py-1 px-3 rounded-full mx-auto w-fit">
                                                    <Ticket size={12} />
                                                    ID: {lastWinner.ticketId.slice(-6).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* WHATSAPP CONGRATULATION BUTTON */}
                                        <button
                                            onClick={() => {
                                                const message = `¡Felicidades al ganador! 🥳🏆 ${lastWinner.paymentDetails?.whatsapp ? '@' + lastWinner.paymentDetails.whatsapp : ''} ¡Qué buen juego!`;
                                                navigator.clipboard.writeText(message);
                                                window.open("https://chat.whatsapp.com/BiaplDWQmH2Ai50Jek8sa5", "_blank");
                                                alert("Mensaje copiado al portapapeles. ¡Pégalo en el grupo!");
                                            }}
                                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-4 rounded-xl shadow-lg shadow-green-500/20 transform active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                            FELICITAR EN EL GRUPO
                                        </button>
                                        <p className="text-[10px] text-slate-500 italic">
                                            Se copiará una felicitación para que la pegues en el grupo.
                                        </p>
                                    </div>
                                )}

                                <div className="max-w-md mx-auto">
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        ¡No te desanimes! El administrador está preparando el siguiente sorteo.
                                        Asegúrate de tener tus cartones listos.
                                    </p>
                                </div>

                                <div className="animate-pulse bg-indigo-500/10 text-indigo-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                    Esperando inicio del siguiente juego...
                                </div>
                            </motion.div>
                        )}

                        {/* STATE: ACTIVE / DRAWING */}
                        {(gameState.status === 'active' || gameState.status === 'paused' || gameState.status === 'validating') && (
                            <motion.div
                                key="drawing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col lg:flex-row items-center justify-between gap-12"
                            >
                                {/* Main Ball Display & History in one cohesive unit */}
                                <div className="flex-1 w-full flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                                    <div>
                                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gameState.status === 'paused' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                                                <span className={`relative inline-flex rounded-full h-3 w-3 ${gameState.status === 'paused' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                            </span>
                                            <h3 className={`${gameState.status === 'paused' ? 'text-yellow-400' : 'text-green-400'} font-black text-sm uppercase tracking-widest`}>
                                                {gameState.status === 'paused' ? 'Sorteo Pausado' : gameState.status === 'validating' ? 'Validando Bingo...' : 'Sorteo en Vivo'}
                                            </h3>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                                            Bola Actual
                                        </h2>
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-[60px]" />
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={gameState.currentNumber}
                                                initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
                                                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                                                exit={{ scale: 0.5, opacity: 0, rotateX: -90 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-white via-slate-200 to-slate-400 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] flex items-center justify-center border-[12px] border-slate-900 z-10"
                                            >
                                                <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent rounded-t-full pointer-events-none" />
                                                <span className="text-[6rem] md:text-[8rem] font-black text-slate-900 tracking-tighter drop-shadow-sm">
                                                    {gameState.currentNumber || '?'}
                                                </span>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* History Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 rounded-3xl p-6 border border-white/5 h-full">
                                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Historial</span>
                                        <span className="text-xs font-bold text-slate-400">{gameState.history?.length || 0}/75</span>
                                    </div>

                                    <div className="flex flex-wrap content-start gap-2 h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                        {[...(gameState.history || [])].reverse().map((n, i) => (
                                            <motion.div
                                                key={`${n}-${i}`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border border-white/5
                                                ${i === 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400'}`}
                                            >
                                                {n}
                                            </motion.div>
                                        ))}
                                        {(gameState.history?.length === 0) && (
                                            <div className="w-full text-center py-8 text-slate-600 text-xs italic">
                                                El historial aparecerá aquí...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* FALLBACK FOR WAITING STATE if logic slips */}
                        {gameState.status === 'waiting' && (
                            <motion.div
                                key="waiting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center space-y-4"
                            >
                                <div className="text-4xl text-slate-600 font-black uppercase tracking-widest">Esperando Sorteo</div>
                                <p className="text-slate-500">Compra tus tickets para participar.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Tickets Area */}
            <div>
                <div className="flex items-center justify-between mb-6 pl-2 border-l-4 border-orange-500">
                    <h2 className="text-xl font-bold text-white">Mis Cartones Activos</h2>
                    {tickets.length > 0 && (
                        <button
                            onClick={onBuyTickets}
                            className="bg-slate-800 hover:bg-slate-700 text-orange-500 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-colors"
                        >
                            + Comprar Más
                        </button>
                    )}
                </div>

                {tickets.length === 0 ? (
                    <div className="bg-slate-800/30 border border-white/5 border-dashed rounded-[2rem] p-12 text-center space-y-6">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                            <Ticket size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-2">Aún no tienes cartones</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                Para participar en este sorteo y ganar premios, necesitas al menos un cartón.
                            </p>
                        </div>
                        <button
                            onClick={onBuyTickets}
                            className="bg-orange-500 hover:bg-orange-400 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-orange-500/20 transition-all transform hover:scale-105"
                        >
                            COMPRAR CARTONES
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tickets.map((ticket) => (
                            <BingoCard
                                key={ticket.id}
                                id={ticket.id}
                                numbers={ticket.numbers}
                                drawnNumbers={gameState.history || []}
                                onStateChange={handleCardStateChange}
                                hasWon={gameState.winners?.some(w => w.ticketId === ticket.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* FLOATING ACTION BAR: CENTRALIZED BINGO BUTTON (Neuromarketing) */}
            <AnimatePresence>
                {canClaim && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none"
                    >
                        <div className="max-w-xl mx-auto pointer-events-auto">
                            <div className="bg-slate-900/90 backdrop-blur-2xl p-2 rounded-[2.5rem] border-2 border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.4)] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 to-transparent animate-pulse" />

                                <div className="flex items-center gap-2 p-4 justify-between relative z-10">
                                    <div className="flex items-center gap-4 pl-4">
                                        <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white scale-110 shadow-lg animate-bounce">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] mb-1">¡CARTÓN LLENO DETECTADO!</div>
                                            <div className="text-xl font-black text-white">HAS GANADO {myWinners * 500} Bs</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBingo}
                                        className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-orange-600/20 active:scale-95 transition-all group overflow-hidden relative"
                                    >
                                        <span className="relative z-10">¡CANTAR BINGO!</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </button>
                                </div>
                                <div className="bg-orange-600/10 px-6 py-2 text-[9px] font-black text-orange-400 uppercase tracking-widest text-center border-t border-orange-500/20">
                                    {myWinners > 1
                                        ? `Doble Victoria: Estás reclamando ${myWinners} cartones a la vez.`
                                        : "Garantiza tu premio ahora mismo antes que alguien más lo haga."}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
