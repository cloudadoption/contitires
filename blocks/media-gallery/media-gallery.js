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
 *
 * A linked row is a video everywhere but the `social` variant, where live's
 * link leaves the site for an Instagram post, so the caller says which it is
 * reading and the item carries the answer.
 * @param {Element} row an authored row
 * @param {boolean} social whether the block is live's Social row
 * @returns {{picture: Element, link: Element, text: string, cta: Element,
 *   video: boolean}|null} the item
 */
function readRow(row, social) {
  const picture = row.querySelector('picture');
  const cells = [...row.children];
  const link = cells[1]?.querySelector('a[href]') || row.querySelector('a[href]');
  if (!picture && !link) return null;
  const third = cells[2];
  const cta = third?.querySelector('a[href]') || null;
  const text = cta ? '' : third?.textContent.trim() || '';
  return {
    picture, link, text, cta, video: !!link && !social,
  };
}

/**
 * What the item is called: the video's title, or what the still shows. A Social
 * post's link text is its own URL, which is an address rather than a name, so
 * that one is named by its still like any other photograph.
 * @param {{picture: Element, link: Element, video: boolean}} item one item
 * @returns {string} the title
 */
function titleOf({ picture, link, video }) {
  if (video) return link.textContent.trim();
  return picture?.querySelector('img')?.getAttribute('alt') || '';
}

/**
 * The name live prints under a card, then either the description it prints on
 * the cards it shows one for, or the link it puts on the cards that lead
 * somewhere. Live's product highlight card ends on `Tire details`.
 *
 * The name is an h2 on the cards that stand on their own and a plain span on
 * the ones that end on a call to action. Live gives neither shape a heading,
 * so the level is ours: a card whose name is the left half of a label row
 * beside `Tire details` is not a section of the page, and one that names a
 * video is. h2 rather than h3 because the page above it is an h1 and 2 of the
 * 7 pages carrying this variant author nothing in between.
 * @param {{picture: Element, link: Element, text: string, cta: Element}} item one item
 * @returns {Element} the caption
 */
function buildCaption(item) {
  const caption = document.createElement('div');
  caption.className = 'media-gallery-caption';
  const heading = document.createElement(item.cta ? 'span' : 'h2');
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
 * @param {{picture: Element, link: Element, video: boolean}} item one item
 * @returns {string} the label
 */
function label(item) {
  const title = titleOf(item);
  if (item.video) return title ? `Play ${title}` : 'Play video';
  return title ? `View ${title}` : 'View image';
}

/**
 * The grid tile and the strip thumbnail are the same button at two sizes.
 * @param {{picture: Element, link: Element, video: boolean}} item one item
 * @param {string} kind `tile` or `thumb`
 * @returns {Element} the button
 */
function buildButton(item, kind) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = item.video
    ? `media-gallery-${kind} media-gallery-${kind}-video`
    : `media-gallery-${kind}`;
  button.setAttribute('aria-label', label(item));
  if (item.picture) button.append(item.picture.cloneNode(true));
  return button;
}

/**
 * Live's expand badge, the `+` in the corner of a Social tile. It is on that
 * variant alone because that is the one variant whose tile is a link out: live
 * gives the still no other way to open, and marks the corner it opens from.
 * @param {{picture: Element, link: Element, video: boolean}} item one item
 * @returns {Element} the button
 */
function buildZoom(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'media-gallery-zoom';
  button.setAttribute('aria-label', label(item));
  return button;
}

/**
 * Live's mobile pager: `1 of 6` between two arrows, under the strip. Live's own
 * slider hides every slide but the active one and counts off its own index; the
 * strip here scroll-snaps, so the count follows the scroll and the arrows move
 * it. That makes a swipe move the count too, which live's touch handlers also
 * do. Both wrap, the way live's do.
 * @param {Element} list the tile strip
 * @param {number} total how many tiles
 * @returns {Element} the pager
 */
function buildPager(list, total) {
  const pager = document.createElement('div');
  pager.className = 'media-gallery-pager';
  const count = document.createElement('div');
  count.className = 'media-gallery-pager-count';

  let at = 0;
  const read = (index) => {
    at = index;
    count.textContent = `${index + 1} of ${total}`;
  };
  read(0);

  const cells = [...list.children];
  // the cells snap centred, so the one on screen is the one whose middle is
  // closest to the middle of the strip
  const showing = () => {
    const middle = list.scrollLeft + list.clientWidth / 2;
    const off = (cell) => Math.abs(cell.offsetLeft + cell.offsetWidth / 2 - middle);
    return cells.reduce((best, cell, i) => (off(cell) < off(cells[best]) ? i : best), 0);
  };
  const step = (delta) => {
    const index = (at + delta + total) % total;
    read(index);
    const cell = cells[index];
    list.scrollTo({ left: cell.offsetLeft - (list.clientWidth - cell.offsetWidth) / 2 });
  };
  list.addEventListener('scroll', () => read(showing()), { passive: true });

  const arrow = (name, delta) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `media-gallery-pager-${name}`;
    // live's own arrows carry no name at all, and a button with none is a
    // button a screen reader can only call "button"
    button.setAttribute('aria-label', name === 'prev' ? 'Previous' : 'Next');
    button.addEventListener('click', () => step(delta));
    return button;
  };
  pager.append(arrow('prev', -1), count, arrow('next', 1));
  return pager;
}

/**
 * How many tiles the product viewer draws. Live's product grid keeps the rest
 * of the set for the modal alone, marking those items
 * `media--hidden-media-gallery-item` and giving them no picture at all.
 *
 * Counted on all 56 live tire URLs: 45 carry a viewer and the grid draws 2, 3,
 * 4, 5 or 6, never more. Hidden items appear on 10 of the 45 and each of those
 * draws exactly 6, so the 32 hidden assets are items 7 and up on every page
 * that has any. That is why the cap needs no new row shape and no new cell: an
 * author writes one photograph per paragraph in the hero's image cell, the way
 * they always did, and the seventh onwards is modal only.
 *
 * The cap is the product viewer's alone. Live's article galleries draw the
 * whole set and keep nothing back: 14 tiles on
 * /experience/lingenfelter-performance-engineering, 8 on
 * /experience/usf-pro-championships, 7 on /learn/continental-science-guy, and 0
 * hidden on all 26 article pages that carry one. (#319)
 */
const PRODUCT_TILES = 6;

/**
 * Media gallery: a grid of square tiles mixing stills and videos, opening on a
 * modal that pages the whole set. The player is the video block's, so a page of
 * videos asks nothing of YouTube until someone asks to watch one.
 *
 * The `cards` variant is the same gallery in the shape live gives a landing
 * page: a wider still with the video's name under it, and the description on
 * the cards live shows one for.
 *
 * The `social` variant is live's /events row of Instagram posts. It is the one
 * place a linked row is not a video: the tile is an anchor that leaves the
 * site, and the `+` beside it is what opens the still here. (#341)
 *
 * The modal is a native dialog shown modally, which is where the focus trap,
 * Escape and the handoff back to the tile come from. Live gives none of the
 * three: its dialog is a div, it has no close control, and its thumbnail strip
 * falls below the fold at every width we support.
 * @param {Element} block the media-gallery block
 */
export default function decorate(block) {
  const social = block.classList.contains('social');
  // a Social row is a set of posts, so a row that links nowhere is not one
  const items = [...block.children].map((row) => readRow(row, social))
    .filter((item) => item && (!social || item.link));
  if (!items.length) return;

  const cards = block.classList.contains('cards');

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
    if (item.video) {
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
  // the strip and the stage above took the whole array, so an item the grid
  // skips is still paged to and still opens. slice keeps the indices, which is
  // what lets a tile hand its own position straight to show()
  const drawn = block.classList.contains('product')
    ? items.slice(0, PRODUCT_TILES)
    : items;
  drawn.forEach((item, i) => {
    const cell = document.createElement('li');
    if (social) {
      // the whole tile is the post's link, so the badge in its corner is what
      // opens the still, the way live's own does
      const zoom = buildZoom(item);
      zoom.addEventListener('click', () => {
        show(i, false);
        modal.showModal();
      });
      cell.append(buildLinkTile(item), zoom);
    } else {
      const tile = buildButton(item, 'tile');
      tile.addEventListener('click', () => {
        show(i, true);
        modal.showModal();
      });
      cell.append(tile);
      // live's card names the video under the still, and the still itself is
      // the whole of the click target
      if (cards) cell.append(buildCaption(item));
    }
    list.append(cell);
  });

  // the strip is one tile at a time below 769 and the pager is what says how
  // many there are. It counts what the grid DREW rather than the whole set: a
  // product page keeps its seventh row onwards for the modal, and a count of 11
  // over a strip of 6 pages to a tile that is not there. The cards grid is a
  // column below 769 rather than a slider, and live gives it none
  const pager = !cards && drawn.length > 1 ? buildPager(list, drawn.length) : null;
  block.replaceChildren(...[list, pager, modal].filter(Boolean));
}
