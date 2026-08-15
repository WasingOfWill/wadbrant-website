'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CategoryGroup } from '@/lib/posts';

function measure(count: number, singular: string, plural: string) {
  return `${count} ${count > 1 ? plural : singular}`;
}

/** One collapsible top-level category with its sub-categories. */
export default function CategoryCard({ group, index }: { group: CategoryGroup; index: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = group.children.length > 0;
  const listId = `l_${index}`;

  return (
    <div className="card categories">
      <div
        id={`h_${index}`}
        className={`card-header d-flex justify-content-between${open ? ' hide-border-bottom' : ''}`}
      >
        <span className="ms-2">
          <i className={`far fa-folder${hasChildren ? '-open' : ''} fa-fw`} aria-hidden="true" />{' '}
          <Link href={`/categories/${group.slug}/`} className="mx-2">
            {group.name}
          </Link>{' '}
          <span className="text-muted small font-weight-light">
            {hasChildren
              ? ` ${measure(group.children.length, 'category', 'categories')} , ${measure(group.postCount, 'post', 'posts')} `
              : ` ${measure(group.postCount, 'post', 'posts')} `}
          </span>{' '}
        </span>

        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={`Toggle ${group.name}`}
            className={`category-trigger${open ? ' hide-border-bottom' : ''}`}
            onClick={() => setOpen((value) => !value)}
          >
            <i className={`fas fa-fw fa-angle-${open ? 'down' : 'right'}`} aria-hidden="true" />
          </button>
        ) : (
          <span className="category-trigger hide-border-bottom disabled">
            <i className="fas fa-fw fa-angle-right" aria-hidden="true" />
          </span>
        )}
      </div>

      {hasChildren && (
        <div id={listId} className={`collapse${open ? ' show' : ''}`} aria-expanded={open}>
          <ul className="list-group">
            {group.children.map((child) => (
              <li className="list-group-item" key={child.slug}>
                <i className="far fa-folder fa-fw" aria-hidden="true" />{' '}
                <Link href={`/categories/${child.slug}/`} className="mx-2">
                  {child.name}
                </Link>{' '}
                <span className="text-muted small font-weight-light">
                  {` ${measure(child.postCount, 'post', 'posts')} `}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
