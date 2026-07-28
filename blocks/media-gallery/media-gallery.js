import { loadCSS } from '../../scripts/aem.js';
import decorateVideo from '../video/video.js';

/**
 * One item per authored row: the still in the first cell, an optional YouTube
 * link in the second. A row with a link is a video.
 * @param {Element} row an authored row
 * @returns {{picture: Element, link: Element}|null} the item, or null
 */
function readRow(row) {
  const picture = row.querySelector('picture');
  const link = row.querySelector('a[href]');
  if (!picture && !link) return null;
  return { picture, link };
}

/**
 * What opening an item does, for whoever cannot see the still.
 * @param {{picture: Element, link: Element}} item one item
 * @returns {string} the label
 */
function label({ picture, link }) {
  if (link) {
    const title = link.textContent.trim();
    return title ? `Play ${title}` : 'Play video';
  }
  const alt = picture.querySelector('img')?.getAttribute('alt') || '';
  return alt ? `View ${alt}` : 'View image';
}

/**
 * The grid tile and the strip thumbnail are the same button at two sizes.
 * @param {{picture: Element, link: Element}} item one item
 * @param {string} name `tile` or `thumb`
 * @returns {Element} the button
 */
function buildButton(item, name) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = item.link
    ? `media-gallery-${name} media-gallery-${name}-video`
    : `media-gallery-${name}`;
  button.setAttribute('aria-label', label(item));
  if (item.picture) button.append(item.picture.cloneNode(true));
  return button;
}

/**
 * Media gallery: a grid of square tiles mixing stills and videos, opening on a
 * modal that pages the whole set. The player is the video block's, so a page of
 * videos asks nothing of YouTube until someone asks to watch one.
 *
 * The modal is a native dialog shown modally, which is where the focus trap,
 * Escape and the handoff back to the tile come from. Live gives none of the
 * three: its dialog is a div, it has no close control, and its thumbnail strip
 * falls below the fold at every width we support.
 * @param {Element} block the media-gallery block
 */
export default function decorate(block) {
  const items = [...block.children].map(readRow).filter(Boolean);
  if (!items.length) return;

  const modal = document.createElement('dialog');
  modal.className = 'media-gallery-modal';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'media-gallery-close';
  close.setAttribute('aria-label', 'Close');

  // the arrows sit on the stage rather than in it, because the stage is
  // replaced on every page turn
  const frame = document.createElement('div');
  frame.className = 'media-gallery-frame';
  const stage = document.createElement('div');
  stage.className = 'media-gallery-stage';
  frame.append(stage);
  modal.append(close, frame);

  // the player keeps playing behind a closed modal otherwise. The close event
  // is what catches Escape, but it fires a task later, so the paths we own
  // empty the stage first and the sound stops on the click itself
  const dismiss = () => {
    stage.replaceChildren();
    modal.close();
  };
  close.addEventListener('click', dismiss);
  // Escape raises cancel before the dialog closes, so the sound stops on the
  // key rather than a task later. close is the backstop for any other path
  modal.addEventListener('cancel', () => stage.replaceChildren());
  modal.addEventListener('close', () => stage.replaceChildren());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) dismiss();
  });

  const thumbs = items.length > 1 ? items.map((item) => buildButton(item, 'thumb')) : [];
  let current = 0;

  /**
   * Puts one item on the stage. A page turn is not a request to watch, so the
   * player starts only for the tile click that asked for it.
   * @param {number} index the item to show
   * @param {boolean} play whether to start a video straight away
   */
  const show = (index, play) => {
    const item = items[index];
    current = index;
    if (item.link) {
      // hand the selection to the video block: it owns the facade and the
      // click-to-load
      loadCSS(`${window.hlx?.codeBasePath ?? ''}/blocks/video/video.css`);
      const player = document.createElement('div');
      player.className = 'video block';
      const cell = document.createElement('div');
      const inner = document.createElement('div');
      if (item.picture) inner.append(item.picture.cloneNode(true));
      inner.append(item.link.cloneNode(true));
      cell.append(inner);
      player.append(cell);
      stage.replaceChildren(player);
      decorateVideo(player);
      if (play) player.querySelector('.video-play')?.click();
    } else {
      stage.replaceChildren(item.picture.cloneNode(true));
    }
    // the dialog is named for whatever it is showing
    modal.setAttribute('aria-label', label(item));
    thumbs.forEach((thumb, i) => {
      if (i === index) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    });
  };

  if (items.length > 1) {
    const step = (delta) => show((current + delta + items.length) % items.length);

    const arrow = (name, delta) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `media-gallery-${name}`;
      button.setAttribute('aria-label', name === 'prev' ? 'Previous' : 'Next');
      button.addEventListener('click', () => step(delta));
      return button;
    };
    frame.prepend(arrow('prev', -1));
    frame.append(arrow('next', 1));

    const strip = document.createElement('ul');
    strip.className = 'media-gallery-thumbs';
    thumbs.forEach((thumb, i) => {
      const item = document.createElement('li');
      thumb.addEventListener('click', () => show(i));
      item.append(thumb);
      strip.append(item);
    });
    modal.append(strip);

    modal.addEventListener('keydown', (e) => {
      const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!delta) return;
      e.preventDefault();
      // a keyboard visitor standing on a thumbnail follows the carousel rather
      // than paging the stage away from where they are
      const fromStrip = e.target.classList.contains('media-gallery-thumb');
      step(delta);
      if (fromStrip) thumbs[current].focus();
    });
  }

  const list = document.createElement('ul');
  list.className = 'media-gallery-list';
  items.forEach((item, i) => {
    const cell = document.createElement('li');
    const tile = buildButton(item, 'tile');
    tile.addEventListener('click', () => {
      show(i, true);
      modal.showModal();
    });
    cell.append(tile);
    list.append(cell);
  });

  block.replaceChildren(list, modal);
}
