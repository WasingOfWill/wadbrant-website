'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Progressive enhancements applied to server-rendered markup:
 *  - clears the shimmer placeholder once an image has loaded (or failed);
 *  - opens content images in a lightbox;
 *  - adds a copy button to code blocks.
 */
export default function ContentEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const clearShimmer = (image: HTMLImageElement) => {
      image.closest('.shimmer')?.classList.remove('shimmer');
    };

    const images = Array.from(document.querySelectorAll<HTMLImageElement>('.shimmer img'));
    for (const image of images) {
      if (image.complete) clearShimmer(image);
      else {
        image.addEventListener('load', () => clearShimmer(image), { once: true });
        image.addEventListener('error', () => clearShimmer(image), { once: true });
      }
    }

    const openPopup = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a.popup');
      if (!link) return;
      event.preventDefault();

      const overlay = document.createElement('div');
      overlay.id = 'image-popup';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Image preview');

      const image = document.createElement('img');
      image.src = link.href;
      image.alt = link.querySelector('img')?.alt ?? '';
      overlay.append(image);

      const dismiss = () => {
        overlay.remove();
        document.removeEventListener('keydown', onKeyDown);
      };
      const onKeyDown = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key === 'Escape') dismiss();
      };

      overlay.addEventListener('click', dismiss);
      document.addEventListener('keydown', onKeyDown);
      document.body.append(overlay);
    };

    document.addEventListener('click', openPopup);

    const codeBlocks = Array.from(document.querySelectorAll<HTMLElement>('.highlight'));
    for (const block of codeBlocks) {
      if (block.querySelector('.copy-code')) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code btn';
      button.setAttribute('aria-label', 'Copy code');
      button.innerHTML = '<i class="far fa-clipboard"></i>';
      button.addEventListener('click', async () => {
        const code = block.querySelector('code')?.textContent ?? '';
        await navigator.clipboard.writeText(code);
        button.innerHTML = '<i class="fas fa-check"></i>';
        window.setTimeout(() => {
          button.innerHTML = '<i class="far fa-clipboard"></i>';
        }, 1500);
      });
      block.append(button);
    }

    return () => document.removeEventListener('click', openPopup);
  }, [pathname]);

  return null;
}
