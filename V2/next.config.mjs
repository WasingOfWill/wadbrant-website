/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The Jekyll site served every page from a directory URL; keep those links.
  trailingSlash: true,
  images: {
    // Content images are authored as plain <img> tags inside markdown, so the
    // Next image optimizer is only used by first-party components.
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      // Jekyll's paginator exposed /page2, /page3 …; the home page now lists
      // every post, so send those URLs to the top of the list.
      { source: '/page:num(\\d+)', destination: '/', permanent: true },
      // Retired pages from the Jekyll site.
      { source: '/ai', destination: '/categories/ai/', permanent: true },
      { source: '/product', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
