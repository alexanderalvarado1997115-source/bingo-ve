require('dotenv').config({ path: './.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function createTestPayment() {
    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        const docRef = await addDoc(collection(db, 'payments'), {
            amount: 500,
            bank: 'PRUEBA BOT',
            createdAt: new Date(),
            method: 'PAGO MOVIL',
            reference: 'TEST-BOT-001',
            status: 'pending',
            ticketsCount: 5,
            userId: 'test_user_alexander',
            userName: 'Alex Test'
        });

        console.log('✅ Pago de prueba creado con ID:', docRef.id);
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    }
}

createTestPayment();
