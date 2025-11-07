/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5001/api',
  },
}

module.exports = nextConfig

