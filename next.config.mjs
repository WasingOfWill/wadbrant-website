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
      // The taxonomy is now the six regions on the homepage map: AI, Gaming,
      // Ongoing, Product, Projects and Misc, with three subcategories under
      // them. Everything below is a category page that used to exist and no
      // longer does.
      ...[
        ['game-industry', 'news'],
        ['industry', 'news'],
        ['ongoing', 'news'],
        ['indie', 'gaming'],
        ['strategy', 'monetisation'],
        ['game-design', 'gaming'],
        ['genre', 'gaming'],
        ['product-management', 'product'],
        ['other', 'product'],
        ['feature', 'projects'],
        ['work', 'projects'],
        ['craft', 'practice'],
        ['other-things', 'misc'],
        ['reflection', 'misc'],
      ].map(([from, to]) => ({
        source: `/categories/${from}`,
        destination: `/categories/${to}/`,
        permanent: true,
      })),
      { source: '/tags/product-management', destination: '/tags/product/', permanent: true },
      // A stray " copy" in a filename had made it into the URL.
      {
        source: '/posts/five-best-lessons-of-everyday-LLM-usage-copy',
        destination: '/posts/five-best-lessons-of-everyday-llm-usage/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
