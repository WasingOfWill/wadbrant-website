/**
 * Checks the built site over HTTP: every route answers, the feed and sitemap
 * are real, the search index matches the posts, and no page links to a 404.
 *
 *   node tests/build-output.mjs        # expects a server on localhost:4000
 */
const BASE = process.env.LOCAL ?? 'http://localhost:4000';

const problems = [];
const fail = (what, message) => problems.push(`${what}: ${message}`);

async function get(pathname) {
  const response = await fetch(BASE + pathname, { redirect: 'follow' });
  return { status: response.status, body: await response.text() };
}

const home = await get('/');
if (home.status !== 200) fail('/', `status ${home.status}`);

const searchIndex = await get('/search.json');
let index = [];
try {
  index = JSON.parse(searchIndex.body);
} catch {
  fail('/search.json', 'is not valid JSON');
}
if (!Array.isArray(index) || index.length === 0) fail('/search.json', 'is empty');

for (const entry of index) {
  for (const key of ['title', 'url', 'date', 'snippet', 'tags', 'categories']) {
    if (entry[key] === undefined) fail('/search.json', `entry ${entry.url} is missing ${key}`);
  }
}

const feed = await get('/feed.xml');
if (!feed.body.includes('<feed')) fail('/feed.xml', 'is not an Atom feed');
if ((feed.body.match(/<entry>/g) ?? []).length !== index.length) {
  fail('/feed.xml', 'entry count does not match the search index');
}

const sitemap = await get('/sitemap.xml');
if (!sitemap.body.includes('<urlset')) fail('/sitemap.xml', 'is not a sitemap');

// Crawl every internal link reachable from the pages we know about.
const seeds = ['/', '/articles/', '/categories/', '/archives/', '/about/', '/cv/', ...index.map((e) => e.url)];
const seen = new Set();
const links = new Set();

for (const route of seeds) {
  const page = await get(route);
  if (page.status !== 200) {
    fail(route, `status ${page.status}`);
    continue;
  }
  seen.add(route);
  if (!/<title>/.test(page.body)) fail(route, 'has no <title>');
  if (!/<h1/.test(page.body) && route !== '/') fail(route, 'has no <h1>');

  for (const match of page.body.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = match[1];
    if (href.startsWith('/_next/') || href.startsWith('/assets/')) continue;
    links.add(href);
  }
}

for (const href of links) {
  if (seen.has(href)) continue;
  const response = await fetch(BASE + href, { method: 'HEAD', redirect: 'follow' });
  if (response.status >= 400) fail(href, `linked but returns ${response.status}`);
}

// A missing page must actually 404.
const missing = await fetch(`${BASE}/definitely-not-a-page/`);
if (missing.status !== 404) fail('/definitely-not-a-page/', `expected 404, got ${missing.status}`);

if (problems.length) {
  console.error(`build output checks failed (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`build output ok - ${seen.size} pages, ${links.size} internal links, feed + sitemap valid`);
