import Link from 'next/link';
import { formatLongDate, type Post } from '@/lib/posts';

/** Shared post list used by the tag and category archive pages. */
export default function TermList({
  id,
  icon,
  name,
  posts,
}: {
  id: string;
  icon: string;
  name: string;
  posts: Post[];
}) {
  return (
    <div id={id}>
      <h1 className="ps-lg-2">
        <i className={`${icon} fa-fw text-muted`} aria-hidden="true" /> {name}{' '}
        <span className="lead text-muted ps-2">{posts.length}</span>
      </h1>

      <ul className="content ps-0">
        {posts.map((post) => (
          <li className="d-flex justify-content-between px-md-3" key={post.slug}>
            <Link href={post.url}>{post.title}</Link>{' '}
            <span className="dash flex-grow-1" />{' '}
            <time className="text-muted small text-nowrap" dateTime={post.date.toISOString()}>
              {` ${formatLongDate(post.date)} `}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
