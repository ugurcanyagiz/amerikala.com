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
