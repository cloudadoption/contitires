/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * Below 769 both sites show one tile at a time. Live puts a `1 of 6` counter
 * with an arrow either side under the strip, and a `+` badge on the tile marking
 * it as something that opens. Ours drew neither, so a reader could not see how
 * many photographs there were without swiping to the end.
 *
 * Both numbers come off live's own source rather than a screenshot. Its
 * `con-column-slider` renders `<div class="pager"><button class="prev"></button>
 * <div>1 of 6</div><button class="next"></button></div>` and styles the pager 80
 * wide, centred, `space-between`, 16px clear of the strip, on 16px arrows drawn
 * from a `viewBox 0 0 9 18` chevron in #333 and a 12px count on a line box of 1
 * at 1.25px tracking, bold. The badge is
 * `.media-gallery con-column-slider .media--media-gallery-item:before` inside
 * `max-width: 768px`: 21x21 at bottom 10 right 10, z-index 1, a white circle
 * stroked #ffa500 with a #333 plus.
 *
 * Live reads `1 of 6` on /tires/extremecontact-dws06-plus and `1 of 8` on
 * /learn/celebrating-soccer-charlotte-fc-s-inaugural-home-opener-find-us-game-near-you,
 * so both of live's placements carry it and not one page. The cards grid is not
 * a slider at any width and live gives it neither. Issue #327.
 */
const tile = (src, alt, href, title) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}"></picture></div>
    <div>${href ? `<a href="${href}">${title}</a>` : ''}</div>
  </div>`;

// the CSS is written against the shape the pipeline delivers, so the block
// stands in a section wrapper inside main or none of it applies
const authored = (rows, variant = '') => {
  document.body.innerHTML = '<main><div class="section"><div class="media-gallery-wrapper">'
    + `<div class="media-gallery ${variant} block">${rows.join('')}</div></div></div></main>`;
  return document.querySelector('.media-gallery.block');
};

const stills = (count, variant) => authored(
  Array.from({ length: count }, (v, i) => tile(`/media/shot-${i + 1}.jpg`, `shot ${i + 1}`, '', '')),
  variant,
);

const pagerOf = (block) => block.querySelector('.media-gallery-pager');
const countOf = (block) => block.querySelector('.media-gallery-pager-count').textContent;

describe('Media gallery, the counter live puts under the mobile slider', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('builds the counter after the strip, reading the first of the set', () => {
    decorate(block = stills(3));
    const pager = pagerOf(block);
    expect(pager, 'the pager').to.exist;
    expect(block.querySelector('.media-gallery-list').nextElementSibling, 'under the strip')
      .to.equal(pager);
    expect(countOf(block)).to.equal('1 of 3');
  });

  // live's own two readings, one per placement
  it('counts what live counts on each of its two placements', () => {
    decorate(block = stills(6, 'product'));
    expect(countOf(block), "live's product viewer").to.equal('1 of 6');
    document.body.innerHTML = '';
    decorate(block = stills(8));
    expect(countOf(block), "live's article gallery").to.equal('1 of 8');
  });

  it('names both arrows, which live leaves unnamed', () => {
    decorate(block = stills(3));
    expect(pagerOf(block).querySelector('.media-gallery-pager-prev').getAttribute('aria-label'))
      .to.equal('Previous');
    expect(pagerOf(block).querySelector('.media-gallery-pager-next').getAttribute('aria-label'))
      .to.equal('Next');
  });

  it('counts on to the next tile', () => {
    decorate(block = stills(3));
    block.querySelector('.media-gallery-pager-next').click();
    expect(countOf(block)).to.equal('2 of 3');
  });

  // live wraps both ways: past the last slide it returns to the first
  it('wraps past the last tile and back off the first', () => {
    decorate(block = stills(3));
    const next = block.querySelector('.media-gallery-pager-next');
    next.click();
    next.click();
    expect(countOf(block), 'the last').to.equal('3 of 3');
    next.click();
    expect(countOf(block), 'round to the first').to.equal('1 of 3');
    block.querySelector('.media-gallery-pager-prev').click();
    expect(countOf(block), 'back off the first').to.equal('3 of 3');
  });

  /*
   * The product grid draws live's first six and keeps the rest for the modal
   * (#319), so the strip below 769 holds six cells whatever the set is. The
   * counter counts the strip it pages and not the set the modal holds, or it
   * counts to a tile that is not there.
   */
  it('counts the tiles the product grid drew, not the set behind them', () => {
    decorate(block = stills(11, 'product'));
    expect(block.querySelectorAll('.media-gallery-tile').length, "live's six").to.equal(6);
    expect(countOf(block)).to.equal('1 of 6');
    const next = block.querySelector('.media-gallery-pager-next');
    Array.from({ length: 5 }).forEach(() => next.click());
    expect(countOf(block), 'the last tile the grid drew').to.equal('6 of 6');
    next.click();
    expect(countOf(block), 'round to the first').to.equal('1 of 6');
  });

  it('leaves a single tile without a counter, having nothing to count', () => {
    decorate(block = stills(1));
    expect(!!pagerOf(block)).to.be.false;
  });

  it('gives the cards grid no counter, which live gives none either', () => {
    decorate(block = stills(3, 'cards'));
    expect(!!pagerOf(block)).to.be.false;
  });

  /*
   * The Social row DOES take the counter, and this assertion had it the other
   * way until #341. Live slides that row through the same `con-column-slider`
   * as the rest and prints `1 of 6` under it below 769, read off
   * continentaltire.com/events at 375 on 2026-08-03. The variant was reading as
   * an exception because its own CSS stacked the tiles, so there was nothing to
   * page and no counter to print over it.
   */
  it('counts the social row, which live pages one post at a time', () => {
    decorate(block = authored([
      tile('/media/social-1.jpg', 'a post', 'https://www.instagram.com/p/CHOw2STBQYL/'),
      tile('/media/social-2.jpg', 'another', 'https://www.instagram.com/p/CUYqS3FMtlE/'),
    ], 'social'));
    expect(countOf(block)).to.equal('1 of 2');
  });
});

describe('Media gallery pager, live\'s measurements', () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/media-gallery/media-gallery.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => { document.body.classList.remove('appear'); });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('stands the pager 80 by 16, centred, 16px clear of the tile at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = stills(6));
    const list = block.querySelector('.media-gallery-list').getBoundingClientRect();
    const pager = pagerOf(block).getBoundingClientRect();
    expect(Math.round(pager.width), "live's 5rem").to.equal(80);
    expect(Math.round(pager.height), "live's 1rem arrows set the height").to.equal(16);
    expect(Math.round(pager.top - list.bottom), "live's 16px").to.equal(16);
    const middle = Math.round(pager.left + pager.width / 2);
    expect(middle, 'centred in the viewport').to.equal(Math.round(window.innerWidth / 2));
  });

  it('sets the count to live\'s type and hangs the arrows off the ends', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = stills(6));
    const count = getComputedStyle(block.querySelector('.media-gallery-pager-count'));
    expect(count.fontSize).to.equal('12px');
    expect(count.lineHeight, "live's line-height of 1").to.equal('12px');
    expect(count.fontWeight).to.equal('700');
    expect(count.letterSpacing).to.equal('1.25px');
    expect(count.color, 'the same #333 the arrow carries in its own bytes').to.equal('rgb(51, 51, 51)');
    const pager = pagerOf(block).getBoundingClientRect();
    const prev = block.querySelector('.media-gallery-pager-prev').getBoundingClientRect();
    const next = block.querySelector('.media-gallery-pager-next').getBoundingClientRect();
    expect([Math.round(prev.width), Math.round(prev.height)], "live's 1rem").to.eql([16, 16]);
    expect(Math.round(prev.left), 'at the left end').to.equal(Math.round(pager.left));
    expect(Math.round(next.right), 'at the right end').to.equal(Math.round(pager.right));
  });

  it('draws live\'s own chevron on each arrow', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = stills(6));
    const prev = getComputedStyle(block.querySelector('.media-gallery-pager-prev'));
    const next = getComputedStyle(block.querySelector('.media-gallery-pager-next'));
    expect(prev.backgroundImage, "live's viewBox").to.contain("viewBox='0 0 9 18'");
    expect(prev.backgroundImage, "live's path, pointing back").to.contain('m9 0-9 8 9 8');
    expect(next.backgroundImage, "live's path, pointing on").to.contain('m0 0 9 8-9 8');
    expect(prev.backgroundRepeat).to.equal('no-repeat');
  });

  // the arrows move the strip and not only the label
  it('scrolls the strip to the tile it counts to', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = stills(6));
    const list = block.querySelector('.media-gallery-list');
    expect(list.scrollLeft, 'starts on the first').to.equal(0);
    block.querySelector('.media-gallery-pager-next').click();
    expect(list.scrollLeft, 'moved on').to.be.above(0);
  });

  // live hides all but the active slide and drives the count off its own index.
  // This strip scroll-snaps, so a swipe is a scroll and the count follows it
  it('follows a swipe, because the strip is what moves here', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = stills(6));
    const list = block.querySelector('.media-gallery-list');
    const third = list.children[2];
    list.scrollLeft = third.offsetLeft - (list.clientWidth - third.offsetWidth) / 2;
    list.dispatchEvent(new Event('scroll'));
    expect(countOf(block)).to.equal('3 of 6');
  });

  it('draws no pager from 769 up, where the tiles are a grid', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = stills(6));
    expect(getComputedStyle(pagerOf(block)).display).to.equal('none');
  });

  it('marks the tile with live\'s expand badge below 769', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = stills(6));
    const badge = getComputedStyle(block.querySelector('.media-gallery-tile'), '::before');
    expect(badge.content, 'drawn').to.not.equal('none');
    expect([badge.width, badge.height], "live's 21px").to.eql(['21px', '21px']);
    expect(badge.position).to.equal('absolute');
    expect(badge.bottom, "live's 10px").to.equal('10px');
    expect(badge.right, "live's 10px").to.equal('10px');
    expect(badge.zIndex, 'over the still').to.equal('1');
    expect(badge.backgroundImage, "live's own drawing: a white circle stroked #ffa500")
      .to.contain("stroke='%23ffa500'");
    expect(badge.backgroundImage, 'and a #333 plus').to.contain('m6 9.5h8m-4-4v8');
  });

  it('marks the product viewer too, which live marks with the same rule', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = stills(6, 'product'));
    const badge = getComputedStyle(block.querySelector('.media-gallery-tile'), '::before');
    expect(badge.width).to.equal('21px');
    expect(badge.bottom).to.equal('10px');
  });

  it('leaves the badge off from 769 up and off the cards grid', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = stills(6));
    const grid = getComputedStyle(block.querySelector('.media-gallery-tile'), '::before');
    expect(grid.content, 'no badge on the desktop grid').to.equal('none');
    document.body.innerHTML = '';
    await setViewport({ width: 375, height: 812 });
    decorate(block = stills(6, 'cards'));
    const card = getComputedStyle(block.querySelector('.media-gallery-tile'), '::before');
    expect(card.content, 'no badge on a card').to.equal('none');
  });
});
