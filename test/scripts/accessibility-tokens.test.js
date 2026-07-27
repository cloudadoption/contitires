/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/** WCAG relative luminance, from the sRGB channels of a computed colour. */
function luminance(color) {
  const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map((n) => {
    const c = Number(n) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio between two computed colours. */
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Renders markup with the site stylesheet in effect, so styles compute. */
function render(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

// Lighthouse fails color-contrast on the footer legal copy at 4.05:1 and
// link-in-text-block on body links at 2.77:1 against the text around them.
// Both hold /experience/ mobile accessibility at 89, under the merge gate.
describe('Accessibility tokens', () => {
  let sheet;
  let hosts;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/styles.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    hosts = [];
  });

  after(() => hosts.forEach((h) => h.remove()));

  /** The value a custom property takes on :root. */
  function token(name) {
    const rule = [...sheet.cssRules]
      .filter((r) => !(r instanceof CSSMediaRule) && r.selectorText === ':root')
      .find((r) => r.style.getPropertyValue(name));
    return rule ? rule.style.getPropertyValue(name).trim() : null;
  }

  /** The colour a token resolves to, once its aliases are followed. */
  function resolved(name) {
    const probe = render('<span></span>');
    hosts.push(probe);
    probe.firstElementChild.style.color = `var(${name})`;
    return getComputedStyle(probe.firstElementChild).color;
  }

  it('carries a grey that reaches AA against white as body text', () => {
    expect(token('--conti-text-grey'), '--conti-text-grey is defined').to.not.be.null;
    const ratio = contrast(resolved('--conti-text-grey'), 'rgb(255, 255, 255)');
    expect(ratio, `--conti-text-grey on white is ${ratio.toFixed(2)}:1`).to.be.at.least(4.5);
  });

  // the same grey paints surfaces and borders, where no contrast bar applies.
  // Moving those with the text would repaint the site and leave live behind.
  it('leaves the surface grey at the value live paints', () => {
    expect(token('--conti-darkest-grey')).to.equal('#7e7e7e');
  });

  it('gives a link the colour of the text around it, the way live does', () => {
    const host = render('<main><div class="default-content-wrapper">'
      + '<p>Read more at <a href="/x">the site</a> for the schedule.</p>'
      + '</div></main>');
    hosts.push(host);
    const link = host.querySelector('a');
    const para = host.querySelector('p');
    expect(getComputedStyle(link).color).to.equal(getComputedStyle(para).color);
  });

  // axe accepts a link that matches its text exactly, which passes the check
  // while leaving a reader nothing to see. The underline is what marks it.
  it('marks a link in running text with an underline', () => {
    const host = render('<main><div class="default-content-wrapper">'
      + '<p>Read more at <a href="/x">the site</a> for the schedule.</p>'
      + '</div></main>');
    hosts.push(host);
    const link = host.querySelector('a');
    const para = host.querySelector('p');
    expect(getComputedStyle(link).textDecorationLine).to.equal('underline');
    expect(getComputedStyle(link).textDecorationLine)
      .to.not.equal(getComputedStyle(para).textDecorationLine);
  });

  // a list of bare links is not a text block, so no audit fires on it, but a
  // reader still has nothing to go on once the colour is gone
  it('marks a link that stands alone in a list item', () => {
    const host = render('<main><div class="default-content-wrapper">'
      + '<ul><li><a href="/x">A tire guide</a></li></ul></div></main>');
    hosts.push(host);
    expect(getComputedStyle(host.querySelector('a')).textDecorationLine).to.equal('underline');
  });

  it('leaves a call to action styled as a button unmarked', () => {
    const host = render('<main><div class="default-content-wrapper">'
      + '<p class="button-container"><a href="/x" class="button">Find tires</a></p>'
      + '</div></main>');
    hosts.push(host);
    expect(getComputedStyle(host.querySelector('a')).textDecorationLine).to.equal('none');
  });
});
