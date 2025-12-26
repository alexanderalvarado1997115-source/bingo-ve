"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const ADMIN_EMAIL = "admin@bingove.suport.com";

    useEffect(() => {
        if (!authLoading && user && user.email === ADMIN_EMAIL) {
            router.push("/admin");
        }
    }, [user, authLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (email !== ADMIN_EMAIL) {
                throw new Error("Este acceso es solo para administradores.");
            }
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/admin");
        } catch (err: any) {
            setError(err.message === "Este acceso es solo para administradores." ? err.message : "Credenciales inválidas.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="bg-slate-800 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                    {/* Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -z-10" />

                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                            <ShieldCheck className="text-indigo-500" size={32} />
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-white text-center mb-2 uppercase tracking-tight">Acceso Admin</h1>
                    <p className="text-slate-500 text-center text-sm mb-8 font-medium">Solo personal autorizado</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full bg-slate-900 text-white rounded-2xl py-4 pl-12 pr-4 border border-white/5 focus:border-indigo-500 transition-all outline-none text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900 text-white rounded-2xl py-4 pl-12 pr-4 border border-white/5 focus:border-indigo-500 transition-all outline-none text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl font-bold text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-[0.2em]"
                        >
                            {loading ? "Iniciando..." : (
                                <>
                                    Entrar Al Panel <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <button
                        onClick={() => router.push("/")}
                        className="w-full mt-6 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
