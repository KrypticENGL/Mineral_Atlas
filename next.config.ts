import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
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
