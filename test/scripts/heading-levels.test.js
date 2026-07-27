/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/** Renders markup with the sheets under test in effect, so styles compute. */
function render(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

// #181: eighteen pages put an h3 or an h4 straight under the page h1, which
// fails Lighthouse heading-order. The documents move those headings to h2. A
// stylesheet that sizes by level would resize the page along with them, so the
// two sheets that do size by level pin the size instead.
describe('Heading level does not decide heading size', () => {
  const hosts = [];

  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css', '/blocks/promo-bar/promo-bar.css');
    document.body.classList.add('article');
  });

  after(() => {
    hosts.forEach((h) => h.remove());
    document.body.classList.remove('article');
  });

  function subhead(level) {
    const host = render('<main><div class="section"><div class="default-content-wrapper">'
      + `<h${level}>PremiumContact 6 scores points for driving safety</h${level}>`
      + '</div></div></main>');
    hosts.push(host);
    return getComputedStyle(host.querySelector(`h${level}`)).fontSize;
  }

  // live sets 20px on the subhead under an article title, whichever level it
  // authored there: h3 on the news articles, h4 on the campaign ones.
  it('sizes an article subhead at live 20px whether it is h2 or h3', () => {
    expect(subhead(2), 'h2 subhead').to.equal('20px');
    expect(subhead(2), 'h2 reads the same as h3').to.equal(subhead(3));
  });

  function panelHeading(level) {
    const host = render('<div class="promo-bar block"><div class="promo-bar-panel">'
      + '<div class="promo-bar-panel-inner"><div class="promo-bar-panel-content">'
      + `<h${level}>Get a $110 Rebate</h${level}>`
      + '</div></div></div></div>');
    hosts.push(host);
    return getComputedStyle(host.querySelector(`h${level}`)).fontSize;
  }

  it('keeps the promo panel heading one size across levels', () => {
    expect(panelHeading(2), 'h2 panel heading').to.equal(panelHeading(3));
  });
});
