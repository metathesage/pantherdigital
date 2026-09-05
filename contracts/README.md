# PNTHR DGTL — Onchain Contracts

Deployable to Robinhood Chain (Chain ID 4663) or any EVM. Uses **Hardhat + OpenZeppelin** (audited base contracts), Solidity `0.8.24`.

## Contracts

| Contract | Type | Purpose |
|---|---|---|
| `CoinPanther.sol` | ERC20 (Permit) | `$PNTHR` native token, 1B supply, owner mint/burn |
| `LucyID.sol` | ERC721 (Soulbound) | Non-transferable passport tracking packs opened, realm visits, prediction accuracy |
| `PnthrPack.sol` | ERC1155 | Lootboxes — Common 60% / Rare 30% / Mythic 10% via commit-reveal |
| `WikiIndex.sol` | Registry | On-chain wiki index (title → content hash → author → ts) |

## Build

```bash
cd contracts
npm install
npm run compile        # compiles, emits abis under contracts/artifacts
```

## Deploy

```bash
# 1. copy env
cp .env.example .env
# 2. fill ROBINHOOD_RPC_URL + PRIVATE_KEY (and chain id / explorer)
# 3. deploy
npm run deploy         # -> --network robinhood
```

Local dry-run (no external creds):

```bash
npm run node           # in one terminal
npm run deploy:local   # in another
```

## Verify (on explorer)

```bash
npx hardhat verify --network robinhood <COIN_ADDR> <DEPLOYER>
npx hardhat verify --network robinhood <LUCY_ADDR> <DEPLOYER>
npx hardhat verify --network robinhood <PACK_ADDR> <DEPLOYER>
npx hardhat verify --network robinhood <WIKI_ADDR> <DEPLOYER>
```

(Constructor args are all just `initialOwner`; fill the real explorer URL in `hardhat.config.ts`.)

## Design notes (Robinhood Chain 4663)

- **$PNTHR** is the hero ticker. `LUCY` already has a live Uniswap v4 pool off-chain, so Lucy stays the soulbound persona to avoid ticker collision.
- **FIFO-safe RNG**: pack reveals use commit-reveal (commit hash → reveal preimage), NOT blockhash/sequencer timestamps. See `_rollRarity`. Swap to a VRF callback when an oracle is live on the Orbit L3.
- **AA gas sponsorship**: bind any Alchemy paymaster policy to only `PnthrPack.buyPack` / `LucyID.safeMint` selectors and cap per-call gas to prevent drain.

## Security

Not audited. Do not deploy real funds without an independent audit and testnet practice. All power is `onlyOwner` — consider `AccessControl` + timelock before mainnet.