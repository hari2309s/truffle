/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@truffle/ai', '@truffle/db', '@truffle/types'],
  experimental: {
    serverComponentsExternalPackages: [
      '@xenova/transformers',
      'onnxruntime-node',
      'chromadb',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = Array.isArray(config.externals)
        ? config.externals
        : [config.externals].filter(Boolean)
      config.externals = [
        ...existing,
        'onnxruntime-node',
        '@xenova/transformers',
        'chromadb',
        'chromadb-default-embed',
        // Treat any native .node binary or https: URL as a commonjs external
        ({ request }, callback) => {
          if (request && (request.endsWith('.node') || request.startsWith('https://'))) {
            return callback(null, `commonjs ${request}`)
          }
          callback()
        },
      ]
    }
    return config
  },
}

export default nextConfig
