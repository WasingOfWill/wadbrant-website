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
 * The grid is generated, so an arithmetic slip in the coordinate maths would
 * be invisible in a diff and obvious only to the eye. This pins down the parts
 * that have to hold: one home camp, six roads out, six cities, a way back from
 * each, and every published entry actually on the ground somewhere. Only the
 * rendered SVG is measured, because the React payload further down the
 * document repeats every attribute.
 */
const REGION_IDS = ['ai', 'gaming', 'news', 'product', 'projects', 'misc'];

const canvas = home.body.match(/<svg class="hexmap-canvas"[\s\S]*?<\/svg>/)?.[0];
if (!canvas) {
  fail('/', 'has no hex map');
} else {
  const tiles = [
    ...canvas.matchAll(
      /<g class="hex" data-id="([^"]+)" data-kind="(\w+)"(?: data-region="(\w+)")? data-hub="([\w-]+)"(?: data-holds="(\d+)")?[\s\S]{0,240}?transform="(translate\([^"]+\))"/g
    ),
  ].map(([, id, kind, region, hub, holds, at]) => ({ id, kind, region, hub, holds, at }));
  const count = (predicate) => tiles.filter(predicate).length;

  if (count((tile) => tile.kind === 'home') !== 1) fail('/', 'the map has no single home camp');
  if (count((tile) => tile.kind === 'gateway') !== 6) fail('/', 'there are not six roads out');
  if (count((tile) => tile.kind === 'city') !== 6) fail('/', 'there are not six cities');
  if (count((tile) => tile.kind === 'wild') < 40) fail('/', 'there is no empty ground');

  // Every settlement you can travel to needs a tile that leads back out of it,
  // or it is a trap.
  const settlements = new Set(
    tiles.filter((tile) => tile.kind === 'city' || tile.kind === 'outpost').map((tile) => tile.hub)
  );
  for (const hub of settlements) {
    if (count((tile) => tile.hub === hub && tile.kind === 'return') !== 1) {
      fail('/', `${hub} has no way back`);
    }
  }

  // A signpost promises a place. Travelling to one that was never laid would
  // leave the camera pointing at nothing.
  for (const tile of tiles.filter((candidate) => candidate.kind === 'signpost')) {
    const target = tile.id.replace('signpost-', '');
    if (!settlements.has(target)) fail('/', `signpost ${tile.id} leads nowhere`);
  }

  // Two tiles in one place would be a coordinate bug, and would look like a
  // rendering glitch rather than the arithmetic mistake it is.
  const places = new Set(tiles.map((tile) => tile.at));
  if (places.size !== tiles.length) fail('/', 'two tiles share a position');

  // Each city states how many entries its region holds. A city with no gate
  // has to be showing all of them: a tile silently landing on an occupied
  // cell would drop an article off the map with nothing to say so.
  const sizes = [];
  for (const id of REGION_IDS) {
    if (count((tile) => tile.kind === 'city' && tile.region === id) !== 1) {
      fail('/', `region ${id} has no city`);
      continue;
    }
    const held = Number(tiles.find((tile) => tile.id === `city-${id}`)?.holds);
    /* An entry sits at its topic when it has one, and around the category
       otherwise, so a region's entries are spread across both. */
    const shown = count(
      (tile) => tile.kind === 'article' && (tile.hub === id || tile.hub.startsWith(`${id}-`))
    );
    const gated = count((tile) => tile.hub === id && tile.kind === 'gate') === 1;
    sizes.push(shown);

    if (!Number.isFinite(held)) {
      fail('/', `city ${id} does not say how many entries it holds`);
      continue;
    }
    if (!gated && shown !== held) {
      fail('/', `${id} holds ${held} entries but only ${shown} are on the map`);
    }
    if (gated && shown >= held) fail('/', `${id} has a gate but nothing behind it`);
  }

  // Cities are sized by how much each region has to show. If they all came out
  // the same, that sizing has stopped working.
  if (new Set(sizes).size === 1) fail('/', 'every city came out the same size');

  // The map is a picture. Its text alternative has to reach every published
  // post exactly once, or the homepage is a dead end for a screen reader and
  // for a crawler. A post may sit on several tiles: featured near home, in its
  // city, and again in an outpost.
  const listed = home.body.match(/<nav id="main-content"[\s\S]*?<\/nav>/)?.[0] ?? '';
  const listedLinks = [...listed.matchAll(/href="(\/posts\/[^"]+)"/g)].map(([, href]) => href);
  if (listedLinks.length !== index.length) {
    fail('/', `${index.length} posts but ${listedLinks.length} links in the text alternative`);
  }
  if (new Set(listedLinks).size !== listedLinks.length) {
    fail('/', 'the text alternative lists a post twice');
  }
  for (const href of listedLinks) {
    if (!index.some((entry) => entry.url === href)) {
      fail('/', `map links to ${href}, which is not a published post`);
    }
  }
}

/*
 * Drafts are unlisted, which is a promise made of several parts: no index, no
 * sitemap entry, no feed entry, nothing in search, and no link from anywhere.
 * Any one of them slipping is how unfinished writing ends up on Google.
 */
const drafts = await get('/drafts/');
if (drafts.status !== 200) fail('/drafts/', `status ${drafts.status}`);
if (!/name="robots"[^>]*noindex/.test(drafts.body)) fail('/drafts/', 'is not noindex');
if (sitemap.body.includes('/drafts/')) fail('/sitemap.xml', 'lists the drafts page');

const robots = await get('/robots.txt');
if (!/Disallow: \/drafts\//.test(robots.body)) fail('/robots.txt', 'does not exclude /drafts/');

/* Only the list itself. The page chrome carries links to published posts, and
   matching those would report every article on the site as a leaked draft. */
const draftList = drafts.body.match(/<ul class="draft-list">[\s\S]*?<\/ul>/g)?.join('') ?? '';
if (!/In progress/.test(drafts.body) || !/Scheduled/.test(drafts.body)) {
  fail('/drafts/', 'does not show both work in progress and what is scheduled');
}
for (const [, href] of draftList.matchAll(/href="(\/posts\/[^"]+)"/g)) {
  if (index.some((entry) => entry.url === href)) {
    fail('/drafts/', `${href} is listed as a draft but is also published`);
  }
  const page = await get(href);
  if (!/name="robots"[^>]*noindex/.test(page.body)) fail(href, 'a draft that is not noindex');
  if (sitemap.body.includes(href)) fail('/sitemap.xml', `lists the draft ${href}`);
  if (feed.body.includes(href)) fail('/feed.xml', `carries the draft ${href}`);
  if (links.has(href)) fail('/', `a draft is linked from the published site: ${href}`);
}

/*
 * The category tabs on the article list. Filtering is done with an attribute,
 * so a card without one silently becomes unreachable by every filter.
 */
const articles = await get('/articles/');
const tabs = [...articles.body.matchAll(/data-category="([\w-]+)"[^>]*>\s*([A-Za-z]+)/g)];
if (tabs.length === 0) fail('/articles/', 'has no category tabs');
const cards = [...articles.body.matchAll(/class="card-wrapper card" data-category="([\w-]*)"/g)];
if (cards.length !== index.length) {
  fail('/articles/', `${cards.length} cards for ${index.length} posts`);
}
for (const [, category] of cards) {
  if (!category) fail('/articles/', 'a card has no category to filter on');
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
