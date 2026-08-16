import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { renderMarkdown, renderExcerptHtml } from './markdown';
import { site } from './site';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const PAGES_DIR = path.join(process.cwd(), 'content', 'pages');

/**
 * Front matter is parsed with the CORE schema so that `date: 2025-10-27` stays
 * a string. YAML would otherwise turn it into UTC midnight, which renders as
 * the previous day in the site's timezone.
 */
const matterOptions = {
  engines: {
    yaml: (input: string) => yaml.load(input, { schema: yaml.CORE_SCHEMA }) as object,
  },
};

export type PostImage = {
  path: string;
  alt?: string;
  lqip?: string;
};

export type Post = {
  slug: string;
  url: string;
  title: string;
  date: Date;
  lastModified: Date;
  categories: string[];
  tags: string[];
  image?: PostImage;
  pin: boolean;
  /** Still being written. Excluded from every listing, feed and index. */
  draft: boolean;
  description?: string;
  toc: boolean;
  math: boolean;
  mermaid: boolean;
  /** Rendered HTML of the whole post. */
  content: string;
  /** Rendered HTML of the first block of the post. */
  excerptHtml: string;
  /** Plain-text excerpt, Liquid `strip_html | truncate: 200` compatible. */
  excerpt: string;
  /** Plain-text of the whole post truncated to 200 chars (used by related posts). */
  summary: string;
  words: number;
  /** Word count of the markdown source, used for the post-card estimate. */
  rawWords: number;
  /** floor(words / 180), minimum 1 - the reading time shown on a post. */
  readTime: number;
  /** ceil(rawWords / 200) - the reading time shown on post cards. */
  listReadTime: number;
};

export type ContentPage = {
  slug: string;
  title: string;
  content: string;
  description?: string;
};

/* -------------------------------------------------------------------------- */
/* Text helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Strips tags, comments, script and style blocks. */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '');
}

/** Truncates to n characters, ellipsis included in the length. */
export function truncate(input: string, length = 200, ellipsis = '...'): string {
  if (input.length <= length) return input;
  const cut = Math.max(0, length - ellipsis.length);
  return input.slice(0, cut) + ellipsis;
}

/** Word count, whitespace split. */
export function numberOfWords(input: string): number {
  const trimmed = input.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Slug used in category and tag URLs. */
export function slugify(input: string): string {
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/** Decodes HTML entities produced during markdown rendering. */
export function decodeEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&');
}

/* -------------------------------------------------------------------------- */
/* Front matter parsing                                                        */
/* -------------------------------------------------------------------------- */

const FILENAME_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.+)$/;

function toArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [String(value).trim()].filter(Boolean);
}

/**
 * Dates without a zone are read as site-timezone wall clock, then normalised
 * to a real instant so rendering is deterministic on any machine.
 */
function parseDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value !== 'string' || !value.trim()) return fallback;

  // Accepted shapes: `2025-10-05`, `2025-10-05 12:00`,
  // `2025-10-05 12:00:00 -0400`, `2025-10-05T12:00:00Z`.
  const parts =
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/.exec(
      value.trim()
    );
  if (!parts) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }

  const [, year, month, day, hour = '0', minute = '0', second = '0', zone] = parts;
  const utcGuess = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  if (zone) {
    if (zone === 'Z') return new Date(utcGuess);
    const sign = zone.startsWith('-') ? -1 : 1;
    const [zoneHours, zoneMinutes] = zone.slice(1).replace(':', '').match(/\d{2}/g) ?? ['0', '0'];
    const offsetMs = sign * (Number(zoneHours) * 60 + Number(zoneMinutes)) * 60_000;
    return new Date(utcGuess - offsetMs);
  }

  // No zone given: treat as site-timezone wall-clock time.
  const offset = timezoneOffsetMs(new Date(utcGuess), site.timezone);
  return new Date(utcGuess + offset);
}

function timezoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '00' : parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return date.getTime() - asUtc;
}

function normalizeImage(value: unknown): PostImage | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return { path: ensureLeadingSlash(value) };
  const image = value as Record<string, unknown>;
  const source = image.path ?? image.src;
  if (!source) return undefined;
  return {
    path: ensureLeadingSlash(String(source)),
    alt: image.alt ? String(image.alt) : undefined,
    lqip: image.lqip ? String(image.lqip) : undefined,
  };
}

function ensureLeadingSlash(value: string): string {
  if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) return value;
  return `/${value.replace(/^\.\//, '')}`;
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                     */
/* -------------------------------------------------------------------------- */

let cache: Post[] | null = null;

async function loadPost(fileName: string): Promise<Post | null> {
  const filePath = path.join(POSTS_DIR, fileName);
  // Normalise CRLF so excerpt truncation counts the same characters on every
  // platform (the posts are authored on Windows).
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const { data, content } = matter(raw, matterOptions);

  if (data.published === false) return null;

  const base = fileName.replace(/\.mdx?$/, '');
  const match = FILENAME_DATE.exec(base);
  const fallbackDate = match
    ? parseDate(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`, new Date())
    : new Date();
  const slugSource = String(data.slug ?? (match ? match[4] : base));
  const slug = slugSource.trim().replace(/\s+/g, '-');

  const date = parseDate(data.date, fallbackDate);
  const lastModified = parseDate(data.last_modified_at, date);

  const html = await renderMarkdown(content);
  const firstBlock = content.replace(/^\s+/, '').split(/\r?\n\r?\n/)[0] ?? '';
  const excerptHtml = await renderExcerptHtml(firstBlock);

  const plainExcerpt = decodeEntities(stripHtml(excerptHtml)).replace(/^\s+/, '');
  const plainContent = decodeEntities(stripHtml(html)).replace(/^\s+/, '');
  const words = numberOfWords(stripHtml(html));
  const rawWords = numberOfWords(content);

  return {
    slug,
    url: `/posts/${slug}/`,
    title: String(data.title ?? slug),
    date,
    lastModified,
    categories: toArray(data.categories),
    tags: toArray(data.tags),
    image: normalizeImage(data.image),
    pin: Boolean(data.pin),
    draft: data.draft === true,
    description: data.description ? String(data.description) : undefined,
    toc: data.toc !== false,
    math: Boolean(data.math),
    mermaid: Boolean(data.mermaid),
    content: html,
    excerptHtml,
    excerpt: truncate(plainExcerpt.replace(/\s+$/, ''), 200),
    summary: truncate(plainContent.replace(/\s+$/, ''), 200),
    words,
    rawWords,
    readTime: Math.max(1, Math.floor(words / 180)),
    listReadTime: Math.max(1, Math.ceil(rawWords / 200)),
  };
}

/**
 * All published posts, newest first. Future-dated posts are hidden.
 */
let everything: Post[] | null = null;

/** Everything in content/posts, drafts and scheduled pieces included. */
async function loadEverything(): Promise<Post[]> {
  if (everything) return everything;
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter((file) => /\.mdx?$/.test(file));
  const posts = (await Promise.all(files.map(loadPost))).filter((post): post is Post => Boolean(post));
  everything = posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  return everything;
}

/**
 * The published site. A piece is out when it is not a draft and its date has
 * passed, which is what makes both staging and drafting work by writing a file
 * rather than by moving one.
 */
export async function getAllPosts(): Promise<Post[]> {
  if (cache) return cache;
  const now = Date.now();
  cache = (await loadEverything()).filter((post) => !post.draft && post.date.getTime() <= now);
  return cache;
}

/** Work in progress. Never linked from the site and never indexed. */
export async function getDrafts(): Promise<Post[]> {
  return (await loadEverything()).filter((post) => post.draft);
}

/** Dated ahead and waiting for its day to come. */
export async function getScheduled(): Promise<Post[]> {
  const now = Date.now();
  return (await loadEverything())
    .filter((post) => !post.draft && post.date.getTime() > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}

/** Used by the post route, so a draft can be read at its real URL. */
export async function getPostOrDraft(slug: string): Promise<Post | undefined> {
  return (await loadEverything()).find((post) => post.slug === slug);
}

/* -------------------------------------------------------------------------- */
/* Derived collections                                                         */
/* -------------------------------------------------------------------------- */

export type TermGroup = { name: string; slug: string; posts: Post[] };

async function groupBy(key: 'categories' | 'tags'): Promise<Map<string, Post[]>> {
  const posts = await getAllPosts();
  const groups = new Map<string, Post[]>();
  for (const post of posts) {
    for (const term of post[key]) {
      const list = groups.get(term) ?? [];
      list.push(post);
      groups.set(term, list);
    }
  }
  // Groups are exposed sorted by name.
  return new Map([...groups.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)));
}

export async function getCategories(): Promise<Map<string, Post[]>> {
  return groupBy('categories');
}

export async function getTags(): Promise<Map<string, Post[]>> {
  return groupBy('tags');
}

/** Trending tags: count descending, then name ascending. */
export async function getTrendingTags(limit = 10): Promise<TermGroup[]> {
  const tags = await getTags();
  return [...tags.entries()]
    .map(([name, posts]) => ({ name, slug: slugify(name), posts }))
    .sort((a, b) => b.posts.length - a.posts.length || (a.name < b.name ? -1 : 1))
    .slice(0, limit);
}

/** Five most recently posted/updated articles. */
export async function getRecentlyUpdated(limit = 5): Promise<Post[]> {
  const posts = await getAllPosts();
  return [...posts]
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    .slice(0, limit);
}

/**
 * Related-posts scoring: 1 point per shared tag, 0.5 per shared category,
 * highest three win.
 */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const posts = await getAllPosts();
  const candidates = posts.filter((candidate) => candidate.slug !== post.slug);

  const scored = candidates
    .map((candidate, index) => {
      let score = 0;
      for (const tag of candidate.tags) if (post.tags.includes(tag)) score += 1;
      for (const category of candidate.categories) if (post.categories.includes(category)) score += 0.5;
      return { candidate, score, index };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return scored.slice(0, limit).map((entry) => entry.candidate);
}

/** Posts grouped by year for the archives page. */
export async function getArchives(): Promise<{ year: string; posts: Post[] }[]> {
  const posts = await getAllPosts();
  const groups: { year: string; posts: Post[] }[] = [];
  for (const post of posts) {
    const year = formatDate(post.date, { year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.posts.push(post);
    else groups.push({ year, posts: [post] });
  }
  return groups;
}

/**
 * Category tree for the categories page. A category is a top-level group when
 * the newest post filed under it lists it first.
 */
export type CategoryGroup = {
  name: string;
  slug: string;
  postCount: number;
  children: { name: string; slug: string; postCount: number }[];
};

export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  const categories = await getCategories();
  const groups: CategoryGroup[] = [];

  for (const [name, postsOfCategory] of categories) {
    const firstPost = postsOfCategory[0];
    if (!firstPost || firstPost.categories[0] !== name) continue;

    const children = [
      ...new Set(
        postsOfCategory
          .map((post) => post.categories[1])
          .filter((child): child is string => Boolean(child))
      ),
    ]
      .sort((a, b) => (a < b ? -1 : 1))
      .map((child) => ({
        name: child,
        slug: slugify(child),
        postCount: categories.get(child)?.length ?? 0,
      }));

    groups.push({
      name,
      slug: slugify(name),
      postCount: postsOfCategory.length,
      children,
    });
  }

  return groups;
}

/* -------------------------------------------------------------------------- */
/* Standalone pages                                                            */
/* -------------------------------------------------------------------------- */

export async function getPage(slug: string): Promise<ContentPage | null> {
  const file = path.join(PAGES_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(
    fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'),
    matterOptions
  );
  return {
    slug,
    title: String(data.title ?? slug),
    description: data.description ? String(data.description) : undefined,
    content: await renderMarkdown(content),
  };
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: site.timezone, ...options }).format(date);
}

/** "Oct 5, 2025" - used on post, tag and category pages. */
export function formatLongDate(date: Date): string {
  return formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Oct 05, 2025" - the zero-padded variant used on the post cards. */
export function formatCardDate(date: Date): string {
  return formatDate(date, { month: 'short', day: '2-digit', year: 'numeric' });
}

export function toISO(date: Date): string {
  return date.toISOString();
}
