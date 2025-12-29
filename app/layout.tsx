import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Juega y Gana | Tu Plataforma de Entretenimiento Real",
  description: "Vive la emoción de ganar dinero real con juegos automatizados, pagos instantáneos y tecnología segura.",
  other: {
    "cryptomus": "890a03d1"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-slate-900 text-white">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
