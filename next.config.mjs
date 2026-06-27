/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Tells Next.js to export static HTML assets
  images: {
    unoptimized: true, // Required for static HTML exports
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
