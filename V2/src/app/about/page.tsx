import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import { getPage } from '@/lib/posts';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about');
  return {
    title: 'About',
    description: page?.description,
    alternates: { canonical: '/about/' },
  };
}

export default async function AboutPage() {
  const page = await getPage('about');
  if (!page) notFound();

  return (
    <Layout title="About" crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}>
      <article className="px-1">
        <h1 className="dynamic-title">About</h1>
        <div className="content" dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </Layout>
  );
}
