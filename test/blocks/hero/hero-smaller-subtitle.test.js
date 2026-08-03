/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * /experience runs taller than live's below 1025, and the whole of what is left
 * of it is the subtitle. #470
 *
 * The trail is already out of the copy and pinned to the band, which took 40 of
 * the 68 the issue measured. Read on 2026-08-03 through an iframe at the width,
 * live against the published host, naming the box on each side:
 *
 *     width   live   ours     delta
 *     375     362    390.39   +28.39
 *     769     318    332.8    +14.8
 *     1024    318    332.8    +14.8
 *     1440    400    400      0
 *
 * Both bands are the photo strip plus the copy box, and the strip is 160 on both
 * sides at every width read. Live's copy box is 28px top and bottom, which is
 * ours exactly, so the padding is not it. What differs is inside:
 *
 *     element                    live              ours
 *     title, 375 and 1024        30/36, 2 lines    30/36, 2 lines
 *     subtitle                   16px/22px         18px/28.8px
 *     gap above the subtitle     8px               16px
 *
 * 72 + 8 + 22 is live's 102 at 1024 against our 116.8, and 72 + 8 + 66 is its
 * 146 at 375 against our 174.39. Both deltas are the subtitle and its gap, to
 * the pixel.
 *
 * LIVE CARRIES A CLASS FOR IT, `marquee--with-left-backdrop marquee--with-smaller-subtitle`,
 * on exactly the three pages we author `stacked slim breadcrumb`: /experience,
 * /experience/partners and /experience/conti-crew. Live holds 16px/22px on all
 * three and at 1440 as well, so the rule is unbounded rather than shut inside
 * the query below the step. The desktop band is a 400 min-height on both sides
 * and does not move with the type.
 *
 * The two `breadcrumb` pages that are NOT this live variant keep the block's own
 * subtitle: /experience/soccer carries live's breadcrumb class without the
 * backdrop one, and its own subtitle reads 18px there.
 */

const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

/* live's own copy on /experience: a forced break in the title, so the two lines
   are the markup's and not a wrap that moves with the font */
function mount(classes, subtitle = 'a standfirst that runs on for a line or so') {
  document.body.innerHTML = `
    <main><div class="section hero-container"><div class="hero-wrapper">
      <div class="hero ${classes} block">
        <div class="hero-image"><picture><img src="${PHOTO}" alt=""></picture></div>
        <div class="hero-content">
          <h1>INSPIRING <br>CONFIDENCE</h1>
          <p>${subtitle}</p>
        </div>
      </div>
    </div></div></main>`;
  const block = document.querySelector('.hero.block');
  if (block.getBoundingClientRect().height === 0) {
    throw new Error('the hero fixture rendered with no box, so nothing here was measured');
  }
  return block;
}

async function read(classes, width, subtitle) {
  await setViewport({ width, height: 900 });
  const block = mount(classes, subtitle);
  const sub = block.querySelector('.hero-content p');
  const cs = getComputedStyle(sub);
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  return {
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    marginTop: cs.marginTop,
    band: px(block.getBoundingClientRect().height),
    strip: px(block.querySelector('.hero-image').getBoundingClientRect().height),
    title: px(block.querySelector('.hero-content h1').getBoundingClientRect().height),
  };
}

describe('Hero, live\'s smaller subtitle on the three backdrop hubs (#470)', () => {
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

  [375, 1024, 1440].forEach((width) => {
    it(`reads live's 16px subtitle at ${width}`, async () => {
      const s = await read('left stacked slim breadcrumb', width);
      expect(s.fontSize).to.equal('16px');
    });

    it(`reads live's 22px line box at ${width}`, async () => {
      const s = await read('left stacked slim breadcrumb', width);
      expect(s.lineHeight).to.equal('22px');
    });

    it(`sets the subtitle 8px under the title at ${width}`, async () => {
      const s = await read('left stacked slim breadcrumb', width);
      expect(s.marginTop).to.equal('8px');
    });
  });

  it('lands on live\'s 318 band at 1024, on live\'s own copy', async () => {
    // 160 strip + 28 + (72 title + 8 + 22 subtitle) + 28. A one-line subtitle,
    // so the reading does not move with the font's wrapping.
    const s = await read('left stacked slim breadcrumb', 1024, 'Meet the creators');
    expect(s.title, 'the forced two-line title').to.equal(72);
    expect(s.strip, 'the strip live divides at 160').to.equal(160);
    expect(s.band).to.equal(318);
  });

  it('holds the 400 desktop band at 1440', async () => {
    const s = await read('left stacked slim breadcrumb', 1440, 'Meet the creators');
    expect(s.band).to.equal(400);
  });

  describe('the pages this must not reach', () => {
    it('/experience/soccer keeps the block\'s own 18px subtitle', async () => {
      const s = await read('breadcrumb stacked slimmer', 375);
      expect(s.fontSize).to.equal('18px');
      expect(s.marginTop).to.equal('16px');
    });

    it('/events keeps the block\'s own 18px subtitle', async () => {
      const s = await read('stacked tall short', 375);
      expect(s.fontSize).to.equal('18px');
    });

    it('/my-first-car-my-first-tires keeps it too, carrying `slim` without `breadcrumb`', async () => {
      const s = await read('left stacked slim', 375);
      expect(s.fontSize).to.equal('18px');
    });
  });
});
