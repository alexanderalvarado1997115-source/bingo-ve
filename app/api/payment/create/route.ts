import { NextResponse } from 'next/server';
import { cryptomus } from '@/lib/cryptomus';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const { amount, userId, email, description } = await request.json();

        if (!amount || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Crear registro de "Intento de Pago" en Firestore
        // Esto nos da un ID único para rastrear (order_id)
        const paymentDoc = await addDoc(collection(db, 'payments'), {
            userId,
            userEmail: email || 'unknown',
            amount: parseFloat(amount),
            currency: 'USD', // Base interna
            status: 'pending',
            type: 'wallet_deposit',
            createdAt: serverTimestamp(),
            description: description || 'Recarga de saldo'
        });

        const orderId = paymentDoc.id;

        // 2. Solicitar pago a Cryptomus
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const paymentData = {
            amount: amount.toString(),
            currency: 'USDT', // Cobramos en USDT
            order_id: orderId,
            url_return: `${baseUrl}/dashboard/wallet?status=success&order=${orderId}`,
            url_callback: `${baseUrl}/api/webhooks/cryptomus`, // URL donde Cryptomus avisará
            is_payment_multiple: false,
            lifetime: 3600 // 1 hora para pagar
        };

        const cryptomusResponse = await cryptomus.createPayment(paymentData);

        // 3. Devolver la URL de pago al frontend
        return NextResponse.json({
            success: true,
            paymentUrl: cryptomusResponse.result.url,
            orderId: orderId
        });

    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }
}
