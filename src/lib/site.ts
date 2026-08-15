/**
 * Single source of truth for site-wide configuration.
 * Replaces the Jekyll `_config.yml` values that the templates actually used.
 */
export const site = {
  title: 'WADBRANT',
  tagline: 'Will Wadbrant.      Be Endlessly Curious.',
  description:
    'Articles on Product Managment, Gaming Industry, and AI. By Will Wadbrant.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wadbrant.com',
  lang: 'en',
  timezone: 'America/New_York',
  // Rasterised from the original 12MB SVG by `npm run build:avatar`.
  avatar: '/assets/images/avatar-224.png',
  avatarSmall: '/assets/images/avatar-112.png',
  ogImage: '/assets/images/og-image.jpg',
  paginate: 10,
  googleAnalyticsId: 'G-HVDB517FPM',
  author: {
    name: 'Will Wadbrant',
    email: 'williamwadbr@gmail.com',
    linkedin: 'https://www.linkedin.com/in/wadbrant/',
    twitter: 'https://twitter.com/WilliamWadbrant',
    twitterHandle: '@WilliamWadbrant',
    github: 'https://github.com/WasingOfWill',
  },
  copyright: {
    brief: 'Post licensed under CC BY 4.0 by Will.',
    verbose: 'Post licensed under CC BY 4.0 by Will.',
  },
  license: {
    name: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
} as const;

/** Sidebar navigation, in display order. */
export const navigation = [
  { href: '/', label: 'HOME', icon: 'fas fa-home' },
  { href: '/categories/', label: 'CATEGORIES', icon: 'fas fa-stream' },
  { href: '/tags/', label: 'TAGS', icon: 'fas fa-tags' },
  { href: '/archives/', label: 'ARCHIVES', icon: 'fas fa-archive' },
  { href: '/about/', label: 'ABOUT', icon: 'fas fa-info-circle' },
] as const;
