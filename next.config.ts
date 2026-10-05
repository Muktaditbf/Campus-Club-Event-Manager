import type { NextConfig } from "next";

// GitHub Codespaces serves the app from https://<name>-3000.app.github.dev,
// which Next.js treats as a different origin from localhost.
const codespaces = ["*.app.github.dev", "*.github.dev"];

const nextConfig: NextConfig = {
  // mysql2 is a Node-only driver; keep it out of the bundler.
  serverExternalPackages: ["mysql2"],
  // Let the dev server send its scripts to the Codespaces URL (otherwise buttons don't work).
  allowedDevOrigins: codespaces,
  experimental: {
    // Allow forms and buttons (Server Actions) submitted from the Codespaces URL.
    serverActions: { allowedOrigins: ["localhost:3000", ...codespaces] },
  },
};

export default nextConfig;
