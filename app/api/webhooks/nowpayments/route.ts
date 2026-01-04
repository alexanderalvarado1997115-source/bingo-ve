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

            // 3. Actualizar estado del pago y el balance del usuario
            await updateDoc(paymentRef, {
                status: 'completed',
                externalId: payment_id,
                actualAmount: pay_amount,
                actualCurrency: pay_currency,
                updatedAt: serverTimestamp()
            });

            // 4. Acreditar saldo usando la función segura que sincroniza RealtimeDB y Firestore
            await recordTransactionSafe({
                userId: paymentData.userId,
                amount: paymentData.amount, // Usamos el monto original de la orden para evitar discrepancias de cambio
                type: 'income',
                category: 'deposit',
                description: `Recarga automática (NOWPayments #${payment_id})`,
                metadata: {
                    gateway: 'nowpayments',
                    paymentId: payment_id,
                    orderId: order_id
                }
            });

            console.log(`✅ Balance updated for user: ${paymentData.userId}`);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("🔥 Webhook Error:", error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
