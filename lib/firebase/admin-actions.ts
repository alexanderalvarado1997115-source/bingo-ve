import { db } from "./config";
import { collection, doc, updateDoc, serverTimestamp, getDocs, query, where, orderBy, addDoc, writeBatch } from "firebase/firestore";
import { Payment } from "@/utils/types";

// --- Admin Payment Actions ---

export const getPendingPayments = async () => {
    try {
        const q = query(
            collection(db, "payments"),
            where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    } catch (error) {
        console.error("Error getting pending payments:", error);
        return [];
    }
};

export const approvePayment = async (paymentId: string, userId: string, ticketsCount: number, drawId: string) => {
    try {
        const { realtimeDb } = await import("./config");
        const { ref, runTransaction } = await import("firebase/database");

        // 1. Get User Data for accurate records
        let userName = "Jugador";
        try {
            const userSnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", userId)));
            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                userName = userData.displayName || userData.email?.split('@')[0] || "Jugador";
            }
        } catch (e) {
            console.error("Error fetching user name:", e);
        }

        // 2. Get Payment Data
        const paymentSnapshot = await getDocs(query(collection(db, "payments"), where("__name__", "==", paymentId)));
        if (paymentSnapshot.empty) throw new Error("Pago no encontrado");

        const paymentData = paymentSnapshot.docs[0].data();
        const amount = Number(paymentData.amount) || 0; // FORCE NUMBER BLINDAGE

        const batch = writeBatch(db);

        // 2. Mark Payment as Approved
        const paymentRef = doc(db, "payments", paymentId);
        batch.update(paymentRef, {
            status: "approved",
            reviewedAt: serverTimestamp(),
        });

        // 3. Create Tickets
        const ticketsCollectionRef = collection(db, "tickets");
        for (let i = 0; i < ticketsCount; i++) {
            const ticketRef = doc(ticketsCollectionRef);
            const matrix = generateBingoCard75();
            const rowMajor = [];
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    rowMajor.push(matrix[c][r]);
                }
            }
            batch.set(ticketRef, {
                userId,
                userName,
                drawId,
                matrix: rowMajor,
                numbers: rowMajor.filter(n => n !== 0),
                markedNumbers: [],
                purchaseTime: serverTimestamp(),
            });
        }

        // --- ATOMIC TRANSACTION FOR FINANCES AND TICKETS ---
        const gameActiveRef = ref(realtimeDb, "game/active");
        const financialsRef = ref(realtimeDb, "financials");

        // Use a transaction for financials
        await runTransaction(financialsRef, (current) => {
            const data = current || { totalRevenue: 0, hoya: 0 };
            return {
                ...data,
                totalRevenue: Number(data.totalRevenue || 0) + amount,
                hoya: Number(data.hoya || 0) + (amount * 0.20)
            };
        });

        // Use a transaction for game config to avoid "pitting" ticket counts
        await runTransaction(ref(realtimeDb, "game/active/config"), (config) => {
            if (!config) return config;
            return {
                ...config,
                totalTickets: (Number(config.totalTickets) || 0) + ticketsCount
            };
        });

        // Check for Auto-Start (Swiss Watch)
        const gameSnap = await import("firebase/database").then(m => m.get(gameActiveRef));
        const gameState = gameSnap.val();
        if (gameState.status === 'waiting' && gameState.config.totalTickets >= gameState.config.maxTickets) {
            await import("firebase/database").then(m => m.update(gameActiveRef, {
                status: 'countdown',
                countdownStartTime: Date.now()
            }));
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error approving payment:", error);
        return { success: false, error };
    }
};

export const rejectPayment = async (paymentId: string) => {
    try {
        const paymentRef = doc(db, "payments", paymentId);
        await updateDoc(paymentRef, {
            status: "rejected",
            reviewedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error rejecting payment:", error);
        return { success: false, error };
    }
};

// --- Helper: Generate Bingo 75 Card (5x5) ---
function generateBingoCard75(): number[][] {
    const card: number[][] = [[], [], [], [], []]; // 5 columns: B I N G O
    const ranges = [
        { min: 1, max: 15 },   // B
        { min: 16, max: 30 },  // I
        { min: 31, max: 45 },  // N
        { min: 46, max: 60 },  // G
        { min: 61, max: 75 }   // O
    ];

    // Generate columns
    for (let col = 0; col < 5; col++) {
        const { min, max } = ranges[col];
        const numbers: number[] = [];
        while (numbers.length < 5) {
            const r = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!numbers.includes(r)) numbers.push(r);
        }
        card[col] = numbers;
    }

    // Set FREE space in the middle (Column N, Row 3 -> Index 2,2)
    card[2][2] = 0;
    return card;
}

export const getAllActiveTickets = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "tickets"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all tickets:", error);
        return [];
    }
};

export const getAllUsers = async () => {
    try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting users:", error);
        return [];
    }
};
