"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/providers/ProtectedRoute";
import Navbar from "@/components/common/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { getUserTickets } from "@/lib/firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import PaymentModal from "@/components/user/PaymentModal";
import LiveDrawView from "@/components/user/LiveDrawView";
import ApprovalLoader from "@/components/user/ApprovalLoader";
import WelcomeGuide from "@/components/user/WelcomeGuide"; // Still useful for first-time specific guide
import { subscribeToGame, GameState, trackPresence, subscribeToConnection } from "@/lib/firebase/game-actions";
import { subscribeToUserPaymentStatus } from "@/lib/firebase/payment-listener";
import { Trophy, Clock, Ticket, Users, CheckCircle, Play, ChevronRight, Zap } from "lucide-react";

export default function Dashboard() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isInLiveRoom, setIsInLiveRoom] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    // Payment approval states
    const [paymentStatus, setPaymentStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [showApprovalLoader, setShowApprovalLoader] = useState(false);

    const loadTickets = async () => {
        if (!user) return;
        const t = await getUserTickets(user.uid);
        setTickets(t);
    };

    // Subscriptions
    useEffect(() => {
        const unsubConn = subscribeToConnection(setIsConnected);
        return () => unsubConn();
    }, []);

    // 1. Tickets & Presence (Initial Load & Updates)
    useEffect(() => {
        if (!user) return;
        trackPresence(user.uid);
        loadTickets();
    }, [user]);

    // 2. Game Subscription (Independent)
    useEffect(() => {
        const unsubGame = subscribeToGame((state) => {
            setGameState(state);
            // Auto enter check can rely on state, but avoiding tickets dep loop here is safer. 
            // We handle redirection in other logical flows.
        });
        return () => unsubGame();
    }, []);

    // 3. Auto-Enter Room Logic (Reactive to game/tickets)
    useEffect(() => {
        if (gameState?.status === 'active' && tickets.length > 0 && !isInLiveRoom) {
            // Optional: Auto-enter. Commented out to avoid aggressive redirects if user wants to be in dashboard.
            // setIsInLiveRoom(true); 
        }
    }, [gameState?.status, tickets.length]);

    // 4. Payment Subscription (Strictly User Dependent)
    useEffect(() => {
        if (!user) return;

        const unsubPayment = subscribeToUserPaymentStatus(user.uid, (status, paymentId) => {
            setPaymentStatus(status);

            // Handle pending loader
            if (status === 'pending') {
                setShowApprovalLoader(true);
            }

            // Reload tickets if approved (silent update)
            if (status === 'approved') {
                loadTickets();
            }
        });

        return () => unsubPayment();
    }, [user]);

    // Formatters
    const formatTime = (timestamp?: number) => {
        if (!timestamp) return "20:00"; // Default
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getMinutesRemaining = () => {
        if (!gameState?.countdownStartTime) return 25; // Default mock
        const diff = 300 - Math.floor((Date.now() - gameState.countdownStartTime) / 1000);
        return Math.max(0, Math.floor(diff / 60));
    };

    // Action Handlers
    const handleJoinGame = () => {
        // Always enter the room directly. Buying connects inside.
        setIsInLiveRoom(true);
    };

    const handleOpenPaymentModal = () => {
        setIsPaymentModalOpen(true);
    };

    const handlePaymentReported = () => {
        setIsPaymentModalOpen(false); // Close modal immediately
        setShowApprovalLoader(true); // Show loader explicitly
    };

    const handleApprovalSuccess = async () => {
        setShowApprovalLoader(false);
        setIsPaymentModalOpen(false); // Double check close
        await loadTickets();

        // Intelligent Redirection
        if (gameState?.status === 'active') {
            setIsInLiveRoom(true);
        }
    };

    const handleRetryPayment = () => {
        setShowApprovalLoader(false);
        setIsPaymentModalOpen(true);
        // Could add specific retry logic here
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-900 pb-24 selection:bg-orange-500/30 font-sans">
                <Navbar />

                <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">



                    {isInLiveRoom ? (
                        <LiveDrawView
                            gameState={gameState}
                            tickets={tickets}
                            onExit={() => setIsInLiveRoom(false)}
                            onBuyTickets={handleOpenPaymentModal}
                        />
                    ) : (
                        <>
                            {/* Welcome Header */}
                            <header>
                                <motion.h1
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-2xl md:text-3xl font-black text-white"
                                >
                                    👋 ¡Hola! <span className="text-slate-400 font-medium">Bienvenido a BingoVE</span>
                                </motion.h1>
                            </header>

                            {/* Game Status Card */}
                            <section className="bg-slate-800/50 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                        <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Estado del Sorteo</span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-sm text-slate-400 font-medium mb-1 flex items-center gap-2">
                                                    <Clock size={16} /> Próximo sorteo en:
                                                </div>
                                                <div className="text-3xl font-black text-white">
                                                    {gameState?.status === 'waiting' ? 'En espera'
                                                        : gameState?.status === 'countdown' ? `${getMinutesRemaining()} minutos`
                                                            : '¡EN CURSO!'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-400 font-medium mb-1">Hora inicio</div>
                                                <div className="text-xl font-bold text-white">{gameState?.config?.startTime || "20:00"}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-l border-white/5 pl-0 md:pl-8">
                                            <div>
                                                <div className="text-sm text-slate-400 font-medium mb-1 flex items-center gap-2">
                                                    <Ticket size={16} /> Cartones Disponibles
                                                </div>
                                                <div className="text-xl font-bold text-white">
                                                    {gameState?.config?.totalTickets || 0}/{gameState?.config?.maxTickets || 90} <span className="text-slate-500 text-sm">vendidos</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-400 font-medium mb-1 flex items-center gap-2">
                                                    <Trophy size={16} /> Premios
                                                </div>
                                                <div className="text-orange-400 font-bold">
                                                    {gameState?.config?.prizes?.join(", ") || "500, 350, 200..."} Bs
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={handleJoinGame}
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-black text-lg py-5 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] group"
                                    >
                                        <div className="bg-white/20 p-1 rounded-full"><Play size={20} fill="currentColor" /></div>
                                        {tickets.length > 0 ? "ENTRAR A LA SALA" : "ÚNETE AL JUEGO"}
                                    </button>
                                </div>

                                {/* Background Decor */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            </section>

                            {/* How it works */}
                            <section className="space-y-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Zap size={20} className="text-yellow-500" />
                                    Cómo funciona
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { step: "1", text: "Compra 1-3 cartones (100 Bs c/u)" },
                                        { step: "2", text: "Espera confirmación (2-5 min)" },
                                        { step: "3", text: "Juega en vivo automáticamente" },
                                        { step: "4", text: "Gana y retira al instante" }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-black text-sm">
                                                {item.step}
                                            </div>
                                            <p className="text-xs text-slate-300 font-medium leading-tight">
                                                {item.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {/* Modals & Loaders */}
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        onSuccess={handlePaymentReported}
                    />

                    <ApprovalLoader
                        isVisible={showApprovalLoader}
                        status={paymentStatus === 'none' ? 'pending' : paymentStatus}
                        onApproved={handleApprovalSuccess}
                        onRetry={handleRetryPayment}
                    />

                </main>
            </div>
        </ProtectedRoute>
    );
}
