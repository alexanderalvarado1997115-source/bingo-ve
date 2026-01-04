import { realtimeDb, db } from "./config";
import { ref, set, get, update, onValue, onDisconnect, serverTimestamp, runTransaction } from "firebase/database";
import { collection, getDocs, deleteDoc, doc, writeBatch, addDoc, query, where, serverTimestamp as firestoreTimestamp } from "firebase/firestore";

const GAME_STATE_PATH = "game/active";
const PRESENCE_PATH = "presence/users";

// --- Utility: Timeout Wrapper for Firebase Operations ---
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000, operation: string = "Operación"): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${operation} excedió el tiempo límite (${timeoutMs}ms). Verifica tu conexión.`)), timeoutMs)
        )
    ]);
}

export interface GameState {
    status: 'waiting' | 'countdown' | 'active' | 'paused' | 'validating' | 'finished';
    mode: 'auto' | 'manual';
    currentNumber: number | null;
    history: number[];
    lastBallTime: number;
    countdownStartTime: number | null;
    drawId: string;
    config: {
        price: number;
        prizes: number[];
        startTime: string;
        playersCount: number;
        totalTickets: number;
        maxTickets: number;
        paymentInfo?: {
            bank: string;
            phone: string;
            ci: string;
            name: string;
        };
    };
    winners?: {
        userId: string;
        ticketId: string;
        timestamp: number;
        prizePosition: number;
        numbers?: number[];
        verified?: boolean;
        payoutStatus?: 'pending_info' | 'processing_payment' | 'paid';
        multiClaimCount?: number;
        paymentDetails?: {
            bank: string;
            phone: string;
            ci: string;
            name?: string;
            whatsapp?: string;
        };
    }[];
    socialStatus?: {
        message: string;
        tensionLevel: 'low' | 'medium' | 'high' | 'imminent';
        topPlayers: { name: string, missing: number }[];
        lastUpdate: number;
    };
}

// --- Presence System ---

export const subscribeToConnection = (callback: (connected: boolean) => void) => {
    const connectedRef = ref(realtimeDb, ".info/connected");
    return onValue(connectedRef, (snap) => {
        callback(snap.val() === true);
    });
};

export const trackPresence = (userId: string) => {
    if (!userId) return;
    const userPresenceRef = ref(realtimeDb, `${PRESENCE_PATH}/${userId}`);
    const connectedRef = ref(realtimeDb, ".info/connected");

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            // Create node on connect
            set(userPresenceRef, {
                online: true,
                lastSeen: serverTimestamp()
            });

            // Remove node on disconnect
            onDisconnect(userPresenceRef).remove();
        }
    });
};

export const subscribeToOnlineCount = (callback: (count: number) => void, onError?: (error: any) => void) => {
    const presenceRef = ref(realtimeDb, PRESENCE_PATH);
    return onValue(presenceRef, (snap) => {
        if (snap.exists()) {
            callback(Object.keys(snap.val()).length);
        } else {
            callback(0);
        }
    }, (error) => {
        console.error("RTDB Presence Error:", error);
        if (onError) onError(error);
    });
};

// --- Admin Commands ---

export const initializeGame = async (
    drawId: string,
    config = {
        price: 100,
        prizes: [500, 350, 200, 150, 100],
        startTime: "15:30",
        playersCount: 0,
        totalTickets: 0,
        maxTickets: 90,
        paymentInfo: {
            bank: "Venezuela (BDV)",
            phone: "0414-2747550",
            ci: "V-30826974",
            name: "Administrador"
        }
    }
) => {
    await set(ref(realtimeDb, GAME_STATE_PATH), {
        status: 'waiting',
        mode: 'auto',
        currentNumber: null,
        history: [],
        lastBallTime: Date.now(),
        countdownStartTime: null,
        drawId: drawId,
        winners: [],
        config: config
    });

    // Check auto-start immediately
    await checkAutoStart();
};

export const updateGameMode = async (mode: 'auto' | 'manual') => {
    await update(ref(realtimeDb, GAME_STATE_PATH), { mode });
};

export const updateGameConfig = async (config: Partial<GameState['config']>) => {
    const snap = await get(ref(realtimeDb, GAME_STATE_PATH));
    const currentConfig = snap.val()?.config || {};
    await update(ref(realtimeDb, `${GAME_STATE_PATH}/config`), { ...currentConfig, ...config });
};

export const startCountdown = async () => {
    await update(ref(realtimeDb, GAME_STATE_PATH), {
        status: 'countdown',
        countdownStartTime: Date.now()
    });
}

export const finishCountdown = async () => {
    await update(ref(realtimeDb, GAME_STATE_PATH), {
        status: 'active',
        lastBallTime: Date.now()
    });
}

export const pauseGame = async () => {
    await update(ref(realtimeDb, GAME_STATE_PATH), { status: 'paused' });
}

export const drawNextBall = async () => {
    const snap = await get(ref(realtimeDb, GAME_STATE_PATH));
    if (!snap.exists()) return null;

    const state = snap.val() as GameState;
    const history = state.history || [];

    // Generate unique number 1-75
    let next: number;
    if (history.length >= 75) {
        await update(ref(realtimeDb, GAME_STATE_PATH), { status: 'finished' });
        return null;
    }

    do {
        next = Math.floor(Math.random() * 75) + 1;
    } while (history.includes(next));

    const newHistory = [...history, next];

    // --- Referee Logic (Tension Detection) ---
    let tensionLevel: 'low' | 'medium' | 'high' | 'imminent' = 'low';
    let message = `Sorteo en curso... Bola # ${newHistory.length}: [ ${next} ]`;
    let topPlayers: { name: string, missing: number }[] = [];

    try {
        const q = query(collection(db, "tickets"), where("drawId", "==", state.drawId));
        const ticketsSnap = await getDocs(q);
        const tickets = ticketsSnap.docs.map(d => d.data());

        const projections = tickets.map((t: any) => {
            const missing = t.numbers.filter((n: number) => !newHistory.includes(n)).length;
            // Get name from user meta or generic
            return {
                name: t.userName || `Jugador...${t.userId.slice(-4)}`,
                missing
            };
        });

        const minMissing = Math.min(...projections.map((p: any) => p.missing), 25);
        topPlayers = projections.filter((p: any) => p.missing <= 3).sort((a: any, b: any) => a.missing - b.missing).slice(0, 5);

        if (minMissing === 1) {
            tensionLevel = 'imminent';
            message = `🔥 ¡TENSIÓN MÁXIMA! Con la bola ${next}, alguien está a punto de cantar BINGO.`;
        } else if (minMissing <= 3) {
            tensionLevel = 'high';
            message = `⚠️ ¡ATENCIÓN! El sistema detecta ganadores inminentes con la bola ${next}.`;
        } else if (newHistory.length > 35) {
            tensionLevel = 'medium';
            message = `⏳ El sorteo avanza... Ya han salido ${newHistory.length} bolas y el botín busca dueño.`;
        }
    } catch (err) {
        console.error("Referee Analysis Error:", err);
    }

    await update(ref(realtimeDb, GAME_STATE_PATH), {
        currentNumber: next,
        history: newHistory,
        lastBallTime: Date.now(),
        socialStatus: {
            message,
            tensionLevel,
            topPlayers,
            lastUpdate: Date.now()
        }
    });

    const nextBall = next;
    return nextBall;
};

export const verifyBingoWin = async (winner: any) => {
    console.log("SERVER: Iniciando verifyBingoWin para ticket:", winner.ticketId);
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);

    // Get game state with timeout protection
    const snap = await withTimeout(
        get(gameRef),
        8000,
        "Obtener estado del juego para verificación"
    );

    if (!snap.exists()) {
        console.error("SERVER: El nodo de juego no existe.");
        throw new Error("No hay juego activo.");
    }

    const data = snap.val() as GameState;
    const allWinners = data.winners || [];
    console.log("SERVER: Total ganadores en BD:", allWinners.length);

    const alreadyVerified = allWinners.filter(w => w.verified);
    const otherPending = allWinners.filter(w => !w.verified && w.ticketId !== winner.ticketId);

    // Find the current winner group (multi-tickets) correctly
    const ticketsToVerify = allWinners.filter(w => !w.verified && (
        (w.userId === winner.userId && w.timestamp === winner.timestamp) ||
        w.ticketId === winner.ticketId
    ));

    console.log("SERVER: Cartones encontrados para verificar:", ticketsToVerify.length);

    if (ticketsToVerify.length === 0) {
        console.error("SERVER: No se encontró ningún cartón pendiente que coincida.");
        throw new Error("No se encontró el cartón a validar en la lista de pendientes.");
    }

    const verifiedEntries = ticketsToVerify.map((t, idx) => ({
        ...t,
        verified: true,
        prizePosition: alreadyVerified.length + 1 + idx,
        payoutStatus: 'pending_info' as const
    }));

    const newWinnersList = [...alreadyVerified, ...verifiedEntries, ...otherPending];
    console.log("SERVER: Nueva lista de ganadores generada. Enviando actualización...");

    try {
        await withTimeout(
            update(gameRef, {
                status: 'finished',
                winners: newWinnersList,
                socialStatus: {
                    message: `🏆 ¡BINGO CONFIRMADO! Felicidades al ganador.`,
                    tensionLevel: 'low',
                    topPlayers: [],
                    lastUpdate: Date.now()
                }
            }),
            8000,
            "Confirmar ganador"
        );
        console.log("SERVER: Actualización en Firebase exitosa.");
    } catch (firebaseErr: any) {
        console.error("SERVER: Error al actualizar Firebase:", firebaseErr);
        throw new Error("Fallo al escribir en la base de datos: " + firebaseErr.message);
    }

    return { committed: true };
};

export const rejectBingoWin = async (winner: any) => {
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);

    return runTransaction(gameRef, (data: GameState | null) => {
        if (!data || !data.winners) return;

        const updatedWinners = data.winners.filter(w => !(w.userId === winner.userId && w.timestamp === winner.timestamp));
        const hasMorePending = updatedWinners.some(w => !w.verified);

        data.status = hasMorePending ? 'validating' : 'active';
        data.winners = updatedWinners;
        data.socialStatus = {
            message: hasMorePending ? "⚠️ Cartón rechazado. Revisando otros reclamos..." : "❌ Cartón rechazado. ¡El sorteo continúa!",
            tensionLevel: hasMorePending ? 'high' : 'medium',
            topPlayers: data.socialStatus?.topPlayers || [],
            lastUpdate: Date.now()
        };

        return data;
    });
};

export const addWinner = async (userId: string, ticketId: string, prizePosition: number) => {
    // Legacy support or internal use
    const snap = await get(ref(realtimeDb, GAME_STATE_PATH));
    const winners = snap.val()?.winners || [];

    if (winners.some((w: any) => w.ticketId === ticketId)) return;

    const newWinner = {
        userId,
        ticketId,
        timestamp: Date.now(),
        prizePosition
    };

    await update(ref(realtimeDb, GAME_STATE_PATH), {
        winners: [...winners, newWinner]
    });
};

// --- Listener for both Admin and User ---

export const subscribeToGame = (callback: (state: GameState | null) => void, onError?: (error: any) => void) => {
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);
    return onValue(gameRef, (snap) => {
        if (snap.exists()) {
            callback(snap.val());
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("RTDB Subscribe Error:", error);
        if (onError) onError(error);
    });
}

export const fullResetSystem = async () => {
    try {
        console.log("INICIANDO RESETEO SEGURO...");

        // 1. ARCHIVAR ANTES DE BORRAR (Copia de seguridad en history_backups)
        const collectionsToBackup = ["tickets", "payments"];
        const backupId = `BACKUP_${Date.now()}`;

        for (const colName of collectionsToBackup) {
            const snap = await getDocs(collection(db, colName));
            if (snap.size > 0) {
                const batch = writeBatch(db);
                snap.docs.forEach(docSnap => {
                    const backupRef = doc(db, "history_backups", backupId, colName, docSnap.id);
                    batch.set(backupRef, { ...docSnap.data(), backedUpAt: firestoreTimestamp() });
                    batch.delete(docSnap.ref);
                });
                await batch.commit();
                console.log(`✅ Backup y limpieza de ${colName} completada.`);
            }
        }

        // 2. Limpiar RTDB: Game State y Presence
        await set(ref(realtimeDb, GAME_STATE_PATH), {
            status: 'waiting',
            mode: 'auto',
            currentNumber: null,
            history: [],
            lastBallTime: Date.now(),
            countdownStartTime: null,
            drawId: `RESET_${Date.now()}`,
            winners: [],
            socialStatus: {
                message: "¡Mesa limpia! Nueva jugada abierta.",
                tensionLevel: 'low',
                topPlayers: [],
                lastUpdate: Date.now()
            },
            config: {
                price: 100,
                prizes: [500],
                startTime: "20:00",
                playersCount: 0,
                totalTickets: 0,
                maxTickets: 90,
                paymentInfo: {
                    bank: "Venezuela (BDV)",
                    phone: "0414-2747550",
                    ci: "V-30826974",
                    name: "Administrador"
                }
            }
        });

        // 3. Clear Financials (Caja Limpia)
        await set(ref(realtimeDb, "financials"), {
            totalRevenue: 0,
            hoya: 0,
            lastReset: Date.now()
        });

        // 4. Clear Presence nodes
        await set(ref(realtimeDb, PRESENCE_PATH), null);

        return { success: true };
    } catch (error) {
        console.error("Error during full reset:", error);
        return { success: false, error };
    }
};

/**
 * RESET SEMANAL DE LA HOYA (Días Viernes)
 * Archiva el acumulado y pone el contador en 0.
 */
export const resetWeeklyHoya = async () => {
    try {
        const financialsRef = ref(realtimeDb, "financials");
        const snap = await get(financialsRef);

        if (!snap.exists()) return { success: false, error: "No hay finanzas registradas" };

        const currentData = snap.val();
        const hoyaAmount = currentData.hoya || 0;

        // 1. Guardar en Historial de Firestore
        await addDoc(collection(db, "hoya_history"), {
            amount: hoyaAmount,
            closedAt: firestoreTimestamp(),
            totalRevenueAtClose: currentData.totalRevenue || 0
        });

        // 2. Resetear en Realtime Database (Mantenemos totalRevenue)
        await update(financialsRef, {
            hoya: 0
        });

        return { success: true, amountResetted: hoyaAmount };
    } catch (error) {
        console.error("Error al resetear la hoya:", error);
        return { success: false, error };
    }
}

// --- Archive and Reset Logic ---
export const archiveCurrentGame = async () => {
    try {
        // 1. Get Game State (with timeout)
        const gameSnap = await withTimeout(
            get(ref(realtimeDb, GAME_STATE_PATH)),
            8000,
            "Obtener estado del juego"
        );
        if (!gameSnap.exists()) return { success: false, error: "No active game" };
        const gameState = gameSnap.val() as GameState;

        // 2. Get All Active Tickets (with timeout)
        const ticketsSnap = await withTimeout(
            getDocs(collection(db, "tickets")),
            10000,
            "Obtener tickets"
        );
        console.log(`Archivando ${ticketsSnap.size} tickets...`);

        // 3. Batch Operations Logic (Chunking 200 ops limit)
        const BATCH_SIZE = 200;
        const historyGameRef = doc(db, "history_games", gameState.drawId || `DRAW_${Date.now()}`);

        // Save Summary first (with timeout)
        const summaryBatch = writeBatch(db);
        summaryBatch.set(historyGameRef, {
            ...gameState,
            archivedAt: firestoreTimestamp(),
            totalTickets: ticketsSnap.size
        });
        await withTimeout(
            summaryBatch.commit(),
            8000,
            "Guardar resumen del juego"
        );

        // Save Tickets in chunks (with timeout per chunk)
        const chunks = [];
        const docs = ticketsSnap.docs;
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            chunks.push(docs.slice(i, i + BATCH_SIZE));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(t => {
                const ticketData = t.data();
                const archiveTicketRef = doc(collection(historyGameRef, "tickets"), t.id);
                batch.set(archiveTicketRef, ticketData);
                batch.delete(t.ref);
            });
            await withTimeout(
                batch.commit(),
                10000,
                "Archivar lote de tickets"
            );
        }

        // 4. Reset RTDB to Waiting (with timeout)
        await withTimeout(
            set(ref(realtimeDb, GAME_STATE_PATH), {
                status: 'waiting',
                mode: 'auto',
                currentNumber: null,
                history: [],
                lastBallTime: Date.now(),
                countdownStartTime: null,
                drawId: `SORTEO_${Date.now()}`, // Generate new ID
                winners: [],
                config: gameState.config // Keep config
            }),
            8000,
            "Reiniciar juego"
        );

        return { success: true };

    } catch (error) {
        console.error("Archive Error:", error);
        return { success: false, error };
    }
}

// --- Payout Logic ---

export const submitWinnerPaymentDetails = async (ticketId: string, details: { bank: string, phone: string, ci: string, name: string, whatsapp: string }) => {
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);
    return runTransaction(gameRef, (data: GameState | null) => {
        if (!data || !data.winners) return;
        const index = data.winners.findIndex(w => w.ticketId === ticketId);
        if (index === -1) return;

        data.winners[index].payoutStatus = 'processing_payment';
        data.winners[index].paymentDetails = details;
        return data;
    });
};

import { recordTransaction } from "./financial-actions";

// ... existing imports

export const markWinnerAsPaid = async (ticketId: string) => {
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);
    let prizeAmount = 0;
    let winnerName = "Ganador";

    try {
        // 1. Transaction to update state AND get data for logging (with timeout protection)
        const result = await withTimeout(
            runTransaction(gameRef, (data: GameState | null) => {
                if (!data || !data.winners) return;
                const index = data.winners.findIndex(w => w.ticketId === ticketId);
                if (index === -1) return;

                // Get prize info before updating
                const winner = data.winners[index];
                const position = winner.prizePosition || 1;
                // Default to first prize if config missing, or 0 safely
                const prizeList = data.config?.prizes || [0];
                // prizePosition is 1-based usually
                const amount = prizeList[position - 1] || prizeList[0] || 0;

                prizeAmount = amount;
                winnerName = winner.paymentDetails?.name || winner.userId;

                // Update status
                data.winners[index].payoutStatus = 'paid';
                return data;
            }),
            10000,
            "Confirmar pago"
        );

        // 2. If successful, record the expense in Financial System (CRÍTICO - Sistema seguro)
        if (result.committed && prizeAmount > 0) {
            const { recordTransactionSafe } = await import("./financial-actions");
            const txnResult = await withTimeout(
                recordTransactionSafe(
                    'expense',
                    'prize_payout',
                    prizeAmount,
                    `Pago de premio a ${winnerName} (Cartón ${ticketId.slice(-4)})`,
                    ticketId
                ),
                8000,
                "Registrar transacción"
            );

            if (!txnResult.success) {
                // Si falla el registro, es CRÍTICO - lanzar error
                throw new Error(`Premio marcado como pagado pero registro financiero falló: ${txnResult.error}`);
            }

            console.log(`✅ Premio pagado y registrado exitosamente [TXN: ${txnResult.transactionId}]`);
        }

        return result;
    } catch (error) {
        console.error("Error en markWinnerAsPaid:", error);
        throw error; // Re-throw para que el componente pueda manejarlo
    }
};

export const removeWinner = async (ticketId: string) => {
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);
    return runTransaction(gameRef, (data: GameState | null) => {
        if (!data || !data.winners) return;

        // Remove the winner
        data.winners = data.winners.filter(w => w.ticketId !== ticketId);

        // Safety: If no winners left, we might want to revert status, but let's leave it up to Admin to manually Reset or Resume if they deleted everyone.
        // Actually, if we delete a "ghost" winner, we just want it gone.
        return data;
    });
};


// --- User Game Interaction ---

export const claimBingo = async (userId: string, claims: { ticketId: string, numbers: number[] }[]) => {
    if (claims.length === 0) return { success: false, error: "No tickets selected" };

    try {
        const gameRef = ref(realtimeDb, GAME_STATE_PATH);

        const result = await runTransaction(gameRef, (currentData: GameState | null) => {
            if (!currentData) return;
            if (currentData.status !== 'active' && currentData.status !== 'validating') return;

            const winners = currentData.winners || [];

            // Check if ANY of these tickets were already claimed
            const alreadyClaimed = claims.some(c => winners.some(w => w.ticketId === c.ticketId));
            if (alreadyClaimed) return;

            // Sort claims by timestamp/order if needed, but here we treat them as a single "Win Claim" event
            // that contains multiple tickets. 
            // In the DB, we'll record them as individual winners OR grouped. 
            // Let's record them as one entry but with an array of tickets for the Admin to see.
            // Or just multiple entries. Let's do multiple entries but linked by timestamp.

            const timestamp = Date.now();
            const newEntries = claims.map(c => ({
                userId,
                ticketId: c.ticketId,
                timestamp,
                prizePosition: 0,
                numbers: c.numbers,
                verified: false,
                multiClaimCount: claims.length // Help admin see it's a multi-win
            }));

            currentData.status = 'validating';
            currentData.winners = [...winners, ...newEntries];
            currentData.socialStatus = {
                message: `📢 ¡BINGO CANTADO! Validando cartón...`,
                tensionLevel: 'imminent',
                topPlayers: currentData.socialStatus?.topPlayers || [],
                lastUpdate: Date.now()
            };

            return currentData;
        });

        return { success: result.committed, snapshot: result.snapshot };
    } catch (error) {
        console.error("Error claiming bingo:", error);
        return { success: false, error };
    }
};

/**
 * Verifica si se cumplen las condiciones para el inicio automático del juego.
 * Regla: Mínimo 20 jugadores conectados o tickets vendidos para arrancar.
 */
export const checkAutoStart = async () => {
    try {
        const gameRef = ref(realtimeDb, GAME_STATE_PATH);
        const gameSnap = await get(gameRef);

        if (!gameSnap.exists()) return;

        const gameState = gameSnap.val() as GameState;

        // Solo actuar si está en espera y en modo automático
        if (gameState.status !== 'waiting' || gameState.mode !== 'auto') return;

        // 1. Obtener conteo de jugadores únicos con tickets (más seguro que online count)
        const ticketsSnap = await getDocs(collection(db, "tickets"));
        const uniquePlayers = new Set(ticketsSnap.docs.map(doc => doc.data().userId)).size;

        const MIN_PLAYERS_TO_START = 20;

        if (uniquePlayers >= MIN_PLAYERS_TO_START) {
            console.log(`🚀 AUTO-START TRIGGERED: ${uniquePlayers} players ready.`);
            await startCountdown();
        } else {
            // Actualizar estado social para informar faltantes
            const missing = MIN_PLAYERS_TO_START - uniquePlayers;
            await update(ref(realtimeDb, `${GAME_STATE_PATH}/socialStatus`), {
                message: `Esperando jugadores... Faltan ${missing} para iniciar`,
                tensionLevel: 'low',
                lastUpdate: Date.now()
            });
        }

    } catch (error) {
        console.error("Error en checkAutoStart:", error);
    }
};
