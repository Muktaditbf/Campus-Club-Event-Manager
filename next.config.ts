import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mysql2 is a Node-only driver; keep it out of the bundler.
  serverExternalPackages: ["mysql2"],
};

export default nextConfig;
