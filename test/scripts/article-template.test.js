/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';
import decorateRelated from '../../blocks/related-articles/related-articles.js';
import decorateVideo from '../../blocks/video/video.js';

/**
 * The article template as live draws it, read off
 * continentaltire.com/learn/how-do-i-check-my-tire-pressure at each width.
 *
 * `gap` is the space between the bottom of the title and the top of the body,
 * 60 while the sidebar sits beside the body and 20 once it follows it.
 * `featured` is the media at the head of the body: live keeps its copy to the
 * reading measure and lets the media break out of it by 17% each side, up to
 * the 747 the column caps at. Below 769 the media takes the measure itself.
 */
const LIVE = [
  { vw: 1440, reading: 559, featured: 747 },
  { vw: 1200, reading: 559, featured: 747 },
  { vw: 1024, reading: 479, featured: 642 },
  { vw: 900, reading: 387, featured: 519 },
  { vw: 769, reading: 290, featured: 389 },
];

/** the widths at which live's sidebar follows the body rather than sitting
 *  beside it, one of them live's 769 breakpoint less a pixel */
const NARROW = [768, 375];

const GAP = { beside: 60, under: 20 };

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

/** An article as authored: a title, a featured image, copy, related links. */
function buildArticle() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div><h1>How do I check my tire pressure?</h1></div>
    <div>
      <p><picture><img src="/icons/facebook.svg" alt="A tire gauge"></picture></p>
      <h2>What you need</h2>
      <p>A tire pressure gauge and the placard inside the driver's door.</p>
      <p>Check them cold, before the car has been driven, and check the spare
         while you are down there.</p>
      <div class="related-articles">
        <div><div><ul>
          <li><a href="/learn/tire-rotation">How often should I rotate my tires?</a></li>
          <li><a href="/learn/tread-depth">How do I measure tread depth?</a></li>
        </ul></div></div>
      </div>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  // loadSection runs each block's own decoration, and the list is a list of
  // links until it has: its authored markup has margins the block drops
  decorateRelated(main.querySelector('.related-articles'));
  // decorateSections hides each section inline (aem.js:479) and loadSection
  // reveals it (aem.js:634), so an unloaded fixture measures nothing
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

/** The used geometry at `vw`. Reading layout forces it, so no frame is waited
 *  on: a backgrounded tab fires no rAF, and under the suite these are. */
async function measure(vw) {
  await setViewport({ width: vw, height: 900 });
  const box = (sel) => {
    const el = document.querySelector(sel);
    return el ? el.getBoundingClientRect() : null;
  };
  const title = box('main .section:first-of-type h1');
  const reading = box('main .section:has(.share-wrapper) .default-content-wrapper');
  const featured = box('main .section:has(.share-wrapper) .default-content-wrapper picture');
  const share = box('.share');
  const related = box('.related-articles');
  return {
    reading: Math.round(reading.width),
    featured: Math.round(featured.width),
    gap: Math.round(featured.top - title.bottom),
    underShare: Math.round(related.top - share.bottom),
    fromShareTop: Math.round(related.top - share.top),
  };
}

describe('Article template', () => {
  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css');
    document.body.classList.add('article', 'appear');
    buildArticle();
  });

  after(async () => {
    document.body.classList.remove('article', 'appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  // #192: the featured image took the reading measure, 559 against live's 747
  // at 1440 and 387 against 519 at 900, on all 229 article pages. The measure
  // is right for copy and wrong for the media that sits in it.
  LIVE.forEach(({ vw, reading, featured }) => {
    it(`spans live's ${featured}px featured image at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.reading, `reading measure at ${vw}`).to.be.closeTo(reading, 1);
      expect(m.featured, `featured image at ${vw}`).to.be.closeTo(featured, 1);
    });
  });

  // below 769 live's media takes the measure rather than breaking out of it
  NARROW.forEach((vw) => {
    it(`holds the featured image to the measure at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.featured, `featured image at ${vw}`).to.be.closeTo(m.reading, 1);
    });
  });

  // #200: the gap under the title was 20 at every width, against live's 60
  // while the sidebar sits beside the body
  LIVE.forEach(({ vw }) => {
    it(`leaves live's ${GAP.beside}px under the title at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.gap, `title to body at ${vw}`).to.be.closeTo(GAP.beside, 1);
    });
  });

  NARROW.forEach((vw) => {
    it(`leaves live's ${GAP.under}px under the title at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.gap, `title to body at ${vw}`).to.be.closeTo(GAP.under, 1);
    });
  });

  // #193: the list was pinned to grid row 2 while row 1 held the whole body,
  // so it fell to the foot of the article, 3736px down at 1440 and 4734 at
  // 900, and rendered above the sharebar below 769. Live puts it flush under
  // the sharebar at every width, which reads as 45 there because live's
  // sharebar is 45 tall against our 33.
  [...LIVE.map((l) => l.vw), ...NARROW].forEach((vw) => {
    it(`sits the related list under the sharebar at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.underShare, `related list under the sharebar at ${vw}`).to.be.closeTo(0, 1);
      expect(m.fromShareTop, `related list from the sharebar top at ${vw}`).to.be.below(100);
    });
  });
});

/** An article whose body starts with a block rather than with copy. 51 of the
 *  229 lead with a video. */
function buildVideoArticle() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div><h1>An All-Terrain Tire on a Scion FR-S</h1></div>
    <div>
      <div class="video">
        <div><div><p><a href="https://youtu.be/dQw4w9WgXcQ">Watch the build</a></p></div></div>
      </div>
      <p>The FR-S is not a truck, which is the point of the build.</p>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  // as loadSection would: the authored link has margins the block drops
  decorateVideo(main.querySelector('.video'));
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

// #200 again, on the pages the gap reads differently: live leaves the same 60
// whatever leads the body, and its own embed sits flush at the top of the
// column. Ours read 92 at 1440 and 44 at 375, the block's own margin on top of
// the gap.
describe('Article template, block first', () => {
  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css', '/blocks/video/video.css');
    document.body.classList.add('article', 'appear');
    buildVideoArticle();
  });

  after(async () => {
    document.body.classList.remove('article', 'appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  [[1440, GAP.beside], [900, GAP.beside], [375, GAP.under]].forEach(([vw, gap]) => {
    it(`leaves live's ${gap}px under the title at ${vw}`, async () => {
      await setViewport({ width: vw, height: 900 });
      const title = document.querySelector('main .section:first-of-type h1');
      const lead = document.querySelector('main .section:has(.share-wrapper) .video');
      const under = lead.getBoundingClientRect().top - title.getBoundingClientRect().bottom;
      expect(Math.round(under), `title to body at ${vw}`).to.be.closeTo(gap, 1);
    });
  });
});

/** The shape 6 of the 229 have: one section holding the heading, the copy and
 *  a share block the author placed by hand, so no title section of its own. */
function buildSharedSectionArticle() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <h1>BMW Car Club of America</h1>
      <p>Continental has been a BMW CCA partner since 2019.</p>
      <div class="share"><div><div></div></div></div>
      <p>The club has 69 chapters and more than 60,000 members.</p>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

// the gap belongs to a title section. Where the heading shares the body's
// section there is no gap to set, and the rule would pad the foot of the
// article instead.
describe('Article template, title inside the body', () => {
  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css');
    document.body.classList.add('article', 'appear');
    buildSharedSectionArticle();
  });

  after(async () => {
    document.body.classList.remove('article', 'appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  it('leaves the foot of that section as it was', async () => {
    await setViewport({ width: 1440, height: 900 });
    const section = document.querySelector('main .section:has(.share-wrapper)');
    expect(section, 'the body section is the first one').to
      .equal(document.querySelector('main .section:first-of-type'));
    expect(getComputedStyle(section).paddingBottom, 'padding under the article').to.equal('8px');
  });
});
