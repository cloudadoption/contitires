import { getMetadata } from '../../scripts/aem.js';
import { buildBreadcrumb } from '../banner/banner.js';

// the width at which the hero stops stacking, so the desktop art starts here
const DESKTOP_MEDIA = '(min-width: 1025px)';

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
 * What the author wrote, at the level they wrote it. The pipeline nests
 * authored content in row and cell divs, so the walk descends through divs and
 * stops at the first element that is not one.
 * @param {Element} root the block, or a row or cell within it
 * @returns {Element[]} the authored elements, in document order
 */
function authoredContent(root) {
  return [...root.children].flatMap((el) => (el.tagName === 'DIV' ? authoredContent(el) : [el]));
}

/**
 * Reuses whatever the author placed in the block: up to two pictures
 * (desktop + optional mobile art direction), a heading, subcopy paragraphs
 * and CTA links. Authoring order is preserved (an eyebrow line can precede
 * the heading), CTA paragraphs are pulled into their own row at the end.
 * Anything else the author wrote goes through unstyled rather than being
 * dropped, so a list or a table reaches the page.
 * @param {Element} block the hero block
 */
export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')];

  const isEmpty = (el) => !el.textContent.trim() && el.children.length === 0;

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

  // the art pictures are out of the block by now, so the cells that held them
  // read empty and the walk skips them
  const content = document.createElement('div');
  content.className = 'hero-content';
  const ctaWrappers = [];
  authoredContent(block).forEach((el) => {
    if (isEmpty(el)) return;
    if (el.tagName === 'P' && el.classList.contains('button-wrapper')) ctaWrappers.push(el);
    else content.append(el);
  });

  if (ctaWrappers.length) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-ctas';
    ctaWrappers.forEach((p) => ctas.append(p));
    content.append(ctas);
  }

  // Live draws EXPERIENCE / PARTNERS above the marquee title on the three
  // section hubs under /experience and draws no trail on the twelve other
  // pages this block builds, so the trail is a variant the page carries the
  // way live's own marquee carries `marquee--has-breadcrumbs`. hero.css sizes
  // its divided marquee at 160 for exactly this case. #289
  if (block.classList.contains('breadcrumb')) {
    // the same rule banner uses: the name the page gives itself, or its title
    // minus the site suffix. Live names a page in the trail the way its
    // navigation names it, which is not always the title. Partners is titled
    // ROLLING WITH THE BEST and reads Partners in the trail.
    const label = getMetadata('breadcrumb')
      || (document.title || '').replace(/\s*\|\s*Continental Tire\s*$/i, '').trim();
    const trail = buildBreadcrumb(window.location.pathname, label);
    if (trail) {
      trail.className = 'hero-breadcrumb';
      content.prepend(trail);
    }
  }

  block.replaceChildren(imageWrap, content);
}
