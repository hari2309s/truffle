/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@truffle/ai', '@truffle/db', '@truffle/types'],
  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers', 'chromadb'],
  },
}

export default nextConfig
