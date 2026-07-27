/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * Live's article geometry, read off
 * continentaltire.com/learn/how-do-i-check-my-tire-pressure at each width: a
 * 1168px container with 16px padding, so the grid measures
 * min(1136, viewport - 32); a body column of min(755, grid - 345) beside a
 * 300px sidebar with a 45px gap; and a reading measure of 74% of that column.
 */
const LIVE = [
  { vw: 1440, column: 755, reading: 559 },
  { vw: 1200, column: 755, reading: 559 },
  { vw: 1024, column: 647, reading: 479 },
  { vw: 900, column: 523, reading: 387 },
  { vw: 769, column: 392, reading: 290 },
];

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

/** An article as authored: a title section, then a body section. */
function buildArticle() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div><h1>How do I check my tire pressure?</h1></div>
    <div>
      <p>Checking your tire pressure is one of the simplest things you can do
         to keep your car safe, and it takes about five minutes.</p>
      <h2>What you need</h2>
      <p>A tire pressure gauge and the placard inside the driver's door.</p>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  // decorateSections hides each section inline (aem.js:479) and loadSection
  // reveals it (aem.js:634). A hidden grid reports its declared tracks rather
  // than its used ones, so an unloaded fixture measures nothing and proves
  // nothing: reveal the sections the way the page loader does.
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

/**
 * The used widths at `vw`. Reading layout forces it, so no frame is waited on:
 * a backgrounded tab fires no rAF, and under the whole suite these tabs are
 * backgrounded.
 */
async function measure(vw) {
  await setViewport({ width: vw, height: 900 });
  const section = document.querySelector('main .section:has(.share-wrapper)');
  const reading = section.querySelector('.default-content-wrapper');
  const tracks = getComputedStyle(section).gridTemplateColumns
    .split(' ').map((t) => Math.round(parseFloat(t)));
  return {
    vw: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    tracks,
    column: tracks[0],
    sidebar: tracks[1],
    reading: Math.round(reading.getBoundingClientRect().width),
  };
}

// #190: the two-column rule declared a fixed 755px body column and a fixed
// 559px reading measure, both of them live's numbers at 1440. Below 1124 the
// columns no longer fit and every article page scrolled sideways, and every
// block measured inside the column at 900 read 755px against live's 523.
describe('Article body column', () => {
  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css');
    // styles.css keeps the whole body hidden until the page is revealed
    document.body.classList.add('article', 'appear');
    buildArticle();
  });

  after(async () => {
    document.body.classList.remove('article', 'appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  LIVE.forEach(({ vw, column, reading }) => {
    it(`fits the viewport at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.scrollWidth, `scrollWidth at ${vw}`).to.be.at.most(m.vw);
    });

    it(`tracks live's ${column}px column at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.column, `column at ${vw}`).to.be.closeTo(column, 1);
      expect(m.sidebar, `sidebar at ${vw}`).to.equal(300);
    });

    it(`tracks live's ${reading}px reading measure at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.reading, `reading measure at ${vw}`).to.be.closeTo(reading, 1);
    });
  });

  // below live's 769 the sidebar follows the body, one column, and the column
  // is the viewport rather than a share of it
  it('runs one column under 769', async () => {
    const m = await measure(768);
    expect(m.tracks, 'one track').to.have.length(1);
    expect(m.scrollWidth, 'no sideways scroll at 768').to.be.at.most(m.vw);
  });
});
