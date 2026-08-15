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
      // Old paginated URLs.
      { source: '/page:num(\\d+)', destination: '/articles/', permanent: true },
      // Tags now live at the bottom of the categories page.
      { source: '/tags', destination: '/categories/', permanent: true },
      // Retired pages.
      { source: '/ai', destination: '/categories/ai/', permanent: true },
      { source: '/product', destination: '/articles/', permanent: true },
    ];
  },
};

export default nextConfig;
