/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Workers compatible settings
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Disable image optimization for Cloudflare (use Cloudflare Images instead)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
