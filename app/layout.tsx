import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BingoVE | El Bingo de Próxima Generación",
  description: "Vive la emoción del bingo online con tecnología de punta, premios en tiempo real y seguridad garantizada.",
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
