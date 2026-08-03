/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * The marquee copy row of #467. Live sets /my-first-car-my-first-tires apart from
 * every other marquee on the site, and ours ran the block's own size there.
 *
 * Live's rule, out of its own stylesheet, is a page class rather than a layout:
 *
 *     .marquee--my-1st-car .marquee__text {
 *       font-size: 16px; line-height: 22px; letter-spacing: 0.4px }
 *
 * against a base `.marquee__text` of 18px on a 26px box. Read on the rendered
 * page at 1440, 1024 and 375 on 2026-08-03: live holds 16px/22px at 0.4px at all
 * three, at weight 400. Ours read 20px/32px at 1440 and 18px/28.8px below, and
 * the marquee is the only place that copy appears.
 *
 * The one authored shape that reaches it is `hero left stacked slim` without
 * `breadcrumb`, which is this page alone out of the 37 hero blocks on 33 paths.
 * /experience carries `left stacked slim breadcrumb` and takes #470's bold 16px
 * eight pixels under its title, /ev-compatible carries `stacked slim` with no
 * `left` and authors no copy at all.
 */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

function mount(classes) {
  document.body.innerHTML = `
    <main><div class="section hero-container"><div class="hero-wrapper">
      <div class="hero ${classes} block">
        <div class="hero-image"><picture><img src="${PHOTO}" alt=""></picture></div>
        <div class="hero-content">
          <h1>MY <em>FIRST CAR</em>.<br>MY <em>FIRST TIRES</em>.</h1>
          <p>Your first car holds a special place in your heart.</p>
        </div>
      </div>
    </div></div></main>`;
  const block = document.querySelector('.hero.block');
  if (block.getBoundingClientRect().height === 0) {
    throw new Error('the hero fixture rendered with no box, so nothing here was measured');
  }
  return block;
}

async function copy(classes, width) {
  await setViewport({ width, height: 900 });
  const block = mount(classes);
  return getComputedStyle(block.querySelector('.hero-content > p'));
}

describe("Hero, live's my-first-car marquee copy (#467)", () => {
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    sheets = await Promise.all(['/styles/styles.css', '/blocks/hero/hero.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  [1440, 1024, 375].forEach((width) => {
    it(`reads live's 16px on a 22px box at ${width}`, async () => {
      const cs = await copy('left stacked slim', width);
      expect(cs.fontSize).to.equal('16px');
      expect(cs.lineHeight).to.equal('22px');
    });

    it(`reads live's 0.4px tracking at ${width}`, async () => {
      const cs = await copy('left stacked slim', width);
      expect(cs.letterSpacing).to.equal('0.4px');
    });

    it(`leaves it at live's weight 400 at ${width}`, async () => {
      const cs = await copy('left stacked slim', width);
      expect(cs.fontWeight).to.equal('400');
    });
  });

  describe('the pages this must not reach', () => {
    /* live sets 0.4px on that one too and #470's rule does not, which is left
       alone here: tracking moves the wrap at 375 and the band it belongs to is
       that issue's reading. */
    it("/experience keeps #470's bold 16px eight pixels under the title", async () => {
      const cs = await copy('left stacked slim breadcrumb', 375);
      expect(cs.fontWeight, "live's smaller subtitle is bold").to.equal('700');
      expect(cs.marginTop).to.equal('8px');
    });

    it("/experience/soccer keeps the block's own 18px", async () => {
      const cs = await copy('breadcrumb stacked slimmer', 375);
      expect(cs.fontSize).to.equal('18px');
      expect(cs.letterSpacing).to.equal('normal');
    });

    it("/events keeps the block's own 18px", async () => {
      const cs = await copy('stacked tall short', 375);
      expect(cs.fontSize).to.equal('18px');
    });

    it("a bare marquee keeps the block's own size at 1440", async () => {
      const cs = await copy('', 1440);
      expect(cs.fontSize).to.equal('18px');
    });
  });
});
