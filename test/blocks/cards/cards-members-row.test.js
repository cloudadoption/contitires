/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate, { addScrollControls } from '../../../blocks/cards/cards.js';

/**
 * Live's `/experience` hub runs its Conti Crew row as a scrolling carousel, not
 * a static grid. Read off continentaltire.com/experience at 1440 on 2026-07-30:
 *
 *   list      .splide__list, display flex, scrollWidth 1588 into clientWidth 1192
 *   slides    4, no clones: straight-pipes, gears-gasoline, speed-academy,
 *             engineering-explained
 *   tile      380x325, two images (the photo and the show's logo badge)
 *   controls  a Previous slide and a Next slide button, labels "1 of 4".."4 of 4"
 *
 * Ours was a 1200-into-1200 grid of 282x265 single-image tiles with no controls,
 * so it never scrolled and carried no badge.
 *
 * NOTE ON THE FIFTH SHOW. This row reaches FOUR shows on live, not five. Its
 * splide reports four slides with no clones and its arrows count "1 of 4" to
 * "4 of 4". Dinner With Racers is absent from the hub and appears only on
 * /experience/conti-crew, which carries five and which we already match. So the
 * row is not built to reach a fifth show; it is built to match live's shape.
 *
 * The tile itself is the `members` variant already built for #252. This adds the
 * scrolling row around it rather than a second tile. Issue #250.
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
  return block;
}

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

describe("Cards, live's scrolling hub row", () => {
  before(async () => {
    await adopt('/styles/styles.css', '/blocks/cards/cards.css');
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it('lays the tiles in one scrolling flex row', async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = buildRow().querySelector('ul');
    const styles = getComputedStyle(list);
    expect(styles.display).to.equal('flex');
    expect(styles.overflowX).to.equal('auto');
  });

  it("holds live's 380 wide tile so four of them overflow 1192", async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = buildRow().querySelector('ul');
    const tile = list.firstElementChild;
    expect(Math.round(tile.getBoundingClientRect().width)).to.equal(380);
    expect(list.scrollWidth, 'wider than the row it sits in')
      .to.be.greaterThan(list.clientWidth + 2);
  });

  it('does not scroll when the tiles already fit', async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = buildRow(2).querySelector('ul');
    expect(list.scrollWidth).to.be.at.most(list.clientWidth + 2);
  });

  it('uppercases the section heading at 30px, as live does', async () => {
    await setViewport({ width: 1440, height: 900 });
    buildRow();
    const h2 = document.querySelector('.section.cards-container h2');
    const styles = getComputedStyle(h2);
    expect(styles.textTransform).to.equal('uppercase');
    expect(styles.fontSize).to.equal('30px');
  });
});

describe('Cards, the hub row scroll controls', () => {
  before(async () => {
    await adopt('/styles/styles.css', '/blocks/cards/cards.css');
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it('adds a previous and a next control, labelled as live labels them', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow();
    addScrollControls(block);
    const prev = block.querySelector('.cards-scroll-prev');
    const next = block.querySelector('.cards-scroll-next');
    expect(prev, 'a previous control').to.exist;
    expect(next, 'a next control').to.exist;
    expect(prev.tagName).to.equal('BUTTON');
    expect(prev.getAttribute('type')).to.equal('button');
    expect(prev.getAttribute('aria-label')).to.equal('Previous slide');
    expect(next.getAttribute('aria-label')).to.equal('Next slide');
  });

  it('starts with previous disabled and next available', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow();
    addScrollControls(block);
    expect(block.querySelector('.cards-scroll-prev').disabled, 'at the start').to.be.true;
    expect(block.querySelector('.cards-scroll-next').disabled).to.be.false;
  });

  it('scrolls one tile on when next is pressed', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow();
    addScrollControls(block);
    const list = block.querySelector('ul');
    const step = list.firstElementChild.getBoundingClientRect().width;
    block.querySelector('.cards-scroll-next').click();
    await new Promise((r) => setTimeout(r, 50));
    expect(list.scrollLeft, 'moved about one tile').to.be.closeTo(step + 20, 24);
  });

  it('adds no controls when the row does not scroll', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow(2);
    addScrollControls(block);
    expect(block.querySelector('.cards-scroll-next'), 'nothing to scroll to').to.not.exist;
  });
});
