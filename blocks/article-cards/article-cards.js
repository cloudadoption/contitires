import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULT_SOURCE = '/learn/query-index.json';
const BATCH = 12;

/** Drops the " | Continental Tire" suffix the article <title> carries. */
function cleanTitle(title) {
  return (title || '').replace(/\s*\|\s*Continental Tire\s*$/i, '').trim();
}

/** Builds one teaser: an anchor wrapping the title and the excerpt, no image. */
function buildTeaser(row) {
  const teaser = document.createElement('a');
  teaser.className = 'article-teaser';
  teaser.href = row.path;

  const heading = document.createElement('h3');
  heading.textContent = cleanTitle(row.title);
  teaser.append(heading);

  if (row.description) {
    const desc = document.createElement('p');
    desc.textContent = row.description;
    teaser.append(desc);
  }
  return teaser;
}

/**
 * Rearranges the band the feature variant sits in: the category image becomes
 * a media column, the heading and its subtitle an intro, and the all-articles
 * link closes the band. Below 769 the intro overlays the image, which is why
 * the two are siblings in one grid.
 */
function buildFeatureBand(block) {
  const section = block.closest('.section');
  if (!section) return { media: null, intro: null, link: null };

  const picture = section.querySelector('.default-content-wrapper picture');
  let media = null;
  if (picture) {
    media = document.createElement('div');
    media.className = 'article-cards-media';
    media.append(picture);
  }

  const intro = document.createElement('div');
  intro.className = 'article-cards-intro';
  const heading = section.querySelector('.default-content-wrapper :is(h1, h2, h3, h4, h5, h6)');
  if (heading) {
    const subtitle = heading.nextElementSibling;
    intro.append(heading);
    if (subtitle && subtitle.tagName === 'P') intro.append(subtitle);
  }

  const link = [...section.querySelectorAll('.default-content-wrapper p')]
    .find((p) => p.querySelector('a'));

  return { media, intro, link };
}

/** Clears the section wrappers the feature band has emptied out. */
function dropEmptyWrappers(block) {
  const section = block.closest('.section');
  if (!section) return;
  section.querySelectorAll('.default-content-wrapper').forEach((wrapper) => {
    if (!wrapper.textContent.trim() && !wrapper.querySelector('picture, img')) wrapper.remove();
  });
}

/** Builds one card: an anchor wrapping the optimized image and the title. */
function buildCard(row) {
  const card = document.createElement('a');
  card.className = 'article-card';
  card.href = row.path;

  const figure = document.createElement('div');
  figure.className = 'article-card-image';
  figure.append(createOptimizedPicture(row.image, cleanTitle(row.title), false, [{ width: '750' }]));

  const heading = document.createElement('h3');
  heading.textContent = cleanTitle(row.title);

  const body = document.createElement('div');
  body.className = 'article-card-body';
  body.append(heading);
  if (row.description) {
    const desc = document.createElement('p');
    desc.textContent = row.description;
    body.append(desc);
  }

  card.append(figure, body);
  return card;
}

/**
 * Article cards: fetches a query-index and renders its rows as a card grid,
 * newest first. Shows a first batch and reveals the rest on demand. The
 * index path can be authored in the block; it defaults to the learn index.
 * @param {Element} block the article-cards block
 */
export function selectRows(rows, { category } = {}) {
  // articles carry an editorial `weight` (their position in the live category
  // listing); sort by it ascending. Rows with no weight fall to the end,
  // newest first, so a not-yet-weighted article never jumps the order.
  const weightOf = (row) => {
    // parseFloat, not Number: the index stores an unweighted row as '', and
    // Number('') is 0 (which would sort it first), while parseFloat('') is NaN
    const w = parseFloat(row.weight);
    return Number.isNaN(w) ? Infinity : w;
  };
  return rows
    .filter((row) => row.image && !row.image.includes('/default-meta-image'))
    .filter((row) => !category || (row.category || '').toLowerCase() === category.toLowerCase())
    .sort((a, b) => {
      const wa = weightOf(a);
      const wb = weightOf(b);
      if (wa !== wb) return wa - wb;
      return Number(b.lastModified || 0) - Number(a.lastModified || 0);
    });
}

export default async function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')]
    .map((cell) => cell.textContent.trim())
    .filter(Boolean);
  let source = DEFAULT_SOURCE;
  let category = '';
  let limit = 0;
  cells.forEach((text) => {
    if (text.startsWith('/')) source = text;
    else if (/^\d+$/.test(text)) limit = Number(text);
    else category = text;
  });
  // the learn hub bands show teasers rather than thumbnail cards; the feature
  // band also puts a category image beside them
  const feature = block.classList.contains('feature');
  const teasers = feature || block.classList.contains('columns');
  const band = feature ? buildFeatureBand(block) : null;

  block.textContent = '';

  let rows = [];
  try {
    const resp = await fetch(source);
    if (resp.ok) ({ data: rows = [] } = await resp.json());
  } catch (e) {
    rows = [];
  }

  rows = selectRows(rows, { category });

  const list = document.createElement('ul');
  list.className = 'article-cards-list';
  const build = teasers ? buildTeaser : buildCard;

  if (band) {
    if (band.media) block.append(band.media);
    block.append(band.intro);
  }

  // an explicit limit renders a fixed featured set; otherwise render a first
  // batch with a load-more button
  if (limit) {
    rows.slice(0, limit).forEach((row) => {
      const li = document.createElement('li');
      li.append(build(row));
      list.append(li);
    });
    block.append(list);
    if (band && band.link) block.append(band.link);
    dropEmptyWrappers(block);
    return;
  }

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'article-cards-more';
  more.textContent = 'Load more';

  let shown = 0;
  const renderNext = () => {
    rows.slice(shown, shown + BATCH).forEach((row) => {
      const li = document.createElement('li');
      li.append(build(row));
      list.append(li);
    });
    shown = Math.min(shown + BATCH, rows.length);
    if (shown >= rows.length) more.remove();
  };

  renderNext();
  block.append(list);
  if (band && band.link) block.append(band.link);
  dropEmptyWrappers(block);
  if (shown < rows.length) {
    more.addEventListener('click', renderNext);
    block.append(more);
  }
}
