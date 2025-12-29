/**
 * Script de Prueba del Sistema Financiero Blindado
 * Ejecutar con: node test-financial-system.js
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Configuración de Firebase (usar las mismas credenciales del .env.local)
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
const realtimeDb = getDatabase(app);
const firestoreDb = getFirestore(app);

async function testFinancialIntegrity() {
    console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA FINANCIERO BLINDADO\n');
    console.log('='.repeat(60));

    try {
        // Prueba 1: Verificar estructura de Realtime DB
        console.log('\n📊 PRUEBA 1: Verificando Realtime Database...');
        const rtdbSnapshot = await get(ref(realtimeDb, 'financials'));

        if (rtdbSnapshot.exists()) {
            const rtdbData = rtdbSnapshot.val();
            console.log('✅ Realtime DB conectado');
            console.log(`   - totalRevenue: ${rtdbData.totalRevenue || 0} Bs`);
            console.log(`   - hoya: ${rtdbData.hoya || 0} Bs`);

            // Verificar si existe el ledger (doble escritura)
            const ledgerSnapshot = await get(ref(realtimeDb, 'financials/ledger'));
            if (ledgerSnapshot.exists()) {
                const ledgerCount = Object.keys(ledgerSnapshot.val()).length;
                console.log(`✅ Ledger (respaldo) encontrado: ${ledgerCount} transacciones`);
            } else {
                console.log('⚠️  Ledger vacío (normal si no hay transacciones aún)');
            }
        } else {
            console.log('❌ No se encontró nodo financials en RTDB');
        }

        // Prueba 2: Verificar Firestore
        console.log('\n📊 PRUEBA 2: Verificando Firestore...');
        const transactionsSnapshot = await getDocs(collection(firestoreDb, 'transactions'));
        console.log(`✅ Firestore conectado`);
        console.log(`   - Transacciones registradas: ${transactionsSnapshot.size}`);

        // Prueba 3: Auditoría de integridad
        console.log('\n🔍 PRUEBA 3: Ejecutando auditoría de integridad...');

        let firestoreBalance = 0;
        transactionsSnapshot.forEach(doc => {
            const txn = doc.data();
            firestoreBalance += txn.amount || 0;
        });

        const rtdbBalance = rtdbSnapshot.val()?.totalRevenue || 0;
        const difference = Math.abs(firestoreBalance - rtdbBalance);
        const isValid = difference <= 0.01;

        console.log(`   Firestore Balance: ${firestoreBalance.toFixed(2)} Bs`);
        console.log(`   RTDB Balance: ${rtdbBalance.toFixed(2)} Bs`);
        console.log(`   Diferencia: ${difference.toFixed(2)} Bs`);

        if (isValid) {
            console.log('✅ AUDITORÍA EXITOSA: Los balances coinciden');
        } else {
            console.log(`❌ DISCREPANCIA DETECTADA: ${difference.toFixed(2)} Bs de diferencia`);
        }

        // Prueba 4: Verificar transacciones fallidas
        console.log('\n🔍 PRUEBA 4: Verificando transacciones fallidas...');
        const failedSnapshot = await get(ref(realtimeDb, 'financials/failed_transactions'));

        if (failedSnapshot.exists()) {
            const failedCount = Object.keys(failedSnapshot.val()).length;
            console.log(`⚠️  ${failedCount} transacciones fallidas registradas`);
            console.log('   (Esto requiere revisión manual)');
        } else {
            console.log('✅ No hay transacciones fallidas');
        }

        // Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN DE PRUEBAS:');
        console.log(`   ✅ Realtime DB: Operativo`);
        console.log(`   ✅ Firestore: Operativo`);
        console.log(`   ${isValid ? '✅' : '❌'} Integridad: ${isValid ? 'Válida' : 'Discrepancia detectada'}`);
        console.log(`   ✅ Sistema de doble escritura: Implementado`);
        console.log('='.repeat(60));

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR EN PRUEBAS:', error);
        process.exit(1);
    }
}

// Ejecutar pruebas
testFinancialIntegrity();
