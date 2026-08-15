import type { Metadata } from 'next';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getTags, slugify } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Tags',
  alternates: { canonical: '/tags/' },
};

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <Layout title="Tags" crumbs={[{ label: 'Home', href: '/' }, { label: 'Tags' }]}>
      <article className="px-1">
        <h1 className="dynamic-title">Tags</h1>
        <div className="content">
          <div id="tags" className="d-flex flex-wrap mx-xl-2">
            {[...tags.entries()].map(([name, posts]) => (
              <div key={name}>
                <Link className="tag" href={`/tags/${slugify(name)}/`}>
                  {` ${name}`}
                  <span className="text-muted">{posts.length}</span>{' '}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </article>
    </Layout>
  );
}
