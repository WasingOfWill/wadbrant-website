import { getHexMap, hexPoints, type HexCell } from '@/lib/hexmap';

/**
 * The homepage map.
 *
 * Milestone 1: geometry, terrain and hover only. No selection, no camera
 * movement, no side panel yet. Everything here is static markup, so the page
 * needs no JavaScript to paint.
 *
 * Tiles are SVG rather than clipped divs for three reasons: the hit area is
 * the real hexagon so neighbours never steal a hover, the camera can move the
 * whole grid with one transform, and the grid can run past the viewport
 * without overflow tricks.
 */

const POINTS = hexPoints();

/**
 * Region marks, drawn rather than set in a font. Font Awesome is a webfont
 * and referencing it from inside SVG means chasing codepoints; these are six
 * strokes on a 44 unit square and cost nothing.
 */
const MARKS: Record<string, string> = {
  home: 'M -16 2 L 0 -14 L 16 2 M -11 -2 L -11 15 L 11 15 L 11 -2',
  ai: 'M -14 8 L 14 8 M -14 8 L 0 -13 M 14 8 L 0 -13',
  gaming: 'M 0 -17 L 15 -8.5 L 15 8.5 L 0 17 L -15 8.5 L -15 -8.5 Z M 0 -17 L 15 8.5 L -15 8.5 Z',
  industry: 'M -18 14 L 18 14 M -14 14 L -14 -2 M 0 14 L 0 -14 M 14 14 L 14 -8',
  product: 'M -15 13 L 15 13 L -15 -13 Z M -15 5 L 6 5',
  business: 'M -16 10 L -5 -1 L 3 6 L 16 -10 M 16 -10 L 8 -10 M 16 -10 L 16 -2',
  misc: 'M 4 -12 L 14 -12 L 14 -2 L 4 -2 Z M -12 12 L -2 12 L -7 3 Z',
  article: 'M -8 -11 L 4 -11 L 9 -6 L 9 11 L -8 11 Z M 4 -11 L 4 -6 L 9 -6',
  gate: 'M -12 -9 L -2 0 L -12 9 M -1 -9 L 9 0 L -1 9',
};

/** Dots for the AI mark, which needs nodes as well as edges. */
const AI_NODES: [number, number][] = [
  [-14, 8],
  [14, 8],
  [0, -13],
];

function markFor(cell: HexCell): string | undefined {
  if (cell.kind === 'home') return MARKS.home;
  if (cell.kind === 'region') return MARKS[cell.regionId ?? ''];
  if (cell.kind === 'article') return MARKS.article;
  if (cell.kind === 'gate') return MARKS.gate;
  return undefined;
}

/**
 * Terrain fills. Each region gets its own so the pattern can be tinted from
 * CSS: `currentColor` inside a `<pattern>` resolves against the pattern, not
 * against whatever references it, so the ink comes from a rule on the id.
 */
function Terrain() {
  return (
    <defs>
      <pattern id="terrain-ai" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 0 12 H 9 M 15 12 H 24 M 12 0 V 9 M 12 15 V 24" />
        <circle cx="12" cy="12" r="2.2" />
      </pattern>
      <pattern id="terrain-gaming" width="26" height="30" patternUnits="userSpaceOnUse">
        <path d="M 13 4 L 20 8 L 20 16 L 13 20 L 6 16 L 6 8 Z" />
      </pattern>
      <pattern id="terrain-industry" width="28" height="18" patternUnits="userSpaceOnUse">
        <path d="M -2 13 Q 7 3 16 13 T 34 13" />
      </pattern>
      <pattern id="terrain-product" width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M 11 4 V 18 M 4 11 H 18" />
      </pattern>
      <pattern id="terrain-business" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M -4 20 L 20 -4 M 4 28 L 28 4" />
      </pattern>
      <pattern id="terrain-misc" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="1.6" />
        <circle cx="15" cy="15" r="1.6" />
      </pattern>
    </defs>
  );
}

function Tile({ cell }: { cell: HexCell }) {
  const mark = markFor(cell);
  const interactive = cell.kind !== 'edge' && cell.kind !== 'empty';

  return (
    <g
      className="hex"
      data-kind={cell.kind}
      data-region={cell.regionId}
      data-ring={cell.ring}
      transform={`translate(${cell.x} ${cell.y})`}
      style={{ ['--ring' as string]: cell.ring }}
    >
      <polygon className="hex-face" points={POINTS} />
      {cell.regionId && (
        <polygon className="hex-terrain" points={POINTS} fill={`url(#terrain-${cell.regionId})`} />
      )}
      <polygon className="hex-edge" points={POINTS} />
      {/* Marks ride above centre so a label can sit under them without
          reaching the part of the hexagon that narrows towards its vertex. */}
      {mark && (
        <g transform={cell.kind === 'region' || cell.kind === 'home' ? 'translate(0 -10)' : ''}>
          <path className="hex-mark" d={mark} />
          {cell.regionId === 'ai' &&
            cell.kind === 'region' &&
            AI_NODES.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} className="hex-mark-node" cx={cx} cy={cy} r="4" />
            ))}
        </g>
      )}
      {cell.kind === 'region' && (
        <text className="hex-label" y={30}>
          {cell.label}
        </text>
      )}
      {interactive && <title>{cell.label ?? cell.kind}</title>}
    </g>
  );
}

export default async function HexMap() {
  const { cells, regions } = await getHexMap();
  const articles = cells.filter((cell) => cell.kind === 'article');

  return (
    <div id="hexmap">
      {/* The ground is a CSS background, so it is only discovered once the
          stylesheet has parsed. Without this it fades in after the grid. */}
      <link rel="preload" as="image" href="/assets/images/website/map.jpg" />
      {/* The map is a picture to a screen reader. This is the same content as
          a list, and it is what a crawler follows. */}
      <nav id="main-content" className="hexmap-index" aria-label="Site map">
        <h1>Will Wadbrant</h1>
        <ul>
          {regions.map((region) => (
            <li key={region.id}>
              {region.name}: {region.blurb}
            </li>
          ))}
          {articles.map((cell) => (
            <li key={cell.id}>
              <a href={cell.href}>{cell.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="hexmap-camera" aria-hidden="true">
        <svg
          className="hexmap-canvas"
          viewBox="-620 -560 1240 1120"
          width="1240"
          height="1120"
          focusable="false"
        >
          <Terrain />
          {cells.map((cell) => (
            <Tile key={cell.id} cell={cell} />
          ))}
          {/* Where you are standing. It rings the tile rather than covering
              it, so the tile's own mark stays readable underneath. */}
          <g className="hex-pawn" transform="translate(0 0)">
            <circle className="hex-pawn-halo" r="34" />
            <circle className="hex-pawn-dot" cy="26" r="5" />
          </g>
        </svg>
      </div>
    </div>
  );
}
