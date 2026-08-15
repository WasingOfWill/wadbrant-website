import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import TermList from '@/components/TermList';
import { getCategories, slugify } from '@/lib/posts';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const categories = await getCategories();
  return [...categories.keys()].map((name) => ({ slug: slugify(name) }));
}

async function findCategory(slug: string) {
  const categories = await getCategories();
  const entry = [...categories.entries()].find(([name]) => slugify(name) === slug);
  return entry ? { name: entry[0], posts: entry[1] } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) return {};
  return { title: category.name, alternates: { canonical: `/categories/${slug}/` } };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) notFound();

  return (
    <Layout
      title="Category"
      crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Categories', href: '/categories/' },
        { label: category.name },
      ]}
    >
      <article className="px-1">
        <TermList
          id="page-category"
          icon="far fa-folder-open"
          name={category.name}
          posts={category.posts}
        />
      </article>
    </Layout>
  );
}
