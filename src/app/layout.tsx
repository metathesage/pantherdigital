import type { Metadata } from "next";
// Self-hosted via the `geist` package (next/font/local + bundled woff2).
// Previously next/font/google, which fetches fonts.googleapis.com at build time —
// that is a hard build failure whenever the network is absent or restricted.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Providers from "@/components/PrivyProvider";
const geistSans = GeistSans;
const geistMono = GeistMono;
export const metadata: Metadata = {
  title: { default: "CoinPanther - Crypto Discovery Radar", template: "%s | CoinPanther" },
  description: "CoinPanther - minimal, luxury crypto discovery. Real CoinGecko prices, AI wallet analysis, NFT gallery, and X-ray radar for 300+ coins.",
  icons: { icon: "/panther-icon.png", apple: "/panther-icon.png" },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col emergent-bg"><Providers>{children}</Providers></body>
    </html>
  );
}
