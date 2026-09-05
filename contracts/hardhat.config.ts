import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const {
  ROBINHOOD_RPC_URL,
  PRIVATE_KEY,
  ROBINHOOD_EXPLORER_API_KEY,
  ROBINHOOD_CHAIN_ID = "4663",
} = process.env;

// Chain-agnostic: fills in Robinhood Chain (4663) endpoints from .env when present.
const config: HardhatUserConfig = {
  paths: {
    sources: "./src",
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test",
  },
  solidity: {
    version: "0.8.24",
    settings: {
      // `mcopy` (EIP-5656) builtin requires evmVersion cancun; OZ 5.1 uses it.
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    robinhood: {
      // Swap RPC + chainId in contracts/.env before deploying to mainnet.
      url: ROBINHOOD_RPC_URL || "",
      chainId: Number(ROBINHOOD_CHAIN_ID),
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: ROBINHOOD_EXPLORER_API_KEY || "",
    customChains: ROBINHOOD_RPC_URL
      ? [
          {
            network: "robinhood",
            chainId: Number(ROBINHOOD_CHAIN_ID),
            urls: {
              apiURL: ROBINHOOD_RPC_URL,
              browserURL: "https://explorer.REPLACE.with.robinhood.chain",
            },
          },
        ]
      : [],
  },
};

export default config;