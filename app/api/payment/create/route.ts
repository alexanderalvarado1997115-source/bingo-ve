import { NextResponse } from 'next/server';
import { nowpayments } from '@/lib/nowpayments';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const { amount, userId, email, description } = await request.json();

        if (!amount || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Crear registro de "Intento de Pago" en Firestore
        const paymentDoc = await addDoc(collection(db, 'payments'), {
            userId,
            userEmail: email || 'unknown',
            amount: parseFloat(amount),
            currency: 'USD',
            status: 'pending',
            type: 'wallet_deposit',
            gateway: 'nowpayments',
            createdAt: serverTimestamp(),
            description: description || 'Recarga de saldo'
        });

        const orderId = paymentDoc.id;

        // 2. Solicitar pago a NOWPayments
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bingo-ve-delta.vercel.app';

        const npResponse = await nowpayments.createInvoice({
            price_amount: parseFloat(amount),
            price_currency: 'usd',
            pay_currency: 'usdttrc20', // USDT en la red Tron por defecto
            order_id: orderId,
            order_description: description || `Recarga de saldo BingoVE - Orden ${orderId}`,
            ipn_callback_url: `${baseUrl}/api/webhooks/nowpayments`,
            success_url: `${baseUrl}/dashboard/wallet?status=success&order=${orderId}`,
            cancel_url: `${baseUrl}/dashboard/wallet?status=error`
        });

        // 3. Devolver la URL de pago al frontend
        return NextResponse.json({
            success: true,
            paymentUrl: npResponse.invoice_url,
            orderId: orderId
        });

    } catch (error: any) {
        console.error("Error creating NOWPayments invoice:", error);
        // Devolvemos el mensaje real para que el usuario pueda verlo en el alert del navegador
        return NextResponse.json({
            error: error.message || 'Failed to create payment',
            details: error.toString()
        }, { status: 500 });
    }
}
