'use client';

/**
 * The homepage has no top bar, and the top bar is where the sidebar toggle
 * normally lives. Without this there is no way into navigation on a phone.
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
      <i className="fas fa-bars fa-fw" aria-hidden="true" />
    </button>
  );
}
