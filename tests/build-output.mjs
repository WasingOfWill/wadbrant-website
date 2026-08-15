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

/*
 * The homepage map.
 *
 * The grid is generated, so an arithmetic slip in the wedge maths would be
 * invisible in a diff and obvious only to the eye. These numbers pin it down:
 * one home tile, six regions, five territory slots each and a ring of
 * scenery. Only the rendered SVG is measured, because the React payload
 * further down the document repeats every attribute.
 */
const REGION_IDS = ['ai', 'gaming', 'industry', 'product', 'business', 'misc'];
const TERRITORY_KINDS = ['article', 'gate', 'empty'];

const canvas = home.body.match(/<svg class="hexmap-canvas"[\s\S]*?<\/svg>/)?.[0];
if (!canvas) {
  fail('/', 'has no hex map');
} else {
  const tiles = [...canvas.matchAll(/<g class="hex" data-kind="(\w+)"(?: data-region="(\w+)")?/g)].map(
    ([, kind, region]) => ({ kind, region }),
  );
  const count = (predicate) => tiles.filter(predicate).length;

  if (count((tile) => tile.kind === 'home') !== 1) fail('/', 'the map has no single home tile');
  if (count((tile) => tile.kind === 'region') !== 6) fail('/', 'the map does not have six regions');
  // Rings 4 and 5: 6 * 4 plus 6 * 5.
  if (count((tile) => tile.kind === 'edge') !== 54) fail('/', 'the scenery rings are not 54 tiles');

  for (const id of REGION_IDS) {
    if (count((tile) => tile.kind === 'region' && tile.region === id) !== 1) {
      fail('/', `region ${id} is missing from the map`);
    }
    const slots = count((tile) => tile.region === id && TERRITORY_KINDS.includes(tile.kind));
    if (slots !== 5) fail('/', `region ${id} has ${slots} territory tiles, expected 5`);
  }

  // The map is a picture. Its text alternative has to carry the same links,
  // or the homepage is a dead end for a screen reader and for a crawler.
  const listed = home.body.match(/<nav id="main-content"[\s\S]*?<\/nav>/)?.[0] ?? '';
  const articles = count((tile) => tile.kind === 'article');
  const listedLinks = [...listed.matchAll(/href="(\/posts\/[^"]+)"/g)];
  if (listedLinks.length !== articles) {
    fail('/', `${articles} article tiles but ${listedLinks.length} links in the text alternative`);
  }
  for (const [, href] of listedLinks) {
    if (!index.some((entry) => entry.url === href)) {
      fail('/', `map links to ${href}, which is not a published post`);
    }
  }
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
