import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import CopyLink from '@/components/CopyLink';
import { extractHeadings } from '@/lib/headings';
import {
  formatLongDate,
  getAllPosts,
  getPost,
  getRelatedPosts,
  slugify,
  type Post,
} from '@/lib/posts';
import { site } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const description = post.description ?? post.excerpt;
  const image = post.image?.path ?? site.ogImage;

  return {
    title: post.title,
    description,
    alternates: { canonical: post.url },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: post.url,
      images: [image],
      publishedTime: post.date.toISOString(),
      modifiedTime: post.lastModified.toISOString(),
      authors: [site.author.name],
      tags: [...post.tags],
    },
    twitter: {
      card: post.image ? 'summary_large_image' : 'summary',
      title: post.title,
      description,
      images: [image],
    },
  };
}

function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <aside id="related-posts" aria-labelledby="related-label">
      <h3 className="mb-4" id="related-label">
        Further Reading
      </h3>
      <nav className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4 mb-4">
        {posts.map((post) => (
          <article className="col" key={post.slug}>
            <Link href={post.url} className="post-preview card h-100">
              <div className="card-body">
                <time dateTime={post.date.toISOString()}>{` ${formatLongDate(post.date)} `}</time>
                <h4 className="pt-0 my-2">{post.title}</h4>
                <div className="text-muted">
                  <p>{post.summary}</p>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </nav>
    </aside>
  );
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const posts = await getAllPosts();
  const index = posts.findIndex((entry) => entry.slug === post.slug);
  const newer = index > 0 ? posts[index - 1] : undefined;
  const older = index < posts.length - 1 ? posts[index + 1] : undefined;
  const related = await getRelatedPosts(post);
  const headings = post.toc ? extractHeadings(post.content) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date.toISOString(),
    dateModified: post.lastModified.toISOString(),
    description: post.description ?? post.excerpt,
    image: post.image ? `${site.url}${post.image.path}` : `${site.url}${site.ogImage}`,
    author: { '@type': 'Person', name: site.author.name, url: site.author.linkedin },
    mainEntityOfPage: `${site.url}${post.url}`,
  };

  const tail = (
    <>
      <RelatedPosts posts={related} />
      <nav className="post-navigation d-flex justify-content-between" aria-label="Post Navigation">
        {older ? (
          <Link href={older.url} className="btn btn-outline-primary" aria-label="Older">
            <p>{older.title}</p>
          </Link>
        ) : (
          <div />
        )}
        {newer ? (
          <Link href={newer.url} className="btn btn-outline-primary" aria-label="Newer">
            <p>{newer.title}</p>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </>
  );

  return (
    <Layout
      title="Post"
      crumbs={[{ label: 'Home', href: '/' }, { label: post.title }]}
      headings={headings}
      tail={tail}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="px-1">
        <header>
          <h1 data-toc-skip="">{post.title}</h1>
          <div className="post-meta text-muted">
            <span>
              {' Posted '}
              <time dateTime={post.date.toISOString()}>{` ${formatLongDate(post.date)} `}</time>
            </span>

            {post.image && (
              <div className="mt-3 mb-3">
                <a href={post.image.path} className="popup img-link preview-img shimmer">
                  <Image
                    src={post.image.path}
                    alt={post.image.alt ?? 'Preview Image'}
                    fill
                    sizes="(max-width: 1200px) 100vw, 820px"
                    quality={85}
                    priority
                  />
                </a>
              </div>
            )}

            <div className="d-flex justify-content-between">
              <span>
                By{' '}
                <em>
                  <a href={site.author.linkedin}>{site.author.name}</a>
                </em>
              </span>
              <span className="readtime" title={`${post.words} words`}>
                <em>{post.readTime} min</em> read
              </span>
            </div>
          </div>
        </header>

        <div className="content" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="post-tail-wrapper text-muted">
          {post.categories.length > 0 && (
            <div className="post-meta mb-3">
              <i className="far fa-folder-open fa-fw me-1" aria-hidden="true" />
              {post.categories.map((category, position) => (
                <span key={category}>
                  <Link href={`/categories/${slugify(category)}/`}>{category}</Link>
                  {position < post.categories.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {post.tags.length > 0 && (
            <div className="post-tags">
              <i className="fa fa-tags fa-fw me-1" aria-hidden="true" />
              {post.tags.map((tag) => (
                <Link
                  href={`/tags/${slugify(tag)}/`}
                  className="post-tag no-text-decoration"
                  key={tag}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div className="post-tail-bottom d-flex justify-content-between align-items-center mt-5 pb-2">
            <div className="license-wrapper">
              This post is licensed under <a href={site.license.url}>{site.license.name}</a> by the
              author.
            </div>
            <CopyLink />
          </div>
        </div>
      </article>
    </Layout>
  );
}
