/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Every page is served from a directory URL.
  trailingSlash: true,
  images: {
    // Content images are authored as plain <img> tags inside markdown, so the
    // Next image optimizer is only used by first-party components.
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      // Old paginated URLs; the home page lists every post now.
      { source: '/page:num(\\d+)', destination: '/', permanent: true },
      // Retired pages.
      { source: '/ai', destination: '/categories/ai/', permanent: true },
      { source: '/product', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
