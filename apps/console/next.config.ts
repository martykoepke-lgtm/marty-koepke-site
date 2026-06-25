import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required so Next can resolve and bundle TypeScript files from the
  // @practical-informatics/avi workspace package (which exports raw .ts).
  transpilePackages: ["@practical-informatics/avi"],
};

export default nextConfig;
