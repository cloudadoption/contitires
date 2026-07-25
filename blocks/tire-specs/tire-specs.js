const PRODUCTS_URL = '/products.json';
const LEGACY_SPECS_URL = '/product-specs.json';

/**
 * Loads one product's per-size specs. Reads the multi-sheet DA workbook first:
 * specs.data is a flat list of rows keyed by slug, each row carrying the spec
 * fields in column order. Falls back to the legacy /product-specs.json shape
 * ({ slug: [{ size, specs }] }) when the workbook has no specs sheet.
 * @param {string} slug the product slug
 * @returns {Promise<Array<{size: string, specs: Object}>>}
 */
async function loadSizes(slug) {
  const resp = await fetch(PRODUCTS_URL);
  if (!resp.ok) return [];
  const data = await resp.json();
  if (data.specs && data.specs.data) {
    return data.specs.data
      .filter((row) => row.slug === slug)
      .map((row) => {
        const specs = { ...row };
        delete specs.slug;
        delete specs.size;
        return { size: row.size, specs };
      });
  }
  const legacy = await fetch(LEGACY_SPECS_URL);
  if (!legacy.ok) return [];
  const legacyData = await legacy.json();
  return legacyData[slug] || [];
}

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
 * in the block, falling back to the last path segment. Per-size specs come
 * from the /products.json workbook, or the legacy product-specs.json.
 * @param {Element} block the tire-specs block
 */
export default async function decorate(block) {
  const authored = block.textContent.trim();
  const slug = authored || window.location.pathname.replace(/\/$/, '').split('/').pop();
  block.textContent = '';

  let sizes = [];
  try {
    sizes = await loadSizes(slug);
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
