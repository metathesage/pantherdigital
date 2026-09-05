"use client";
import React from "react";
import { PrivyProvider, type PrivyProviderProps } from "@privy-io/react-auth";
export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const noPrivy = !appId || appId === "clz-demo-privy-app-id";
  // If no real app ID, just render children — keeps build working without credentials
  if (noPrivy) {
    return (
      <>
        <div className="pointer-events-none fixed top-0 inset-x-0 z-[60] flex justify-center">
          <div className="mt-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-900 opacity-90">
            Sign-in disabled — NEXT_PUBLIC_PRIVY_APP_ID not set
          </div>
        </div>
        {children}
      </>
    );
  }
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "email", "twitter"],
        appearance: { theme: "light", accentColor: "#0A0A0A", showWalletLoginFirst: true },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
