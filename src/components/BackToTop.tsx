'use client';

import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <aside aria-label="Scroll to Top">
      <button
        id="back-to-top"
        type="button"
        className="btn btn-lg btn-box-shadow"
        aria-label="Back to top"
        style={{ display: visible ? 'block' : 'none' }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="fas fa-angle-up" aria-hidden="true" />
      </button>
    </aside>
  );
}
