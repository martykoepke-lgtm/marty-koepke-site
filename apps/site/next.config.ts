import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      { source: '/privacy.html', destination: '/privacy', permanent: true },
      { source: '/terms.html', destination: '/terms', permanent: true },
      { source: '/cookies.html', destination: '/cookies', permanent: true },
      { source: '/acceptable-use.html', destination: '/acceptable-use', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/returns.html', destination: '/returns', permanent: true },
      // The old PULSE route is gone.
      { source: '/pulse', destination: '/time-back-assessment', permanent: true },
    ];
  },
};

export default nextConfig;
