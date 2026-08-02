/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/*
 * The social band's list was capped at 1264 and centred, so its four cells were
 * narrower than live's and every icon sat inside live's position. Live's list
 * runs the viewport. Measured at 1440 on continentaltire.com and on main,
 * /tires/vancontact-winter, 2026-08-02:
 *
 *                     live                    ours before
 *     list box        0 to 1440, no cap       88 to 1352, max-width 1264px
 *     cell centres    180 540 900 1260        246 562 878 1194
 *     icon centres    142 532 859 1226        208 554 837 1160
 *
 * The cells are quarters, so a cell centre is (i + 0.5) * width / 4. The icon
 * sits left of it by half its label plus the 7px gap, which is a label width
 * and not something this touches. So the assertion is on the cells: they are
 * the quarters of the viewport, and the band is not capped.
 */

/** The four quarters of a 1440 viewport, live's cell centres. */
const LIVE_CELL_CENTRES = [180, 540, 900, 1260];

/* the wrapper chain the page builds: the section wrapper, the block, then the
   content the block writes. `footer .footer ul` resets the UA's list padding
   from there, so a fixture without it measures 40px wider than the page. */
const BAND = `
  <footer class="footer-wrapper"><div class="footer block"><div class="footer-content">
    <div class="footer-links-group footer-social">
      <h2 class="footer-social-heading">Follow Us</h2>
      <ul>
        <li><a href="https://www.facebook.com/x" aria-label="Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 23z"/></svg>
          <span class="footer-social-label">Facebook</span></a></li>
        <li><a href="https://twitter.com/x" aria-label="X">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 23z"/></svg>
          <span class="footer-social-label">X</span></a></li>
        <li><a href="https://www.instagram.com/x" aria-label="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 23z"/></svg>
          <span class="footer-social-label">Instagram</span></a></li>
        <li><a href="https://www.youtube.com/x" aria-label="Youtube">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 23z"/></svg>
          <span class="footer-social-label">Youtube</span></a></li>
      </ul>
    </div>
  </div></div></footer>`;

describe('Footer social band, the list runs the viewport like live\'s (#141)', () => {
  let sheets;
  let host;

  before(async () => {
    sheets = await Promise.all(['/styles/styles.css', '/blocks/footer/footer.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
    host = document.createElement('div');
    host.innerHTML = BAND;
    document.body.append(host);
    await setViewport({ width: 1440, height: 900 });
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    host.remove();
    await setViewport({ width: 1440, height: 900 });
  });

  const list = () => host.querySelector('.footer-social ul');
  const cells = () => [...host.querySelectorAll('.footer-social li')];

  it('spans the full 1440 rather than the capped 1264', () => {
    const r = list().getBoundingClientRect();
    expect(Math.round(r.width), 'the list is as wide as the band').to.equal(1440);
    expect(Math.round(r.left), 'and starts at the viewport edge').to.equal(0);
  });

  it('puts the four cells on live\'s quarter centres', () => {
    const centres = cells().map((li) => {
      const r = li.getBoundingClientRect();
      return Math.round(r.left + r.width / 2);
    });
    expect(centres).to.eql(LIVE_CELL_CENTRES);
  });

  // the band itself was already full width; the cap was on the list inside it,
  // so the two used to disagree
  it('lines the list up with the band it sits in', () => {
    const band = host.querySelector('.footer-social').getBoundingClientRect();
    const inner = list().getBoundingClientRect();
    expect(Math.round(inner.width), 'list against band width').to.equal(Math.round(band.width));
  });
});
