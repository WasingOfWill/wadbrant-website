import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import { getPage } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'CV',
  description: 'Curriculum vitae of Will Wadbrant - Product Manager, Gaming Industry, AI.',
  alternates: { canonical: '/cv/' },
};

export default async function CvPage() {
  const page = await getPage('cv');
  if (!page) notFound();

  return (
    <Layout title="CV" crumbs={[{ label: 'Home', href: '/' }, { label: 'CV' }]}>
      <article className="px-1">
        <h1 className="dynamic-title">{' CV'}</h1>
        <div className="content" dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </Layout>
  );
}
