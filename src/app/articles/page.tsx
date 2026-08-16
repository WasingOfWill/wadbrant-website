import type { Metadata } from 'next';
import Layout from '@/components/Layout';
import ArticleFilter from '@/components/ArticleFilter';
import PostCard from '@/components/PostCard';
import { getAllPosts, slugify } from '@/lib/posts';
import { REGIONS } from '@/lib/hexmap';

export const metadata: Metadata = {
  title: 'Articles',
  alternates: { canonical: '/articles/' },
};

export default async function ArticlesPage() {
  const posts = await getAllPosts();
  const ordered = [...posts.filter((post) => post.pin), ...posts.filter((post) => !post.pin)];

  /* The same six as the homepage map, in the same order, so the two agree.
     A region with nothing in it does not get a tab. */
  const filters = REGIONS.map((region) => ({
    slug: slugify(region.name),
    name: region.name,
    count: posts.filter((post) => post.categories[0] === region.name).length,
  })).filter((filter) => filter.count > 0);

  return (
    <Layout title="Articles" crumbs={[{ label: 'Home', href: '/' }, { label: 'Articles' }]}>
      <ArticleFilter filters={filters} total={posts.length} />

      <div id="post-list" className="flex-grow-1 px-xl-1">
        {ordered.map((post, index) => (
          <PostCard post={post} priority={index < 2} key={post.slug} />
        ))}
      </div>
    </Layout>
  );
}
