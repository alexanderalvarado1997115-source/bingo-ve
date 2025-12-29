// Script para crear transacciones de prueba de los últimos 7 días
require('dotenv').config({ path: './.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');
const { getDatabase, ref, set } = require('firebase/database');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

async function createTestData() {
    try {
        console.log('🧪 Creando datos de prueba para los últimos 7 días...\n');

        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        let totalRevenue = 0;
        let totalPaid = 0;

        // Crear transacciones para cada día
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(14, 0, 0, 0);

            // Ingresos aleatorios entre 200-800 Bs
            const income = Math.floor(Math.random() * 600) + 200;
            totalRevenue += income;

            await addDoc(collection(db, 'transactions'), {
                timestamp: Timestamp.fromDate(date),
                type: 'income',
                category: 'ticket_sale',
                amount: income,
                description: `Pago aprobado - Usuario Demo ${i + 1}`,
                relatedId: `test_payment_${i}`,
                balance: totalRevenue
            });

            console.log(`✅ Día ${days[6 - i]}: +${income} Bs (ingreso)`);

            // Algunos días tienen egresos (premios)
            if (i % 3 === 0 && i !== 6) {
                const expense = 500;
                totalPaid += expense;

                await addDoc(collection(db, 'transactions'), {
                    timestamp: Timestamp.fromDate(new Date(date.getTime() + 3600000)), // 1 hora después
                    type: 'expense',
                    category: 'prize_payout',
                    amount: -expense,
                    description: `Premio pagado - Ganador Demo ${i}`,
                    relatedId: `test_winner_${i}`,
                    balance: totalRevenue - totalPaid
                });

                console.log(`   💸 Día ${days[6 - i]}: -${expense} Bs (premio)`);
            }
        }

        // Actualizar financials en Realtime Database
        const hoya = totalRevenue * 0.20;
        await set(ref(realtimeDb, 'financials'), {
            totalRevenue,
            hoya,
            totalPaid,
            lastReset: Date.now(),
            config: {
                ticketPrice: 100,
                bingoReward: 500,
                hoyaPercentage: 20
            }
        });

        console.log('\n📊 RESUMEN FINAL:');
        console.log(`   💰 Ingresos Totales: ${totalRevenue} Bs`);
        console.log(`   🏺 La Hoya (20%): ${hoya} Bs`);
        console.log(`   💸 Premios Pagados: ${totalPaid} Bs`);
        console.log(`   💎 Utilidad Neta: ${totalRevenue - hoya - totalPaid} Bs`);
        console.log('\n✨ ¡Datos de prueba creados! Refresca el Centro Financiero para ver los gráficos.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestData();
