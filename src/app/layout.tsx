import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/PrivyProvider";
// Self-hosted Geist (SIL OFL 1.1, vendored in ./fonts) — deliberately NOT next/font/google,
// which fetches fonts.googleapis.com at build time and fails the whole build when the
// deploy environment has no outbound network.
const geistSans = localFont({
  variable: "--font-geist-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
  src: [
    { path: "./fonts/geist-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/geist-latin-ext-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
});
const geistMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
  src: [
    { path: "./fonts/geist-mono-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/geist-mono-latin-ext-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
});
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
