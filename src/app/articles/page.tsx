import type { Metadata } from 'next';
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Articles',
  alternates: { canonical: '/articles/' },
};

export default async function ArticlesPage() {
  const posts = await getAllPosts();
  const ordered = [...posts.filter((post) => post.pin), ...posts.filter((post) => !post.pin)];

  return (
    <Layout title="Articles" crumbs={[{ label: 'Home', href: '/' }, { label: 'Articles' }]}>
      <div id="post-list" className="flex-grow-1 px-xl-1">
        {ordered.map((post, index) => (
          <PostCard post={post} priority={index < 2} key={post.slug} />
        ))}
      </div>
    </Layout>
  );
}
