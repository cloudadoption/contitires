import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULT_SOURCE = '/learn/query-index.json';
const BATCH = 12;

/** Drops the " | Continental Tire" suffix the article <title> carries. */
function cleanTitle(title) {
  return (title || '').replace(/\s*\|\s*Continental Tire\s*$/i, '').trim();
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
    const w = Number(row.weight);
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

  // an explicit limit renders a fixed featured set; otherwise render a first
  // batch with a load-more button
  if (limit) {
    rows.slice(0, limit).forEach((row) => {
      const li = document.createElement('li');
      li.append(buildCard(row));
      list.append(li);
    });
    block.append(list);
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
      li.append(buildCard(row));
      list.append(li);
    });
    shown = Math.min(shown + BATCH, rows.length);
    if (shown >= rows.length) more.remove();
  };

  renderNext();
  block.append(list);
  if (shown < rows.length) {
    more.addEventListener('click', renderNext);
    block.append(more);
  }
}
