import type { ReactNode } from 'react';
import Topbar, { type Crumb } from './Topbar';
import Panel from './Panel';
import Footer from './Footer';
import BackToTop from './BackToTop';
import SearchResults from './SearchResults';
import ContentEnhancer from './ContentEnhancer';
import { getTrendingTags } from '@/lib/posts';
import type { Heading } from './Toc';

type LayoutProps = {
  /** Text shown in the mobile top bar. */
  title: string;
  crumbs: Crumb[];
  children?: ReactNode;
  /** Rendered under the main column (related posts, post navigation…). */
  tail?: ReactNode;
  /** Table of contents entries; only post pages pass these. */
  headings?: Heading[];
};

/**
 * The page chrome shared by every route: top bar, main column, side panel,
 * tail area and the search overlay.
 */
export default async function Layout({ title, crumbs, children, tail, headings }: LayoutProps) {
  const trending = await getTrendingTags();

  return (
    <>
      <div id="main-wrapper" className="d-flex justify-content-center">
        <div className="container d-flex flex-column px-xxl-5">
          <Topbar title={title} crumbs={crumbs} />

          <div className="row flex-grow-1">
            <main
              id="main-content"
              aria-label="Main Content"
              className="col-12 col-lg-11 col-xl-9 px-md-4"
            >
              {children}
            </main>
            <Panel headings={headings} />
          </div>

          <div className="row">
            <div id="tail-wrapper" className="col-12 col-lg-11 col-xl-9 px-md-4">
              {tail}
              <Footer />
            </div>
          </div>

          <SearchResults trending={trending.map(({ name, slug }) => ({ name, slug }))} />

          <BackToTop />
        </div>
      </div>
      <ContentEnhancer />
    </>
  );
}
