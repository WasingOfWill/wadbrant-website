'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type SearchEntry = {
  title: string;
  url: string;
  categories: string[];
  tags: string[];
  /** Pre-formatted "Nov 2025". */
  date: string;
  snippet: string;
  content: string;
};

type SearchState = {
  query: string;
  active: boolean;
  results: SearchEntry[];
  setQuery: (value: string) => void;
  open: () => void;
  close: () => void;
};

const SearchContext = createContext<SearchState | null>(null);

export function useSearch(): SearchState {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used inside <SearchProvider>');
  return context;
}

function score(entry: SearchEntry, needle: string): number {
  if (entry.title.toLowerCase().includes(needle)) return 3;
  if ([...entry.categories, ...entry.tags].join(' ').toLowerCase().includes(needle)) return 2;
  if (entry.content.toLowerCase().includes(needle)) return 1;
  return 0;
}

export default function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryState] = useState('');
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const loading = useRef(false);

  const loadIndex = useCallback(async () => {
    if (index || loading.current) return;
    loading.current = true;
    try {
      const response = await fetch('/search.json');
      setIndex((await response.json()) as SearchEntry[]);
    } catch {
      setIndex([]);
    } finally {
      loading.current = false;
    }
  }, [index]);

  const open = useCallback(() => {
    setActive(true);
    void loadIndex();
  }, [loadIndex]);

  const close = useCallback(() => {
    setActive(false);
    setQueryState('');
  }, []);

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      if (value) open();
    },
    [open]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (active && query.trim()) root.setAttribute('data-search', 'on');
    else root.removeAttribute('data-search');
  }, [active, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !index) return [];
    return index
      .map((entry) => ({ entry, rank: score(entry, needle) }))
      .filter((item) => item.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .map((item) => item.entry);
  }, [index, query]);

  const value = useMemo<SearchState>(
    () => ({ query, active, results, setQuery, open, close }),
    [query, active, results, setQuery, open, close]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}
