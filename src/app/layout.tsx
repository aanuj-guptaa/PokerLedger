import type { Metadata } from "next";
import "./globals.css";
import { PokerProvider } from "../context/PokerContext";

export const metadata: Metadata = {
  title: "PokerLedger | Modern Poker Ledger & Smart Settlement",
  description: "Track poker sessions, automated zero-sum P&L, cumulative balances, and smart debt-minimizing settlement calculator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-poker-bg text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <PokerProvider>
          {children}
        </PokerProvider>
      </body>
    </html>
  );
}
