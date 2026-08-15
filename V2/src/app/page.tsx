import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import { getAllPosts } from '@/lib/posts';

export default async function HomePage() {
  const posts = await getAllPosts();
  const ordered = [...posts.filter((post) => post.pin), ...posts.filter((post) => !post.pin)];

  return (
    <Layout title="WADBRANT" crumbs={[{ label: 'Home' }]}>
      <div id="post-list" className="flex-grow-1 px-xl-1">
        {ordered.map((post) => (
          <PostCard post={post} key={post.slug} />
        ))}
      </div>
    </Layout>
  );
}
