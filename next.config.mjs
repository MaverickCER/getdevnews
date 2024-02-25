/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'q54ouf6kgkl8kx0c.public.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'www.getdevnews.com',
        port: '',
      },
    ],
  },
};

export default nextConfig;
