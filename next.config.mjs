/** @type {import('next').NextConfig} */
const nextConfig = {
  // We remove output: 'export' because Cloudflare Workers (OpenNext) 
  // bundles and runs Next.js server-side on the Edge.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
