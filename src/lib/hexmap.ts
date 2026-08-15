/**
 * The homepage map.
 *
 * A pointy-top hex grid built as seven settlements rather than one blob. Home
 * sits at the origin with six gateway tiles around it, one per region. Each
 * gateway has a city out on the map in the same direction, a few tiles' travel
 * away, and that city is where the region's articles actually live. A city has
 * room for seventeen entries, so a region can grow well past what fits next to
 * home.
 *
 * Distances, skews and city shapes are all deliberately uneven. Nothing here
 * is symmetrical on purpose; it should read as places on a map, not as a menu
 * drawn with a compass.
 *
 * All of it is computed at build time. The map ships as finished markup.
 */
import { getAllPosts, getCategories, slugify, type Post } from './posts';

export type Axial = { q: number; r: number };

export type Region = {
  id: string;
  name: string;
  /** Front matter categories that feed this region, best match first. */
  matches: string[];
  /** One line shown when the region is open. */
  blurb: string;
  direction: Axial;
  /** How far its city sits from home, and how far the road bends. */
  distance: number;
  skew: number;
};

/** Circumradius of a tile in SVG user units, which are CSS pixels at scale 1. */
export const HEX_SIZE = 64;

/** Tiles are drawn slightly inside their cell so the seams read as edges. */
const HEX_INSET = 0.93;

const SQRT3 = Math.sqrt(3);

/** Neighbour offsets in redblobgames order: E, NE, NW, W, SW, SE. */
const DIRS: Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

/**
 * Regions in match precedence order. A post lands in the first region whose
 * `matches` contains its top-level category; failing that, any of its
 * categories; failing that, Misc.
 *
 * The legacy names are here so the map has something to show before the
 * content is retagged to the six regions.
 */
export const REGIONS: Region[] = [
  {
    id: 'ai',
    name: 'AI',
    direction: { q: 0, r: -1 },
    distance: 8,
    skew: 1,
    blurb: 'Building with models, and what survives contact with real users.',
    matches: ['AI'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    direction: { q: 1, r: -1 },
    distance: 7,
    skew: -1,
    blurb: 'Design, genre and why players do what they do.',
    matches: ['Gaming', 'Game Design', 'Games', 'Design'],
  },
  {
    id: 'industry',
    name: 'Industry',
    direction: { q: 1, r: 0 },
    distance: 9,
    skew: 0,
    blurb: 'What is happening to the business of making games.',
    matches: ['Industry', 'Game Industry', 'News'],
  },
  {
    id: 'product',
    name: 'Product',
    direction: { q: 0, r: 1 },
    distance: 7,
    skew: 1,
    blurb: 'The craft: discovery, prioritisation, shipping, saying no.',
    matches: ['Product', 'Product Management', 'Feature'],
  },
  {
    id: 'business',
    name: 'Business',
    direction: { q: -1, r: 1 },
    distance: 8,
    skew: -1,
    blurb: 'Monetisation, incentives, and where the money actually goes.',
    matches: ['Business', 'Strategy', 'Indie'],
  },
  {
    id: 'misc',
    name: 'Misc',
    direction: { q: -1, r: 0 },
    distance: 8,
    skew: 1,
    blurb: 'Everything that did not fit anywhere else.',
    matches: ['Misc', 'Other Things', 'Reflection', 'Other'],
  },
];

/** At most this many subcategory signposts on a city's outer ring. */
const MAX_SIGNPOSTS = 3;

export type HexKind =
  | 'home'
  | 'gateway'
  | 'city'
  | 'article'
  | 'signpost'
  | 'gate'
  | 'return'
  | 'trail'
  | 'edge';

export type HexCell = {
  id: string;
  q: number;
  r: number;
  /** Centre in SVG user units, origin at the home tile. */
  x: number;
  y: number;
  /** Which settlement this tile belongs to: 'home' or a region id. */
  hub: string;
  /** Rings out from that settlement's centre, used to stagger the reveal. */
  ring: number;
  kind: HexKind;
  regionId?: string;
  label?: string;
  /** Secondary line: date and reading time for an article. */
  meta?: string;
  href?: string;
  excerpt?: string;
  /** Entries the region holds, on city tiles only. Read by the build check. */
  holds?: number;
  /** The post's cover, shown in the readout when it has one. */
  image?: { src: string; alt: string };
  /** Key into the mark table in HexMapView. */
  icon?: string;
};

export function axialToPixel({ q, r }: Axial, size = HEX_SIZE) {
  return { x: size * SQRT3 * (q + r / 2), y: size * 1.5 * r };
}

/** The six corners of a tile, as an SVG `points` string centred on 0,0. */
export function hexPoints(size = HEX_SIZE * HEX_INSET): string {
  return Array.from({ length: 6 }, (_, corner) => {
    const angle = (Math.PI / 180) * (60 * corner - 30);
    return `${(size * Math.cos(angle)).toFixed(2)},${(size * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

function add(a: Axial, b: Axial): Axial {
  return { q: a.q + b.q, r: a.r + b.r };
}

function scale(a: Axial, by: number): Axial {
  return { q: a.q * by, r: a.r * by };
}

function key({ q, r }: Axial): string {
  return `${q},${r}`;
}

/** Cube distance between two axial coordinates. */
function distance(a: Axial, b: Axial): number {
  const q = a.q - b.q;
  const r = a.r - b.r;
  return (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
}

function ring(centre: Axial, radius: number): Axial[] {
  if (radius === 0) return [centre];
  const cells: Axial[] = [];
  let cell = add(centre, scale(DIRS[4], radius));
  for (let side = 0; side < 6; side += 1) {
    for (let step = 0; step < radius; step += 1) {
      cells.push(cell);
      cell = add(cell, DIRS[side]);
    }
  }
  return cells;
}

/** Straight run of tiles from one coordinate to another, endpoints included. */
function line(from: Axial, to: Axial): Axial[] {
  const steps = distance(from, to);
  if (steps === 0) return [from];
  const cube = (cell: Axial) => ({ x: cell.q, y: -cell.q - cell.r, z: cell.r });
  const a = cube(from);
  const b = cube(to);
  const out: Axial[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const z = a.z + (b.z - a.z) * t;
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);
    const dx = Math.abs(rx - x);
    const dy = Math.abs(ry - y);
    const dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;
    out.push({ q: rx, r: rz });
  }
  return out;
}

/**
 * Deterministic value in 0..1 for a coordinate. Used to rough up the frontier.
 * It has to be a pure function of the coordinate, not a random number, or the
 * world would be a different shape on every build.
 */
function noise(q: number, r: number): number {
  const value = Math.sin(q * 127.1 + r * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function angleOf(cell: Axial, from: Axial): number {
  const a = axialToPixel(cell);
  const b = axialToPixel(from);
  return Math.atan2(a.y - b.y, a.x - b.x);
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Which mark an article gets. Read in order, first hit wins, so the more
 * specific subjects have to come before the general ones. It works off tags
 * and the title because those are what an author actually writes; nothing new
 * has to be added to the front matter for a post to get a sensible icon.
 */
const ICON_RULES: [RegExp, string][] = [
  [/monet|money|pricing|revenue|free.?to.?play|incentive|spend/, 'coins'],
  [/genre|pick|choos|select/, 'compass'],
  [/mystery|discover|research|investigat/, 'lens'],
  [/\bai\b|llm|gpt|prompt|model|wrapper/, 'chip'],
  [/law|act|regulat|polic|compliance|fairness/, 'scales'],
  [/mistake|wrong|fail|suck|trap|pitfall/, 'warning'],
  [/prototyp|experiment|test|hypothes/, 'flask'],
  [/design|characteri[sz]|narrative|story|rpg/, 'nib'],
  [/indie|studio|solo|small team/, 'sprout'],
  [/launch|connect|feature|ship|roadmap|priorit/, 'target'],
  [/data|metric|analytic|growth|retention|funnel/, 'chart'],
  [/news|happening|announce|report/, 'signal'],
];

function iconFor(post: Post): string {
  const haystack = [post.title, ...post.tags, ...post.categories].join(' ').toLowerCase();
  for (const [pattern, icon] of ICON_RULES) {
    if (pattern.test(haystack)) return icon;
  }
  return 'book';
}

/* -------------------------------------------------------------------------- */

function regionForPost(post: Post): Region {
  const [top, ...rest] = post.categories;
  for (const region of REGIONS) {
    if (top && region.matches.includes(top)) return region;
  }
  for (const region of REGIONS) {
    if (rest.some((category) => region.matches.includes(category))) return region;
  }
  return REGIONS[REGIONS.length - 1];
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'America/New_York',
});

export type RegionInfo = Region & {
  count: number;
  /** Where its city sits, in SVG user units. */
  x: number;
  y: number;
  /** The category page behind the readout's call to action. */
  href: string;
  /** Titles shown in the readout, newest first. */
  reads: { title: string; href: string }[];
};

export type HexMapData = {
  cells: HexCell[];
  regions: RegionInfo[];
  /** One road per region, as an SVG path from the gateway to the city. */
  routes: { id: string; d: string }[];
};

export async function getHexMap(): Promise<HexMapData> {
  const posts = await getAllPosts();
  const categories = await getCategories();

  const byRegion = new Map<string, Post[]>(REGIONS.map((region) => [region.id, []]));
  for (const post of posts) byRegion.get(regionForPost(post).id)?.push(post);
  for (const list of byRegion.values()) {
    list.sort((a, b) => Number(b.pin) - Number(a.pin) || b.date.getTime() - a.date.getTime());
  }

  const home: Axial = { q: 0, r: 0 };
  const cells: HexCell[] = [];
  const taken = new Set<string>();
  const routes: { id: string; d: string }[] = [];
  const info: RegionInfo[] = [];

  const put = (cell: HexCell) => {
    if (taken.has(`${cell.q},${cell.r}`)) return false;
    taken.add(`${cell.q},${cell.r}`);
    cells.push(cell);
    return true;
  };

  put({ ...place(home), id: 'home', hub: 'home', ring: 0, kind: 'home', label: 'Will Wadbrant' });

  /* Gateways first, so a city can never take a tile next to home. */
  const gateways = new Map<string, Axial>();
  for (const region of REGIONS) {
    const at = region.direction;
    gateways.set(region.id, at);
    put({
      ...place(at),
      id: `gateway-${region.id}`,
      hub: 'home',
      ring: 1,
      kind: 'gateway',
      regionId: region.id,
      label: region.name,
      icon: region.id,
    });
  }

  /* City centres. Distance and skew differ per region so the six are not a
     star, and the roads out of home do not all look like the same road. */
  const cities = new Map<string, Axial>();
  for (const [index, region] of REGIONS.entries()) {
    const along = scale(region.direction, region.distance);
    const sideways = scale(DIRS[(index + 1) % 6], region.skew);
    cities.set(region.id, add(along, sideways));
  }

  for (const [index, region] of REGIONS.entries()) {
    const city = cities.get(region.id)!;
    const gateway = gateways.get(region.id)!;
    const list = byRegion.get(region.id) ?? [];

    /* The road. Its tiles are scenery; the drawn line follows their centres.
       The last tile before the city is the way back, so it is both the end of
       the road and the return marker: laying a separate one there would land
       on an occupied cell and quietly disappear. */
    const road = line(gateway, city);
    const points = road.map((cell) => {
      const { x, y } = axialToPixel(cell);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    routes.push({ id: region.id, d: `M ${points.join(' L ')}` });
    for (const cell of road.slice(1, -2)) {
      put({
        ...place(cell),
        id: `trail-${cell.q}-${cell.r}`,
        hub: region.id,
        ring: 0,
        kind: 'trail',
        regionId: region.id,
      });
    }

    const back = road[road.length - 2];
    put({
      ...place(back),
      id: `return-${region.id}`,
      hub: region.id,
      ring: 1,
      kind: 'return',
      regionId: region.id,
      label: 'Back to camp',
      icon: 'return',
    });

    put({
      ...place(city),
      id: `city-${region.id}`,
      hub: region.id,
      ring: 0,
      kind: 'city',
      regionId: region.id,
      label: region.name,
      meta: `${list.length} ${list.length === 1 ? 'entry' : 'entries'}`,
      holds: list.length,
      icon: region.id,
    });

    /* Ring 1 first, then ring 2, swept by angle so the newest work sits
       closest to the city. Anything the road already took is skipped, so no
       entry can be dropped on the floor. */
    const slots = [
      ...ring(city, 1).sort((a, b) => angleOf(a, city) - angleOf(b, city)),
      ...ring(city, 2).sort((a, b) => angleOf(a, city) - angleOf(b, city)),
    ].filter((cell) => !taken.has(key(cell)));

    const signposts = subcategoriesFor(list, region, categories).slice(0, MAX_SIGNPOSTS);
    const overflows = list.length + signposts.length > slots.length;
    const shown = overflows ? list.slice(0, slots.length - signposts.length - 1) : list;

    const filling: HexCell[] = shown.map((post) => ({
      ...place(home),
      id: `post-${post.slug}`,
      hub: region.id,
      ring: 0,
      kind: 'article',
      regionId: region.id,
      label: post.title,
      meta: `${DATE_FORMAT.format(post.date)} / ${post.listReadTime} min`,
      href: post.url,
      excerpt: post.excerpt,
      image: post.image ? { src: post.image.path, alt: post.image.alt ?? '' } : undefined,
      icon: iconFor(post),
    }));

    for (const signpost of signposts) {
      filling.push({
        ...place(home),
        id: `signpost-${region.id}-${signpost.slug}`,
        hub: region.id,
        ring: 0,
        kind: 'signpost',
        regionId: region.id,
        label: signpost.name,
        meta: `${signpost.count} ${signpost.count === 1 ? 'entry' : 'entries'}`,
        href: `/categories/${signpost.slug}/`,
        icon: 'signpost',
      });
    }

    if (overflows) {
      filling.push({
        ...place(home),
        id: `gate-${region.id}`,
        hub: region.id,
        ring: 0,
        kind: 'gate',
        regionId: region.id,
        label: `All ${region.name}`,
        meta: `${list.length} entries`,
        href: hrefFor(region, categories),
        icon: 'gate',
      });
    }

    /* Only as many tiles as there is something to put on them. A city with
       four entries is a hamlet; one with fifteen sprawls. */
    filling.forEach((cell, index) => {
      const at = slots[index];
      if (!at) return;
      put({ ...cell, ...place(at), ring: distance(at, city) });
    });

    /* A thin, ragged outskirt so a city is not a perfect flower. */
    for (const cell of ring(city, filling.length > 6 ? 3 : 2)) {
      if (noise(cell.q, cell.r) > 0.4) continue;
      put({
        ...place(cell),
        id: `edge-${cell.q}-${cell.r}`,
        hub: region.id,
        ring: distance(cell, city),
        kind: 'edge',
        regionId: region.id,
      });
    }

    const cityPoint = axialToPixel(city);
    info.push({
      ...region,
      count: list.length,
      x: Number(cityPoint.x.toFixed(2)),
      y: Number(cityPoint.y.toFixed(2)),
      href: hrefFor(region, categories),
      reads: list.slice(0, 3).map((post) => ({ title: post.title, href: post.url })),
    });
  }

  /* Scrub around home, thinned hard: enough to say the world continues. */
  for (const radius of [2, 3]) {
    for (const cell of ring(home, radius)) {
      if (noise(cell.q, cell.r) > (radius === 2 ? 0.5 : 0.22)) continue;
      put({
        ...place(cell),
        id: `edge-${cell.q}-${cell.r}`,
        hub: 'home',
        ring: radius,
        kind: 'edge',
      });
    }
  }

  return { cells, regions: info, routes };
}

/** The best real category page for a region, or the index if it has none. */
function hrefFor(region: Region, categories: Map<string, Post[]>): string {
  for (const name of region.matches) {
    if (categories.has(name)) return `/categories/${slugify(name)}/`;
  }
  return '/categories/';
}

/**
 * Second-level categories used by a region's posts, biggest first. These
 * become signposts on the city's outer ring, so a region can point at more of
 * the site than its own entries.
 */
function subcategoriesFor(
  posts: Post[],
  region: Region,
  categories: Map<string, Post[]>
): { name: string; slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const name of post.categories.slice(1)) {
      if (region.matches.includes(name)) continue;
      if (!categories.has(name)) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, slug: slugify(name), count }));
}

function place(cell: Axial) {
  const { x, y } = axialToPixel(cell);
  return { q: cell.q, r: cell.r, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
}
