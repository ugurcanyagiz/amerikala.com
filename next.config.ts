import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  async rewrites() {
    return {
      // Serve the app poster at the root without replacing the original homepage.
      beforeFiles: [{ source: "/", destination: "/uygulama" }],
    };
  },

  async redirects() {
    return [
      {
        source: "/events",
        destination: "/meetups",
        permanent: true,
      },
      {
        source: "/events/create",
        destination: "/meetups/create",
        permanent: true,
      },
      {
        source: "/events/:id",
        destination: "/meetups/:id",
        permanent: true,
      },
    ];
  },
  
  trailingSlash: false,
};

export default nextConfig;
