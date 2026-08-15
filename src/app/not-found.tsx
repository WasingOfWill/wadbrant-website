import Link from 'next/link';
import Layout from '@/components/Layout';

export default function NotFound() {
  return (
    <Layout title="404" crumbs={[{ label: 'Home', href: '/' }, { label: '404' }]}>
      <article className="px-1">
        <h1 className="dynamic-title">404</h1>
        <div className="content">
          <p>Sorry, we&apos;ve misplaced that URL or it&apos;s pointing to something that doesn&apos;t exist.</p>
          <p>
            <Link href="/">Head back home</Link> to try finding it again.
          </p>
        </div>
      </article>
    </Layout>
  );
}
