import { createOptimizedPicture } from '../../scripts/aem.js';
import { categoryNames } from '../../scripts/categories.js';

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
export function selectRows(rows, { category, subcategory } = {}) {
  // `category` is which LISTING a row belongs to; `subcategory` is which pill it
  // takes inside that listing. Two axes, two fields, and each filters on its
  // own. Everything is the listing with no pill asked for, so a row carrying no
  // pill term shows there and under neither pill, the way live shows its 8.
  const matches = (value, wanted) => !wanted
    || (value || '').toLowerCase() === wanted.toLowerCase();
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
    .filter((row) => matches(row.category, category))
    .filter((row) => matches(row.subcategory, subcategory))
    .sort((a, b) => {
      const wa = weightOf(a);
      const wb = weightOf(b);
      if (wa !== wb) return wa - wb;
      return Number(b.lastModified || 0) - Number(a.lastModified || 0);
    });
}

const LABELS = ['source', 'category', 'subcategory', 'limit'];

/**
 * The block's configuration. An author labels a row and the label says what
 * the value is: Source, Category, Subcategory or Limit. A row that carries one
 * cell is the older shape the learn bands still carry, read by what the value
 * looks like: a leading slash is the index, all digits the limit, anything else
 * the category. That shape cannot tell a category of digits from a limit, which
 * is why the labels are there, and it cannot reach Subcategory at all.
 *
 * Category names the LISTING, Subcategory the pill inside it. A page that leaves
 * Subcategory empty is the Everything view of its listing.
 * @param {Element} block the article-cards block
 * @returns {{source: string, category: string, subcategory: string, limit: number}} the config
 */
export function readConfig(block) {
  const config = {
    source: DEFAULT_SOURCE, category: '', subcategory: '', limit: 0,
  };
  const loose = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children].map((cell) => cell.textContent.trim());
    const label = cells.length > 1 ? cells[0].toLowerCase() : '';
    if (LABELS.includes(label)) {
      const [, value] = cells;
      if (value) config[label] = label === 'limit' ? Number(value) || 0 : value;
    } else {
      loose.push(...cells.filter(Boolean));
    }
  });

  loose.forEach((text) => {
    if (text.startsWith('/')) config.source = text;
    else if (/^\d+$/.test(text)) config.limit = Number(text);
    else config.category = text;
  });
  return config;
}

/**
 * Says what an author typed and what the index publishes under, on the page.
 * A value no article carries renders an empty grid, and an empty grid reads as
 * a section nobody has written yet rather than as a typo. The list comes from
 * the index rather than from the vocabulary, so a value an author adds needs no
 * code change to read right. Issue #124.
 *
 * It names the AXIS that emptied the grid. A page can ask for a listing that is
 * published and a pill term that is not, and naming the listing then sends the
 * reader to the cell that was right. Issue #246.
 * @param {string} field the index field that emptied the grid
 * @param {string} value the value as it was authored
 * @param {Array<Object>} rows every row of the index
 * @returns {HTMLParagraphElement}
 */
function unknownValue(field, value, rows) {
  const published = [...new Set(rows.map((row) => (row[field] || '').trim()).filter(Boolean))];
  const fallback = field === 'category' ? categoryNames().join(', ') : 'nothing yet';
  const known = published.length ? published.join(', ') : fallback;
  const said = `No article is published under "${value}". The index publishes under ${known}.`;
  // eslint-disable-next-line no-console
  console.error(`article-cards: ${said}`);
  const message = document.createElement('p');
  message.className = 'article-cards-error';
  message.textContent = said;
  return message;
}

export default async function decorate(block) {
  const {
    source, category, subcategory, limit,
  } = readConfig(block);
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

  const indexed = rows;
  rows = selectRows(rows, { category, subcategory });

  // an index that answered, a value asked for, and no article carrying it: the
  // cell says something the site does not publish under. Test the listing first,
  // because a listing nobody publishes empties the grid whatever the pill says.
  if (indexed.length && !rows.length) {
    const inListing = selectRows(indexed, { category });
    if (category && !inListing.length) {
      block.append(unknownValue('category', category, indexed));
      return;
    }
    if (subcategory) {
      block.append(unknownValue('subcategory', subcategory, indexed));
      return;
    }
  }

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
