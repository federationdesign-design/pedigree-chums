import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: hide the Next.js dev indicator so it does not overlap the
  // bottom-left Hidden Games counter during local verification. This setting
  // has no effect on production builds (the indicator is dev-only anyway).
  devIndicators: false,
  async redirects() {
    return [
      { source: "/pack-pit", destination: "/", permanent: true },
      /* ONE SITE, ONE ADDRESS.

         Vercel gives every project a permanent .vercel.app hostname. It is not
         a copy or a staging build: it is this exact deployment served under a
         second name, and it cannot be deleted. Left alone, a search engine sees
         two hosts carrying identical pages and picks one of them as the real
         address on your behalf.

         Everything arriving on that hostname is sent to the same path here,
         permanently, so any value it has picked up comes across with it.

         Preview deployments have their own unique hostnames and are untouched:
         this names one host exactly. */
      {
        source: "/:path*",
        has: [{ type: "host", value: "pedigree-chums.vercel.app" }],
        destination: "https://www.pedigreechums.co.uk/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
