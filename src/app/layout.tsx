import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/PrivyProvider";
import SiteChrome from "@/components/SiteChrome";
import IridescentCursor from "@/components/IridescentCursor";
import ThemeToggle from "@/components/ThemeToggle";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });
export const metadata: Metadata = {
  title: { default: "PNTHR DGTL — Emergent Crypto Radar", template: "%s | PNTHR DGTL" },
  description: "PNTHR DGTL — crypto discovery radar powered by AI. Real CoinGecko prices, Kimi K3 analysis, Solana NFT portfolio, Robinhood Chain data, and gamified hunting.",
  icons: { icon: "/panther-icon.png", apple: "/panther-icon.png" },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col emergent-bg"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#0A0A0A] focus:px-4 focus:py-2 focus:text-[13px] focus:font-bold focus:text-white">Skip to content</a><Providers><SiteChrome>{children}</SiteChrome></Providers><IridescentCursor /><ThemeToggle /></body>
    </html>
  );
}
