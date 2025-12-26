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
        const batch = writeBatch(db);

        // 1. Reference to payment
        const paymentRef = doc(db, "payments", paymentId);
        batch.update(paymentRef, {
            status: "approved",
            reviewedAt: serverTimestamp(),
        });

        // 2. Generate and Add Tickets within the batch
        const ticketsCollectionRef = collection(db, "tickets");

        for (let i = 0; i < ticketsCount; i++) {
            const ticketRef = doc(ticketsCollectionRef);
            const matrix = generateBingoCard75();

            // TRANSPOSE TO ROW-MAJOR for correct grid rendering and logic
            // Matrix is col-major currently. We need [row1, row2, row3, row4, row5]
            const rowMajor = [];
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    rowMajor.push(matrix[c][r]);
                }
            }

            batch.set(ticketRef, {
                userId,
                drawId: drawId,
                matrix: rowMajor,
                numbers: rowMajor.filter(n => n !== 0),
                markedNumbers: [],
                purchaseTime: serverTimestamp(),
            });
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
