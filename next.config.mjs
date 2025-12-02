/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb', // Increase the body size limit
        },
    },
    webpack: (config, { isServer }) => {
        // Ignore optional native dependencies that don't work in Vercel
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            memcpy: false,
        };
        
        // Ignore memcpy module completely
        config.externals = config.externals || [];
        config.externals.push({
            'memcpy': 'commonjs memcpy'
        });
        
        return config;
    }
}

export default nextConfig;

