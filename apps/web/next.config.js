/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/ui", "@repo/config", "@repo/types"],
    experimental: {
        optimizePackageImports: ["lucide-react"],
    },
    images: {
        domains: ["localhost"],
    },
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:3001/api/:path*",
            },
        ];
    },
};

module.exports = nextConfig;
