import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import TermList from '@/components/TermList';
import { getTags, slugify } from '@/lib/posts';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const tags = await getTags();
  return [...tags.keys()].map((name) => ({ slug: slugify(name) }));
}

async function findTag(slug: string) {
  const tags = await getTags();
  const entry = [...tags.entries()].find(([name]) => slugify(name) === slug);
  return entry ? { name: entry[0], posts: entry[1] } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tag = await findTag(slug);
  if (!tag) return {};
  return { title: tag.name, alternates: { canonical: `/tags/${slug}/` } };
}

export default async function TagPage({ params }: Params) {
  const { slug } = await params;
  const tag = await findTag(slug);
  if (!tag) notFound();

  return (
    <Layout
      title="Tag"
      crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Tags', href: '/tags/' },
        { label: tag.name },
      ]}
    >
      <article className="px-1">
        <TermList id="page-tag" icon="fa fa-tag" name={tag.name} posts={tag.posts} />
      </article>
    </Layout>
  );
}
