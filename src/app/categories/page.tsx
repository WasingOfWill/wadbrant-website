import type { Metadata } from 'next';
import Layout from '@/components/Layout';
import CategoryCard from '@/components/CategoryCard';
import { getCategoryGroups } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Categories',
  alternates: { canonical: '/categories/' },
};

export default async function CategoriesPage() {
  const groups = await getCategoryGroups();

  return (
    <Layout title="Categories" crumbs={[{ label: 'Home', href: '/' }, { label: 'Categories' }]}>
      <article className="px-1">
        <h1 className="dynamic-title">{' Categories'}</h1>
        <div className="content">
          {groups.map((group, index) => (
            <CategoryCard group={group} index={index} key={group.slug} />
          ))}
        </div>
      </article>
    </Layout>
  );
}
