import crypto from 'crypto';

const CRYPTOMUS_API_URL = 'https://api.cryptomus.com/v1';

// Estas claves deben estar en .env.local
// MERCHANT_ID y PAYMENT_API_KEY se obtienen en el panel de Cryptomus
const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID || '';
const PAYMENT_API_KEY = process.env.CRYPTOMUS_PAYMENT_KEY || '';

interface CreatePaymentPayload {
    amount: string;
    currency: string;
    order_id: string;
    url_return?: string;
    url_callback?: string;
    is_payment_multiple?: boolean;
    lifetime?: number;
    to_currency?: string;
}

export const cryptomus = {
    /**
     * Genera un encabezado de autenticación (Sign) para las peticiones a Cryptomus
     */
    generateSignature(payload: string) {
        return crypto
            .createHash('md5')
            .update(Buffer.from(payload).toString('base64') + PAYMENT_API_KEY)
            .digest('hex');
    },

    /**
     * Crea una factura de pago en Cryptomus
     */
    async createPayment(data: CreatePaymentPayload) {
        if (!MERCHANT_ID || !PAYMENT_API_KEY) {
            console.warn("⚠️ Cryptomus Credentials missing. Running in Mock Mode.");
            // Mock response for development without keys
            return {
                result: {
                    uuid: "mock-uuid-" + Date.now(),
                    order_id: data.order_id,
                    amount: data.amount,
                    currency: data.currency,
                    url: `https://bingo-ve-delta.vercel.app/mock-payment?orderId=${data.order_id}&amount=${data.amount}`, // Simulación
                    status: "check"
                }
            };
        }

        const payload = JSON.stringify(data);
        const sign = this.generateSignature(payload);

        try {
            const response = await fetch(`${CRYPTOMUS_API_URL}/payment`, {
                method: 'POST',
                headers: {
                    merchant: MERCHANT_ID,
                    sign: sign,
                    'Content-Type': 'application/json'
                },
                body: payload
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Cryptomus API Error:", result);
                throw new Error(result.message || 'Error executing payment request');
            }

            return result;
        } catch (error) {
            console.error("Error creating Cryptomus payment:", error);
            throw error;
        }
    },

    /**
     * Verifica la firma de un webhook entrante para asegurar que viene de Cryptomus
     */
    verifyWebhookSignature(body: string, receivedSign: string): boolean {
        if (!PAYMENT_API_KEY) return true; // En dev/mock aceptamos todo

        const computedSign = crypto
            .createHash('md5')
            .update(Buffer.from(body).toString('base64') + PAYMENT_API_KEY)
            .digest('hex');

        return computedSign === receivedSign;
    }
};
