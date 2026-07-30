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
//
// #185 narrowed the article half of this to below 769, which is where live
// holds a subhead at one size across levels. Above 769 live sizes an article
// h2 and h3 differently and this repo now follows it.
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

  async function articleRule(selector, media) {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/article.css')).text());
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const rule = [...rules].reverse().find((r) => r.selectorText === selector
      && r.style.getPropertyValue('font-size'));
    return rule ? rule.style.getPropertyValue('font-size').trim() : null;
  }

  const wrapper = 'body.article main .section .default-content-wrapper';

  // Below 769 live sets 20px on an article subhead at either level, so the
  // promotion #181 made costs nothing there. ABOVE 769 live does let the level
  // decide: it drops its own pin and an h2 takes the global 30px while an h3
  // stays 20px bold. Measured on /learn/how-do-i-check-my-tire-pressure, where
  // live's six h2 subheads read 20px at 375 and 30px at 900 and 1440. So this
  // claim holds below 769 and is narrowed to it; #185 corrects the rest.
  it('sizes an article subhead at live 20px whether it is h2 or h3, below 769', async () => {
    expect(await articleRule(`${wrapper} h2`), 'h2 subhead').to.equal('20px');
    expect(await articleRule(`${wrapper} h3`), 'h3 subhead').to.equal('20px');
  });

  it('follows live above 769, where an h2 returns to the global 30px', async () => {
    expect(await articleRule(`${wrapper} h2`, '769px')).to.equal('30px');
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
