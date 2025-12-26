"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { autoAuthWithEmail, loginWithEmail, registerWithEmail } from "@/lib/firebase/auth-actions";
import { Mail, Lock, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";

import { Suspense } from "react";

function LoginFormContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Detect mode from URL
    useEffect(() => {
        const urlMode = searchParams.get('mode');
        if (urlMode === 'register' || urlMode === 'login') {
            setMode(urlMode);
        }
    }, [searchParams]);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Basic Validations
        if (!email || !password) {
            setError("Por favor completa todos los campos");
            return;
        }
        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setError("Las contraseñas no coinciden");
                return;
            }
        }

        setLoading(true);
        try {
            let result;
            if (mode === 'login') {
                result = await loginWithEmail(email, password);
            } else {
                result = await registerWithEmail(email, password);
            }

            if (result.success) {
                router.push('/dashboard');
            } else {
                setError(result.error || "Ocurrió un error inesperado");
            }
        } catch (err) {
            setError("Error de conexión");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden z-10"
            >
                {/* Header Tabs */}
                <div className="flex border-b border-white/5 bg-slate-950/50">
                    <button
                        onClick={() => setMode('register')}
                        className={`flex-1 py-6 text-sm font-bold uppercase tracking-widest transition-colors relative
                            ${mode === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Regístrate
                        {mode === 'register' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-1 bg-orange-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-6 text-sm font-bold uppercase tracking-widest transition-colors relative
                            ${mode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Iniciar Sesión
                        {mode === 'login' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-1 bg-orange-500" />
                        )}
                    </button>
                </div>

                <div className="p-8 md:p-10 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-white">
                            {mode === 'login' ? '¡Bienvenido de nuevo!' : 'Crea tu cuenta gratis'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {mode === 'login' ? 'Ingresa para gestionar tus cartones' : 'Únete a la comunidad de BingoVE'}
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-200 text-sm font-medium"
                        >
                            <AlertTriangle size={18} />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {mode === 'register' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="password"
                                            required={mode === 'register'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <input type="checkbox" required id="terms" className="w-4 h-4 rounded border-white/10 bg-slate-950 text-orange-500 focus:ring-0" />
                                        <label htmlFor="terms" className="text-xs text-slate-400">Acepto términos y condiciones</label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? 'ENTRAR AHORA' : 'CREAR CUENTA'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {mode === 'login' && (
                        <div className="text-center">
                            <button className="text-xs text-slate-500 hover:text-white transition-colors">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        }>
            <LoginFormContent />
        </Suspense>
    );
}
