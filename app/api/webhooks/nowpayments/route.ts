import { NextResponse } from 'next/server';
import { nowpayments } from '@/lib/nowpayments';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { recordTransactionSafe } from '@/lib/firebase/financial-actions';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const signature = request.headers.get('x-nowpayments-sig');

        // 1. Validar la autenticidad del pago
        if (!signature || !nowpayments.verifyIPN(body, signature)) {
            console.error("🚨 Invalid NOWPayments IPN Signature");
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const { payment_status, order_id, pay_amount, pay_currency, payment_id } = body;

        console.log(`💰 NOWPayments IPN received: ${order_id} - Status: ${payment_status}`);

        // 2. Si el pago está confirmado (finished), acreditar saldo
        if (payment_status === 'finished') {
            const paymentRef = doc(db, 'payments', order_id);
            const paymentSnap = await getDoc(paymentRef);

            if (!paymentSnap.exists()) {
                console.error("❌ Payment record not found in Firestore:", order_id);
                return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
            }

            const paymentData = paymentSnap.data();

            // Evitar duplicados si el pago ya fue procesado
            if (paymentData.status === 'completed') {
                return NextResponse.json({ success: true, message: 'Already processed' });
            }

            // 3. Actualizar estado del pago
            await updateDoc(paymentRef, {
                status: 'completed',
                externalId: payment_id,
                actualAmount: pay_amount,
                actualCurrency: pay_currency,
                updatedAt: serverTimestamp()
            });

            // 4. Acreditar saldo en la billetera del usuario
            const userRef = doc(db, 'users', paymentData.userId);
            await updateDoc(userRef, {
                walletBalance: increment(paymentData.amount)
            });

            // 5. Registrar transacción en los estados financieros del sistema
            await recordTransactionSafe(
                'income',
                'system_adjustment', // Usamos system_adjustment por ahora, o actualizamos la interfaz
                paymentData.amount,
                `Recarga automática (NOWPayments #${payment_id})`,
                order_id
            );

            console.log(`✅ Balance updated for user: ${paymentData.userId}`);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("🔥 Webhook Error:", error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
