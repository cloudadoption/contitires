/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * Live's player spans the body column rather than the reading measure inside
 * it. Read off continentaltire.com/learn/celebrating-150-years-continental:
 * the player carries width 747px and a negative margin of 17% on each side,
 * which breaks it out of the 74% copy box and back to the column. Ours sits in
 * the grid item already, so it takes the column without breaking out, capped
 * by the block's own 747px.
 */
const LIVE = [
  { vw: 1440, video: 747, live: 747 },
  { vw: 1024, video: 647, live: 642 },
  { vw: 900, video: 523, live: 519 },
  { vw: 769, video: 392, live: 389 },
];

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

/** An article whose body opens with a video, the way 62 of them do. */
function buildArticle() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div><h1>Celebrating 150 Years of Continental!</h1></div>
    <div>
      <div class="video">
        <div>
          <div>
            <p><picture><img src="/media/poster.png" alt="150 years"></picture></p>
            <p><a href="https://www.youtube.com/watch?v=abc123">Celebrating 150 Years</a></p>
          </div>
        </div>
      </div>
      <p>Continental has been building tires for 150 years, and the anniversary
         film runs through the whole of it, from the first solid rubber tire to
         the tread compounds that carry a car through standing water today. The
         copy has to be long enough to reach its own measure, or it shrinks to
         its content and proves nothing about the player beside it.</p>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

/** The used widths at `vw`; reading layout forces it, so no frame is waited on. */
async function measure(vw) {
  await setViewport({ width: vw, height: 900 });
  const section = document.querySelector('main .section:has(.share-wrapper)');
  const video = section.querySelector('.video');
  const reading = section.querySelector('.default-content-wrapper');
  const box = (el) => (el ? Math.round(el.getBoundingClientRect().width) : -1);
  return {
    vw: window.innerWidth,
    video: box(video),
    reading: box(reading),
  };
}

// #195: the article template capped the player at the reading measure, so at
// 900 it rendered 387 where live gives 519. The block's own sheet already says
// live draws the player wider than the reading column it sits in.
describe('Article video width', () => {
  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css', '/blocks/video/video.css');
    document.body.classList.add('article', 'appear');
    buildArticle();
  });

  after(async () => {
    document.body.classList.remove('article', 'appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  LIVE.forEach(({ vw, video, live }) => {
    it(`spans the column at ${vw}, where live draws ${live}`, async () => {
      const m = await measure(vw);
      expect(m.video, `player at ${vw}`).to.be.closeTo(video, 1);
    });

    it(`draws the player wider than the copy at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.video, `player against copy at ${vw}`).to.be.greaterThan(m.reading);
    });
  });

  // below 769 there is one column and the player takes it, the same as live
  it('takes the single column under 769', async () => {
    const m = await measure(375);
    expect(m.video, 'player at 375').to.equal(m.reading);
  });
});
