import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
import { realtimeDb } from "./config";

/**
 * Updates the user's presence status in Realtime Database.
 * This is used to track if a user is currently online or offline.
 */
export const updatePresence = (userId: string) => {
    const statusRef = ref(realtimeDb, `status/${userId}`);
    const connectedRef = ref(realtimeDb, ".info/connected");

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            // When we disconnect, update the status to offline and include a timestamp
            const offlineStatus = {
                state: "offline",
                last_changed: serverTimestamp(),
            };

            onDisconnect(statusRef).set(offlineStatus).then(() => {
                // When we are connected, update the status to online
                const onlineStatus = {
                    state: "online",
                    last_changed: serverTimestamp(),
                };

                set(statusRef, onlineStatus);
            });
        }
    });
};

/**
 * Subscribes to the status of all users to identify who is online
 */
export const subscribeToPresence = (callback: (statusMap: Record<string, any>) => void) => {
    const statusRef = ref(realtimeDb, "status");
    return onValue(statusRef, (snap) => {
        callback(snap.val() || {});
    });
};
