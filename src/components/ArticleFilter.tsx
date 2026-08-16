'use client';

import { useEffect, useState } from 'react';

export type Filter = { slug: string; name: string; count: number };

/**
 * Category tabs over the article list.
 *
 * The filtering is a class on the list rather than a re-render: every card is
 * already in the markup, so hiding the ones that do not match is instant and
 * costs no JavaScript beyond setting an attribute. The choice lives in the
 * query string so a link can arrive here already filtered, which is what the
 * category breadcrumb on a post does.
 *
 * `window.location` rather than `useSearchParams`, because reading search
 * params through the router opts the whole page out of static rendering and
 * this page is otherwise entirely static.
 */
export default function ArticleFilter({ filters, total }: { filters: Filter[]; total: number }) {
  const [active, setActive] = useState('');

  useEffect(() => {
    const read = () => setActive(new URLSearchParams(window.location.search).get('c') ?? '');
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  useEffect(() => {
    const list = document.getElementById('post-list');
    if (list) list.dataset.filter = active;
  }, [active]);

  const choose = (slug: string) => {
    setActive(slug);
    const url = slug ? `?c=${slug}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  };

  return (
    <nav id="article-filter" aria-label="Filter by category">
      <ul>
        <li>
          <button type="button" data-on={active === '' ? '' : undefined} onClick={() => choose('')}>
            All <span>{total}</span>
          </button>
        </li>
        {filters.map((filter) => (
          <li key={filter.slug}>
            <button
              type="button"
              data-category={filter.slug}
              data-on={active === filter.slug ? '' : undefined}
              onClick={() => choose(filter.slug)}
            >
              {filter.name} <span>{filter.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
