import type { MetadataRoute } from 'next';
import { getAllPosts, getCategories, getTags, slugify } from '@/lib/posts';
import { site } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags] = await Promise.all([getAllPosts(), getCategories(), getTags()]);

  const staticRoutes = ['/', '/categories/', '/tags/', '/archives/', '/about/', '/cv/'].map(
    (route) => ({
      url: `${site.url}${route}`,
      lastModified: posts[0]?.lastModified ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '/' ? 1 : 0.6,
    })
  );

  return [
    ...staticRoutes,
    ...posts.map((post) => ({
      url: `${site.url}${post.url}`,
      lastModified: post.lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...[...categories.keys()].map((name) => ({
      url: `${site.url}/categories/${slugify(name)}/`,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
    ...[...tags.keys()].map((name) => ({
      url: `${site.url}/tags/${slugify(name)}/`,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];
}
