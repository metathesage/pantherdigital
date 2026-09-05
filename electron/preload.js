// PNHR DGTL desktop preload — minimal bridge. Wallets (Coinbase/Phantom) inject
// themselves into the page, so no node APIs are exposed to the renderer.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("pnhrDesktop", {
  platform: process.platform,
  version: "1.0.0",
});
