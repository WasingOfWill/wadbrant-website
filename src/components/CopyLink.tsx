'use client';

import { useState } from 'react';

export default function CopyLink() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="share-wrapper d-flex align-items-center">
      <span className="share-label text-muted">Share</span>
      <span className="share-icons">
        <button
          id="copy-link"
          aria-label="Copy link"
          className="btn small"
          title={copied ? 'Link copied successfully!' : 'Copy link'}
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
        >
          <i className={`fa-fw fas ${copied ? 'fa-check' : 'fa-link'} pe-none fs-6`} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}
