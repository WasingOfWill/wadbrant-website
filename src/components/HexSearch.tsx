'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

type Entry = {
  title: string;
  url: string;
  snippet: string;
  tags: string[];
  categories: string[];
};

/** Enough to choose from without turning the map into a list. */
const LIMIT = 6;

/**
 * Search on the homepage.
 *
 * The rest of the site searches through the top bar, which this page does not
 * have, and the shared overlay is positioned against page chrome that is not
 * here either. This reads the same static index and answers underneath itself,
 * which keeps the map visible while you look.
 */
export default function HexSearch() {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  /* The index is only worth fetching once someone means to use it. */
  useEffect(() => {
    if (!open || index) return;
    let live = true;
    fetch('/search.json')
      .then((response) => response.json())
      .then((data: Entry[]) => live && setIndex(data))
      .catch(() => live && setIndex([]));
    return () => {
      live = false;
    };
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const needle = query.trim().toLowerCase();
  const hits = needle
    ? (index ?? [])
        .filter((entry) =>
          [entry.title, entry.snippet, ...entry.tags, ...entry.categories]
            .join(' ')
            .toLowerCase()
            .includes(needle)
        )
        .slice(0, LIMIT)
    : [];

  return (
    <div
      id="hexmap-search"
      ref={box}
      role="search"
      /* The map treats any press as the start of a drag. */
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="hexmap-search-field">
        <i className="fas fa-search fa-fw" aria-hidden="true" />
        <input
          type="search"
          autoComplete="off"
          placeholder="Search"
          aria-label="Search articles"
          aria-controls={listId}
          aria-expanded={hits.length > 0}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setQuery('');
              setOpen(false);
              event.currentTarget.blur();
            }
          }}
        />
      </div>

      {open && needle.length > 0 && (
        <ul className="hexmap-search-hits" id={listId}>
          {hits.map((entry) => (
            <li key={entry.url}>
              <Link href={entry.url}>{entry.title}</Link>
            </li>
          ))}
          {hits.length === 0 && <li className="hexmap-search-empty">Nothing found</li>}
        </ul>
      )}
    </div>
  );
}
