'use client';

/**
 * The homepage has no top bar, and the top bar is where the sidebar toggle
 * normally lives. Without this there is no way into navigation on a phone.
 *
 * The hexagon is a drawn polygon rather than a clipped box: clip-path cuts a
 * border away at the same edge it is drawn on, which leaves flat sides and
 * bare corners. This way the button is the same shape, fill and stroke as
 * every tile on the map.
 */
export default function HexMapNav() {
  return (
    <button
      type="button"
      id="hexmap-nav"
      aria-label="Toggle navigation"
      onClick={() => {
        const root = document.documentElement;
        if (root.hasAttribute('sidebar-display')) root.removeAttribute('sidebar-display');
        else root.setAttribute('sidebar-display', '');
      }}
    >
      <svg viewBox="0 0 100 116" aria-hidden="true" focusable="false">
        <polygon points="98.5,30 98.5,86 50,114 1.5,86 1.5,30 50,2" />
      </svg>
      <i className="fas fa-bars fa-fw" aria-hidden="true" />
    </button>
  );
}
