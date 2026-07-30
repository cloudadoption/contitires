import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Adds live's Previous and Next controls to a `row` variant that overflows.
 * Live drives its hub carousel with splide; a flex row with `overflow-x: auto`
 * already scrolls by wheel, touch and keyboard, so these controls are the only
 * part that needs script. A row whose tiles already fit gets none.
 * @param {Element} block the cards block
 * @returns {Element|null} the control wrapper, or nothing where the row fits
 */
export function addScrollControls(block) {
  const existing = block.querySelector(':scope > .cards-scroll-controls');
  if (existing) return existing;
  const list = block.querySelector('ul');
  if (!list) return null;

  const step = () => {
    const tile = list.firstElementChild;
    if (!tile) return list.clientWidth;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    return tile.getBoundingClientRect().width + gap;
  };

  const button = (name, label, delta) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `cards-scroll-${name}`;
    el.setAttribute('aria-label', label);
    el.addEventListener('click', () => list.scrollBy({ left: delta() * step(), behavior: 'smooth' }));
    return el;
  };

  const prev = button('prev', 'Previous slide', () => -1);
  const next = button('next', 'Next slide', () => 1);

  const controls = document.createElement('div');
  controls.className = 'cards-scroll-controls';
  controls.append(prev, next);

  // The overflow cannot be measured here and trusted. A block's CSS and its JS
  // load in parallel, so `decorate` can run while the row is still an unstyled
  // grid, where scrollWidth equals clientWidth and the row looks like it fits.
  // Gating on that measurement is why the controls were missing on the rendered
  // page while every unit test passed. So build them always and let this decide
  // whether they are reachable, re-running whenever the box changes.
  const sync = () => {
    const scrollable = list.scrollWidth > list.clientWidth + 2;
    controls.hidden = !scrollable;
    prev.disabled = !scrollable || list.scrollLeft <= 2;
    next.disabled = !scrollable || list.scrollLeft >= list.scrollWidth - list.clientWidth - 2;
  };
  list.addEventListener('scroll', sync, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(sync).observe(list);
  sync();

  block.append(controls);
  return controls;
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
  if (block.classList.contains('row')) addScrollControls(block);
}
