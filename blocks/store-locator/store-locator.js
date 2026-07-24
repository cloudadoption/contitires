/**
 * Static representation of the live "Stores near" module: a search column
 * (heading + disabled location input + use-current-location link) and an
 * example nearest-store result with distance, address, directions and phone,
 * plus CTA links. No live geolocation/search in this demo; the store result
 * is illustrative content authored on the page, matching what the live site
 * renders by default.
 * @param {Element} block the store-locator block
 */
export default function decorate(block) {
  const [search, result, ctas] = [...block.children];

  if (search) {
    search.className = 'store-locator-search';
    const field = document.createElement('div');
    field.className = 'store-locator-field';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter city, state or zip';
    input.setAttribute('aria-label', 'Enter city, state or zip');
    input.disabled = true;
    field.append(input);
    const heading = search.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) heading.after(field);
    else search.prepend(field);
  }

  if (result) result.className = 'store-locator-result';
  if (ctas) ctas.className = 'store-locator-ctas';
}
