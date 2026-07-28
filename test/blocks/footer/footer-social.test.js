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

/** The social band as footer.js leaves it: an icon and a label per network. */
const BAND = `
  <footer><div class="footer-links">
    <div class="footer-links-group footer-social">
      <h2 class="footer-social-heading">Follow Us</h2>
      <ul>
        <li><a href="https://www.facebook.com/continentaltire" aria-label="Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 23z"/></svg>
          <span class="footer-social-label">Facebook</span></a></li>
        <li><a href="https://www.youtube.com/continentaltire" aria-label="Youtube">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 23z"/></svg>
          <span class="footer-social-label">Youtube</span></a></li>
      </ul>
    </div>
    <div class="footer-links-group">
      <h2>Our Tires</h2>
      <ul><li><a href="/tires/passenger">Passenger</a></li></ul>
    </div>
  </div></footer>`;

// #198: the four social links painted rgb(51, 51, 51) on their own rgb(51, 51,
// 51) band, so the band read as an empty dark strip on all 330 pages. The white
// rule was there and lost: `.footer-links-group :is(a, button[data-tire-finder])`
// takes its specificity from the most specific branch of the :is(), which is the
// attribute selector, so it outranked `.footer-social a`.
describe('Footer social band', () => {
  let host;

  before(async () => {
    const sheets = await Promise.all(['/styles/styles.css', '/blocks/footer/footer.css']
      .map(async (p) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(p)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    host = document.createElement('div');
    host.innerHTML = BAND;
    document.body.append(host);
  });

  after(() => host.remove());

  const band = () => host.querySelector('.footer-social');
  const links = () => [...host.querySelectorAll('.footer-social a')];

  it('paints every social link against its own band, not into it', () => {
    const bg = getComputedStyle(band()).backgroundColor;
    links().forEach((a) => {
      expect(getComputedStyle(a).color, `${a.getAttribute('aria-label')} colour`)
        .to.not.equal(bg);
    });
  });

  // the ratio no gate we run would have caught: axe returns "can't tell" for a
  // ratio of exactly 1, and Lighthouse scores only violations, so 1:1 read 100
  it('clears the 4.5:1 the audit declined to check', () => {
    const bg = getComputedStyle(band()).backgroundColor;
    links().forEach((a) => {
      const ratio = contrast(getComputedStyle(a).color, bg);
      expect(ratio, `${a.getAttribute('aria-label')} contrast`).to.be.at.least(4.5);
    });
  });

  it('gives the icons the colour of the link they sit in', () => {
    links().forEach((a) => {
      const svg = a.querySelector('svg');
      expect(getComputedStyle(svg).fill, 'icon fill follows currentcolor')
        .to.equal(getComputedStyle(a).color);
    });
  });

  // the column links keep the dark they have always had, on the white footer
  it('leaves the column links dark', () => {
    const column = host.querySelector('.footer-links-group:not(.footer-social) a');
    expect(getComputedStyle(column).color).to.equal('rgb(51, 51, 51)');
  });
});
