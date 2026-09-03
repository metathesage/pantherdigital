import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/PrivyProvider";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });
export const metadata: Metadata = {
  title: { default: "PNHR DGTL - Crypto Discovery Radar", template: "%s | PNHR DGTL" },
  description: "PNHR DGTL - minimal, luxury crypto discovery. Real CoinGecko prices, AI wallet analysis, NFT gallery, and X-ray radar for 300+ coins.",
  icons: { icon: "/panther-icon.png", apple: "/panther-icon.png" },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col emergent-bg"><Providers>{children}</Providers></body>
    </html>
  );
}
