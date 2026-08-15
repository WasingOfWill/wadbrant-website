import Link from 'next/link';
import { formatCardDate, type Post } from '@/lib/posts';

export default function PostCard({ post }: { post: Post }) {
  const hasImage = Boolean(post.image);

  return (
    <article className="card-wrapper card">
      <Link
        href={post.url}
        className={`post-preview row g-0${hasImage ? ' flex-md-row-reverse' : ''}`}
      >
        {post.image && (
          <div className="col-md-5">
            <div className="preview-img shimmer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image.path} alt={post.image.alt ?? 'Preview Image'} loading="lazy" />
            </div>
          </div>
        )}

        <div className={hasImage ? 'col-md-7' : 'col-12'}>
          <div className="card-body d-flex flex-column">
            <h1 className="card-title my-2 mt-md-0">{post.title}</h1>

            <div className="card-text content mt-0 mb-3">
              <p>{post.excerpt}</p>
            </div>

            <div className="post-meta flex-grow-1 d-flex align-items-end">
              <div className="me-auto">
                <i className="far fa-calendar fa-fw me-1" aria-hidden="true" />{' '}
                <time dateTime={post.date.toISOString()}>{` ${formatCardDate(post.date)} `}</time>{' '}
                <i className="far fa-clock fa-fw me-1 ms-3" aria-hidden="true" />{' '}
                <span>{`${post.listReadTime} min`}</span>{' '}
                {post.categories.length > 0 && (
                  <>
                    <i className="far fa-folder-open fa-fw me-1 ms-3" aria-hidden="true" />{' '}
                    <span className="categories">{` ${post.categories.join(', ')} `}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
