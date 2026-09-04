"use client";
import React from "react";
import AchievementHost from "@/components/AchievementHost";
let RealPrivyProvider: any = null;
try {
  RealPrivyProvider = require("@privy-io/react-auth").PrivyProvider;
} catch {}
export default function Providers({ children }: { children: React.ReactNode }) {
  const raw = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appId = raw?.trim();
  // Demo mode — no banner, no hang, just render children (also covers empty string, whitespace, demo placeholder)
  if (!appId || appId === "clz-demo-privy-app-id" || appId === "demo" || !RealPrivyProvider) {
    return <>{children}<AchievementHost /></>;
  }
  return (
    <RealPrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "email", "twitter"],
        appearance: { theme: "light", accentColor: "#0A0A0A", showWalletLoginFirst: true },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
      }}
    >
      {children}
      <AchievementHost />
    </RealPrivyProvider>
  );
}
