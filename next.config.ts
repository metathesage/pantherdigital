import type { NextConfig } from "next";
import path from "node:path";

/**
 * Extra origins allowed to request the dev server's dev-only assets.
 *
 * Next.js blocks cross-origin dev requests by default. That silently breaks any setup
 * where the browser's origin differs from the server's own host — a sandboxed preview
 * (https://<port>-<id>.e2b.app), a tunnel, a remote dev container. The HTML still
 * returns 200, but every /_next chunk is refused, so React never hydrates and the page
 * looks blank / permanently "not loading" while the server logs
 * "Blocked cross-origin request to Next.js dev resource".
 *
 * Dev-only: has no effect on `next build` / production, where the app is same-origin.
 * Add more with a comma-separated list, e.g.
 *   NEXT_DEV_ALLOWED_ORIGINS=*.trycloudflare.com my-tunnel.dev npm run dev
 */
const allowedDevOrigins = [
  // Arena / e2b style previews: <port>-<sandboxId>.e2b.app
  "*.e2b.app",
  ...(process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  allowedDevOrigins,
};
export default nextConfig;
