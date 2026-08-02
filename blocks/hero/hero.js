import { getMetadata, loadCSS } from '../../scripts/aem.js';
import { buildBreadcrumb, buildHubBreadcrumb } from '../banner/banner.js';
import decorateVideo, { videoId } from '../video/video.js';

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
 * Live's marquee play control and the modal it opens, on the one page that
 * carries a video: a badge centred over the photo, and a dialog whose whole
 * content is the video block's player, so nothing is asked of YouTube until the
 * click that asked to watch.
 *
 * The dialog is a native one shown modally, which is where the focus trap and
 * Escape come from; media-gallery's is the same shape one block along, and the
 * half the two genuinely share is the player, which is `blocks/video`. Emptying
 * the stage is what stops the sound: `close` fires a task later, so the paths we
 * own empty it first and Escape is caught on `cancel`.
 * @param {Element} link the authored youtube link
 * @returns {{control: Element, modal: Element}} the control and its dialog
 */
function buildPlayer(link) {
  const title = link.textContent.trim();

  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'hero-play';
  control.setAttribute('aria-label', title ? `Play ${title}` : 'Play video');

  const modal = document.createElement('dialog');
  modal.className = 'hero-modal';
  modal.setAttribute('aria-label', title ? `Play ${title}` : 'Play video');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'hero-close';
  close.setAttribute('aria-label', 'Close');

  const stage = document.createElement('div');
  stage.className = 'hero-stage';
  modal.append(close, stage);

  const dismiss = () => {
    stage.replaceChildren();
    modal.close();
  };
  close.addEventListener('click', dismiss);
  modal.addEventListener('cancel', () => stage.replaceChildren());
  modal.addEventListener('close', () => stage.replaceChildren());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) dismiss();
  });

  control.addEventListener('click', () => {
    loadCSS(`${window.hlx?.codeBasePath ?? ''}/blocks/video/video.css`);
    const player = document.createElement('div');
    player.className = 'video block';
    const cell = document.createElement('div');
    const inner = document.createElement('div');
    inner.append(link.cloneNode(true));
    cell.append(inner);
    player.append(cell);
    stage.replaceChildren(player);
    decorateVideo(player);
    // the click on the marquee is the request to watch, so the facade behind it
    // does not need a second one
    player.querySelector('.video-play')?.click();
    modal.showModal();
  });

  return { control, modal };
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
  // a youtube link is live's marquee play control rather than a CTA pill: on
  // /my-first-car-my-first-tires live draws a badge over the photo that opens
  // the film, and the same link in the copy would read as a fourth button. #468
  let videoLink = null;
  authoredContent(block).forEach((el) => {
    if (isEmpty(el)) return;
    const anchor = el.tagName === 'A' ? el : el.querySelector('a[href]');
    if (!videoLink && anchor && videoId(anchor.href)) {
      videoLink = anchor;
      return;
    }
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
  let trail = null;
  if (block.classList.contains('breadcrumb')) {
    // the same rule banner uses: the name the page gives itself, or its title
    // minus the site suffix. Live names a page in the trail the way its
    // navigation names it, which is not always the title. Partners is titled
    // ROLLING WITH THE BEST and reads Partners in the trail.
    const label = getMetadata('breadcrumb')
      || (document.title || '').replace(/\s*\|\s*Continental Tire\s*$/i, '').trim();
    // a section hub has no section above it, so the two-step trail gives
    // nothing there. Live paints one step on /experience naming the hub itself,
    // which is what the hub builder draws. #250
    trail = buildBreadcrumb(window.location.pathname, label)
      || buildHubBreadcrumb(label);
    if (trail) trail.className = 'hero-breadcrumb';
  }

  // the control goes in the photo wrap, so it covers the photo at whatever
  // height the variant divides it to and needs no measurement of its own
  let modal = null;
  if (videoLink) {
    const player = buildPlayer(videoLink);
    imageWrap.append(player.control);
    modal = player.modal;
  }

  // the trail is a sibling of the copy, not the first line of it, which is
  // live's own placement: its `nav.breadcrumb` sits at the top left of the
  // marquee over the photo at every width, on all four pages that carry one.
  // Inside the centred copy it added its own line and the gap under it to the
  // band, 40px that live's band does not spend. #470
  block.replaceChildren(...[trail, imageWrap, content, modal].filter(Boolean));
}
