/**
 * The homepage map.
 *
 * A pointy-top hex grid centred on a home tile. Six regions sit on ring 1,
 * one per compass direction. Everything further out belongs to whichever
 * region it points at, so each region owns a 60 degree wedge: two tiles on
 * ring 2 and three on ring 3, five article slots in all. Ring 4 is scenery
 * that runs off the edge of the screen.
 *
 * All of this is computed at build time. The map ships as finished markup.
 */
import { getAllPosts, type Post } from './posts';

export type Axial = { q: number; r: number };

export type Region = {
  id: string;
  name: string;
  /** Front matter categories that feed this region, best match first. */
  matches: string[];
  /** Font Awesome glyph class. */
  icon: string;
  /** One line shown when the region is selected. */
  blurb: string;
  direction: Axial;
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
    icon: 'fa-microchip',
    blurb: 'Building with models, and what survives contact with real users.',
    matches: ['AI'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    direction: { q: 1, r: -1 },
    icon: 'fa-dice-d20',
    blurb: 'Design, genre and why players do what they do.',
    matches: ['Gaming', 'Game Design', 'Games', 'Design'],
  },
  {
    id: 'industry',
    name: 'Industry',
    direction: { q: 1, r: 0 },
    icon: 'fa-tower-broadcast',
    blurb: 'What is happening to the business of making games.',
    matches: ['Industry', 'Game Industry', 'News'],
  },
  {
    id: 'product',
    name: 'Product',
    direction: { q: 0, r: 1 },
    icon: 'fa-compass-drafting',
    blurb: 'The craft: discovery, prioritisation, shipping, saying no.',
    matches: ['Product', 'Product Management', 'Feature'],
  },
  {
    id: 'business',
    name: 'Business',
    direction: { q: -1, r: 1 },
    icon: 'fa-chart-line',
    blurb: 'Monetisation, incentives, and where the money actually goes.',
    matches: ['Business', 'Strategy', 'Indie'],
  },
  {
    id: 'misc',
    name: 'Misc',
    direction: { q: -1, r: 0 },
    icon: 'fa-shapes',
    blurb: 'Everything that did not fit anywhere else.',
    matches: ['Misc', 'Other Things', 'Reflection', 'Other'],
  },
];

/**
 * Rings a region may claim, nearest first. How many it actually takes depends
 * on how much it has to show, so the six territories are different shapes and
 * different sizes. A region is as big as it has earned.
 */
const TERRITORY_RINGS = [2, 3, 4];

/** Smallest and largest territory, before any gate tile is added. */
const MIN_TERRITORY = 3;
const MAX_TERRITORY = 6;

/** Scenery rings: drawn, never interactive, run past the viewport. */
const EDGE_RINGS = [4, 5, 6];

/**
 * How much of each scenery ring survives. The frontier is meant to be ragged,
 * not a set of neat concentric outlines, and it thins as it goes.
 */
const EDGE_SURVIVAL: Record<number, number> = { 4: 0.88, 5: 0.62, 6: 0.34 };

export type HexKind = 'home' | 'region' | 'article' | 'gate' | 'empty' | 'edge';

export type HexCell = {
  id: string;
  q: number;
  r: number;
  /** Centre in SVG user units, origin at the home tile. */
  x: number;
  y: number;
  ring: number;
  kind: HexKind;
  regionId?: string;
  /** Position within the region's territory, nearest tile first. */
  slot?: number;
  label?: string;
  /** Secondary line: date and reading time for an article. */
  meta?: string;
  href?: string;
  excerpt?: string;
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

function ring(radius: number): Axial[] {
  if (radius === 0) return [{ q: 0, r: 0 }];
  const cells: Axial[] = [];
  let cell: Axial = { q: DIRS[4].q * radius, r: DIRS[4].r * radius };
  for (let side = 0; side < 6; side += 1) {
    for (let step = 0; step < radius; step += 1) {
      cells.push(cell);
      cell = { q: cell.q + DIRS[side].q, r: cell.r + DIRS[side].r };
    }
  }
  return cells;
}

/** Signed difference between two angles, normalised to -PI..PI. */
function angleDelta(a: number, b: number): number {
  let delta = a - b;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/**
 * Tiles on the boundary between two wedges sit at exactly 30 degrees from
 * both. Rotating every tile half a degree before matching breaks the tie the
 * same way every time, which keeps the layout stable between builds.
 */
const TIE_BREAK = (-0.5 * Math.PI) / 180;

function regionAngle(region: Region): number {
  const point = axialToPixel(region.direction);
  return Math.atan2(point.y, point.x);
}

function wedgeFor(cell: Axial): { region: Region; offset: number } {
  const point = axialToPixel(cell);
  const angle = Math.atan2(point.y, point.x) + TIE_BREAK;
  let best = REGIONS[0];
  let bestOffset = Infinity;
  for (const region of REGIONS) {
    const offset = Math.abs(angleDelta(angle, regionAngle(region)));
    if (offset < bestOffset) {
      bestOffset = offset;
      best = region;
    }
  }
  return { region: best, offset: bestOffset };
}

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

export type HexMapData = {
  cells: HexCell[];
  regions: (Region & { count: number })[];
};

/**
 * Deterministic value in 0..1 for a coordinate. Used to rough up the frontier.
 * It has to be a pure function of the coordinate, not a random number, or the
 * world would be a different shape on every build.
 */
function noise(q: number, r: number): number {
  const value = Math.sin(q * 127.1 + r * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/** How much land a region gets. More to show, more ground. */
function territorySize(postCount: number): number {
  return Math.max(MIN_TERRITORY, Math.min(postCount, MAX_TERRITORY));
}

/**
 * Builds the whole map. Territories are sized by how much each region has to
 * show, so the six are deliberately different shapes; a region with more posts
 * than land spends its last tile on a gate to the category index.
 */
export async function getHexMap(): Promise<HexMapData> {
  const posts = await getAllPosts();

  const byRegion = new Map<string, Post[]>(REGIONS.map((region) => [region.id, []]));
  for (const post of posts) {
    byRegion.get(regionForPost(post).id)?.push(post);
  }
  for (const list of byRegion.values()) {
    list.sort((a, b) => Number(b.pin) - Number(a.pin) || b.date.getTime() - a.date.getTime());
  }

  const candidates = new Map<string, Axial[]>(REGIONS.map((region) => [region.id, []]));
  for (const radius of TERRITORY_RINGS) {
    for (const cell of ring(radius)) {
      candidates.get(wedgeFor(cell).region.id)?.push(cell);
    }
  }
  for (const [id, wedge] of candidates) {
    const region = REGIONS.find((candidate) => candidate.id === id)!;
    wedge.sort((a, b) => {
      const ringDelta = distance(a) - distance(b);
      if (ringDelta !== 0) return ringDelta;
      return wedgeAngleOffset(a, region) - wedgeAngleOffset(b, region);
    });
  }

  const cells: HexCell[] = [];
  const claimed = new Set<string>();

  cells.push({
    ...place({ q: 0, r: 0 }),
    id: 'home',
    ring: 0,
    kind: 'home',
    label: 'Will Wadbrant',
    meta: 'Product manager',
  });

  for (const region of REGIONS) {
    const posts = byRegion.get(region.id) ?? [];
    cells.push({
      ...place(region.direction),
      id: `region-${region.id}`,
      ring: 1,
      kind: 'region',
      regionId: region.id,
      label: region.name,
      meta: `${posts.length} ${posts.length === 1 ? 'entry' : 'entries'}`,
    });

    const wedge = candidates.get(region.id) ?? [];
    const overflows = posts.length > territorySize(posts.length);
    const slots = wedge.slice(0, territorySize(posts.length) + (overflows ? 1 : 0));
    const shown = overflows ? posts.slice(0, slots.length - 1) : posts;

    slots.forEach((cell, slot) => {
      claimed.add(`${cell.q},${cell.r}`);
      const post = shown[slot];
      if (post) {
        cells.push({
          ...place(cell),
          id: `post-${post.slug}`,
          ring: distance(cell),
          kind: 'article',
          regionId: region.id,
          slot,
          label: post.title,
          meta: `${DATE_FORMAT.format(post.date)} / ${post.listReadTime} min`,
          href: post.url,
          excerpt: post.excerpt,
        });
        return;
      }
      const isGate = overflows && slot === slots.length - 1;
      cells.push({
        ...place(cell),
        id: `${region.id}-slot-${slot}`,
        ring: distance(cell),
        kind: isGate ? 'gate' : 'empty',
        regionId: region.id,
        slot,
        label: isGate ? `All ${region.name}` : undefined,
        meta: isGate ? `${posts.length} entries` : undefined,
        href: isGate ? '/categories/' : undefined,
      });
    });
  }

  for (const radius of EDGE_RINGS) {
    for (const cell of ring(radius)) {
      if (claimed.has(`${cell.q},${cell.r}`)) continue;
      if (noise(cell.q, cell.r) > EDGE_SURVIVAL[radius]) continue;
      cells.push({
        ...place(cell),
        id: `edge-${cell.q}-${cell.r}`,
        ring: radius,
        kind: 'edge',
      });
    }
  }

  return {
    cells,
    regions: REGIONS.map((region) => ({
      ...region,
      count: byRegion.get(region.id)?.length ?? 0,
    })),
  };
}

function place(cell: Axial) {
  const { x, y } = axialToPixel(cell);
  return { q: cell.q, r: cell.r, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
}

/** Ring index of a cell, which is its cube distance from home. */
function distance({ q, r }: Axial): number {
  return (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
}

function wedgeAngleOffset(cell: Axial, region: Region): number {
  const point = axialToPixel(cell);
  return Math.abs(angleDelta(Math.atan2(point.y, point.x) + TIE_BREAK, regionAngle(region)));
}
