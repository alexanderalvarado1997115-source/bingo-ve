// Script para inicializar la configuración financiera en Firebase
// Ejecutar: node init-financial-config.js

require('dotenv').config({ path: './.env.local' });
const { initializeApp } = require('firebase/app');
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
const db = getDatabase(app);

async function initializeFinancialConfig() {
    try {
        console.log('🔧 Inicializando configuración financiera...');

        const financialConfig = {
            totalRevenue: 0,
            hoya: 0,
            totalPaid: 0,
            lastReset: Date.now(),
            config: {
                ticketPrice: 100,
                bingoReward: 500,
                hoyaPercentage: 20
            }
        };

        await set(ref(db, 'financials'), financialConfig);

        console.log('✅ Configuración financiera inicializada correctamente:');
        console.log('   - Precio por cartón: 100 Bs');
        console.log('   - Premio por bingo: 500 Bs');
        console.log('   - Porcentaje para La Hoya: 20%');
        console.log('\n💡 Puedes cambiar estos valores desde el panel de administración.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error inicializando configuración:', error);
        process.exit(1);
    }
}

initializeFinancialConfig();
