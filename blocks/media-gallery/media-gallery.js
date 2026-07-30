import { loadCSS } from '../../scripts/aem.js';
import decorateVideo from '../video/video.js';

/**
 * One item per authored row: the still in the first cell, an optional YouTube
 * link in the second, and in the third either a description or a link on to
 * another page. A row with a video link is a video. The third cell is read by
 * the cards variant alone.
 *
 * The third cell holds one of two things and is told apart by what it HOLDS
 * rather than by a variant: /cruisingthecontinentalus writes a sentence there,
 * /learn/product-highlights writes the tire's page. An anchor is a structure
 * and not a guess about a string, so the two cannot be confused the way a
 * category of digits and a limit can.
 * @param {Element} row an authored row
 * @returns {{picture: Element, link: Element, text: string, cta: Element}|null} the item
 */
function readRow(row) {
  const picture = row.querySelector('picture');
  const cells = [...row.children];
  const link = cells[1]?.querySelector('a[href]') || row.querySelector('a[href]');
  if (!picture && !link) return null;
  const third = cells[2];
  const cta = third?.querySelector('a[href]') || null;
  const text = cta ? '' : third?.textContent.trim() || '';
  return {
    picture, link, text, cta,
  };
}

/**
 * What the item is called: the video's title, or what the still shows.
 * @param {{picture: Element, link: Element}} item one item
 * @returns {string} the title
 */
function titleOf({ picture, link }) {
  if (link) return link.textContent.trim();
  return picture?.querySelector('img')?.getAttribute('alt') || '';
}

/**
 * The name live prints under a card, then either the description it prints on
 * the cards it shows one for, or the link it puts on the cards that lead
 * somewhere. Live's product highlight card ends on `Tire details`.
 * @param {{picture: Element, link: Element, text: string, cta: Element}} item one item
 * @returns {Element} the caption
 */
function buildCaption(item) {
  const caption = document.createElement('div');
  caption.className = 'media-gallery-caption';
  const heading = document.createElement('h3');
  heading.textContent = titleOf(item);
  caption.append(heading);
  if (item.text) {
    const text = document.createElement('p');
    text.textContent = item.text;
    caption.append(text);
  }
  if (item.cta) {
    const cta = document.createElement('p');
    cta.className = 'media-gallery-cta';
    const link = item.cta.cloneNode(true);
    // the still beside it already opens the video, so the name the card gives
    // assistive tech has to say which tire this link is for
    link.setAttribute('aria-label', `${link.textContent.trim()} for ${titleOf(item)}`);
    cta.append(link);
    caption.append(cta);
  }
  return caption;
}

/**
 * Live's Social tile: the still is the whole of a link out to the post. The
 * authored cell holds the URL as its own link text, which is an address rather
 * than a name, so the anchor takes the picture alone and the still's alt text
 * names it.
 *
 * Live opens a new tab with `rel="nofollow"` and no `noopener`, which hands the
 * opened page a handle on ours. We keep live's target and add `noopener`: it
 * changes nothing a visitor sees.
 * @param {{picture: Element, link: Element}} item one item
 * @returns {Element} the anchor
 */
function buildLinkTile({ picture, link }) {
  const href = link.getAttribute('href');
  const anchor = document.createElement('a');
  anchor.className = 'media-gallery-link';
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'nofollow noopener';
  anchor.title = `Go to ${href}`;
  if (picture) anchor.append(picture.cloneNode(true));
  return anchor;
}

/**
 * What opening an item does, for whoever cannot see the still.
 * @param {{picture: Element, link: Element}} item one item
 * @returns {string} the label
 */
function label(item) {
  const title = titleOf(item);
  if (item.link) return title ? `Play ${title}` : 'Play video';
  return title ? `View ${title}` : 'View image';
}

/**
 * The grid tile and the strip thumbnail are the same button at two sizes.
 * @param {{picture: Element, link: Element}} item one item
 * @param {string} kind `tile` or `thumb`
 * @returns {Element} the button
 */
function buildButton(item, kind) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = item.link
    ? `media-gallery-${kind} media-gallery-${kind}-video`
    : `media-gallery-${kind}`;
  button.setAttribute('aria-label', label(item));
  if (item.picture) button.append(item.picture.cloneNode(true));
  return button;
}

/**
 * Media gallery: a grid of square tiles mixing stills and videos, opening on a
 * modal that pages the whole set. The player is the video block's, so a page of
 * videos asks nothing of YouTube until someone asks to watch one.
 *
 * The `cards` variant is the same gallery in the shape live gives a landing
 * page: a wider still with the video's name under it, and the description on
 * the cards live shows one for.
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

  // The `social` variant is the one place a linked row is NOT a video. Live's
  // /events Social row links out to Instagram, so the tile is an anchor and
  // there is no player, no modal and nothing to page through.
  if (block.classList.contains('social')) {
    const links = document.createElement('ul');
    links.className = 'media-gallery-list';
    items.filter((item) => item.link).forEach((item) => {
      const cell = document.createElement('li');
      cell.append(buildLinkTile(item));
      links.append(cell);
    });
    block.replaceChildren(links);
    return;
  }

  const captions = block.classList.contains('cards');

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
    // live's card names the video under the still, and the still itself is the
    // whole of the click target
    if (captions) cell.append(buildCaption(item));
    list.append(cell);
  });

  block.replaceChildren(list, modal);
}
