import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql', 'libsql'],
  // Configuración de Turbopack vacía para silenciar el warning
  turbopack: {},
  // Usar webpack en lugar de Turbopack para evitar problemas con libsql
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@libsql/client': 'commonjs @libsql/client',
        '@prisma/adapter-libsql': 'commonjs @prisma/adapter-libsql',
        libsql: 'commonjs libsql',
      });
    }
    return config;
  },
};

export default nextConfig;
