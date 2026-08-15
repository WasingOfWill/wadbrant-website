import Layout from '@/components/Layout';

/**
 * Intentionally empty for now. The article list lives at /articles/; this
 * space is reserved for whatever the landing page becomes.
 */
export default function HomePage() {
  return <Layout title="WADBRANT" crumbs={[{ label: 'Home' }]} />;
}
