'use client';

import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark';

const STORAGE_KEY = 'mode';

function systemMode(): Mode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Switches between the theme's light and dark palettes by setting
 * `data-mode` on <html>, which is exactly what the Chirpy stylesheet keys off.
 * The choice is remembered; with no choice stored the OS preference wins.
 */
export default function ModeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Mode | null;
    setMode(stored ?? systemMode());
  }, []);

  const toggle = () => {
    const next: Mode = (mode ?? systemMode()) === 'dark' ? 'light' : 'dark';
    setMode(next);
    document.documentElement.setAttribute('data-mode', next);
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent('mode-change', { detail: next }));
  };

  const label = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button type="button" className="mode-toggle btn" aria-label={label} title={label} onClick={toggle}>
      <i className={mode === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} aria-hidden="true" />
    </button>
  );
}
