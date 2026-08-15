'use client';

import Link from 'next/link';
import { useSearch } from './SearchProvider';

export type TrendingTag = { name: string; slug: string };

export default function SearchResults({ trending }: { trending: TrendingTag[] }) {
  const { query, results, close } = useSearch();
  const searching = query.trim().length > 0;

  return (
    <div
      id="search-result-wrapper"
      className={`d-flex justify-content-center${searching ? '' : ' unloaded'}`}
    >
      <div className="col-11 content">
        {!searching && (
          <div id="search-hints">
            <section>
              <h2 className="panel-heading">Trending Tags</h2>
              <div className="d-flex flex-wrap mt-3 mb-1 me-3">
                {trending.map((tag) => (
                  <Link
                    className="post-tag btn btn-outline-primary"
                    href={`/tags/${tag.slug}/`}
                    key={tag.slug}
                    onClick={close}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        <div id="search-results" className="d-flex flex-wrap justify-content-center text-muted mt-3">
          {searching && results.length === 0 && <p className="mt-4">No results found.</p>}
          {results.map((result) => (
            <article key={result.url}>
              <header>
                <Link href={result.url} onClick={close}>
                  {result.title}
                </Link>
              </header>
              <p>{result.snippet}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
