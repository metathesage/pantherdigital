// Chain-agnostic network config. Robinhood Chain (4663) endpoints are
// placeholders — fill from env before wiring wagmi/viem and deploying.
//
// This object intentionally mirrors the `viem`/`wagmi` Chain shape so it can be
// dropped straight into `createConfig` once those deps are added.

export const ROBINHOOD_CHAIN = {
  id: Number(process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID ?? 4663),
  name: "Robinhood Chain",
  // ⚠️ Confirm the native gas token on the actual 4663 chain (likely ETH-derivative).
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ROBINHOOD_RPC ?? ""],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Explorer",
      url: process.env.NEXT_PUBLIC_ROBINHOOD_EXPLORER ?? "https://explorer.REPLACE.with.robinhood.chain",
    },
  },
} as const;

// Contract addresses — populated from `contracts/scripts/deploy.ts` output
// after the first real deployment. Left blank until then.
export const CONTRACTS = {
  coinPanther: process.env.NEXT_PUBLIC_COINPANTHER_ADDRESS ?? "",
  lucyId: process.env.NEXT_PUBLIC_LUCYID_ADDRESS ?? "",
  pnthrPack: process.env.NEXT_PUBLIC_PNTHRPACK_ADDRESS ?? "",
  wikiIndex: process.env.NEXT_PUBLIC_WIKIINDEX_ADDRESS ?? "",
} as const;

export const IS_CONTRACTS_DEPLOYED = Object.values(CONTRACTS).every(
  (addr) => addr !== ""
);