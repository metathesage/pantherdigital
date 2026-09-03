import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone", // required for the Electron exe (electron-builder extraResources)
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};
export default nextConfig;
