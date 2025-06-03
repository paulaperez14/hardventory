import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        // Hostname del bucket S3 de Hardventory Local
        protocol: 'https',
        hostname: 'hardventory-local.s3.sa-east-1.amazonaws.com', 
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
