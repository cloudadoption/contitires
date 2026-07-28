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

/**
 * A partner page as the pipeline delivers it: the section's authored
 * `Style: partner` arrives as a class on the section, and the section holds
 * the gallery, then the logo, title, sharebar and copy.
 */
function buildPartner() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div class="partner">
      <div class="media-gallery">
        <div><div><picture><img src="/icons/search.svg" alt="one"></picture></div></div>
        <div><div><picture><img src="/icons/search.svg" alt="two"></picture></div></div>
      </div>
      <p><picture><img src="/icons/search.svg" alt="AMG Driving Academy"></picture></p>
      <h1>AMG DRIVING ACADEMY</h1>
      <div class="share"></div>
      <p>The AMG Driving Academy allows you to channel your inner speed demon
         at some of the top tracks in the country.</p>
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
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  };
  const gallery = box(section.querySelector('.media-gallery-wrapper'));
  const share = box(section.querySelector('.share'));
  const title = box(section.querySelector('h1'));
  // the gallery's tiles are pictures too, so the logo is named by its column
  const logo = box(section.querySelector('.partner-sidebar picture'));
  const copy = box([...section.querySelectorAll('.partner-sidebar .default-content-wrapper')].pop());
  return {
    vw: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    tracks,
    sectionWidth: Math.round(section.getBoundingClientRect().width),
    gallery,
    share,
    title,
    logo,
    copy,
    galleryLeft: gallery.left,
    galleryWidth: gallery.width,
    shareLeft: share.left,
    shareWidth: share.width,
    titleWidth: title.width,
    titleTop: title.top,
    galleryTop: gallery.top,
  };
}

describe('The partner layout', () => {
  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css', '/blocks/media-gallery/media-gallery.css', '/blocks/share/share.css');
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

  // one element, so the grid holds the column to a single row
  it('stands the sidebar in one element beside the gallery', () => {
    const section = document.querySelector('main .section.partner');
    expect(section.children, 'the gallery and the sidebar').to.have.length(2);
    expect(section.lastElementChild.classList.contains('partner-sidebar')).to.be.true;
    expect(section.querySelectorAll('.partner-sidebar .share')).to.have.length(1);
  });

  // live packs the sidebar at the top of its column: the logo starts level
  // with the gallery, and the four items sit 60, 38 and 45 apart. Three grid
  // items spanning the gallery's three rows share its height out between them
  // instead, which put the sharebar a third of the way down the page.
  it("packs the sidebar at the top, on live's gaps", async () => {
    const m = await measure(1440);
    expect(m.logo.top - m.gallery.top, 'logo level with the gallery').to.equal(0);
    expect(m.title.top - m.logo.bottom, 'logo to title').to.equal(60);
    expect(m.share.top - m.title.bottom, 'title to sharebar').to.equal(38);
    expect(m.copy.top - m.share.bottom, 'sharebar to copy').to.equal(45);
  });

  // an inline image leaves a descender gap under it, which read 160 against
  // live's 153 on a 305 wide 2:1 logo
  it("gives the logo live's 2:1 box", async () => {
    const m = await measure(1440);
    expect(m.logo.height).to.equal(153);
  });

  // the article sidebar drops the sharebar's lower rule and its lower padding.
  // Live keeps both here, which is a 45px bar rather than a 33px one.
  it("draws live's sharebar, ruled above and below", async () => {
    const m = await measure(1440);
    const cs = getComputedStyle(document.querySelector('.partner-sidebar .share'));
    expect(cs.borderTopWidth, 'rule above').to.equal('1px');
    expect(cs.borderBottomWidth, 'rule below').to.equal('1px');
    expect(cs.padding, 'padding').to.equal('8px');
    // the bar's own row is what the last pixel rides on, and the fixture's
    // controls are not the page's, so the page is where the 45 is proved
    expect(m.share.height).to.be.closeTo(45, 1);
  });

  // live pads a partner page 20 each side below 769, where the article
  // template gives 24
  it("takes live's page padding below 769", async () => {
    const m = await measure(768);
    expect(m.gallery.width).to.equal(728);
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

  // live starts a partner page flush under the header, where the article
  // template opens its title section with 40 of padding
  it('starts the page flush under the header', () => {
    expect(value('body.article main .section.partner', 'padding-top')).to.equal('0px');
  });

  // live closes the page with 38 under the columns; ours ran the last tile
  // straight into the social band
  it('closes the page the way live closes it', () => {
    expect(value('body.article main .section.partner', 'padding-bottom')).to.equal('38px');
  });

  // live sets the sidebar copy on a flat 22, where the article template runs
  // its reading column at 1.48, which is 22.2 on a 15px body
  it("sets the sidebar copy on live's line height", () => {
    expect(value('body.article main .section.partner .partner-sidebar .default-content-wrapper', 'line-height')).to.equal('22px');
  });

  it("sets the title on live's scale", () => {
    expect(value(TITLE, 'font-size')).to.equal('30px');
    expect(value(TITLE, 'line-height')).to.equal('38px');
    expect(value(TITLE, 'font-weight')).to.equal('300');
    expect(value(TITLE, 'letter-spacing')).to.equal('3px');
    expect(value(TITLE, 'text-transform')).to.equal('uppercase');
    expect(value(TITLE, 'text-align')).to.equal('center');
  });
});
