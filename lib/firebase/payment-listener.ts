import { db } from "./config";
import { collection, query, where, onSnapshot, Unsubscribe } from "firebase/firestore";

/**
 * Subscribe to user's pending payment status in real-time
 * Returns unsubscribe function
 */
export const subscribeToUserPaymentStatus = (
    userId: string,
    onStatusChange: (status: 'none' | 'pending' | 'approved' | 'rejected', paymentId?: string) => void
): Unsubscribe => {
    const q = query(
        collection(db, "payments"),
        where("userId", "==", userId),
        where("status", "in", ["pending", "approved", "rejected"])
    );

    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            onStatusChange('none');
            return;
        }

        // Get the most recent payment
        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toMillis() || 0
        }));

        // Sort by creation time (most recent first)
        payments.sort((a: any, b: any) => b.createdAt - a.createdAt);

        const latestPayment: any = payments[0];

        onStatusChange(latestPayment.status as 'pending' | 'approved' | 'rejected', latestPayment.id);
    }, (error) => {
        console.error("Error subscribing to payment status:", error);
        onStatusChange('none');
    });
};

import { Payment } from "@/utils/types";

// Listen to ALL pending payments (Admin only)
export const subscribeToPendingPayments = (callback: (payments: Payment[]) => void) => {
    const q = query(
        collection(db, "payments"),
        where("status", "==", "pending")
        // orderBy("createdAt", "desc") // Keep commented until index exists
    );

    return onSnapshot(q, (snapshot) => {
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
        callback(payments);
    });
};
