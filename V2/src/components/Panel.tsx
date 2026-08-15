import Link from 'next/link';
import { getRecentlyUpdated, getTrendingTags } from '@/lib/posts';
import Toc, { type Heading } from './Toc';

export default async function Panel({ headings }: { headings?: Heading[] }) {
  const [recent, trending] = await Promise.all([getRecentlyUpdated(), getTrendingTags()]);

  return (
    <aside aria-label="Panel" id="panel-wrapper" className="col-xl-3 ps-2 mb-5 text-muted">
      <div className="access">
        {recent.length > 0 && (
          <section id="access-lastmod">
            <h2 className="panel-heading">Recently Updated</h2>
            <ul className="content list-unstyled ps-0 pb-1 ms-1 mt-2">
              {recent.map((post) => (
                <li className="text-truncate lh-lg" key={post.slug}>
                  <Link href={post.url}>{post.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {trending.length > 0 && (
          <section>
            <h2 className="panel-heading">Trending Tags</h2>
            <div className="d-flex flex-wrap mt-3 mb-1 me-3">
              {trending.map((tag) => (
                <Link
                  className="post-tag btn btn-outline-primary"
                  href={`/tags/${tag.slug}/`}
                  key={tag.slug}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {headings && headings.length > 0 && <Toc headings={headings} />}
    </aside>
  );
}
