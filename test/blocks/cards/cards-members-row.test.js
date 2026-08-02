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

  /**
   * The control asks for one tile plus the row's gap, with a smooth behaviour.
   * The ARGUMENTS are asserted rather than the resulting scrollLeft, because
   * `behavior: 'smooth'` never animates in this headless runner: setting
   * scrollLeft directly reads back 0 under `scroll-snap-type: x mandatory`,
   * while `scrollBy` with `behavior: 'auto'` lands exactly on 400. The real
   * scroll is proved on the rendered page instead, in .mossy/parity/250/.
   */
  it('asks to scroll one tile plus the gap, smoothly', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow();
    addScrollControls(block);
    const list = block.querySelector('ul');
    const tileWidth = list.firstElementChild.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(list).columnGap);
    const calls = [];
    list.scrollBy = (opts) => calls.push(opts);

    block.querySelector('.cards-scroll-next').click();
    expect(calls, 'next scrolls once').to.have.length(1);
    expect(calls[0].behavior).to.equal('smooth');
    expect(calls[0].left).to.equal(tileWidth + gap);
  });

  it('scrolls back the other way once there is somewhere to go back to', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow();
    addScrollControls(block);
    const list = block.querySelector('ul');
    const step = list.firstElementChild.getBoundingClientRect().width
      + parseFloat(getComputedStyle(list).columnGap);
    // move off the start so the control enables itself, the way a reader would
    list.scrollBy({ left: step, behavior: 'auto' });
    list.dispatchEvent(new Event('scroll'));
    const prev = block.querySelector('.cards-scroll-prev');
    expect(prev.disabled, 'enabled once scrolled').to.be.false;
    const calls = [];
    list.scrollBy = (opts) => calls.push(opts);
    prev.click();
    expect(calls).to.have.length(1);
    expect(calls[0].left, 'the other way').to.equal(-step);
  });

  /**
   * A full step is MORE THAN THE ROW HAS LEFT TO GIVE since the row bleeds to
   * the page edges: the scrollport is the viewport rather than the 1136 column,
   * so four 380 tiles overhang it by 292 and the scroll clamps there. It was
   * exactly one 400 step while the row clipped at 1288.
   */
  it('really scrolls the row when the behaviour is not animated', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow();
    const list = block.querySelector('ul');
    const step = list.firstElementChild.getBoundingClientRect().width
      + parseFloat(getComputedStyle(list).columnGap);
    list.scrollBy({ left: step, behavior: 'auto' });
    expect(list.scrollLeft, 'the row moved').to.be.greaterThan(0);
    expect(list.scrollLeft, 'as far as it goes')
      .to.equal(list.scrollWidth - list.clientWidth);
  });

  /**
   * The controls are built whatever the row measures, and hidden when there is
   * nothing to scroll to. They used to be gated on measuring an overflow inside
   * `decorate`, and that measurement cannot be trusted: a block's CSS and its JS
   * load in parallel, so `decorate` can run while the row is still an unstyled
   * grid whose scrollWidth equals its clientWidth. Every unit test passed and the
   * rendered page had no controls at all.
   */
  it('hides the controls when the row does not scroll', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow(2);
    addScrollControls(block);
    const controls = block.querySelector('.cards-scroll-controls');
    expect(controls, 'still built').to.exist;
    expect(controls.hidden, 'but out of reach').to.be.true;
    expect(block.querySelector('.cards-scroll-next').disabled).to.be.true;
  });

  it('shows them when the row does overflow', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildRow(4);
    addScrollControls(block);
    const controls = block.querySelector('.cards-scroll-controls');
    expect(controls.hidden, 'reachable').to.be.false;
  });
});
