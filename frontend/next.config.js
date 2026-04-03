/** @type {import('next').NextConfig} */
const normalizeTarget = (value) => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

const backendProxyTarget = normalizeTarget(
  process.env.BACKEND_PROXY_TARGET ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://esencelab-api.vercel.app')
);
const aiProxyTarget = normalizeTarget(
  process.env.AI_PROXY_TARGET ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://esencelab-ai.vercel.app')
);

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
  async rewrites() {
    const rules = [];
    if (backendProxyTarget) {
      rules.push({
        source: '/api/:path*',
        destination: `${backendProxyTarget}/api/:path*`,
      });
    }
    if (aiProxyTarget) {
      rules.push({
        source: '/ai/health',
        destination: `${aiProxyTarget}/health`,
      });
      rules.push({
        source: '/ai/:path*',
        destination: `${aiProxyTarget}/ai/:path*`,
      });
    }
    return rules;
  },
};

module.exports = nextConfig;
