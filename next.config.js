/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@opendatalabs/vana-sdk'],
  },
  // Ensure trailing slashes work correctly for Vana return URLs
  trailingSlash: false,
};

module.exports = nextConfig;
