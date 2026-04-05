/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["lucide-react"],
  experimental: {
    turbo: {
      resolveAlias: {
        tailwindcss: "./node_modules/tailwindcss",
      },
    },
  },
};

export default nextConfig;
