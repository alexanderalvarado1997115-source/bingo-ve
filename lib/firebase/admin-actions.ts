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
        const { ref, runTransaction: runRealtimeTransaction, get: getRealtime } = await import("firebase/database");
        const { runTransaction: runFirestoreTransaction } = await import("firebase/firestore");

        let paymentAmount = 0;
        let userName = "Jugador";

        // --- PASO 1: TRANSACCIÓN ATÓMICA EN FIRESTORE (Evita doble gasto) ---
        await runFirestoreTransaction(db, async (transaction) => {
            // 1. Leer el pago con bloqueo
            const paymentRef = doc(db, "payments", paymentId);
            const paymentDoc = await transaction.get(paymentRef);

            if (!paymentDoc.exists()) throw "Pago no encontrado";

            const data = paymentDoc.data();
            if (data.status !== "pending") throw "El pago ya fue procesado"; // 🛡️ ESCUDO ANTI-DOBLE CLICK

            paymentAmount = Number(data.amount) || 0;

            // 2. Leer usuario (opcional, sin bloqueo estricto necesario)
            const userSnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", userId)));
            if (!userSnapshot.empty) {
                const uData = userSnapshot.docs[0].data();
                userName = uData.displayName || uData.email?.split('@')[0] || "Jugador";
            }

            // 3. Escribir: Actualizar Pago a Aprobado
            transaction.update(paymentRef, {
                status: "approved",
                reviewedAt: serverTimestamp(),
            });

            // 4. Escribir: Crear Tickets
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
                transaction.set(ticketRef, {
                    userId,
                    userName,
                    drawId,
                    matrix: rowMajor,
                    numbers: rowMajor.filter(n => n !== 0), // Guardar números planos para búsqueda fácil
                    markedNumbers: [],
                    purchaseTime: serverTimestamp(),
                });
            }
        });

        // --- PASO 2: ACTUALIZAR REALTIME DB (Solo si Firestore tuvo éxito) ---

        // A. Finanzas
        const financialsRef = ref(realtimeDb, "financials");
        await runRealtimeTransaction(financialsRef, (current) => {
            const data = current || { totalRevenue: 0, hoya: 0 };
            return {
                ...data,
                totalRevenue: Number(data.totalRevenue || 0) + paymentAmount,
                hoya: Number(data.hoya || 0) + (paymentAmount * 0.20)
            };
        });

        // B. Configuración del Juego (Contador Tickets)
        const gameConfigRef = ref(realtimeDb, "game/active/config");
        await runRealtimeTransaction(gameConfigRef, (config) => {
            if (!config) return config;
            return {
                ...config,
                totalTickets: (Number(config.totalTickets) || 0) + ticketsCount
            };
        });

        // C. Chequeo de Auto-Start (Usar lógica centralizada de 20 jugadores)
        try {
            const { checkAutoStart } = await import("./game-actions");
            await checkAutoStart();
        } catch (e) {
            console.error("Error auto-starting game:", e);
        }

        // D. Registro Financiero (CRÍTICO - Usa sistema seguro con doble escritura)
        const { recordTransactionSafe } = await import("./financial-actions");
        const txnResult = await recordTransactionSafe(
            'income',
            'ticket_sale',
            paymentAmount,
            `Pago aprobado - ${userName} (${ticketsCount} tickets)`,
            paymentId
        );

        if (!txnResult.success) {
            // Si falla el registro financiero, es CRÍTICO
            console.error("❌ CRÍTICO: Fallo en registro financiero, iniciando rollback...");

            // Aquí podrías implementar rollback completo si es necesario
            // Por ahora, lanzamos error para que el admin sepa que debe revisar
            throw new Error(`Pago procesado pero registro financiero falló: ${txnResult.error}`);
        }

        console.log(`✅ Pago aprobado exitosamente con registro financiero [TXN: ${txnResult.transactionId}]`);

        // E. Procesar Recompensa de Referidos (10%)
        // No bloqueante, si falla solo se loguea
        try {
            const { processReferralReward } = await import("./financial-actions");
            if (txnResult.transactionId) {
                processReferralReward(userId, paymentAmount, txnResult.transactionId); // Async, fire and forget logic or await if critical
            }
        } catch (refError) {
            console.error("⚠️ Error procesando referido (no crítico):", refError);
        }

        return { success: true };

    } catch (error) {
        console.error("Error approving payment:", error);
        return { success: false, error: typeof error === 'string' ? error : 'Error interno' };
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

export const getDrawHistory = async () => {
    try {
        const q = query(
            collection(db, "history_games"),
            orderBy("archivedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            archivedAt: doc.data().archivedAt?.toDate ? doc.data().archivedAt.toDate() : doc.data().archivedAt
        }));
    } catch (error) {
        console.error("Error getting draw history:", error);
        return [];
    }
};

// --- User Management Actions ---

export const toggleUserBan = async (userId: string, currentStatus: boolean) => {
    try {
        await updateDoc(doc(db, "users", userId), {
            banned: !currentStatus
        });
        return { success: true };
    } catch (error) {
        console.error("Error toggling ban:", error);
        return { success: false, error };
    }
};

export const giveFreeTicket = async (userId: string, count: number = 1) => {
    try {
        const batch = writeBatch(db);
        const { realtimeDb } = await import("./config");
        const { ref, get } = await import("firebase/database");

        // 1. Get Game ID
        const gameSnap = await get(ref(realtimeDb, "game/active"));
        const drawId = gameSnap.exists() ? gameSnap.val().drawId : "UNKNOWN_DRAW";

        // 2. Get User Name
        let userName = "Cortesía";
        const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", userId)));
        if (!userSnap.empty) {
            userName = userSnap.docs[0].data().displayName || "Jugador";
        }

        // 3. Create Tickets
        for (let i = 0; i < count; i++) {
            const ticketRef = doc(collection(db, "tickets"));
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
                isCourtesy: true // Flag for analytics
            });
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error giving free ticket:", error);
        return { success: false, error };
    }
};

export const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
        await updateDoc(doc(db, "users", userId), {
            role: newRole
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating role:", error);
        return { success: false, error };
    }
};
