import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    /* Drafts render on the real site so a piece can be checked in place. They
       are unlisted, not secret, and this is the half of that which is up to
       us: no index, and nothing in the sitemap pointing at them. */
    rules: [{ userAgent: '*', allow: '/', disallow: '/drafts/' }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
