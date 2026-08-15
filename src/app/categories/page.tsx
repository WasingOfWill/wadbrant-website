import type { Metadata } from 'next';
import Link from 'next/link';
import Layout from '@/components/Layout';
import CategoryCard from '@/components/CategoryCard';
import { getCategoryGroups, getTags, slugify } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Categories',
  alternates: { canonical: '/categories/' },
};

export default async function CategoriesPage() {
  const [groups, tags] = await Promise.all([getCategoryGroups(), getTags()]);

  return (
    <Layout title="Categories" crumbs={[{ label: 'Home', href: '/' }, { label: 'Categories' }]}>
      <article className="px-1">
        <h1 className="dynamic-title">{' Categories'}</h1>
        <div className="content">
          {groups.map((group, index) => (
            <CategoryCard group={group} index={index} key={group.slug} />
          ))}

          <h2 className="section-heading">Tags</h2>
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
