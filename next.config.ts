import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: hide the Next.js dev indicator so it does not overlap the
  // bottom-left Hidden Games counter during local verification. This setting
  // has no effect on production builds (the indicator is dev-only anyway).
  devIndicators: false,
  async redirects() {
    return [{ source: "/pack-pit", destination: "/", permanent: true }];
  },
};

export default nextConfig;
