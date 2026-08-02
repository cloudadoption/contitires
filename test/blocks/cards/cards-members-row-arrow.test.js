/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate, { addScrollControls } from '../../../blocks/cards/cards.js';

/**
 * The Conti Crew row's next control. The row and its two buttons already
 * existed; nothing on /experience drew them.
 *
 * Read off continentaltire.com/experience on 2026-08-03. Live's splide holds
 * four slides with no clones, its track is `overflow: visible` so the row
 * bleeds past the right viewport edge, and it shows ONE arrow at a time: a
 * 64x64 white square with a black glyph and a `0 0 32px rgb(0 0 0 / 25%)`
 * shadow, flush to a viewport edge and centred on the row.
 *
 *     width   first slide   last slide ends   next arrow
 *      1440       156            1724          1376..1440
 *      1200        36            1444          1136..1200
 *      1025        20            1216           961..1025
 *      1024        20            1215           960..1024
 *       769        20            1310           705..769
 *       768        20            1308          display: none
 *       375        20            1296          display: none
 *
 * So the arrow appears from 769, which is this project's own first step, and
 * its right edge is the viewport's right edge at every width above it. One
 * click moves the row 376 and the prev arrow takes over at 0..64, rotated.
 *
 * Ours on main--contitires--cloudadoption.aem.live at 1440: four tiles, the row
 * clipped at the 1136 content column so its right edge was 1288 and the fourth
 * tile sat off-screen, and both controls under the row at y924 drawn as
 * `border: 1px solid var(--conti-white)` circles with a white glyph on the
 * band's own white. Present in the DOM, invisible on the page.
 */
function buildRow(count = 4) {
  const tile = (n) => `
    <div>
      <div><picture><img src="./photo${n}.jpg" alt="show ${n}"></picture></div>
      <div><picture><img src="./logo${n}.png" alt="logo ${n}"></picture><p><a href="/experience/conti-crew/show-${n}">Show ${n}</a></p></div>
    </div>`;
  document.body.innerHTML = `
    <main><div class="section cards-container"><div class="default-content-wrapper"><h2>Conti Crew</h2></div>
      <div class="cards-wrapper"><div class="cards members row block">
        ${Array.from({ length: count }, (_, i) => tile(i + 1)).join('')}
      </div></div>
    </div></main>`;
  const block = document.querySelector('.cards');
  decorate(block);
  addScrollControls(block);
  if (block.getBoundingClientRect().height === 0) {
    throw new Error('the row fixture rendered with no box, so nothing here was measured');
  }
  return block;
}

const rect = (el) => el.getBoundingClientRect();
const centre = (el) => rect(el).top + rect(el).height / 2;
const viewport = () => document.documentElement.clientWidth;

describe("Cards, the hub row's next control against live's own", () => {
  let sheets;

  before(async () => {
    sheets = await Promise.all(['/styles/styles.css', '/blocks/cards/cards.css']
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

  it('draws the control on the band rather than in the band\'s own white', async () => {
    await setViewport({ width: 1440, height: 900 });
    const next = buildRow().querySelector('.cards-scroll-next');
    const styles = getComputedStyle(next);
    expect(styles.backgroundColor, 'live fills it white').to.equal('rgb(255, 255, 255)');
    expect(styles.color, 'and sets the glyph dark').to.not.equal('rgb(255, 255, 255)');
    expect(styles.width).to.equal('64px');
    expect(styles.height).to.equal('64px');
  });

  it('sits at the right viewport edge, centred on the row, as live does', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow();
    const next = block.querySelector('.cards-scroll-next');
    const list = block.querySelector('ul');
    expect(Math.round(rect(next).right), 'flush right').to.equal(viewport());
    expect(Math.abs(centre(next) - centre(list)), 'on the row').to.be.at.most(1);
  });

  it('bleeds the row past the content column to that same edge', async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = buildRow().querySelector('ul');
    expect(Math.round(rect(list).right), 'our row stopped at 1288').to.equal(viewport());
  });

  it('leaves the row resting where it rested, at the column\'s own inset', async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = buildRow().querySelector('ul');
    expect(Math.round(rect(list.firstElementChild).left)).to.equal(152);
  });

  it('draws one control at a time, the way live draws one', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow();
    const prev = block.querySelector('.cards-scroll-prev');
    expect(prev.disabled, 'nowhere to go back to yet').to.be.true;
    expect(getComputedStyle(prev).display, 'so live draws none').to.equal('none');
    expect(getComputedStyle(block.querySelector('.cards-scroll-next')).display).to.not.equal('none');
  });

  it('takes the control away below 769, where live takes its own away', async () => {
    await setViewport({ width: 768, height: 900 });
    const controls = buildRow().querySelector('.cards-scroll-controls');
    expect(getComputedStyle(controls).display).to.equal('none');
  });

  it('draws it at 769, where live draws its own', async () => {
    await setViewport({ width: 769, height: 900 });
    const block = buildRow();
    expect(getComputedStyle(block.querySelector('.cards-scroll-controls')).display).to.not.equal('none');
    expect(Math.round(rect(block.querySelector('.cards-scroll-next')).right)).to.equal(viewport());
  });

  it('keeps a row that does not scroll from drawing a control at all', async () => {
    await setViewport({ width: 1440, height: 900 });
    const controls = buildRow(2).querySelector('.cards-scroll-controls');
    expect(controls.hidden, 'the block marks it out of reach').to.be.true;
    expect(getComputedStyle(controls).display, 'and the sheet honours that').to.equal('none');
  });
});
