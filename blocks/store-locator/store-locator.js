/**
 * Static shell for the live store locator: a heading, a disabled location
 * input (no live geolocation/search in this demo) and CTA links. The input
 * is built in JS because it has no default-content representation.
 * @param {Element} block the store-locator block
 */
export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const ctaWrappers = [...block.querySelectorAll('p.button-wrapper')];

  const search = document.createElement('div');
  search.className = 'store-locator-search';
  if (heading) search.append(heading);

  const field = document.createElement('div');
  field.className = 'store-locator-field';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter city, state or zip';
  input.setAttribute('aria-label', 'Enter city, state or zip');
  input.disabled = true;
  field.append(input);
  search.append(field);

  const ctas = document.createElement('div');
  ctas.className = 'store-locator-ctas';
  ctaWrappers.forEach((p) => ctas.append(p));

  block.replaceChildren(search, ctas);
}
