/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * The partner layout. Live gives a partner page a gallery down the left and
 * stacks the logo, title, sharebar and copy in a 305px column beside it, which
 * is the article grid with the columns the other way round. Read off
 * continentaltire.com/experience/amg-driving-academy at 1440, 1200, 1025,
 * 1024, 900, 769, 768 and 375. Issue #95.
 */
const LIVE = [
  { vw: 1440, gallery: 750 },
  { vw: 1200, gallery: 750 },
  { vw: 1025, gallery: 643 },
  { vw: 1024, gallery: 642 },
  { vw: 900, gallery: 518 },
  { vw: 769, gallery: 387 },
];

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

/** A partner page as authored: the gallery, then the logo, title, share, copy. */
function buildPartner() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <div class="media-gallery">
        <div><div><picture><img src="/icons/search.svg" alt="one"></picture></div></div>
        <div><div><picture><img src="/icons/search.svg" alt="two"></picture></div></div>
      </div>
      <p><picture><img src="/icons/search.svg" alt="AMG Driving Academy"></picture></p>
      <h1>AMG DRIVING ACADEMY</h1>
      <div class="share"></div>
      <p>The AMG Driving Academy allows you to channel your inner speed demon
         at some of the top tracks in the country.</p>
      <div class="section-metadata"><div><div>Style</div><div>partner</div></div></div>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  // decorateSections hides each section inline and loadSection reveals it. A
  // hidden grid reports its declared tracks rather than its used ones.
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

async function measure(vw) {
  await setViewport({ width: vw, height: 900 });
  const section = document.querySelector('main .section.partner');
  const tracks = getComputedStyle(section).gridTemplateColumns
    .split(' ').map((t) => Math.round(parseFloat(t)));
  const gallery = section.querySelector('.media-gallery-wrapper');
  const share = section.querySelector('.share-wrapper');
  const title = section.querySelector('h1');
  return {
    vw: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    tracks,
    galleryLeft: Math.round(gallery.getBoundingClientRect().left),
    galleryWidth: Math.round(gallery.getBoundingClientRect().width),
    shareLeft: Math.round(share.getBoundingClientRect().left),
    shareWidth: Math.round(share.getBoundingClientRect().width),
    titleWidth: Math.round(title.getBoundingClientRect().width),
    titleTop: Math.round(title.getBoundingClientRect().top),
    galleryTop: Math.round(gallery.getBoundingClientRect().top),
  };
}

describe('The partner layout', () => {
  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css', '/blocks/media-gallery/media-gallery.css');
    document.body.classList.add('article', 'appear');
    buildPartner();
  });

  after(async () => {
    document.body.classList.remove('article', 'appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  LIVE.forEach(({ vw, gallery }) => {
    it(`tracks live's ${gallery}px gallery beside a 305px column at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.tracks, `two tracks at ${vw}`).to.have.length(2);
      expect(m.tracks[0], `gallery track at ${vw}`).to.be.closeTo(gallery, 1);
      expect(m.tracks[1], `sidebar track at ${vw}`).to.equal(305);
    });

    it(`fits the viewport at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.scrollWidth, `scrollWidth at ${vw}`).to.be.at.most(m.vw);
    });
  });

  it('puts the gallery in the left column and everything else in the right', async () => {
    const m = await measure(1440);
    expect(m.galleryWidth, 'gallery width').to.be.closeTo(750, 1);
    expect(m.shareWidth, 'share width').to.equal(305);
    expect(m.titleWidth, 'title width').to.equal(305);
    expect(m.shareLeft - m.galleryLeft, 'sidebar offset').to.equal(795);
  });

  // the gallery leads the page, and the sidebar starts level with it rather
  // than below whatever the gallery measures
  it('starts the sidebar level with the gallery', async () => {
    const m = await measure(1440);
    expect(m.galleryTop).to.be.at.most(m.titleTop);
  });

  // below 769 live stacks them, gallery first
  it('runs one column under 769, gallery first', async () => {
    const m = await measure(768);
    expect(m.tracks, 'one track').to.have.length(1);
    expect(m.galleryTop, 'gallery above the title').to.be.below(m.titleTop);
    expect(m.scrollWidth, 'no sideways scroll at 768').to.be.at.most(m.vw);
  });
});

/**
 * The partner title. Live sets it 30/38, weight 300, tracked 3 and in
 * capitals, centred in the 305px column, where the article template gives a
 * page title 42px across a 940px band.
 */
describe('The partner title', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/article.css')).text());
  });

  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  const TITLE = 'body.article main .section.partner h1';

  it("sets the title on live's scale", () => {
    expect(value(TITLE, 'font-size')).to.equal('30px');
    expect(value(TITLE, 'line-height')).to.equal('38px');
    expect(value(TITLE, 'font-weight')).to.equal('300');
    expect(value(TITLE, 'letter-spacing')).to.equal('3px');
    expect(value(TITLE, 'text-transform')).to.equal('uppercase');
    expect(value(TITLE, 'text-align')).to.equal('center');
  });
});
