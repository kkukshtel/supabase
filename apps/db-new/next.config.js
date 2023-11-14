/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui'],
  webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
    config.module.rules.push({
      test: /\.node$/,
      use: [
        {
          loader: 'nextjs-node-loader',
        },
      ],
    })
    return config
  },
  redirects: () => [
    {
      source: '/',
      destination: '/visualizer/new',
      permanent: true,
    },
    {
      source: '/visualizer',
      destination: '/visualizer/new',
      permanent: true,
    },
  ],
}

module.exports = nextConfig
