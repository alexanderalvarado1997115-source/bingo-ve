import crypto from 'crypto';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

// Las claves se leen dinámicamente dentro de las funciones para evitar caché en Vercel

interface CreateInvoicePayload {
    price_amount: number;
    price_currency: string;
    pay_currency: string;
    ipn_callback_url: string;
    order_id: string;
    order_description: string;
    success_url: string;
    cancel_url: string;
}

export const nowpayments = {
    /**
     * Valida la firma del webhook (IPN) para asegurar que el pago es real
     */
    verifyIPN(payload: any, headerSignature: string): boolean {
        const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
        if (!IPN_SECRET) return true; // En desarrollo

        const orderedPayload = Object.keys(payload)
            .sort()
            .reduce((obj: any, key) => {
                obj[key] = payload[key];
                return obj;
            }, {});

        const hmac = crypto.createHmac('sha512', IPN_SECRET);
        hmac.update(JSON.stringify(orderedPayload));
        const signature = hmac.digest('hex');

        return signature === headerSignature;
    },

    /**
     * Crea una factura de pago
     */
    async createInvoice(data: CreateInvoicePayload) {
        // Leemos las variables dentro de la función para mayor seguridad en Vercel
        const API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

        if (!API_KEY) {
            console.error("❌ ERROR: NOWPayments API Key not found in Environment Variables.");
            console.log("Available Env Vars (Keys):", Object.keys(process.env).filter(k => k.includes('NOWPAYMENTS')));

            return {
                invoice_id: "mock_" + Date.now(),
                invoice_url: `https://bingo-ve-delta.vercel.app/mock-payment?orderId=${data.order_id}`,
                status: "waiting"
            };
        }

        try {
            const response = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
                method: 'POST',
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    price_amount: data.price_amount,
                    price_currency: data.price_currency,
                    pay_currency: data.pay_currency,
                    ipn_callback_url: data.ipn_callback_url,
                    order_id: data.order_id,
                    order_description: data.order_description,
                    success_url: data.success_url,
                    cancel_url: data.cancel_url
                })
            });

            const result = await response.json();
            if (!response.ok) {
                console.error("NOWPayments Error:", result);
                throw new Error(result.message || "Failed to create invoice");
            }

            return result;
        } catch (error) {
            console.error("NOWPayments Request Failed:", error);
            throw error;
        }
    }
};
