import { realtimeDb, db } from "./config";
import { ref, set, get, update, onValue, onDisconnect, serverTimestamp, runTransaction } from "firebase/database";
import { collection, getDocs, deleteDoc, doc, writeBatch, serverTimestamp as firestoreTimestamp } from "firebase/firestore";

const GAME_STATE_PATH = "game/active";
const PRESENCE_PATH = "presence/users";

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

    await update(ref(realtimeDb, GAME_STATE_PATH), {
        currentNumber: next,
        history: newHistory,
        lastBallTime: Date.now()
    });

    return next;
};

export const verifyBingoWin = async (winner: any, currentWinners: any[] = []) => {
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);

    return runTransaction(gameRef, (data: GameState | null) => {
        if (!data) return;

        const allWinners = data.winners || [];
        const alreadyVerified = allWinners.filter(w => w.verified);
        const otherPending = allWinners.filter(w => !w.verified && !(w.userId === winner.userId && w.timestamp === winner.timestamp));
        const linkedTickets = allWinners.filter(w => !w.verified && w.userId === winner.userId && w.timestamp === winner.timestamp);

        const ticketsToVerify = linkedTickets.length > 0 ? linkedTickets : [winner];

        // Create verified entries
        const verifiedEntries = ticketsToVerify.map((t, idx) => ({
            ...t,
            verified: true,
            prizePosition: alreadyVerified.length + 1 + idx,
            payoutStatus: 'pending_info'
        }));

        // Final list
        const newWinnersList = [...alreadyVerified, ...verifiedEntries, ...otherPending];

        // Rule: Only Full House supported -> Confirming a winner always FINISHES the game
        data.status = 'finished';
        data.winners = newWinnersList;

        return data;
    });
};

export const rejectBingoWin = async (winner: any) => {
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);

    return runTransaction(gameRef, (data: GameState | null) => {
        if (!data || !data.winners) return;

        const updatedWinners = data.winners.filter(w => !(w.userId === winner.userId && w.timestamp === winner.timestamp));
        const hasMorePending = updatedWinners.some(w => !w.verified);

        data.status = hasMorePending ? 'validating' : 'active';
        data.winners = updatedWinners;

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
        // 1. Clear Firestore: Tickets and Payments
        const collectionsToClear = ["tickets", "payments"];
        for (const colName of collectionsToClear) {
            const snap = await getDocs(collection(db, colName));
            console.log(`Borrando ${snap.size} de ${colName}`);

            // Delete docs individually or in chunks to avoid batch limits (500)
            const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
        }

        // 2. Clear RTDB: Game State and Presence
        await set(ref(realtimeDb, GAME_STATE_PATH), {
            status: 'waiting',
            mode: 'auto',
            currentNumber: null,
            history: [],
            lastBallTime: Date.now(),
            countdownStartTime: null,
            drawId: `BINGO_RESET_${Date.now()}`,
            winners: [],
            config: {
                price: 100,
                prizes: [500, 350, 200, 150, 100],
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

        // 3. Clear Presence nodes
        await set(ref(realtimeDb, PRESENCE_PATH), null);

        return { success: true };
    } catch (error) {
        console.error("Error during full reset:", error);
        return { success: false, error };
    }
};

// --- Archive and Reset Logic ---
export const archiveCurrentGame = async () => {
    try {
        // 1. Get Game State
        const gameSnap = await get(ref(realtimeDb, GAME_STATE_PATH));
        if (!gameSnap.exists()) return { success: false, error: "No active game" };
        const gameState = gameSnap.val() as GameState;

        // 2. Get All Active Tickets
        const ticketsSnap = await getDocs(collection(db, "tickets"));
        console.log(`Archivando ${ticketsSnap.size} tickets...`);

        // 3. Batch Operations Logic (Chunking 200 ops limit)
        const BATCH_SIZE = 200;
        const historyGameRef = doc(db, "history_games", gameState.drawId || `DRAW_${Date.now()}`);

        // Save Summary first
        const summaryBatch = writeBatch(db);
        summaryBatch.set(historyGameRef, {
            ...gameState,
            archivedAt: firestoreTimestamp(),
            totalTickets: ticketsSnap.size
        });
        await summaryBatch.commit();

        // Save Tickets in chunks
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
            await batch.commit();
        }

        // 4. Reset RTDB to Waiting
        await set(ref(realtimeDb, GAME_STATE_PATH), {
            status: 'waiting',
            mode: 'auto',
            currentNumber: null,
            history: [],
            lastBallTime: Date.now(),
            countdownStartTime: null,
            drawId: `SORTEO_${Date.now()}`, // Generate new ID
            winners: [],
            config: gameState.config // Keep config
        });

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

export const markWinnerAsPaid = async (ticketId: string) => {
    const gameRef = ref(realtimeDb, GAME_STATE_PATH);
    return runTransaction(gameRef, (data: GameState | null) => {
        if (!data || !data.winners) return;
        const index = data.winners.findIndex(w => w.ticketId === ticketId);
        if (index === -1) return;

        data.winners[index].payoutStatus = 'paid';
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

            return currentData;
        });

        return { success: result.committed, snapshot: result.snapshot };
    } catch (error) {
        console.error("Error claiming bingo:", error);
        return { success: false, error };
    }
};
