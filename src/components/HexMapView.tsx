'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HexCell, Region } from '@/lib/hexmap';

type RegionInfo = Region & { count: number };

type Props = {
  cells: HexCell[];
  regions: RegionInfo[];
  /** Precomputed hexagon outline, so this file never imports the server lib. */
  points: string;
};

/**
 * Region marks, drawn rather than set in a font. Font Awesome is a webfont and
 * referencing it from inside SVG means chasing codepoints; these are strokes
 * on a 44 unit square and cost nothing.
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
  /* Shown on a tile whose region has not been entered yet. */
  unknown: 'M -6 -5 A 6 6 0 1 1 0 3 M 0 10 L 0 10.5',
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

/** How much of the way the camera travels towards the tile you picked. */
const CAMERA_FOLLOW = 0.5;

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

function markFor(cell: HexCell, known: boolean): string | undefined {
  if (cell.kind === 'home') return MARKS.home;
  if (cell.kind === 'region') return MARKS[cell.regionId ?? ''];
  if (!known) return cell.kind === 'empty' || cell.kind === 'edge' ? undefined : MARKS.unknown;
  if (cell.kind === 'article') return MARKS.article;
  if (cell.kind === 'gate') return MARKS.gate;
  return undefined;
}

export default function HexMapView({ cells, regions, points }: Props) {
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState('home');

  /* The pointer handlers are memoised, so anything they read from state has
     to come through a ref. Reading `discovered` directly would judge every
     tap against whatever was discovered on the first render, which is
     nothing. */
  const discoveredRef = useRef(discovered);
  discoveredRef.current = discovered;

  const byId = useMemo(() => new Map(cells.map((cell) => [cell.id, cell])), [cells]);
  const regionById = useMemo(() => new Map(regions.map((region) => [region.id, region])), [regions]);
  const selected = byId.get(selectedId) ?? byId.get('home')!;

  const camera = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
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
     second through React state would re-render ninety tiles for nothing. */
  const paint = useCallback(() => {
    const node = camera.current;
    if (!node) return;
    node.style.setProperty('--drag-x', `${drag.current.x.toFixed(1)}px`);
    node.style.setProperty('--drag-y', `${drag.current.y.toFixed(1)}px`);
  }, []);

  const limits = useCallback(
    () => ({
      x: window.innerWidth * DRAG_LIMIT,
      y: window.innerHeight * DRAG_LIMIT,
    }),
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

  const choose = useCallback(
    (id: string) => {
      const cell = byId.get(id);
      if (!cell) return;
      if (cell.kind === 'edge' || cell.kind === 'empty') return;
      if (cell.kind === 'region') {
        setDiscovered((current) =>
          current.includes(cell.regionId!) ? current : [...current, cell.regionId!]
        );
      } else if (cell.regionId && !discoveredRef.current.includes(cell.regionId)) {
        // Its region has not been entered, so there is nothing there yet.
        return;
      }
      setSelectedId(id);
    },
    [byId]
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
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
      camera.current?.parentElement?.setAttribute('data-dragging', '');
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    []
  );

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
      camera.current?.parentElement?.removeAttribute('data-dragging');

      if (state.moved < TAP_SLOP) {
        if (state.target) choose(state.target);
        return;
      }
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) glide();
    },
    [choose, glide]
  );

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const known = (cell: HexCell) =>
    cell.kind === 'home' || cell.kind === 'region' || discovered.includes(cell.regionId ?? '');

  const focusX = -selected.x * CAMERA_FOLLOW;
  const focusY = -selected.y * CAMERA_FOLLOW;

  return (
    <div
      id="hexmap"
      data-selected={selectedId}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const id = (event.target as Element).closest?.('.hex')?.getAttribute('data-id');
        if (!id) return;
        event.preventDefault();
        choose(id);
      }}
    >
      <div
        className="hexmap-camera"
        ref={camera}
        style={{ ['--focus-x' as string]: `${focusX}px`, ['--focus-y' as string]: `${focusY}px` }}
      >
        <svg
          className="hexmap-canvas"
          viewBox="-760 -700 1520 1400"
          width="1520"
          height="1400"
          focusable="false"
          aria-hidden="true"
        >
          <Terrain />
          {cells.map((cell) => (
            <Tile
              key={cell.id}
              cell={cell}
              points={points}
              known={known(cell)}
              visited={discovered.includes(cell.regionId ?? '')}
              selected={cell.id === selectedId}
            />
          ))}
          <g
            className="hex-pawn"
            transform={`translate(${selected.x} ${selected.y})`}
            aria-hidden="true"
          >
            <circle className="hex-pawn-halo" r="34" />
            <circle className="hex-pawn-dot" cy="-44" r="5" />
          </g>
        </svg>
      </div>

      <Panel
        cell={selected}
        region={selected.regionId ? regionById.get(selected.regionId) : undefined}
        siblings={cells.filter(
          (cell) =>
            cell.regionId === selected.regionId &&
            (cell.kind === 'article' || cell.kind === 'gate') &&
            selected.kind === 'region'
        )}
        onPick={choose}
      />
    </div>
  );
}

function Tile({
  cell,
  points,
  known,
  visited,
  selected,
}: {
  cell: HexCell;
  points: string;
  known: boolean;
  visited: boolean;
  selected: boolean;
}) {
  const mark = markFor(cell, known);
  const reachable = cell.kind !== 'edge' && cell.kind !== 'empty' && (known || cell.kind !== 'article');

  return (
    <g
      className="hex"
      data-id={cell.id}
      data-kind={cell.kind}
      data-region={cell.regionId}
      data-known={known ? '' : undefined}
      data-visited={visited ? '' : undefined}
      data-selected={selected ? '' : undefined}
      transform={`translate(${cell.x} ${cell.y})`}
      style={{ ['--ring' as string]: cell.ring }}
      tabIndex={reachable ? 0 : undefined}
      role={reachable ? 'button' : undefined}
      aria-label={reachable ? (known ? cell.label : 'Unexplored') : undefined}
    >
      <polygon className="hex-face" points={points} />
      {cell.regionId && (
        <polygon className="hex-terrain" points={points} fill={`url(#terrain-${cell.regionId})`} />
      )}
      <polygon className="hex-edge" points={points} />
      {mark && (
        <g transform={cell.kind === 'region' || cell.kind === 'home' ? 'translate(0 -10)' : ''}>
          <path className={known ? 'hex-mark' : 'hex-mark hex-mark-faint'} d={mark} />
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
    </g>
  );
}

function Panel({
  cell,
  region,
  siblings,
  onPick,
}: {
  cell: HexCell;
  region?: RegionInfo;
  siblings: HexCell[];
  onPick: (id: string) => void;
}) {
  const heading = cell.kind === 'home' ? 'Wadbrant' : (cell.label ?? '');
  const kicker =
    cell.kind === 'home'
      ? 'Base camp'
      : cell.kind === 'region'
        ? 'Region'
        : cell.kind === 'gate'
          ? 'Wayfinder'
          : 'Entry';

  return (
    <aside
      id="hexmap-panel"
      aria-live="polite"
      /* The panel borrows the colour of wherever you are standing. */
      style={{ ['--region' as string]: `var(--region-${cell.regionId ?? 'accent'}, var(--accent))` }}
    >
      {/* Remounting on every move replays the entrance rather than sliding
          one set of words into another. */}
      <div className="hexmap-panel-card" key={cell.id}>
        <p className="hexmap-kicker">{kicker}</p>
        <h2>{heading}</h2>

        {cell.kind === 'home' && (
          <>
            <p className="hexmap-lede">
              Product manager. Games, and the things games taught me about building software.
            </p>
            <p className="hexmap-hint">Pick a region to see what is there.</p>
          </>
        )}

        {cell.kind === 'region' && region && (
          <>
            <p className="hexmap-lede">{region.blurb}</p>
            <p className="hexmap-meta">
              {region.count} {region.count === 1 ? 'entry' : 'entries'}
            </p>
            {siblings.length > 0 ? (
              <ul className="hexmap-list">
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <button type="button" onClick={() => onPick(sibling.id)}>
                      {sibling.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hexmap-hint">Nothing here yet. The ground is marked out.</p>
            )}
          </>
        )}

        {(cell.kind === 'article' || cell.kind === 'gate') && (
          <>
            {cell.meta && <p className="hexmap-meta">{cell.meta}</p>}
            {cell.excerpt && <p className="hexmap-lede">{cell.excerpt}</p>}
            {cell.href && (
              <Link className="hexmap-go" href={cell.href}>
                {cell.kind === 'gate' ? 'Browse them all' : 'Read it'}
              </Link>
            )}
          </>
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
