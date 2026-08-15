import HexMap from '@/components/HexMap';
import HexMapNav from '@/components/HexMapNav';

/**
 * The homepage is a map, not a document. It deliberately skips the shared
 * Layout: no top bar, no side panel, no footer, just the sidebar from the
 * root layout and a grid that runs off every edge of the screen.
 */
export default function HomePage() {
  return (
    <>
      <HexMap />
      <HexMapNav />
    </>
  );
}
