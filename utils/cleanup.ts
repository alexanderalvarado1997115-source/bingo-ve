import { db, realtimeDb } from "./lib/firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, set } from "firebase/database";

async function freshStart() {
    console.log("🚀 Iniciando limpieza total...");

    // 1. Limpiar Realtime DB (Game State)
    const gameRef = ref(realtimeDb, "game/active");
    await set(gameRef, {
        status: 'waiting',
        mode: 'auto',
        currentNumber: null,
        history: [],
        lastBallTime: Date.now(),
        countdownStartTime: null,
        drawId: "SORTEO_001",
        winners: [],
        config: {
            price: 100,
            prizes: [500, 350, 200, 150, 100],
            startTime: "20:00",
            playersCount: 0,
            totalTickets: 0,
            maxTickets: 90
        }
    });
    console.log("✅ Estado del juego reiniciado.");

    // 2. Limpiar Tickets en Firestore
    const ticketsSnap = await getDocs(collection(db, "tickets"));
    const deletePromises = ticketsSnap.docs.map(t => deleteDoc(doc(db, "tickets", t.id)));
    await Promise.all(deletePromises);
    console.log(`✅ ${ticketsSnap.size} tickets eliminados.`);

    console.log("✨ Sistema listo para un sorteo real.");
}

// freshStart(); // Descomentar para ejecutar
