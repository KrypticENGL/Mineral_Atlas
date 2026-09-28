import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Dev only: let other devices on the local network load dev assets and HMR
  // (Next blocks non-localhost origins by default, leaving the page stuck loading).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  cacheLife: {
    // Catalogue data changes rarely (seed today, scheduled ingestion later).
    // Admin writes invalidate the "catalog" tag explicitly.
    catalog: {
      stale: 300,
      revalidate: 900,
      expire: 86_400,
    },
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
