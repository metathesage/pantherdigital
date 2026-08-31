"use client";
import React from "react";
let RealPrivyProvider: any = null;
try {
  RealPrivyProvider = require("@privy-io/react-auth").PrivyProvider;
} catch {}
export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  // If no real app ID or provider not installed, just render children — keeps build working
  if (!appId || appId === "clz-demo-privy-app-id" || !RealPrivyProvider) {
    return <>{children}</>;
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
    </RealPrivyProvider>
  );
}
