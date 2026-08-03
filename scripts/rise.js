/**
 * Blocks rise into place as the reader reaches them, which is the motion live
 * carries across the site.
 *
 * Live's own values, read off three rendered pages rather than guessed: one
 * `fadeInUp` everywhere, `opacity: 0` and `translate3d(0, 100%, 0)` to
 * `opacity: 1` and no transform, `--animate-duration: 1s`, `ease`,
 * `animation-fill-mode: both`, and 100ms of `animation-delay` between
 * neighbours. styles/lazy-styles.css holds those numbers; this file decides
 * what takes them and when.
 *
 * Live triggers all of it at load. Every animation on `/`, `/learn/news` and
 * `/learn/technology` reported a `startTime` between 96ms and 158ms, and none
 * started after the page was scrolled. This triggers on entry instead, for two
 * reasons. A page here runs 2178px to 6284px against live's 2033px to 5437px,
 * so a load-time pass would animate most of the page where nobody is looking.
 * And fading the first screen in holds LCP behind the fade.
 *
 * Nothing is hidden that the reader can already see, and nothing at all is
 * hidden without this script running: `rise` is added here and never delivered,
 * so a page with no JavaScript, or with a broken module, shows everything.
 */

// the hidden state, and the animation that undoes it. Both are declared in
// styles/lazy-styles.css.
const ARMED = 'rise';
const PLAYING = 'rise-in';

// how far into the viewport an item is before it plays. A tenth of the screen,
// so an item barely showing at the bottom edge is not already gone.
const MARGIN = '0px 0px -10% 0px';

// the longest cascade, in stagger steps. Live's own order classes stop at
// `animated-order-7`, six steps of 100ms. A screenful arriving in one callback
// would otherwise leave the last item hidden for a second after the reader had
// reached it.
const LONGEST = 6;

/**
 * The elements inside a group that move, which is live's unit: a card, a list
 * item, a heading, a paragraph. Descends past wrappers that hold one thing,
 * then takes that thing's children, and takes a list's items in place of the
 * list so a grid cascades card by card the way live's does.
 *
 * The unit matters more than it looks. `/learn/news` holds its whole 1202px
 * listing in one wrapper whose top edge is 454px down the page, so the wrapper
 * is inside the fold and 800px past it at the same time.
 * @param {Element} group A section's wrapper
 * @returns {Element[]} the elements to move
 */
export function riseItems(group) {
  let node = group;
  while (node.children.length === 1) node = node.firstElementChild;
  const children = [...node.children];
  if (!children.length) return [node];
  return children.flatMap((child) => {
    const items = child.matches('ul, ol') ? [...child.children] : [];
    return items.length > 1 ? items : [child];
  });
}

/**
 * Plays a set of items, cascading down the page. Items that cross the line
 * together cascade together, so the delay counts from the first of the batch
 * rather than from an item's place in its own grid.
 * @param {Element[]} items The items entering, in document order
 */
export function playBatch(items) {
  items.forEach((item, i) => {
    item.style.setProperty('--rise-order', String(Math.min(i, LONGEST)));
    item.classList.remove(ARMED);
    item.classList.add(PLAYING);
  });
}

/**
 * Arms and plays every item below the fold.
 * @param {Element} main The main element
 * @returns {IntersectionObserver|null} null when nothing is animated
 */
export default function riseIntoView(main) {
  if (!main || !window.IntersectionObserver) return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  // where each armed item stands in the document, so a batch cascades down the
  // page. Observer entries arrive in no guaranteed order.
  const place = new Map();

  const observer = new IntersectionObserver((entries) => {
    const entering = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => place.get(a.target) - place.get(b.target))
      .map((entry) => entry.target);
    // once each: nothing re-arms, so scrolling back up leaves it in place
    entering.forEach((item) => observer.unobserve(item));
    playBatch(entering);
  }, { threshold: 0, rootMargin: MARGIN });

  // the first section is the eager one, and it is on screen by definition
  const groups = [...main.children].slice(1).flatMap((section) => [...section.children]);
  groups.flatMap(riseItems).forEach((item) => {
    const box = item.getBoundingClientRect();
    // already in the fold, so hiding it now would blink it out
    if (box.top < window.innerHeight) return;
    if (!box.height) return;
    place.set(item, place.size);
    item.classList.add(ARMED);
    observer.observe(item);
  });

  return observer;
}
