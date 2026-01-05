'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function MockPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');

    const handleSimulateSuccess = () => {
        // En un escenario real, esto lo haría el webhook. 
        // Aquí solo redirigimos al usuario a la página de éxito.
        router.push(`/dashboard/wallet?status=success&order=${orderId}`);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl"
            >
                <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-yellow-500/10 rounded-full">
                        <AlertCircle className="w-12 h-12 text-yellow-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Modo de Prueba Activo</h1>
                <p className="text-slate-400 mb-6">
                    Esta es una página de simulación porque las llaves de NOWPayments no están configuradas en Vercel.
                </p>

                <div className="bg-slate-950/50 rounded-2xl p-4 mb-8 border border-slate-800 text-left">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Orden ID</p>
                    <p className="text-sm font-mono text-emerald-400 break-all">{orderId || 'N/A'}</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleSimulateSuccess}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" /> Simular Pago Exitoso
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/wallet')}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                    >
                        Cancelar y Volver
                    </button>
                </div>

                <p className="mt-8 text-xs text-slate-600">
                    BingoVE Security Layer - Sandbox Mode
                </p>
            </motion.div>
        </div>
    );
}

export default function MockPaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            </div>
        }>
            <MockPaymentContent />
        </Suspense>
    );
}
