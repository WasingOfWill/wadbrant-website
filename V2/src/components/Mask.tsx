'use client';

/** Dimming layer shown behind the off-canvas sidebar on small screens. */
export default function Mask() {
  return (
    <div
      id="mask"
      onClick={() => document.documentElement.removeAttribute('sidebar-display')}
      aria-hidden="true"
    />
  );
}
