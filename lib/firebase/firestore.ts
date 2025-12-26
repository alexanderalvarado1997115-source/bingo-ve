import { db } from "./config";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { Payment } from "@/utils/types";

// --- Payment Functions ---

export const createPaymentRequest = async (
    userId: string,
    ticketsCount: number,
    amount: number,
    reference: string,
    phone: string,
    last4Digits?: string
) => {
    try {
        const docRef = await addDoc(collection(db, "payments"), {
            userId,
            ticketsCount,
            amount,
            reference,
            phone,
            last4Digits: last4Digits || "",
            status: "pending",
            createdAt: serverTimestamp(),
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating payment:", error);
        return { success: false, error };
    }
};


export const getUserPayments = async (userId: string) => {
    try {
        const q = query(
            collection(db, "payments"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    } catch (error) {
        console.error("Error getting user payments:", error);
        return [];
    }
};

// --- Ticket Functions ---

export const getUserTickets = async (userId: string) => {
    try {
        const q = query(
            collection(db, "tickets"),
            where("userId", "==", userId),
            orderBy("purchaseTime", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.log(error);
        return [];
    }
}
