import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      // daizie.ai is the promotable product domain. Until Daizie earns its
      // own standalone site (see D010 triggers), every daizie.ai URL lands
      // on the Daizie page here.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'daizie.ai' }],
        destination: 'https://www.martykoepke.com/ai-visibility',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.daizie.ai' }],
        destination: 'https://www.martykoepke.com/ai-visibility',
        permanent: true,
      },
      // Vanity path on the main domain: martykoepke.com/daizie
      { source: '/daizie', destination: '/ai-visibility', permanent: true },
      { source: '/privacy.html', destination: '/privacy', permanent: true },
      { source: '/terms.html', destination: '/terms', permanent: true },
      { source: '/cookies.html', destination: '/cookies', permanent: true },
      { source: '/acceptable-use.html', destination: '/acceptable-use', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/returns.html', destination: '/returns', permanent: true },
      // The old PULSE route is gone.
      { source: '/pulse', destination: '/', permanent: true },
      // Framework page retired 2026-07-12; replaced by /methodology.
      // Both the old ai-business-accuracy-framework slug and the
      // our-framework slug now land on /methodology.
      { source: '/ai-business-accuracy-framework', destination: '/methodology', permanent: true },
      { source: '/our-framework', destination: '/methodology', permanent: true },
      { source: '/why-ai-business-accuracy-matters', destination: '/blog/why-ai-business-accuracy-matters', permanent: true },
    ];
  },
};

export default nextConfig;
