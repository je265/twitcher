/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/prisma", "@repo/shared"],
}

module.exports = nextConfig
