/**
 * Checks the content itself - no browser needed, runs in about a second.
 *
 *   node tests/content.mjs
 *
 * Catches the mistakes that are easy to make when writing or generating a
 * post: a missing title, a date that will never publish, an image path that
 * does not exist, a link to a tag page nobody produces.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const POSTS = path.join(process.cwd(), 'content', 'posts');
const PAGES = path.join(process.cwd(), 'content', 'pages');
const PUBLIC = path.join(process.cwd(), 'public');

const problems = [];
const fail = (file, message) => problems.push(`${file}: ${message}`);

const matterOptions = {
  engines: { yaml: (input) => yaml.load(input, { schema: yaml.CORE_SCHEMA }) },
};

const slugs = new Map();
const files = fs.existsSync(POSTS) ? fs.readdirSync(POSTS).filter((f) => /\.mdx?$/.test(f)) : [];

if (files.length === 0) fail('content/posts', 'no posts found');

for (const file of files) {
  const raw = fs.readFileSync(path.join(POSTS, file), 'utf8').replace(/\r\n/g, '\n');
  const { data, content } = matter(raw, matterOptions);

  if (!data.title) fail(file, 'missing title');
  if (!data.date) fail(file, 'missing date');
  if (!content.trim()) fail(file, 'has no body');

  const dated = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.+)$/.exec(file.replace(/\.mdx?$/, ''));
  if (!dated) fail(file, 'filename should start with YYYY-MM-DD-');

  const slug = String(data.slug ?? dated?.[4] ?? '').trim().replace(/\s+/g, '-');
  if (slugs.has(slug)) fail(file, `slug "${slug}" already used by ${slugs.get(slug)}`);
  else slugs.set(slug, file);

  for (const key of ['categories', 'tags']) {
    if (data[key] && !Array.isArray(data[key])) fail(file, `${key} should be a list`);
  }

  // Cover image
  const cover = typeof data.image === 'string' ? data.image : data.image?.path;
  if (cover && !/^https?:/.test(cover)) {
    const target = path.join(PUBLIC, cover.replace(/^\//, ''));
    if (!fs.existsSync(target)) fail(file, `cover image not found: ${cover}`);
  }

  // Inline images
  for (const match of content.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    const src = match[1];
    if (/^https?:|^data:/.test(src)) continue;
    const target = path.join(PUBLIC, src.replace(/^\//, ''));
    if (!fs.existsSync(target)) fail(file, `image not found: ${src}`);
  }

  // Internal links should point at routes that exist.
  for (const match of content.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const href = match[1].split('#')[0];
    if (!href || href.startsWith('/assets/')) continue;
    const known =
      /^\/(posts|tags|categories)\/[^/]+\/$/.test(href) ||
      ['/', '/tags/', '/categories/', '/archives/', '/about/', '/cv/'].includes(href);
    if (!known) fail(file, `internal link looks wrong: ${href}`);
  }
}

for (const page of ['about', 'cv']) {
  const file = path.join(PAGES, `${page}.md`);
  if (!fs.existsSync(file)) fail(`content/pages/${page}.md`, 'missing');
}

if (problems.length) {
  console.error(`content checks failed (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`content ok - ${files.length} posts, ${slugs.size} unique slugs`);
