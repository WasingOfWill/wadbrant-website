'use client';

import Link from 'next/link';
import { useSearch } from './SearchProvider';

export type TrendingTag = { name: string; slug: string };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

export default function SearchResults({ trending }: { trending: TrendingTag[] }) {
  const { query, results, close } = useSearch();
  const searching = query.trim().length > 0;

  return (
    <div
      id="search-result-wrapper"
      className={`d-flex justify-content-center${searching ? '' : ' unloaded'}`}
    >
      <div className="col-11 search-panel">
        {!searching && (
          <div id="search-hints">
            <h2 className="panel-heading">Trending Tags</h2>
            <div className="d-flex flex-wrap mt-3 mb-1 me-3">
              {trending.map((tag) => (
                <Link
                  className="post-tag"
                  href={`/tags/${tag.slug}/`}
                  key={tag.slug}
                  onClick={close}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {searching && (
          <div id="search-results">
            <p className="search-count">
              {results.length === 0
                ? 'No results'
                : `${results.length} result${results.length === 1 ? '' : 's'}`}{' '}
              for “{query.trim()}”
            </p>

            {results.map((result) => (
              <article className="search-hit" key={result.url}>
                <Link href={result.url} className="search-hit-link" onClick={close}>
                  <h3>{result.title}</h3>
                  <p>{result.snippet}</p>
                </Link>
                <div className="search-hit-meta">
                  <time>{result.date}</time>
                  {result.tags.slice(0, 3).map((tag) => (
                    <Link
                      href={`/tags/${slugify(tag)}/`}
                      className="search-hit-tag"
                      key={tag}
                      onClick={close}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
