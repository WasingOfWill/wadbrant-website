'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useSearch } from './SearchProvider';

export type Crumb = { label: string; href?: string };

function toggleSidebar() {
  const root = document.documentElement;
  if (root.hasAttribute('sidebar-display')) root.removeAttribute('sidebar-display');
  else root.setAttribute('sidebar-display', '');
}

export default function Topbar({ title, crumbs }: { title: string; crumbs: Crumb[] }) {
  const { query, setQuery, open, close } = useSearch();
  const input = useRef<HTMLInputElement>(null);

  return (
    <header id="topbar-wrapper" aria-label="Top Bar">
      <div id="topbar" className="d-flex align-items-center justify-content-between px-lg-3 h-100">
        <nav id="breadcrumb" aria-label="Breadcrumb">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`}>
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
            </span>
          ))}
        </nav>

        <button
          type="button"
          id="sidebar-trigger"
          className="btn btn-link"
          aria-label="Toggle navigation"
          onClick={toggleSidebar}
        >
          <i className="fas fa-bars fa-fw" aria-hidden="true" />
        </button>

        <div id="topbar-title">{title}</div>

        <button
          type="button"
          id="search-trigger"
          className="btn btn-link"
          aria-label="Search"
          onClick={() => {
            open();
            input.current?.focus();
          }}
        >
          <i className="fas fa-search fa-fw" aria-hidden="true" />
        </button>

        <search className="align-items-center ms-3 ms-lg-0">
          <i className="fas fa-search fa-fw" aria-hidden="true" />
          <input
            ref={input}
            className="form-control"
            id="search-input"
            type="search"
            aria-label="search"
            autoComplete="off"
            placeholder="Search..."
            value={query}
            onFocus={open}
            onChange={(event) => setQuery(event.target.value)}
          />
        </search>

        <button
          type="button"
          className="btn btn-link text-decoration-none"
          id="search-cancel"
          onClick={close}
        >
          Cancel
        </button>
      </div>
    </header>
  );
}
