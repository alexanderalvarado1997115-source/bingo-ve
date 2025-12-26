"use client";
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function Navbar() {
    const { user, loading } = useAuth();

    const handleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
            <Link href="/" className="text-2xl font-black italic bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent hover:scale-105 transition-transform">
                BINGO<span className="text-white">VE</span>
            </Link>
            <div className="flex gap-4">
                {!loading && (
                    user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-400 hidden sm:block">Hola, {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}</span>
                            {user.email === "admin@bingove.suport.com" && (
                                <Link href="/admin" className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">
                                    Admin
                                </Link>
                            )}
                            <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors">
                                Salir
                            </button>
                            <Link href="/dashboard" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2 rounded-full font-bold transition-all shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5">
                                Ir al Panel
                            </Link>
                        </div>
                    ) : (
                        <button onClick={handleLogin} className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-2 rounded-full font-bold transition-all shadow-lg hover:shadow-white/10 transform hover:-translate-y-0.5">
                            Iniciar Sesión
                        </button>
                    )
                )}
            </div>
        </nav>
    );
}
