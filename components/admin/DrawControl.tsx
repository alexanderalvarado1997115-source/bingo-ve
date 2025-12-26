"use client";
import { useState, useEffect, useRef } from "react";
import { ref, update } from "firebase/database";
import { realtimeDb } from "@/lib/firebase/config";
import { startCountdown, finishCountdown, pauseGame, drawNextBall, subscribeToGame, GameState, initializeGame, addWinner, updateGameMode, updateGameConfig, subscribeToOnlineCount, subscribeToConnection, fullResetSystem, archiveCurrentGame, markWinnerAsPaid } from "@/lib/firebase/game-actions";
import { Play, Pause, FastForward, Timer, Settings, Users, MousePointer2, Zap, Save, X, Plus, Minus, SkipForward, Archive, Copy, CheckCircle, CreditCard, Smartphone, User, Volume2, VolumeX, AlertTriangle, Trophy, BarChart3, Clock, Ticket } from "lucide-react";
import { getAllActiveTickets } from "@/lib/firebase/admin-actions";
import { checkWinner, getWinningDetails } from "@/utils/game-logic";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/hooks/use-audio";

const GAME_STATE_PATH = "game/active";

export default function DrawControl() {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [countdownSeconds, setCountdownSeconds] = useState(300); // 5 minutes
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const DRAW_INTERVAL = 15; // Seconds

    const [editConfig, setEditConfig] = useState<GameState['config'] | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [resetStep, setResetStep] = useState(0); // 0: Normal, 1: Confirm, 2: Resetting
    const [isArchiving, setIsArchiving] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [totalTickets, setTotalTickets] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const { playSound, isMuted, toggleMute } = useAudio();
    const lastNumberRef = useRef<number | null>(null);

    useEffect(() => {
        const unsubConn = subscribeToConnection(setIsConnected);
        const unsubGame = subscribeToGame((state) => {
            setGameState(state);
            if (!editConfig && state) setEditConfig(state.config);
        });
        const unsubOnline = subscribeToOnlineCount((count) => {
            setOnlineCount(count);
        });
        return () => {
            unsubConn();
            unsubGame();
            unsubOnline();
        };
    }, []);

    // Stats fetching
    useEffect(() => {
        const fetchStats = async () => {
            const tickets = await getAllActiveTickets();
            const count = tickets.length;
            setTotalTickets(count);
            if (gameState?.config?.price) {
                setTotalRevenue(count * gameState.config.price);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [gameState?.config?.price]);

    // Countdown timer logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState?.status === 'countdown' && gameState.countdownStartTime) {
            timer = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - gameState.countdownStartTime!) / 1000);
                const remaining = Math.max(0, 300 - elapsed);
                setCountdownSeconds(remaining);
                if (remaining <= 0) {
                    finishCountdown();
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState]);

    // Ball draw timer logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState?.status === 'active' && gameState?.mode === 'auto') {
            timer = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - gameState.lastBallTime) / 1000);
                const remaining = Math.max(0, DRAW_INTERVAL - elapsed);
                setTimeLeft(remaining);
                if (remaining <= 0) {
                    triggerNextBall();
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState]);

    // Sound Trigger for Bingo Alerta
    useEffect(() => {
        if (gameState?.status === 'validating') {
            playSound('bingo');
        }
    }, [gameState?.status, playSound]);

    const triggerNextBall = async () => {
        const nextBall = await drawNextBall();
        if (!nextBall) return;
        playSound('draw');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleInit = () => initializeGame(`SORTEO_${Date.now()}`);

    const handleFullReset = async () => {
        setResetStep(2);
        const res = await fullResetSystem();
        if (res.success) {
            setResetStep(0);
            alert("Sistema reseteado correctamente.");
        } else {
            setResetStep(0);
            alert("Error al resetear el sistema.");
        }
    };

    const handleArchive = async () => {
        if (!confirm("¿Seguro que deseas cerrar este juego y archivar todo? Los tickets actuales desaparecerán.")) return;

        setIsArchiving(true);
        const res = await archiveCurrentGame();
        setIsArchiving(false);

        if (res.success) {
            alert("Juego archivado y listo para el siguiente.");
        } else {
            alert("Error al archivar: " + res.error);
        }
    };

    const saveConfig = async () => {
        if (editConfig) {
            await updateGameConfig(editConfig);
            setIsSettingsOpen(false);
        }
    };

    const handleConfirmWin = async (winner: NonNullable<GameState['winners']>[0]) => {
        const isMulti = winner.multiClaimCount && winner.multiClaimCount > 1;
        const confirmResult = confirm(`¿Confirmar BINGO para este usuario?\n${isMulti ? 'RECLAMO MÚLTIPLE: ' + winner.multiClaimCount + ' Cartones' : '1 Cartón'}`);

        if (!confirmResult) return;

        setIsConfirming(true);
        try {
            console.log("Iniciando confirmación de premio...", winner.userId);

            // 1. Get all winners currently in the DB
            const allWinners = gameState?.winners || [];

            // 2. Separate verified, the current group (linked), and OTHER pending
            const alreadyVerified = allWinners.filter(w => w.verified);
            const otherPending = allWinners.filter(w => !w.verified && !(w.userId === winner.userId && w.timestamp === winner.timestamp));
            const linkedTickets = allWinners.filter(w => !w.verified && w.userId === winner.userId && w.timestamp === winner.timestamp);

            const ticketsToVerify = linkedTickets.length > 0 ? linkedTickets : [winner];

            // 3. Create the verified entries
            const verifiedEntries = ticketsToVerify.map((t, idx) => ({
                ...t,
                verified: true,
                prizePosition: alreadyVerified.length + 1 + idx,
                payoutStatus: 'pending_info'
            }));

            // 4. Combine: Previously verified + New verified + Other pending
            const newWinnersList = [...alreadyVerified, ...verifiedEntries, ...otherPending];

            // 5. Update Game State: Since we ONLY play Full House, confirming a winner ALWAYS finishes the game.
            await update(ref(realtimeDb, GAME_STATE_PATH), {
                status: 'finished',
                winners: newWinnersList
            });

            console.log("Premio confirmado exitosamente.");
            playSound('victory');
        } catch (error: any) {
            console.error("Error confirmando premio:", error);
            alert("⚠️ ERROR CRÍTICO: No se pudo conectar con la base de datos. Revisa tu internet o los permisos de Firebase.\nDetalle: " + error.message);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleRejectWin = async (winner: NonNullable<GameState['winners']>[0]) => {
        if (!gameState?.winners) return;

        // Remove all linked tickets in case of multi-claim rejection
        const updatedQueue = gameState.winners.filter(w => !(w.userId === winner.userId && w.timestamp === winner.timestamp));
        const hasMorePending = updatedQueue.some(w => !w.verified);

        await update(ref(realtimeDb, GAME_STATE_PATH), {
            status: hasMorePending ? 'validating' : 'active',
            winners: updatedQueue
        });
    };

    const handleMarkPaid = async (ticketId: string) => {
        const confirmPay = confirm("¿Confirmas que has realizado el pago móvil?");
        if (confirmPay) {
            await markWinnerAsPaid(ticketId);
        }
    }

    if (!gameState) return (
        <div className="bg-[#0f111a] p-12 rounded-[2.5rem] text-center border border-dashed border-white/10 shadow-2xl">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                <Settings size={40} />
            </div>
            <h3 className="text-white font-black uppercase text-lg tracking-widest mb-2">No hay sorteo activo</h3>
            <p className="text-slate-500 text-sm mb-8">Debes inicializar un sorteo para comenzar a recibir tickets.</p>
            <button onClick={handleInit} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 text-xs tracking-[0.2em] uppercase">
                INICIALIZAR NUEVO SORTEO
            </button>
        </div>
    );

    // Validation Overlay Logic
    if (gameState.status === 'validating') {
        const pendingWinners = gameState.winners?.filter(w => !w.verified) || [];
        const claim = pendingWinners[0]; // Process the first pending claim

        const winDetails = claim && claim.numbers ? getWinningDetails(claim.numbers, gameState.history || []) : null;

        return (
            <div className="bg-orange-600/10 rounded-[2.5rem] border-2 border-orange-500/30 p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="absolute inset-0 bg-orange-600/5 animate-pulse" />

                <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="inline-block bg-orange-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            ⚠️ Alerta de Bingo ({pendingWinners.length} en cola)
                        </div>
                        <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1.5 rounded-xl">
                            Acción Requerida
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-3xl font-black text-white leading-tight">
                                {claim.multiClaimCount && claim.multiClaimCount > 1 ? `¡BINGO MÚLTIPLE! (${claim.multiClaimCount})` : '¡RECLAMO DE BINGO!'}
                            </h3>
                            {claim.multiClaimCount && (
                                <div className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-black animate-bounce shadow-lg shadow-orange-500/20">
                                    +{claim.multiClaimCount * 500} Bs
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                            <p className="text-orange-400 font-black text-xs uppercase tracking-widest">
                                {winDetails && !claim.multiClaimCount ? `Validación por: ${winDetails.type}` : claim.multiClaimCount ? 'Validando múltiples cartones llenos' : 'Verificando secuencia...'}
                            </p>
                        </div>
                    </div>

                    {claim && (
                        <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/5 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Ganador Potencial</div>
                                    <div className="text-lg font-black text-white">{claim.userId.slice(0, 12)}...</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Cartón</div>
                                    <div className="text-lg font-mono font-black text-orange-500">#{claim.ticketId.slice(-6).toUpperCase()}</div>
                                </div>
                            </div>

                            {/* Ticket Numbers Preview */}
                            {claim.numbers && (
                                <div className="grid grid-cols-5 gap-2">
                                    {claim.numbers.map((n, i) => {
                                        const isMatch = n === 0 || gameState.history?.includes(n);
                                        const isWinPart = winDetails?.numbers.includes(n);

                                        return (
                                            <div key={i} className={`aspect-square flex items-center justify-center rounded-xl font-black text-sm transition-all duration-300
                                                ${n === 0 ? 'bg-orange-500 text-white shadow-lg' :
                                                    isWinPart ? 'bg-yellow-400 text-black scale-110 rotate-2 z-10 shadow-[0_0_20px_rgba(250,204,21,0.4)]' :
                                                        isMatch ? 'bg-green-500 text-white' : 'bg-white/5 text-slate-600 border border-white/5'}`}>
                                                {n === 0 ? '★' : n}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => handleRejectWin(claim)}
                                    className="flex-1 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-white/5 transition-all"
                                >
                                    RECHAZAR {claim.multiClaimCount && claim.multiClaimCount > 1 ? 'TODOS' : ''}
                                </button>
                                <button
                                    onClick={() => handleConfirmWin(claim)}
                                    disabled={isConfirming}
                                    className={`flex-1 ${isConfirming ? 'bg-slate-700' : 'bg-orange-500 hover:bg-orange-400'} text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20 active:scale-95 transition-all`}
                                >
                                    {isConfirming ? 'PROCESANDO...' : `¡VÁLIDO! (PAGAR ${claim.multiClaimCount ? claim.multiClaimCount * 500 : 500} Bs)`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState.status === 'finished') {
        const lastWinner = gameState.winners?.[gameState.winners.length - 1];

        return (
            <div className="bg-green-600/10 rounded-[2.5rem] border-2 border-green-500/30 p-10 relative overflow-hidden shadow-2xl backdrop-blur-md text-center">
                <div className="relative z-10 space-y-8">
                    <div className="inline-block bg-green-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">
                        🏆 Sorteo Concluido
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white leading-tight">TENEMOS UN GANADOR</h3>
                        <p className="text-green-500 font-black text-xs uppercase tracking-widest mt-2">Juego finalizado con éxito</p>
                    </div>

                    {lastWinner && (
                        <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/10 text-white max-w-sm mx-auto shadow-2xl">
                            <div className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 mb-4">Datos del Campeón</div>
                            <div className="w-16 h-16 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-lg shadow-green-500/20">
                                {lastWinner.userId.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="text-xl font-black">{lastWinner.userId.slice(0, 15)}...</div>
                            <div className="text-xs font-mono mt-1 text-green-500 font-black mb-6">CARTÓN: #{lastWinner.ticketId.slice(-6).toUpperCase()}</div>

                            {/* Payout Status Card */}
                            <div className="bg-white/5 rounded-2xl p-5 text-left space-y-4 border border-white/5">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado de Pago</span>
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest
                                        ${lastWinner.payoutStatus === 'paid' ? 'bg-green-500 text-white' :
                                            lastWinner.payoutStatus === 'processing_payment' ? 'bg-yellow-500 text-black animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                        {lastWinner.payoutStatus === 'paid' ? 'PAGADO' :
                                            lastWinner.payoutStatus === 'processing_payment' ? 'POR PAGAR' : 'ESPERANDO DATOS'}
                                    </span>
                                </div>

                                {lastWinner.payoutStatus === 'processing_payment' && lastWinner.paymentDetails && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-1">Banco</div>
                                                <div className="text-sm font-bold text-white">{lastWinner.paymentDetails.bank}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-1">Cédula</div>
                                                <div className="text-sm font-black text-white">{lastWinner.paymentDetails.ci}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-1">Teléfono Mobile</div>
                                            <div className="text-sm font-black text-indigo-400">{lastWinner.paymentDetails.phone}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-1">Titular</div>
                                            <div className="text-sm font-black text-white">{lastWinner.paymentDetails.name}</div>
                                        </div>

                                        <button
                                            onClick={() => handleMarkPaid(lastWinner.ticketId)}
                                            className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-4 rounded-xl mt-2 shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase text-[10px] tracking-widest"
                                        >
                                            <CheckCircle size={16} /> CONFIRMAR PAGO ENVIADO
                                        </button>
                                    </div>
                                )}

                                {(!lastWinner.payoutStatus || lastWinner.payoutStatus === 'pending_info') && (
                                    <div className="text-center text-[10px] font-bold text-slate-500 py-2 uppercase tracking-[0.2em]">
                                        Esperando respuesta del usuario...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleArchive}
                        disabled={isArchiving || (lastWinner && lastWinner.payoutStatus !== 'paid')}
                        className={`bg-white text-slate-900 font-black py-5 px-12 rounded-2xl shadow-xl transition-all text-[10px] uppercase tracking-[0.3em]
                            ${(lastWinner && lastWinner.payoutStatus !== 'paid') ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    >
                        {isArchiving ? "PROCESANDO..." : "ARCHIVAR Y NUEVO JUEGO"}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col h-full min-h-[700px]">
            {/* Header Content */}
            <div className="p-8 border-b border-white/5 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                            <Zap size={20} />
                        </div>
                        <h4 className="font-black text-xs uppercase tracking-widest text-white">Consola de Control</h4>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`p-2.5 rounded-xl transition-all ${isSettingsOpen ? 'bg-indigo-600 text-white border-transparent' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={toggleMute}
                            className="p-2.5 bg-white/5 text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all"
                        >
                            {isMuted ? <VolumeX size={20} className="text-red-400" /> : <Volume2 size={20} className="text-green-400" />}
                        </button>
                    </div>
                </div>

                {/* STATS AREA */}
                <div className="grid grid-cols-2 gap-4">
                    <StatBox icon={<Users size={14} />} label="Online" value={onlineCount} color="green" />
                    <StatBox icon={<Ticket size={14} />} label="Ventas" value={totalTickets} color="indigo" />
                    <StatBox icon={<BarChart3 size={14} />} label="Capital" value={`${totalRevenue} Bs`} color="blue" />
                    <StatBox icon={<Trophy size={14} />} label="Premios" value={`${gameState.config.prizes.reduce((a, b) => a + b, 0)} Bs`} color="orange" />
                </div>
            </div>

            <div className="flex-1 p-8">
                <AnimatePresence mode="wait">
                    {isSettingsOpen ? (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Configuración General</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <ConfigInput label="Precio Cartón" value={editConfig?.price} onChange={(v) => setEditConfig(c => c ? { ...c, price: Number(v) } : null)} type="number" />
                                    <ConfigInput label="Hora Inicio" value={editConfig?.startTime} onChange={(v) => setEditConfig(c => c ? { ...c, startTime: v } : null)} type="text" />
                                </div>

                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pt-4">Recepción de Pagos</div>
                                <div className="space-y-4">
                                    <ConfigInput icon={<CreditCard size={14} />} label="Banco" value={editConfig?.paymentInfo?.bank} onChange={(v) => setEditConfig(c => c ? { ...c, paymentInfo: { ...(c.paymentInfo || { bank: "", phone: "", ci: "", name: "" }), bank: v } } : null)} type="text" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <ConfigInput icon={<Smartphone size={14} />} label="Teléfono" value={editConfig?.paymentInfo?.phone} onChange={(v) => setEditConfig(c => c ? { ...c, paymentInfo: { ...(c.paymentInfo || { bank: "", phone: "", ci: "", name: "" }), phone: v } } : null)} type="text" />
                                        <ConfigInput icon={<User size={14} />} label="Cédula" value={editConfig?.paymentInfo?.ci} onChange={(v) => setEditConfig(c => c ? { ...c, paymentInfo: { ...(c.paymentInfo || { bank: "", phone: "", ci: "", name: "" }), ci: v } } : null)} type="text" />
                                    </div>
                                    <ConfigInput label="Nombre Titular" value={editConfig?.paymentInfo?.name} onChange={(v) => setEditConfig(c => c ? { ...c, paymentInfo: { ...(c.paymentInfo || { bank: "", phone: "", ci: "", name: "" }), name: v } } : null)} type="text" />
                                </div>
                            </div>

                            <button onClick={saveConfig} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all uppercase text-[10px] tracking-widest mt-4">
                                Guardar Configuración
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col"
                        >
                            {/* Mode Control */}
                            <div className="flex bg-[#161822] p-1.5 rounded-2xl border border-white/5 mb-8">
                                <ModeBtn active={gameState.mode === 'auto'} onClick={() => updateGameMode('auto')} icon={<Zap size={14} />} label="AUTO" color="indigo" />
                                <ModeBtn active={gameState.mode === 'manual'} onClick={() => updateGameMode('manual')} icon={<MousePointer2 size={14} />} label="MANUAL" color="orange" />
                            </div>

                            {/* Center Monitor */}
                            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#161822] rounded-[3rem] border border-white/5 mb-8 relative group">
                                <div className="absolute top-0 left-0 w-full h-2 bg-slate-900 rounded-t-[3rem] overflow-hidden">
                                    {((gameState.status === 'active' && gameState.mode === 'auto') || gameState.status === 'countdown') && (
                                        <motion.div
                                            className={`h-full ${gameState.status === 'countdown' ? 'bg-orange-500' : 'bg-indigo-500'}`}
                                            initial={false}
                                            animate={{ width: gameState.status === 'countdown' ? `${(countdownSeconds / 300) * 100}%` : `${(timeLeft / DRAW_INTERVAL) * 100}%` }}
                                            transition={{ duration: 1, ease: "linear" }}
                                        />
                                    )}
                                </div>

                                {gameState.status === 'countdown' ? (
                                    <div className="text-center">
                                        <div className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 animate-pulse italic">Iniciando en...</div>
                                        <div className="text-7xl font-black text-white">{formatTime(countdownSeconds)}</div>
                                    </div>
                                ) : (
                                    <div className="text-center relative">
                                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">{gameState.status === 'waiting' ? 'LISTO PARA' : 'ÚLTIMA BOLA'}</div>
                                        <div className={`text-9xl font-black transition-all duration-300 ${gameState.status === 'waiting' ? 'text-slate-800' : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]'}`}>
                                            {gameState.currentNumber || '00'}
                                        </div>

                                        {gameState.status === 'active' && (
                                            <div className="mt-8">
                                                {gameState.mode === 'auto' ? (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/10">
                                                        <Clock size={12} className="text-indigo-400" />
                                                        <span className="text-[11px] font-black text-indigo-400 font-mono">SIGUIENTE EN {timeLeft}S</span>
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-2 bg-orange-500/10 rounded-full border border-orange-500/10">
                                                        <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">ESPERANDO ADMIN</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Main Action Buttons */}
                            <div className="space-y-4">
                                {gameState.status === 'waiting' ? (
                                    <button onClick={startCountdown} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/25 active:scale-95 transition-all text-sm tracking-[0.3em] uppercase">
                                        <Play size={20} strokeWidth={3} /> LANZAR SORTEO
                                    </button>
                                ) : gameState.status === 'countdown' ? (
                                    <button onClick={finishCountdown} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl shadow-orange-600/25 active:scale-95 transition-all text-sm tracking-[0.3em] uppercase">
                                        <SkipForward size={20} strokeWidth={3} /> OMITIR ESPERA
                                    </button>
                                ) : gameState.status === 'active' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={pauseGame} className="bg-[#161822] hover:bg-slate-800 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 border border-white/5 active:scale-95 transition-all">
                                            <Pause size={20} /> PAUSAR
                                        </button>
                                        <button onClick={triggerNextBall} className="bg-white text-slate-900 hover:bg-slate-100 font-black py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">
                                            <FastForward size={20} /> SIGUIENTE
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={handleInit} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2rem]">NUEVO SORTEO</button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Danger Section */}
            <div className="p-8 border-t border-white/5 bg-[#161822]/30 mt-auto">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Zona de Peligro</span>
                </div>
                {resetStep === 0 ? (
                    <button onClick={() => setResetStep(1)} className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-red-500 hover:bg-red-500/5 transition-all">
                        REINICIAR SISTEMA COMPLETO
                    </button>
                ) : resetStep === 1 ? (
                    <div className="flex gap-2">
                        <button onClick={() => setResetStep(0)} className="flex-1 py-3 bg-slate-800 rounded-xl text-[10px] font-black uppercase text-white tracking-widest">CANCELAR</button>
                        <button onClick={handleFullReset} className="flex-1 py-3 bg-red-600 rounded-xl text-[10px] font-black uppercase text-white tracking-widest shadow-lg shadow-red-600/20">CONFIRMAR BORRADO</button>
                    </div>
                ) : (
                    <div className="w-full py-3 bg-slate-900 text-slate-500 text-[10px] font-black text-center animate-pulse tracking-widest">RESETEANDO...</div>
                )}
            </div>
        </div>
    );
}

function StatBox({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    const colors: any = {
        green: 'text-green-400 bg-green-500/10 border-green-500/10',
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/10',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/10',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/10'
    };
    return (
        <div className={`p-4 rounded-3xl border ${colors[color]} flex flex-col items-center justify-center text-center`}>
            <div className="mb-1 opacity-60">{icon}</div>
            <div className="text-sm font-black text-white">{value}</div>
            <div className="text-[8px] font-black uppercase tracking-widest opacity-50">{label}</div>
        </div>
    );
}

function ModeBtn({ active, onClick, icon, label, color }: { active: boolean, onClick: () => void, icon: any, label: string, color: 'indigo' | 'orange' }) {
    const activeClass = color === 'indigo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-orange-600 text-white shadow-lg shadow-orange-600/20';
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all
            ${active ? activeClass : 'text-slate-600 hover:text-slate-400'}`}
        >
            {icon} {label}
        </button>
    );
}

function ConfigInput({ icon, label, value, onChange, type }: { icon?: any, label: string, value: any, onChange: (v: string) => void, type: string }) {
    return (
        <div className="space-y-1.5 flex-1">
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">{icon}</div>}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full bg-[#161822] border border-white/5 rounded-2xl py-3 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-all ${icon ? 'pl-11' : 'px-4'}`}
                />
            </div>
        </div>
    );
}
