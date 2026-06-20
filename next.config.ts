import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/pack-pit", destination: "/", permanent: true }];
  },
};

export default nextConfig;
