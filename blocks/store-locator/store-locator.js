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

  if (result) {
    result.className = 'store-locator-result';
    // split the result into a distance column and a details column, matching
    // the live layout: "3.29 MI" sits left of the store name and address. The
    // paragraphs are nested in the row's cell, so read them as descendants.
    const paras = [...result.querySelectorAll('p')];
    const [distance, ...rest] = paras;
    if (distance) {
      distance.className = 'store-locator-distance';
      const details = document.createElement('div');
      details.className = 'store-locator-details';
      rest.forEach((p) => details.append(p));
      result.replaceChildren(distance, details);
    }
  }
  if (ctas) ctas.className = 'store-locator-ctas';
}
