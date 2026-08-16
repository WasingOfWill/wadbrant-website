import type { Metadata } from 'next';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { formatCardDate, getDrafts, getScheduled } from '@/lib/posts';

/**
 * Work in progress, readable on the real site.
 *
 * Unlisted rather than private: nothing links here, robots are told to stay
 * out, and none of it appears in the article list, the feed, the sitemap, the
 * search index or the homepage map. Anyone who types the URL can still read
 * it, which is the trade for being able to check a piece on the live site
 * before it goes out.
 */
export const metadata: Metadata = {
  title: 'Drafts',
  robots: { index: false, follow: false },
  alternates: { canonical: '/drafts/' },
};

export default async function DraftsPage() {
  const drafts = await getDrafts();
  const scheduled = await getScheduled();

  return (
    <Layout title="Drafts" crumbs={[{ label: 'Home', href: '/' }, { label: 'Drafts' }]}>
      <div className="content">
        <h1>Drafts</h1>
        <p>
          Unfinished and unlisted. Add <code>draft: true</code> to a post&rsquo;s front matter to
          put it here; remove it and set a date to publish. Nothing on this page is indexed or
          linked from anywhere else.
        </p>

        <h2>In progress</h2>
        {drafts.length === 0 ? (
          <p>Nothing being written.</p>
        ) : (
          <ul className="draft-list">
            {drafts.map((post) => (
              <li key={post.slug}>
                <Link href={post.url}>{post.title}</Link>
                <span>
                  {post.categories[0] ?? 'uncategorised'} / {post.listReadTime} min
                  {post.description ? '' : ' / no description yet'}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2>Scheduled</h2>
        {scheduled.length === 0 ? (
          <p>Nothing waiting to go out.</p>
        ) : (
          <ul className="draft-list">
            {scheduled.map((post) => (
              <li key={post.slug}>
                <Link href={post.url}>{post.title}</Link>
                <span>
                  {formatCardDate(post.date)} / {post.categories[0] ?? 'uncategorised'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
