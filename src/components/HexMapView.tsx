'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Cluster, HexCell, Latest, RegionInfo, Settlement } from '@/lib/hexmap';
import HexSearch from './HexSearch';

type Props = {
  cells: HexCell[];
  regions: RegionInfo[];
  routes: { id: string; d: string }[];
  settlements: Settlement[];
  clusters: Cluster[];
  latest?: Latest;
  /** Precomputed hexagon outline, so this file never imports the server lib. */
  points: string;
};

/**
 * Every mark on the map, drawn rather than set in a font. Font Awesome is a
 * webfont and referencing it from inside SVG means chasing codepoints; these
 * are strokes on a 44 unit square and cost nothing.
 */
const MARKS: Record<string, string> = {
  home: 'M -16 2 L 0 -14 L 16 2 M -11 -2 L -11 15 L 11 15 L 11 -2',

  ai: 'M -14 8 L 14 8 M -14 8 L 0 -13 M 14 8 L 0 -13',
  gaming: 'M 0 -17 L 15 -8.5 L 15 8.5 L 0 17 L -15 8.5 L -15 -8.5 Z M 0 -17 L 15 8.5 L -15 8.5 Z',
  ongoing: 'M 0 16 V 3 M -8 -2 A 11 11 0 0 1 8 -2 M -15 -8 A 21 21 0 0 1 15 -8 M 0 3 A 3 3 0 1 0 0 2.9',
  product: 'M -15 13 L 15 13 L -15 -13 Z M -15 5 L 6 5',
  projects: 'M -15 14 H 15 M -13 14 V 2 H -3 V 14 M 3 14 V -4 H 13 V 14 M -8 -2 V -13 H 2 V -2',
  misc: 'M 4 -12 L 14 -12 L 14 -2 L 4 -2 Z M -12 12 L -2 12 L -7 3 Z',

  /* Drawn pointing right, because it is turned by a bearing measured from
     due east. Redraw it facing any other way and every arrow lies. */
  return: 'M -13 0 L 9 0 M 1 -9 L 10 0 L 1 9',
  gate: 'M -12 -9 L -2 0 L -12 9 M -1 -9 L 9 0 L -1 9',
  signpost: 'M 0 14 V -11 M -13 -11 H 8 L 13 -6 L 8 -1 H -13 Z',
  unknown: 'M -6 -5 A 6 6 0 1 1 0 3 M 0 10 L 0 10.5',
  /* Empty ground. Never a control, only somewhere the world carries on. */
  range: 'M -20 8 L -9 -6 L -1 4 L 6 -8 L 20 8 M -4 -1 L -1 4 L 3 -1',

  /* Article marks, chosen from tags and title. See ICON_RULES in hexmap.ts. */
  book: 'M -11 -11 H 1 V 11 H -11 Z M 1 -11 L 11 -8 V 14 L 1 11',
  coins:
    'M -11 -3 A 8 8 0 1 1 5 -3 A 8 8 0 1 1 -11 -3 M -4 5 A 8 8 0 1 1 12 5 A 8 8 0 1 1 -4 5',
  compass: 'M 0 -12 A 12 12 0 1 1 0 12 A 12 12 0 1 1 0 -12 M -5 5 L 0 -7 L 5 5 L 0 2 Z',
  lens: 'M -11 -3 A 8 8 0 1 1 5 -3 A 8 8 0 1 1 -11 -3 M 3 3 L 12 12',
  chip: 'M -8 -8 H 8 V 8 H -8 Z M -13 -4 H -8 M -13 4 H -8 M 8 -4 H 13 M 8 4 H 13 M -4 -13 V -8 M 4 -13 V -8 M -4 8 V 13 M 4 8 V 13',
  scales: 'M 0 -13 V 11 M -11 11 H 11 M -10 -8 H 10 M -10 -8 L -14 -1 A 4 4 0 0 0 -6 -1 Z M 10 -8 L 6 -1 A 4 4 0 0 0 14 -1 Z',
  warning: 'M 0 -13 L 13 11 H -13 Z M 0 -5 V 2 M 0 6 V 6.5',
  flask: 'M -4 -12 V -2 L -11 11 H 11 L 4 -2 V -12 M -7 -12 H 7 M -8 4 H 8',
  nib: 'M 11 -12 L -5 4 L -10 13 L -1 8 L 13 -8 Z M -5 4 L -1 8',
  sprout:
    'M 0 13 V -1 M 0 -1 C -10 -1 -12 -9 -12 -12 C -5 -12 -1 -8 0 -1 M 0 -1 C 8 -2 11 -7 11 -11 C 4 -11 1 -7 0 -1',
  target: 'M 0 -12 A 12 12 0 1 1 0 12 A 12 12 0 1 1 0 -12 M 0 -5 A 5 5 0 1 1 0 5 A 5 5 0 1 1 0 -5',
  chart: 'M -12 12 H 12 M -8 8 V -2 M -1 8 V -10 M 6 8 V 2',
  signal: 'M 0 12 V 2 M -6 -3 A 8 8 0 0 1 6 -3 M -11 -8 A 15 15 0 0 1 11 -8 M 0 2 A 2 2 0 1 0 0 1.9',
};

const AI_NODES: [number, number][] = [
  [-14, 8],
  [14, 8],
  [0, -13],
];

/** How far a tap may move before it counts as a drag instead. */
const TAP_SLOP = 7;

/** Friction applied to the throw each frame, and the speed it stops at. */
const DRAG_FRICTION = 0.92;
const DRAG_REST = 0.05;

/** The map may be pulled a quarter of the window in any direction. */
const DRAG_LIMIT = 0.25;

/** How long the camera takes to reach a city and the road to draw itself. */
const TRAVEL_MS = 900;

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

function markFor(cell: HexCell, known: boolean): string | undefined {
  if (cell.kind === 'home') return MARKS.home;
  if (cell.kind === 'trail' || cell.kind === 'edge') return undefined;
  if (cell.kind === 'wild') return MARKS[cell.icon ?? ''];
  if (!known) return MARKS.unknown;
  return MARKS[cell.icon ?? ''] ?? MARKS.book;
}

export default function HexMapView({
  cells,
  regions,
  routes,
  settlements,
  clusters,
  latest,
  points,
}: Props) {
  /** Which settlement you are standing in: 'home' or a region id. */
  const [place, setPlace] = useState('home');
  const [selectedId, setSelectedId] = useState('home');
  const [travelling, setTravelling] = useState('');

  /* The pointer handlers are memoised, so anything they read from state has to
     come through a ref or they judge every tap against the first render. */
  const placeRef = useRef(place);
  placeRef.current = place;

  const byId = useMemo(() => new Map(cells.map((cell) => [cell.id, cell])), [cells]);
  const regionById = useMemo(
    () => new Map(regions.map((region) => [region.id, region])),
    [regions]
  );
  const hubs = useMemo(
    () => new Map(settlements.map((at) => [at.id, { x: at.x, y: at.y }])),
    [settlements]
  );

  const roads = useMemo(() => new Set(routes.map((route) => route.id)), [routes]);

  /* Arriving somewhere selects its centre tile. */
  const anchors = useMemo(() => {
    const map = new Map<string, string>([['home', 'home']]);
    for (const cell of cells) {
      if (cell.kind === 'city' || cell.kind === 'outpost') map.set(cell.hub, cell.id);
    }
    return map;
  }, [cells]);

  const selected = byId.get(selectedId) ?? byId.get('home')!;
  const hub = hubs.get(place) ?? { x: 0, y: 0 };

  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef({
    active: false,
    pointer: -1,
    fromX: 0,
    fromY: 0,
    baseX: 0,
    baseY: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    at: 0,
    moved: 0,
    /* Which tile the press started on. Once the pointer is captured every
       later event retargets to the capturing element, so reading the tile at
       pointerup would always come back empty. */
    target: '',
  });

  /* The throw is written straight to CSS variables. Routing sixty frames a
     second through React state would re-render every tile for nothing. */
  const paint = useCallback(() => {
    const node = root.current;
    if (!node) return;
    node.style.setProperty('--drag-x', `${drag.current.x.toFixed(1)}px`);
    node.style.setProperty('--drag-y', `${drag.current.y.toFixed(1)}px`);
  }, []);

  const limits = useCallback(
    () => ({ x: window.innerWidth * DRAG_LIMIT, y: window.innerHeight * DRAG_LIMIT }),
    []
  );

  const glide = useCallback(() => {
    const state = drag.current;
    const bounds = limits();
    const step = () => {
      state.vx *= DRAG_FRICTION;
      state.vy *= DRAG_FRICTION;
      state.x = clamp(state.x + state.vx * 16, bounds.x);
      state.y = clamp(state.y + state.vy * 16, bounds.y);
      paint();
      if (Math.abs(state.vx) > DRAG_REST || Math.abs(state.vy) > DRAG_REST) {
        frame.current = requestAnimationFrame(step);
      }
    };
    frame.current = requestAnimationFrame(step);
  }, [limits, paint]);

  /** Travelling recentres the camera, so any leftover drag has to be let go. */
  const settle = useCallback(() => {
    cancelAnimationFrame(frame.current);
    Object.assign(drag.current, { x: 0, y: 0, vx: 0, vy: 0 });
    paint();
  }, [paint]);

  const goHome = useCallback(() => {
    settle();
    setPlace('home');
    setSelectedId('home');
  }, [settle]);


  /**
   * Any tile you can see, you can go to. A tile that leads somewhere takes you
   * there; anything else takes you to the settlement it belongs to and then
   * opens. Only scenery is inert.
   */
  const choose = useCallback(
    (id: string) => {
      const cell = byId.get(id);
      if (!cell) return;
      if (cell.kind === 'edge' || cell.kind === 'trail' || cell.kind === 'wild') return;

      const here = placeRef.current;
      const arriving = cell.travelTo ?? cell.hub;
      const target = cell.travelTo ? (anchors.get(arriving) ?? 'home') : id;

      if (arriving === here) {
        setSelectedId(target);
        return;
      }

      /* Roads are named for where they lead, so travelling outwards draws the
         road you are taking and travelling back draws the one you are on. */
      const outward = roads.has(arriving) && !here.startsWith(`${arriving}-`);
      settle();
      setTravelling(outward ? arriving : here);
      setPlace(arriving);
      setSelectedId(target);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setTravelling(''), TRAVEL_MS);
    },
    [anchors, byId, roads, settle]
  );

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    cancelAnimationFrame(frame.current);
    const state = drag.current;
    state.active = true;
    state.pointer = event.pointerId;
    state.fromX = event.clientX;
    state.fromY = event.clientY;
    state.baseX = state.x;
    state.baseY = state.y;
    state.vx = 0;
    state.vy = 0;
    state.at = event.timeStamp;
    state.moved = 0;
    state.target = (event.target as Element).closest?.('.hex')?.getAttribute('data-id') ?? '';
    root.current?.setAttribute('data-dragging', '');
    /* A pointer the browser is not tracking, which a synthetic event is,
       cannot be captured. Dragging still works; the capture is only there to
       keep a real drag alive past the edge of the element. */
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      /* not a real pointer */
    }
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const state = drag.current;
      if (!state.active || state.pointer !== event.pointerId) return;
      const bounds = limits();
      const dx = event.clientX - state.fromX;
      const dy = event.clientY - state.fromY;
      state.moved = Math.max(state.moved, Math.hypot(dx, dy));

      const next = { x: clamp(state.baseX + dx, bounds.x), y: clamp(state.baseY + dy, bounds.y) };
      const elapsed = Math.max(1, event.timeStamp - state.at);
      state.vx = (next.x - state.x) / elapsed;
      state.vy = (next.y - state.y) / elapsed;
      state.at = event.timeStamp;
      state.x = next.x;
      state.y = next.y;
      paint();
    },
    [limits, paint]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const state = drag.current;
      if (!state.active || state.pointer !== event.pointerId) return;
      state.active = false;
      root.current?.removeAttribute('data-dragging');

      if (state.moved < TAP_SLOP) {
        if (state.target) choose(state.target);
        return;
      }
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) glide();
    },
    [choose, glide]
  );

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(timer.current);
    },
    []
  );

  return (
    <div
      id="hexmap"
      ref={root}
      data-place={place}
      data-travelling={travelling || undefined}
      style={{ ['--focus-x' as string]: `${-hub.x}px`, ['--focus-y' as string]: `${-hub.y}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          goHome();
          return;
        }
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const id = (event.target as Element).closest?.('.hex')?.getAttribute('data-id');
        if (!id) return;
        event.preventDefault();
        choose(id);
      }}
    >
      <div className="hexmap-ground" aria-hidden="true" />

      <div className="hexmap-camera">
        <svg
          className="hexmap-canvas"
          viewBox="-1500 -1500 3000 3000"
          width="3000"
          height="3000"
          focusable="false"
          aria-hidden="true"
        >
          <Terrain />
          {routes.map((route) => (
            <g key={route.id} data-region={route.id}>
              <path className="hex-route" data-here={place === route.id ? '' : undefined} d={route.d} />
              {/* pathLength normalises the dash maths, so one keyframe wipes
                  any road no matter how long it is. */}
              <path
                className="hex-route-draw"
                data-drawing={travelling === route.id ? '' : undefined}
                pathLength={1}
                d={route.d}
              />
            </g>
          ))}
          {cells.map((cell) => (
            <Tile
              key={cell.id}
              cell={cell}
              points={points}
              active={cell.hub === place}
              selected={cell.id === selectedId}
            />
          ))}
          {/* Cluster labels are their own layer, so they float over the map
              instead of being trapped inside one tile's box. */}
          {clusters.map((cluster) => (
            <g className="hex-cluster" key={cluster.badge + cluster.x}>
              <text className="hex-cluster-label" x={cluster.x} y={cluster.y}>
                {cluster.badge}
              </text>
              <line
                className="hex-cluster-rule"
                x1={cluster.x - 26}
                y1={cluster.y + 13}
                x2={cluster.x + 26}
                y2={cluster.y + 13}
              />
            </g>
          ))}

          <g className="hex-pawn" transform={`translate(${selected.x} ${selected.y})`}>
            <circle className="hex-pawn-halo" r="34" />
            <circle className="hex-pawn-dot" cy="-44" r="5" />
          </g>
        </svg>
      </div>

      <HexSearch />

      <Panel
        cell={selected}
        region={selected.regionId ? regionById.get(selected.regionId) : undefined}
        atHome={place === 'home'}
        latest={selected.kind === 'home' ? latest : undefined}
        onLeave={goHome}
      />
    </div>
  );
}

function Tile({
  cell,
  points,
  active,
  selected,
}: {
  cell: HexCell;
  points: string;
  active: boolean;
  selected: boolean;
}) {
  /* A gateway is always readable: it is how you get anywhere. Everything else
     gives up its identity only once you are standing in its settlement. */
  const known = active || cell.kind === 'gateway' || cell.kind === 'home';
  const mark = markFor(cell, known);
  const scenery = cell.kind === 'edge' || cell.kind === 'trail' || cell.kind === 'wild';
  const reachable = !scenery;
  /* Settlements name themselves. So does a signpost, in smaller type, because
     a name is the only thing that says it leads to a category. */
  const named = cell.kind === 'gateway' || cell.kind === 'city' || cell.kind === 'home';
  const labelled = named || cell.kind === 'outpost' || (known && cell.kind === 'signpost');

  return (
    <g
      className="hex"
      data-id={cell.id}
      data-kind={cell.kind}
      data-region={cell.regionId}
      data-hub={cell.hub}
      data-holds={cell.holds}
      data-active={active ? '' : undefined}
      data-selected={selected ? '' : undefined}
      transform={`translate(${cell.x} ${cell.y})`}
      style={{ ['--ring' as string]: cell.ring }}
      tabIndex={reachable ? 0 : undefined}
      role={reachable ? 'button' : undefined}
      aria-label={reachable ? (known ? cell.label : 'Somewhere unexplored') : undefined}
    >
      <polygon className="hex-face" points={points} />
      {cell.regionId && (
        <polygon className="hex-terrain" points={points} fill={`url(#terrain-${cell.regionId})`} />
      )}
      <polygon className="hex-edge" points={points} />
      {mark && (
        <g
          transform={`${labelled ? 'translate(0 -12)' : 'scale(1.3)'}${
            cell.rotate ? ` rotate(${cell.rotate.toFixed(1)})` : ''
          }`}
        >
          <path className={known ? 'hex-mark' : 'hex-mark hex-mark-faint'} d={mark} />
          {cell.icon === 'ai' &&
            named &&
            AI_NODES.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} className="hex-mark-node" cx={cx} cy={cy} r="4" />
            ))}
        </g>
      )}
      {labelled && (
        <text className={named ? 'hex-label' : 'hex-label hex-label-small'} y={30}>
          {cell.label}
        </text>
      )}
    </g>
  );
}

function Panel({
  cell,
  region,
  atHome,
  latest,
  onLeave,
}: {
  cell: HexCell;
  region?: RegionInfo;
  atHome: boolean;
  latest?: Latest;
  onLeave: () => void;
}) {
  /* Plain words. The map is already a metaphor; the labels do not need to be
     one as well. */
  const kickers: Record<string, string> = {
    home: 'Home',
    city: 'Category',
    outpost: 'Topic',
    gateway: 'Category',
    signpost: 'Topic',
    gate: 'Category',
    return: 'Home',
  };

  return (
    <aside
      id="hexmap-panel"
      aria-live="polite"
      /* The readout sits inside the drag surface. Without this a touch that
         starts on it drags the map instead of scrolling the sheet. */
      onPointerDown={(event) => event.stopPropagation()}
      /* The readout borrows the colour of wherever you are standing. */
      style={{ ['--region' as string]: `var(--region-${cell.regionId ?? 'none'}, var(--accent))` }}
    >
      {latest && (
        <div className="hexmap-panel-card hexmap-latest">
          {latest.image && (
            <div className="hexmap-shot">
              <Image
                src={latest.image.src}
                alt={latest.image.alt}
                fill
                sizes="(max-width: 849px) 100vw, 420px"
                quality={80}
              />
            </div>
          )}
          <p className="hexmap-kicker">Latest</p>
          <h2>
            <Link href={latest.href}>{latest.title}</Link>
          </h2>
          <p className="hexmap-meta">{latest.meta}</p>
          <div className="hexmap-actions">
            <Link className="hexmap-go" href={latest.href}>
              Read more
            </Link>
            <Link className="hexmap-go hexmap-go-quiet" href="/articles/">
              All articles
            </Link>
          </div>
        </div>
      )}

      {/* Remounting on every move replays the entrance rather than sliding one
          set of words into another. */}
      <div className="hexmap-panel-card" key={cell.id}>
        {cell.image && (
          /* position: relative is what keeps a filled image inside its box.
             Without it the image escapes the card and is upscaled. */
          <div className="hexmap-shot">
            <Image
              src={cell.image.src}
              alt={cell.image.alt}
              fill
              sizes="(max-width: 849px) 100vw, 420px"
              quality={80}
            />
          </div>
        )}
        <p className="hexmap-kicker">{kickers[cell.kind] ?? 'Article'}</p>
        <h2>{cell.kind === 'home' ? 'Wadbrant' : cell.label}</h2>

        {cell.kind === 'home' && (
          <>
            <p className="hexmap-lede">
              I write about game development, business, tech, AI, and product management.
              Very nerdy.
            </p>
            <p className="hexmap-hint">Pick a category to travel there.</p>
          </>
        )}

        {cell.kind === 'city' && region && (
          <>
            <p className="hexmap-lede">{region.blurb}</p>
            {region.reads.length > 0 ? (
              <>
                <p className="hexmap-subhead">Recommended reads</p>
                <ul className="hexmap-list">
                  {region.reads.map((read) => (
                    <li key={read.href}>
                      <Link href={read.href}>{read.title}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="hexmap-hint">Nothing here yet. The ground is marked out.</p>
            )}
            <Link className="hexmap-go" href={region.href}>
              View all {region.count}
            </Link>
          </>
        )}

        {cell.kind === 'outpost' && (
          <>
            {cell.meta && <p className="hexmap-meta">{cell.meta}</p>}
            <p className="hexmap-hint">
              Part of {region?.name ?? 'the map'}. The tiles around this one are what is here.
            </p>
            {cell.href && (
              <Link className="hexmap-go" href={cell.href}>
                See the category
              </Link>
            )}
          </>
        )}

        {(cell.kind === 'article' || cell.kind === 'gate' || cell.kind === 'signpost') && (
          <>
            {cell.meta && <p className="hexmap-meta">{cell.meta}</p>}
            {cell.excerpt && <p className="hexmap-lede">{cell.excerpt}</p>}
            {cell.kind === 'signpost' && <p className="hexmap-hint">Follow the road to see it.</p>}
            {cell.href && (
              <Link className="hexmap-go" href={cell.href}>
                {cell.kind === 'article' ? 'Read it' : 'Browse them'}
              </Link>
            )}
          </>
        )}

        {!atHome && (
          <button type="button" className="hexmap-back" onClick={onLeave}>
            Back to home
          </button>
        )}
      </div>
    </aside>
  );
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
      <pattern id="terrain-ongoing" width="28" height="18" patternUnits="userSpaceOnUse">
        <path d="M -2 13 Q 7 3 16 13 T 34 13" />
      </pattern>
      <pattern id="terrain-product" width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M 11 4 V 18 M 4 11 H 18" />
      </pattern>
      <pattern id="terrain-projects" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M -4 20 L 20 -4 M 4 28 L 28 4" />
      </pattern>
      <pattern id="terrain-misc" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="1.6" />
        <circle cx="15" cy="15" r="1.6" />
      </pattern>
    </defs>
  );
}
