import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! ПРЕДУПРЕЖДЕНИЕ !!
    // Опасно: позволяет production сборке завершиться успешно даже если есть ошибки типов
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
