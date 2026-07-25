import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Feature carousel: one slide visible at a time, each pairing an image with
 * a heading, body copy and a CTA link. Reads slides from authored rows
 * (image cell + text cell) and builds a track plus prev/next arrows, dot
 * indicators and an "N of X" counter. Wraps around. Autoplay is opt-in via
 * a `carousel (autoplay)` variant and pauses on hover/focus.
 * @param {Element} block the carousel block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const total = rows.length;
  if (total === 0) return;

  const slides = rows.map((row, i) => {
    const [imageCell, textCell] = [...row.children];

    const media = document.createElement('div');
    media.className = 'carousel-media';
    if (imageCell) {
      while (imageCell.firstChild) media.append(imageCell.firstChild);
      media.querySelectorAll('picture > img').forEach((img) => {
        img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt));
      });
    }

    const content = document.createElement('div');
    content.className = 'carousel-content';
    if (textCell) {
      while (textCell.firstChild) content.append(textCell.firstChild);
    }
    // the CTA is a paragraph whose entire text is a single link
    const ctaPara = [...content.children].find((el) => {
      const a = el.tagName === 'P' ? el.querySelector('a') : null;
      return a && el.textContent.trim() === a.textContent.trim();
    });
    if (ctaPara) {
      ctaPara.classList.add('carousel-cta-wrapper');
      ctaPara.querySelector('a').classList.add('carousel-cta');
    }

    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${total}`);
    slide.append(media, content);
    return slide;
  });

  const track = document.createElement('div');
  track.className = 'carousel-track';
  track.append(...slides);

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  viewport.append(track);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'carousel-arrow carousel-prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'carousel-arrow carousel-next';
  nextBtn.setAttribute('aria-label', 'Next slide');

  const counter = document.createElement('div');
  counter.className = 'carousel-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');

  // live shows the counter between the two chevrons, with no dot indicators
  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  nav.append(prevBtn, counter, nextBtn);

  let current = 0;
  const goTo = (index) => {
    current = ((index % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      slide.toggleAttribute('inert', i !== current);
    });
    counter.textContent = `${current + 1} of ${total}`;
  };

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // gentle optional autoplay, default off: add an `autoplay` variant to enable
  if (block.classList.contains('autoplay')) {
    let timer;
    const start = () => { timer = window.setInterval(() => goTo(current + 1), 6000); };
    const stop = () => window.clearInterval(timer);
    block.addEventListener('mouseenter', stop);
    block.addEventListener('mouseleave', start);
    block.addEventListener('focusin', stop);
    block.addEventListener('focusout', start);
    start();
  }

  goTo(0);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured highlights');
  block.replaceChildren(viewport, nav);
}
