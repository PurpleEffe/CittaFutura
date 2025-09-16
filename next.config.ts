import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  typedRoutes: true,
  basePath: basePath && basePath !== "/" ? basePath : undefined,
  assetPrefix: basePath && basePath !== "/" ? basePath : undefined,
};

export default nextConfig;
