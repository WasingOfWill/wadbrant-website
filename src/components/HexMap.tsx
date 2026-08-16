import { getHexMap, hexPoints } from '@/lib/hexmap';
import HexMapView from './HexMapView';

/**
 * The homepage map.
 *
 * The world is worked out at build time here and handed to a client component
 * that owns the interaction. Tiles are SVG rather than clipped divs for three
 * reasons: the hit area is the real hexagon so neighbours never steal a hover,
 * the camera can move everything with one transform, and the grid can run past
 * the viewport without overflow tricks.
 */
export default async function HexMap() {
  const { cells, regions, routes, settlements, clusters, latest, index } = await getHexMap();

  return (
    <>
      {/* The ground is a CSS background, so it is only discovered once the
          stylesheet has parsed. Without this it fades in after the grid. */}
      <link rel="preload" as="image" href="/assets/site/map.jpg" />

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
          {index.map((post) => (
            <li key={post.href}>
              <a href={post.href}>{post.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <HexMapView
        cells={cells}
        regions={regions}
        routes={routes}
        settlements={settlements}
        clusters={clusters}
        latest={latest}
        points={hexPoints()}
      />
    </>
  );
}
