import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/PrivyProvider";
import SiteNav from "@/components/SiteNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://coinpanther.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Emergent Matrix — Waifu Command", template: "%s | Emergent Matrix" },
  description:
    "Emergent Matrix — waifu command center with Alina. Minimal luxury, real-time radar, matrix board, and secure vault.",
  icons: { icon: "/panther-icon.png", apple: "/panther-icon.png" },
  openGraph: {
    type: "website",
    siteName: "Emergent Matrix",
    title: "Emergent Matrix — Waifu Command",
    description:
      "Waifu command center with Alina. Radar, matrix board, wallet X-ray — clean, private, premium.",
    url: SITE_URL,
    images: [{ url: "/black-marble-panther.jpg", width: 1200, height: 675, alt: "Emergent Matrix — black marble panther" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Emergent Matrix — Waifu Command",
    description: "Waifu command center with Alina. Minimal luxury, real-time intelligence.",
    images: ["/black-marble-panther.jpg"],
  },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col emergent-bg">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black focus:outline-none">Skip to content</a>
        <SiteNav />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
