import { decorateIcons } from '../../scripts/aem.js';

let instances = 0;

/**
 * Lifts the logo into the link that takes it to the shop. An author can link
 * the picture itself, or write the picture and the shop link beside it.
 * @param {Element} cell the row's first cell
 * @returns {Element|null} the logo, linked where the cell named a shop
 */
function logo(cell) {
  const picture = cell.querySelector('picture');
  if (!picture) return null;
  const link = cell.querySelector('a[href]');
  if (!link) return picture;
  link.replaceChildren(picture);
  link.className = 'retailers-logo';
  return link;
}

/**
 * Live's online retailers: a tile per shop, its logo linked to the shop over a
 * Credit Card Financing link that opens the financing terms. Live draws that
 * as a popover under the link, held inside the page at narrow widths.
 *
 * A row is a retailer: the first cell is the logo, linked to the shop, the
 * second the copy behind its financing link. A row with no second cell shows
 * no link, the way live shows the badge only on shops that offer it.
 * @param {Element} block the retailers block
 */
export default function decorate(block) {
  instances += 1;
  const list = document.createElement('ul');
  const tiles = [];

  [...block.children].forEach((row, i) => {
    const [first, second] = [...row.children];
    const mark = first && logo(first);
    const terms = second && second.textContent.trim() ? second : null;
    if (!mark && !terms) return;

    const tile = document.createElement('li');
    if (mark) tile.append(mark);

    if (terms) {
      const id = `retailers-${instances}-${i}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'retailers-financing';
      button.id = `${id}-link`;
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', `${id}-panel`);
      const icon = document.createElement('span');
      icon.className = 'icon icon-credit-card';
      button.append(icon, 'Credit Card Financing');

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'retailers-close';
      close.setAttribute('aria-label', 'Close');

      terms.className = 'retailers-panel';
      terms.id = `${id}-panel`;
      terms.hidden = true;
      terms.prepend(close);

      tile.append(button, terms);
      tiles.push({
        tile, button, close, panel: terms,
      });
    }

    list.append(tile);
  });

  /**
   * Places the panel under its link and holds it inside the page, the way
   * live's own popover keeps a 5px margin and leaves its arrow on the link.
   * @param {object} tile the tile whose panel is open
   */
  const place = ({
    tile,
    button,
    panel,
  }) => {
    panel.style.left = '0';
    const anchor = tile.getBoundingClientRect();
    const link = button.getBoundingClientRect();
    const { width } = panel.getBoundingClientRect();
    const centre = link.left + link.width / 2;
    const room = document.documentElement.clientWidth - width - 5;
    const left = Math.min(Math.max(centre - width / 2, 5), Math.max(room, 5));
    panel.style.left = `${left - anchor.left}px`;
    panel.style.setProperty('--retailers-arrow', `${centre - left}px`);
  };

  const open = (which, on) => {
    which.panel.hidden = !on;
    which.button.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) place(which);
  };

  const closeAll = (except) => tiles
    .forEach((other) => other !== except && open(other, false));

  tiles.forEach((which) => {
    which.button.addEventListener('click', () => {
      const on = which.panel.hidden;
      closeAll(which);
      open(which, on);
    });
    which.close.addEventListener('click', () => {
      open(which, false);
      which.button.focus();
    });
  });

  block.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    tiles.filter(({ panel }) => !panel.hidden).forEach((which) => {
      open(which, false);
      which.button.focus();
    });
  });

  // a click anywhere else closes what is open, and a resize moves it back
  // inside the page
  document.addEventListener('click', (event) => tiles
    .filter(({ tile, panel }) => !panel.hidden && !tile.contains(event.target))
    .forEach((which) => open(which, false)));
  window.addEventListener('resize', () => tiles
    .filter(({ panel }) => !panel.hidden).forEach(place));

  block.replaceChildren(list);
  decorateIcons(block);
}
