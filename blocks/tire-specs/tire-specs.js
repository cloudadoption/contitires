const SPECS_URL = '/product-specs.json';

/**
 * Builds a definition list of one size's spec fields, matching the live
 * per-size spec sheet.
 * @param {{size: string, specs: Object}} entry one size and its specs
 * @returns {HTMLDListElement}
 */
function specGrid(entry) {
  const dl = document.createElement('dl');
  dl.className = 'tire-specs-grid';
  Object.entries(entry.specs).forEach(([key, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.append(dt, dd);
  });
  return dl;
}

/**
 * Tire specifications: a size selector plus the selected size's spec sheet,
 * matching the live product page. The product is identified by a slug authored
 * in the block, falling back to the last path segment. Per-size specs are
 * fetched from the code-bus product-specs.json.
 * @param {Element} block the tire-specs block
 */
export default async function decorate(block) {
  const authored = block.textContent.trim();
  const slug = authored || window.location.pathname.replace(/\/$/, '').split('/').pop();
  block.textContent = '';

  let sizes = [];
  try {
    const resp = await fetch(SPECS_URL);
    if (resp.ok) {
      const data = await resp.json();
      sizes = data[slug] || [];
    }
  } catch (e) {
    sizes = [];
  }
  if (!sizes.length) return;

  const heading = document.createElement('h2');
  heading.textContent = 'Specifications';

  const count = document.createElement('p');
  count.className = 'tire-specs-count';
  count.textContent = `${sizes.length} sizes available. Select a size to see its specs.`;

  const select = document.createElement('select');
  select.className = 'tire-specs-select';
  select.setAttribute('aria-label', 'Select a tire size');
  sizes.forEach((entry, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = entry.size;
    select.append(option);
  });

  const panel = document.createElement('div');
  panel.className = 'tire-specs-panel';
  const render = (i) => panel.replaceChildren(specGrid(sizes[i]));
  select.addEventListener('change', () => render(Number(select.value)));
  render(0);

  block.append(heading, count, select, panel);
}
