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
export default async function decorate(block) {
  const configured = block.textContent.trim();
  const source = configured.startsWith('/') ? configured : DEFAULT_SOURCE;
  block.textContent = '';

  let rows = [];
  try {
    const resp = await fetch(source);
    if (resp.ok) ({ data: rows = [] } = await resp.json());
  } catch (e) {
    rows = [];
  }

  rows = rows
    .filter((row) => row.image)
    .sort((a, b) => Number(b.lastModified || 0) - Number(a.lastModified || 0));

  const list = document.createElement('ul');
  list.className = 'article-cards-list';

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
