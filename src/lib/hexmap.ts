/**
 * The homepage map.
 *
 * A pointy-top hex grid built as a set of settlements rather than one blob.
 * Home sits at the origin with six gateway tiles around it and a handful of
 * featured clusters in the gaps between the roads. Each gateway has a city out
 * on the map in the same direction, and a city may in turn have outposts for
 * its subcategories, one road further on. Empty terrain is scattered over the
 * whole thing in clumps, the way a mountain range sits on a game map.
 *
 * Distances, skews and shapes are all deliberately uneven. Nothing here is
 * symmetrical on purpose; it should read as places on a map, not as a menu
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
    blurb:
      'Using it and building with it: ways of working, what is actually changing, and what survives contact with real users.',
    matches: ['AI'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    direction: { q: 1, r: -1 },
    distance: 7,
    skew: -1,
    blurb: 'Game design, and the projects that came out of caring about it.',
    matches: ['Gaming'],
  },
  {
    id: 'ongoing',
    name: 'Ongoing',
    direction: { q: 1, r: 0 },
    distance: 9,
    skew: 0,
    blurb: 'What is happening out there in the industry, and what I make of it.',
    matches: ['Ongoing'],
  },
  {
    id: 'product',
    name: 'Product',
    direction: { q: 0, r: 1 },
    distance: 7,
    skew: 1,
    blurb: 'The craft of product management: discovery, prioritisation, shipping, saying no.',
    matches: ['Product'],
  },
  {
    id: 'projects',
    name: 'Projects',
    direction: { q: -1, r: 1 },
    distance: 8,
    skew: -1,
    blurb: 'Things I have built, how they were run, and how they went.',
    matches: ['Projects'],
  },
  {
    id: 'misc',
    name: 'Misc',
    direction: { q: -1, r: 0 },
    distance: 8,
    skew: 1,
    blurb: 'Opinions and odds and ends that belong nowhere else.',
    matches: ['Misc'],
  },
];

/** At most this many subcategory outposts around a city. */
const MAX_OUTPOSTS = 3;

/** How far an outpost sits from its city. */
const OUTPOST_DISTANCE = 4;

/**
 * Clusters of recent work, newest first. They sit out past a gap rather than
 * touching the camp, so they read as their own places and not as more of the
 * home settlement, and they seed in the gaps between the roads because that is
 * the ground the roads do not use.
 *
 * The four directions are chosen to stay on screen: up, up and right, down and
 * right, down. Nothing seeds to the left, which is where the sidebar sits.
 */
const FEATURED: { badge: string; cells: Axial[] }[] = [
  { badge: 'New', cells: [{ q: 2, r: -4 }, { q: 3, r: -4 }] },
  { badge: 'New', cells: [{ q: 4, r: -3 }, { q: 4, r: -2 }] },
  {
    badge: 'Featured',
    cells: [
      { q: 3, r: 1 },
      { q: 2, r: 2 },
      { q: 1, r: 3 },
      { q: 2, r: 3 },
      { q: 1, r: 4 },
    ],
  },
  { badge: 'Recommended', cells: [{ q: -3, r: 4 }, { q: -2, r: 4 }, { q: -1, r: 4 }] },
];

/** Nothing may be laid closer than this. Rings 2 and 3 are the gap. */
const FEATURED_NEAR = 4;

export type HexKind =
  | 'home'
  | 'gateway'
  | 'city'
  | 'outpost'
  | 'article'
  | 'signpost'
  | 'gate'
  | 'return'
  | 'trail'
  | 'edge'
  | 'wild';

export type HexCell = {
  id: string;
  q: number;
  r: number;
  /** Centre in SVG user units, origin at the home tile. */
  x: number;
  y: number;
  /** Which settlement this tile belongs to. */
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
  /** Settlement this tile travels to when picked. */
  travelTo?: string;
  /** Degrees to turn the mark by, so an arrow can point at where it leads. */
  rotate?: number;
};

/** A label floating over a cluster of recent work, in map coordinates. */
export type Cluster = { badge: string; x: number; y: number };

/** The newest post, given its own card above the readout at home. */
export type Latest = {
  title: string;
  href: string;
  meta: string;
  excerpt: string;
  image?: { src: string; alt: string };
};

export type Settlement = { id: string; x: number; y: number };

export type RegionInfo = Region & {
  count: number;
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
  /** One road per journey, as an SVG path between two settlements. */
  routes: { id: string; d: string }[];
  /** Where the camera sits for each settlement. */
  settlements: Settlement[];
  /** Labels floating over the clusters of recent work. */
  clusters: Cluster[];
  /** The newest post, or nothing at all if there are none. */
  latest?: Latest;
  /** Every published post, for the map's text alternative. */
  index: { title: string; href: string }[];
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

const add = (a: Axial, b: Axial): Axial => ({ q: a.q + b.q, r: a.r + b.r });
const scale = (a: Axial, by: number): Axial => ({ q: a.q * by, r: a.r * by });
const key = ({ q, r }: Axial): string => `${q},${r}`;

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
 * Deterministic value in 0..1 for a coordinate. Used to rough up the world.
 * It has to be a pure function of the coordinate, not a random number, or the
 * map would be a different shape on every build.
 */
function noise(q: number, r: number): number {
  const value = Math.sin(q * 127.1 + r * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * The same hash sampled on a coarser lattice, so neighbouring tiles share a
 * value and the result comes out in clumps rather than as static.
 */
function clump(cell: Axial, size: number): number {
  return noise(Math.floor(cell.q / size), Math.floor(cell.r / size));
}

/** Angle from one tile to another, in degrees, for pointing a mark. */
function bearing(from: Axial, to: Axial): number {
  const a = axialToPixel(from);
  const b = axialToPixel(to);
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
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

const HOME: Axial = { q: 0, r: 0 };

export async function getHexMap(): Promise<HexMapData> {
  const posts = await getAllPosts();
  const categories = await getCategories();

  const newest = (a: Post, b: Post) =>
    Number(b.pin) - Number(a.pin) || b.date.getTime() - a.date.getTime();

  const byRegion = new Map<string, Post[]>(REGIONS.map((region) => [region.id, []]));
  for (const post of posts) byRegion.get(regionForPost(post).id)?.push(post);
  for (const list of byRegion.values()) list.sort(newest);

  const cells: HexCell[] = [];
  const taken = new Set<string>();
  const routes: { id: string; d: string }[] = [];
  const settlements: Settlement[] = [{ id: 'home', x: 0, y: 0 }];
  const info: RegionInfo[] = [];

  const free = (cell: Axial) => !taken.has(key(cell));
  const put = (cell: HexCell) => {
    if (taken.has(`${cell.q},${cell.r}`)) return false;
    taken.add(`${cell.q},${cell.r}`);
    cells.push(cell);
    return true;
  };

  const entry = (post: Post, id: string, hub: string, regionId: string): HexCell => ({
    ...place(HOME),
    id,
    hub,
    ring: 0,
    kind: 'article',
    regionId,
    label: post.title,
    meta: `${DATE_FORMAT.format(post.date)} / ${post.listReadTime} min`,
    href: post.url,
    excerpt: post.excerpt,
    image: post.image ? { src: post.image.path, alt: post.image.alt ?? '' } : undefined,
    icon: iconFor(post),
  });

  put({ ...place(HOME), id: 'home', hub: 'home', ring: 0, kind: 'home', label: 'Home' });

  /* Gateways first, so nothing else can take a tile next to home. */
  const gateways = new Map<string, Axial>();
  for (const region of REGIONS) {
    gateways.set(region.id, region.direction);
    put({
      ...place(region.direction),
      id: `gateway-${region.id}`,
      hub: 'home',
      ring: 1,
      kind: 'gateway',
      regionId: region.id,
      label: region.name,
      icon: region.id,
      travelTo: region.id,
    });
  }

  /* Ground for the clusters is claimed before anything else is laid. A road
     or an outskirt reaching one of these cells would take it, and the entry
     that belonged there would vanish with nothing to say so. */
  for (const cluster of FEATURED) for (const cell of cluster.cells) taken.add(key(cell));

  /* City centres. Distance and skew differ per region so the six are not a
     star, and the roads out of home do not all look like the same road. */
  const cities = new Map<string, Axial>();
  for (const [index, region] of REGIONS.entries()) {
    cities.set(
      region.id,
      add(scale(region.direction, region.distance), scale(DIRS[(index + 1) % 6], region.skew))
    );
  }

  /** Lays a road and, at its far end, the tile that leads back down it. */
  const road = (
    id: string,
    from: Axial,
    to: Axial,
    hub: string,
    regionId: string,
    backTo: string
  ) => {
    const run = line(from, to);
    const points = run.map((cell) => {
      const { x, y } = axialToPixel(cell);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    routes.push({ id, d: `M ${points.join(' L ')}` });

    /* The last tile before the destination is the way back, so it is both the
       end of the road and the return marker: laying a separate one there would
       land on an occupied cell and quietly disappear. */
    for (const cell of run.slice(1, -2)) {
      put({
        ...place(cell),
        id: `trail-${cell.q}-${cell.r}`,
        hub,
        ring: 0,
        kind: 'trail',
        regionId,
      });
    }
    const back = run[run.length - 2];
    put({
      ...place(back),
      id: `return-${hub}`,
      hub,
      ring: 1,
      kind: 'return',
      regionId,
      label: 'Back to home',
      icon: 'return',
      rotate: bearing(back, run[0]),
      travelTo: backTo,
    });
  };

  for (const [index, region] of REGIONS.entries()) {
    const city = cities.get(region.id)!;
    const list = byRegion.get(region.id) ?? [];
    const cityPoint = axialToPixel(city);
    settlements.push({
      id: region.id,
      x: Number(cityPoint.x.toFixed(2)),
      y: Number(cityPoint.y.toFixed(2)),
    });

    road(region.id, gateways.get(region.id)!, city, region.id, region.id, 'home');

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

    /* Outposts for the region's subcategories, one road further out. Each is
       a small settlement holding that subcategory's entries. Ground is
       reserved now so the city's own tiles cannot take it. */
    const subs = subcategoriesFor(list, region, categories).slice(0, MAX_OUTPOSTS);
    const outposts: { sub: (typeof subs)[number]; at: Axial }[] = [];
    for (const [order, sub] of subs.entries()) {
      const at = findOutpost(city, index, order, free);
      if (!at) continue;
      outposts.push({ sub, at });
      taken.add(key(at));
    }

    const signposts: HexCell[] = outposts.map(({ sub, at }) => ({
      ...place(HOME),
      id: `signpost-${region.id}-${sub.slug}`,
      hub: region.id,
      ring: 0,
      kind: 'signpost',
      regionId: region.id,
      label: sub.name,
      meta: `${sub.count} ${sub.count === 1 ? 'entry' : 'entries'}`,
      href: `/categories/${sub.slug}/`,
      icon: 'signpost',
      travelTo: `${region.id}-${sub.slug}`,
    }));

    /* Ring 1 first, then ring 2, swept by angle so the newest work sits
       closest to the city. Anything already taken is skipped, so no entry can
       be dropped on the floor. */
    const slots = [
      ...ring(city, 1).sort((a, b) => angleOf(a, city) - angleOf(b, city)),
      ...ring(city, 2).sort((a, b) => angleOf(a, city) - angleOf(b, city)),
    ].filter(free);

    const room = slots.length - signposts.length;
    const overflows = list.length > room;
    const shown = overflows ? list.slice(0, room - 1) : list;

    const filling: HexCell[] = [
      ...shown.map((post) => entry(post, `post-${post.slug}`, region.id, region.id)),
      ...signposts,
    ];
    if (overflows) {
      filling.push({
        ...place(HOME),
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

    filling.forEach((cell, slot) => {
      const at = slots[slot];
      if (!at) return;
      put({ ...cell, ...place(at), ring: distance(at, city) });
    });

    /* Now the outposts themselves, each with its own road back to the city. */
    for (const { sub, at } of outposts) {
      const id = `${region.id}-${sub.slug}`;
      const point = axialToPixel(at);
      settlements.push({ id, x: Number(point.x.toFixed(2)), y: Number(point.y.toFixed(2)) });

      /* The centre was reserved above; release it so the road can run right up
         to it, then claim it back as the outpost. */
      taken.delete(key(at));
      road(id, city, at, id, region.id, region.id);

      put({
        ...place(at),
        id: `outpost-${id}`,
        hub: id,
        ring: 0,
        kind: 'outpost',
        regionId: region.id,
        label: sub.name,
        meta: `${sub.count} ${sub.count === 1 ? 'entry' : 'entries'}`,
        href: `/categories/${sub.slug}/`,
        icon: 'signpost',
      });

      const held = list.filter((post) => post.categories.includes(sub.name));
      ring(at, 1)
        .filter(free)
        .sort((a, b) => angleOf(a, at) - angleOf(b, at))
        .forEach((cell, slot) => {
          const post = held[slot];
          if (!post) return;
          put({
            ...entry(post, `sub-${sub.slug}-${post.slug}`, id, region.id),
            ...place(cell),
            ring: 1,
          });
        });

      outskirts(at, 2, id, region.id, put, 0.34);
    }

    outskirts(city, list.length > 6 ? 3 : 2, region.id, region.id, put, 0.4);

    info.push({
      ...region,
      count: list.length,
      x: Number(cityPoint.x.toFixed(2)),
      y: Number(cityPoint.y.toFixed(2)),
      href: hrefFor(region, categories),
      reads: list.slice(0, 3).map((post) => ({ title: post.title, href: post.url })),
    });
  }

  /* Recent work, in clusters out past a gap from the camp. The shapes are
     written down rather than grown, because where they sit has to hold against
     the readout on one side and the sidebar on the other, and a grown blob
     wanders under both. */
  const recent = [...posts].sort(newest);
  const clusters: Cluster[] = [];
  let next = 0;
  for (const cluster of FEATURED) {
    const laid: Axial[] = [];
    for (const cell of cluster.cells) {
      taken.delete(key(cell));
      if (distance(cell, HOME) < FEATURED_NEAR) continue;
      const post = recent[next];
      if (!post) break;
      next += 1;
      put({
        ...entry(post, `featured-${post.slug}`, 'home', regionForPost(post).id),
        ...place(cell),
        ring: distance(cell, HOME),
      });
      laid.push(cell);
    }
    if (laid.length === 0) continue;

    /* The label floats above the cluster rather than sitting on a tile, so it
       is readable at any size and belongs to the group, not to one entry. */
    const points = laid.map((cell) => axialToPixel(cell));
    clusters.push({
      badge: cluster.badge,
      x: Number((points.reduce((sum, at) => sum + at.x, 0) / points.length).toFixed(1)),
      y: Number((Math.min(...points.map((at) => at.y)) - 52).toFixed(1)),
    });

    /* A faded road across the gap, so the cluster reads as somewhere the camp
       connects to rather than as an island. */
    const track = line(HOME, cluster.cells[0]);
    const along = track.map((cell) => {
      const at = axialToPixel(cell);
      return `${at.x.toFixed(1)},${at.y.toFixed(1)}`;
    });
    routes.push({
      id: `to-${cluster.badge.toLowerCase()}-${clusters.length}`,
      d: `M ${along.join(' L ')}`,
    });
    for (const cell of track) {
      const out = distance(cell, HOME);
      if (out < 2 || out >= FEATURED_NEAR || !free(cell)) continue;
      put({ ...place(cell), id: `track-${cell.q}-${cell.r}`, hub: 'home', ring: out, kind: 'trail' });
    }
  }

  /* Empty ground. Clumped rather than scattered, so it reads as ranges and
     thickets instead of static, and thinning as it goes out. */
  for (let q = -18; q <= 18; q += 1) {
    for (let r = Math.max(-18, -q - 18); r <= Math.min(18, -q + 18); r += 1) {
      const cell = { q, r };
      const out = distance(cell, HOME);
      if (out < 2 || out > 18 || !free(cell)) continue;
      if (clump(cell, 3) * 0.6 + clump(cell, 6) * 0.4 < 0.62 + out * 0.006) continue;
      if (noise(q, r) > 0.62) continue;
      put({
        ...place(cell),
        id: `wild-${q}-${r}`,
        hub: 'wild',
        ring: out,
        kind: 'wild',
        icon: clump(cell, 6) > 0.66 ? 'range' : undefined,
      });
    }
  }

  return {
    cells,
    regions: info,
    routes,
    settlements,
    clusters,
    latest: recent[0] && {
      title: recent[0].title,
      href: recent[0].url,
      meta: `${DATE_FORMAT.format(recent[0].date)} / ${recent[0].listReadTime} min`,
      excerpt: recent[0].excerpt,
      image: recent[0].image
        ? { src: recent[0].image.path, alt: recent[0].image.alt ?? '' }
        : undefined,
    },
    index: posts.map((post) => ({ title: post.title, href: post.url })),
  };
}

/** A thin, ragged outskirt so a settlement is not a perfect flower. */
function outskirts(
  centre: Axial,
  radius: number,
  hub: string,
  regionId: string,
  put: (cell: HexCell) => boolean,
  survival: number
) {
  for (const cell of ring(centre, radius)) {
    if (noise(cell.q, cell.r) > survival) continue;
    put({
      ...place(cell),
      id: `edge-${cell.q}-${cell.r}`,
      hub,
      ring: radius,
      kind: 'edge',
      regionId,
    });
  }
}

/**
 * Somewhere to put an outpost: a free cell a short way off the city, tried in
 * a few directions so two outposts of the same city do not sit on top of each
 * other. Returns nothing if the ground is full, and the subcategory then stays
 * a plain link rather than a place.
 */
function findOutpost(
  city: Axial,
  regionIndex: number,
  order: number,
  free: (cell: Axial) => boolean
): Axial | undefined {
  const offsets = [2, 4, 1, 5, 3];
  for (let attempt = 0; attempt < offsets.length; attempt += 1) {
    const side = DIRS[(regionIndex + offsets[(order + attempt) % offsets.length]) % 6];
    const at = add(city, scale(side, OUTPOST_DISTANCE));
    if (free(at) && ring(at, 1).filter(free).length >= 4) return at;
  }
  return undefined;
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
 * become outposts around the city, so a region can point at more of the site
 * than its own entries.
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
