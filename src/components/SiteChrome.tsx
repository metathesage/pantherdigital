"use client";
import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

// Routes with their own bespoke sticky headers or full-screen experiences.
// Rendering the global NavBar/Footer here would double-stack headers
// (/app, /bot, /waifus, /wiki/waifus) or break the launch screen (/).
const BARE_ROUTES = [/^\/$/, /^\/app(\/|$)/, /^\/bot(\/|$)/, /^\/waifus(\/|$)/, /^\/wiki\/waifus(\/|$)/];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (BARE_ROUTES.some((re) => re.test(pathname ?? ""))) return <>{children}</>;
  return (
    <>
      <NavBar />
      {children}
      <Footer />
    </>
  );
}
