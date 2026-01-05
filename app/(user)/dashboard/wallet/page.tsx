'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Wallet, ArrowUpCircle, History, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';

export default function WalletPage() {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        if (!user) return;

        // 1. Escuchar balance en tiempo real
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBalance(data.walletBalance || 0);
            }
        });

        // 2. Escuchar historial de pagos recientes
        const q = query(
            collection(db, 'payments'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribePayments = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            setTransactions(txs);
        });

        return () => {
            unsubscribeUser();
            unsubscribePayments();
        };
    }, [user]);

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) < 1) {
            alert("El monto mínimo es 1 USDT");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    userId: user?.uid,
                    email: user?.email,
                    description: "Recarga de Saldo"
                })
            });

            const data = await response.json();

            if (data.success && data.paymentUrl) {
                // Redirigir a Cryptomus (o a nuestra página de mock en dev)
                window.location.href = data.paymentUrl;
            } else {
                alert("Error al iniciar el pago: " + (data.error || "Desconocido"));
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Error de conexión al procesar el pago.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            {/* Cabecera */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                        Billetera Virtual
                    </h1>
                    <p className="text-slate-400">Gestiona tu saldo y retiros</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                    <p className="text-sm text-slate-400 mb-1">Saldo Disponible</p>
                    <div className="text-3xl font-mono text-emerald-400 font-bold flex items-center gap-2">
                        <Wallet className="w-6 h-6" />
                        ${balance.toFixed(2)} <span className="text-sm text-slate-500">USDT</span>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Sección de Recarga */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover:from-emerald-500/20 transition-all duration-500" />

                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <ArrowUpCircle className="text-emerald-500" /> Recargar Saldo
                    </h2>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">Monto a recargar (USDT)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-8 bg-slate-950/50 border border-slate-700 text-lg h-12 text-white w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="10.00"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[10, 20, 50].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(val.toString())}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors border border-slate-700"
                                >
                                    ${val}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleDeposit}
                            disabled={loading || !amount}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg shadow-emerald-900/20 rounded-xl transition-all"
                        >
                            {loading ? 'Procesando...' : 'Pagar con Crypto'}
                        </button>

                        <p className="text-xs text-center text-slate-500 mt-4">
                            Procesado de forma segura por NOWPayments. <br />
                            Aceptamos USDT (TRC20), BTC, LTC y más.
                        </p>
                    </div>
                </motion.div>

                {/* Historial Rápido */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6"
                >
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <History className="text-blue-500" /> Últimos Movimientos
                    </h2>

                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                No hay transacciones recientes
                            </div>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        {tx.status === 'completed' || tx.status === 'finished' ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        ) : tx.status === 'pending' || tx.status === 'waiting' ? (
                                            <Clock className="w-5 h-5 text-yellow-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        <div>
                                            <p className="text-white font-medium text-sm">{tx.description || 'Recarga'}</p>
                                            <p className="text-xs text-slate-500">
                                                {tx.createdAt?.toLocaleDateString()} {tx.createdAt?.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold ${tx.status === 'completed' || tx.status === 'finished' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        +${tx.amount}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
