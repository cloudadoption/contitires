import { loadCSS } from '../../scripts/aem.js';
import decorateVideo from '../video/video.js';

/**
 * One tile per authored row: the still in the first cell, an optional YouTube
 * link in the second. A row with a link is a video tile.
 * @param {Element} row an authored row
 * @returns {{picture: Element, link: Element}|null} the tile parts, or null
 */
function readRow(row) {
  const picture = row.querySelector('picture');
  const link = row.querySelector('a[href]');
  if (!picture && !link) return null;
  return { picture, link };
}

/** The still, sized for the modal rather than for the tile. */
function buildTile({ picture, link }) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = link ? 'media-gallery-tile media-gallery-tile-video' : 'media-gallery-tile';

  const title = link ? link.textContent.trim() : '';
  const alt = picture ? picture.querySelector('img')?.getAttribute('alt') || '' : '';
  if (link) tile.setAttribute('aria-label', title ? `Play ${title}` : 'Play video');
  else tile.setAttribute('aria-label', alt ? `View ${alt}` : 'View image');

  if (picture) tile.append(picture);
  return tile;
}

/**
 * Media gallery: a grid of square tiles mixing stills and videos, each opening
 * in a modal. The player is the video block's, so a page of videos asks nothing
 * of YouTube until a tile is clicked.
 * @param {Element} block the media-gallery block
 */
export default function decorate(block) {
  const rows = [...block.children].map(readRow).filter(Boolean);
  if (!rows.length) return;

  const modal = document.createElement('dialog');
  modal.className = 'media-gallery-modal';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'media-gallery-close';
  close.setAttribute('aria-label', 'Close');

  const stage = document.createElement('div');
  stage.className = 'media-gallery-stage';
  modal.append(close, stage);

  // the player keeps playing behind a closed modal otherwise. The close event
  // is what catches Escape, but it fires a task later, so the paths we own
  // empty the stage first and the sound stops on the click itself
  const dismiss = () => {
    stage.replaceChildren();
    modal.close();
  };
  close.addEventListener('click', dismiss);
  modal.addEventListener('close', () => stage.replaceChildren());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) dismiss();
  });

  const list = document.createElement('ul');
  list.className = 'media-gallery-list';

  rows.forEach(({ picture, link }) => {
    const item = document.createElement('li');
    const full = picture ? picture.cloneNode(true) : null;
    const tile = buildTile({ picture, link });

    tile.addEventListener('click', () => {
      if (link) {
        // hand the selection to the video block: it owns the facade and the
        // click-to-load, and the tile click is the click that asked for it
        loadCSS(`${window.hlx?.codeBasePath ?? ''}/blocks/video/video.css`);
        const player = document.createElement('div');
        player.className = 'video block';
        const cell = document.createElement('div');
        const inner = document.createElement('div');
        if (full) inner.append(full);
        inner.append(link.closest('p') ?? link);
        cell.append(inner);
        player.append(cell);
        stage.replaceChildren(player);
        decorateVideo(player);
        player.querySelector('.video-play')?.click();
      } else {
        stage.replaceChildren(full);
      }
      modal.showModal();
    });

    item.append(tile);
    list.append(item);
  });

  block.replaceChildren(list, modal);
}
