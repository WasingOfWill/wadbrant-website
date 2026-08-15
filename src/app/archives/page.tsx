import type { Metadata } from 'next';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { formatDate, getArchives } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Archives',
  alternates: { canonical: '/archives/' },
};

export default async function ArchivesPage() {
  const years = await getArchives();

  return (
    <Layout title="Archives" crumbs={[{ label: 'Home', href: '/' }, { label: 'Archives' }]}>
      <article className="px-1">
        <h1 className="dynamic-title">{' Archives'}</h1>
        <div className="content">
          <div id="archives" className="pl-xl-3">
            {years.map((group) => (
              <div key={group.year}>
                <time className="year lead d-block">{group.year}</time>
                <ul className="list-unstyled">
                  {group.posts.map((post) => (
                    <li key={post.slug}>
                      <span className="date day">{formatDate(post.date, { day: '2-digit' })}</span>{' '}
                      <span className="date month small text-muted ms-1">
                        {` ${formatDate(post.date, { month: 'short' })} `}
                      </span>{' '}
                      <Link href={post.url}>{post.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </article>
    </Layout>
  );
}
