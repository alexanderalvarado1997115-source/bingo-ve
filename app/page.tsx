"use client";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Trophy, Zap, Play, Smartphone, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import Navbar from "@/components/common/Navbar";

export default function Home() {
  const { user } = useAuth();

  const features = [
    { icon: Smartphone, text: "Compra fácil con Pago Móvil" },
    { icon: Zap, text: "Sorteos cada 30 minutos" },
    { icon: Trophy, text: "Premios inmediatos" },
    { icon: ShieldCheck, text: "100% seguro y transparente" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden font-sans selection:bg-orange-500/30">
      <Navbar />

      {/* Background Decor */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-32 pb-20 flex flex-col items-center justify-center min-h-[90vh]">

        {/* Main Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />

          <div className="text-center space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2">
                BINGO <span className="text-orange-500">VE</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 font-medium tracking-wide border-b border-white/5 pb-6 inline-block">
                Sorteos en Tiempo Real
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="py-6"
            >
              <h2 className="text-2xl font-bold text-white mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                🎉 ¡Juega, Gana y Retira al Instante!
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="p-2 bg-slate-800 rounded-xl text-orange-400">
                      <f.icon size={18} />
                    </div>
                    <span className="text-sm font-semibold">{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6 pt-4"
            >
              <div className="p-1.5 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent border border-white/5">
                <Link
                  href={user ? "/dashboard" : "/login?mode=register"}
                  className="block w-full bg-orange-500 hover:bg-orange-400 text-white text-xl font-black py-5 rounded-[1.7rem] shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-3 group"
                >
                  <Play className="fill-current" />
                  {user ? "IR AL DASHBOARD" : "¡COMIENZA A JUGAR!"}
                </Link>
              </div>

              {!user && (
                <div className="space-y-3">
                  <p className="text-slate-500 text-sm">¿Ya tienes cuenta?</p>
                  <Link
                    href="/login?mode=login"
                    className="inline-flex items-center gap-2 text-white font-bold hover:text-orange-400 transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/5 hover:bg-white/10"
                  >
                    INICIAR SESIÓN <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-400 font-medium"
          >
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <span>+1,000 jugadores activos</span>
            </div>
            <div className="hidden md:block w-1 h-1 bg-slate-700 rounded-full" />
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-yellow-400" />
              <span>+50,000 Bs en premios pagados</span>
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
