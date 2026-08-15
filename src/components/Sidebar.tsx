'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation, site } from '@/lib/site';
import ModeToggle from './ModeToggle';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();

  /* On a phone the sidebar slides over the page, and following a link inside
     it leaves it sitting there on top of wherever you just went. Navigating to
     the page you are already on does not change the route, so this closes on
     the click rather than on the route. */
  const close = () => document.documentElement.removeAttribute('sidebar-display');

  return (
    <aside aria-label="Sidebar" id="sidebar" className="d-flex flex-column align-items-end">
      <header className="profile-wrapper" onClick={close}>
        <Link href="/" id="avatar" className="rounded-circle" aria-label="Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.avatarSmall}
            srcSet={`${site.avatarSmall} 1x, ${site.avatar} 2x`}
            width={112}
            height={112}
            alt="Will Wadbrant"
            fetchPriority="high"
          />
        </Link>

        <h1 className="site-title">
          <Link href="/">{site.title}</Link>
        </h1>
        <p className="site-subtitle fst-italic mb-0">
          {site.taglineLines.map((line) => (
            <span className="d-block" key={line}>
              {line}
            </span>
          ))}
        </p>
      </header>

      <nav className="flex-column flex-grow-1 w-100 ps-0" onClick={close}>
        <ul className="nav">
          {navigation.map((item) => (
            <li className="nav-item" key={item.href}>
              <Link
                href={item.href}
                className={`nav-link${isActive(pathname, item.href) ? ' active' : ''}`}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              >
                <i className={`fa-fw ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-bottom d-flex flex-wrap align-items-center w-100">
        <ModeToggle />
      </div>
    </aside>
  );
}
