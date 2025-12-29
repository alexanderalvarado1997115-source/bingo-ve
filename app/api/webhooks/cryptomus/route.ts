import { NextResponse } from 'next/server';
import { cryptomus } from '@/lib/cryptomus';
// import { adminAuth } from '@/lib/firebase/admin-config'; // Removed unused import causing build error
import { recordTransactionSafe, processReferralReward } from '@/lib/firebase/financial-actions';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

// Force dynamic to allow reading request body
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const data = JSON.parse(rawBody);

        // 1. Verificar Firma de Seguridad (Evitar Hackers)
        const sign = data.sign;
        if (!cryptomus.verifyWebhookSignature(JSON.stringify(data), sign)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 2. Procesar el Estado del Pago
        const status = data.status; // 'paid', 'paid_over', 'process', 'fail'
        const orderId = data.order_id;
        const amount = parseFloat(data.amount);
        const currency = data.currency;

        console.log(`🔔 Webhook Cryptomus Recibido: Order ${orderId} Status ${status}`);

        if (status === 'paid' || status === 'paid_over') {
            await handleSuccessfulPayment(orderId, amount, currency, data);
        } else if (status === 'cancel' || status === 'fail') {
            await handleFailedPayment(orderId, status);
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handleSuccessfulPayment(orderId: string, amount: number, currency: string, webhookData: any) {
    // Buscar el pago en Firestore usando el orderId (que debería ser el ID del documento de pago o un campo ref)
    // Asumimos que orderId es el ID del documento en la colección 'payment_intents' o 'payments'

    // NOTA: Para este MVP, buscaremos en una colección hipotética 'temp_orders' o usaremos el ID directo.
    // Vamos a asumir que orderId ES el userId + timestamp o un ID de transacción previo.
    // Mejor estrategia: Guardar una "orden pendiente" antes de enviar a Cryptomus.

    // Por simplicidad en este paso, vamos a buscar si existe una orden con ese ID.
    // Si usaste el ID de Firestore como orderId, perfecto.

    const paymentRef = doc(db, 'payments', orderId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
        console.error(`❌ Pago recibido para orden inexistente: ${orderId}`);
        return;
    }

    const paymentData = paymentSnap.data();

    if (paymentData.status === 'approved') {
        console.log("⚠️ Pago ya procesado anteriormente.");
        return;
    }

    // 1. Actualizar estado del pago
    await updateDoc(paymentRef, {
        status: 'approved',
        paidAt: serverTimestamp(),
        provider: 'cryptomus',
        providerTxId: webhookData.uuid,
        amountPaid: amount,
        currencyPaid: currency
    });

    // 2. Entregar Beneficios (Tickets o Saldo)
    // Si es recarga de billetera:
    if (paymentData.type === 'wallet_deposit') {
        const userRef = doc(db, 'users', paymentData.userId);
        const { increment } = await import("firebase/firestore");
        await updateDoc(userRef, {
            walletBalance: increment(amount)
        });

        // Registrar Transacción Financiera
        const txn = await recordTransactionSafe(
            'income',
            'ticket_sale', // O 'wallet_deposit' si existiera
            amount,
            `Recarga automática vía Cryptomus (Orden: ${orderId})`,
            orderId
        );

        // Procesar Referidos
        if (txn.transactionId) {
            try {
                // Import dinámico para evitar ciclos si fuera necesario
                const { processReferralReward } = await import('@/lib/firebase/financial-actions');
                await processReferralReward(paymentData.userId, amount, txn.transactionId);
            } catch (e) { console.error("Error referidos webhook", e); }
        }
    }
    // Lógica para compra directa de tickets se añadiría aquí si fuera el caso

    console.log(`✅ Pago ${orderId} procesado exitosamente.`);
}

async function handleFailedPayment(orderId: string, status: string) {
    const paymentRef = doc(db, 'payments', orderId);
    await updateDoc(paymentRef, {
        status: 'failed',
        failureReason: status,
        updatedAt: serverTimestamp()
    });
    console.log(`❌ Pago ${orderId} marcado como fallido/cancelado.`);
}
