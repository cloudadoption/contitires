import { toFinderTrigger } from '../../scripts/tire-finder.js';

// the width at which the hero stops stacking, so the desktop art starts here
const DESKTOP_MEDIA = '(min-width: 1025px)';

// live's promo marquee offers the finder beside the store link, and opens it
// on By Vehicle from both pages, whichever of the two labels it carries
const FINDER_HREF = 'a.button[href="/perfect-fit"]';
const FINDER_TAB = 'vehicle';

/**
 * Folds an authored desktop and mobile picture into one, so a viewport
 * downloads a single image. The desktop sources lead, behind the breakpoint,
 * because a picture takes the first source that matches.
 * @param {Element} desktop the first authored picture
 * @param {Element} mobile the second authored picture
 * @returns {Element} the merged picture
 */
function mergePictures(desktop, mobile) {
  // only the wide sources are worth keeping above the breakpoint
  [...desktop.querySelectorAll('source[media]')].reverse().forEach((source) => {
    source.media = DESKTOP_MEDIA;
    mobile.prepend(source);
  });
  desktop.remove();
  return mobile;
}

/**
 * Reuses whatever the author placed in the block: up to two pictures
 * (desktop + optional mobile art direction), a heading, subcopy paragraphs
 * and CTA links. Authoring order is preserved (an eyebrow line can precede
 * the heading), CTA paragraphs are pulled into their own row at the end.
 * @param {Element} block the hero block
 */
export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')];

  const isImageOnly = (p) => {
    const kids = [...p.children];
    return kids.length > 0 && kids.every((kid) => kid.tagName === 'PICTURE') && !p.textContent.trim();
  };
  const isEmpty = (p) => !p.textContent.trim() && p.children.length === 0;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'hero-image';
  const picture = pictures.length > 1
    ? mergePictures(pictures[0], pictures[1])
    : pictures[0];
  if (picture) {
    imageWrap.append(picture);
    // the hero that opens the page holds the LCP image, and it is the only
    // image in it now, so it can be asked for first
    const section = block.closest('.section');
    if (section && section === section.parentElement.firstElementChild) {
      const img = picture.querySelector('img');
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
    }
  }

  const content = document.createElement('div');
  content.className = 'hero-content';
  [...block.querySelectorAll('h1, h2, h3, h4, h5, h6, p')].forEach((el) => {
    if (el.tagName === 'P' && (el.classList.contains('button-wrapper') || isImageOnly(el) || isEmpty(el))) return;
    content.append(el);
  });

  // the finder page is a page, and a link to it stays a link in every hero but
  // this one, where live offers the modal instead
  if (block.classList.contains('promo')) {
    block.querySelectorAll(FINDER_HREF).forEach((link) => toFinderTrigger(link, FINDER_TAB));
  }

  const ctaWrappers = [...block.querySelectorAll('p.button-wrapper')];
  if (ctaWrappers.length) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-ctas';
    ctaWrappers.forEach((p) => ctas.append(p));
    content.append(ctas);
  }

  block.replaceChildren(imageWrap, content);
}
