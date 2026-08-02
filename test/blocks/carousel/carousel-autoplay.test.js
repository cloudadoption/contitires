/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/carousel/carousel.js';

/**
 * The `autoplay` variant moves the carousel on a 6 second timer. WCAG 2.2.2
 * wants a way to stop that, and hover and focus are not one: a touch reader
 * hovers nothing, and a reader who has asked their system for less motion
 * should not have to ask this page as well.
 *
 * No live page to read here. Live's own carousels do not autoplay, and a scan of
 * the published site found no page carrying the variant at all, so this is a
 * defect in shipped code rather than a parity gap. Issue #116.
 */
describe('Carousel autoplay, stopping it', () => {
  let clock;

  /** An autoplay carousel with three slides. */
  const build = (variant = 'autoplay') => {
    const rows = Array.from({ length: 3 }, (unused, i) => `
      <div>
        <div><picture><img src="/media_slide${i}.png" alt="Slide ${i + 1}"></picture></div>
        <div><h3>Slide ${i + 1}</h3><p>Body ${i + 1}.</p><p><a href="/learn">Learn more</a></p></div>
      </div>`).join('');
    document.body.innerHTML = `<div class="carousel ${variant} block">${rows}</div>`;
    const block = document.querySelector('.carousel.block');
    decorate(block);
    return block;
  };

  const at = (block) => block.querySelector('.carousel-counter').textContent;

  beforeEach(() => { clock = sinon.useFakeTimers(); });
  afterEach(() => { clock.restore(); sinon.restore(); });

  it('offers a pause control in the nav, and only on the autoplay variant', () => {
    const block = build();
    const pause = block.querySelector('.carousel-pause');
    expect(pause, 'the control').to.exist;
    expect(pause.tagName).to.equal('BUTTON');
    expect(pause.type).to.equal('button');
    expect(pause.getAttribute('aria-pressed'), 'running, so not pressed').to.equal('false');
    expect(pause.getAttribute('aria-label'), 'named for what it does').to.match(/paus/i);
    expect(pause.closest('.carousel-nav'), 'it sits with the arrows and the counter').to.exist;

    expect(build('').querySelector('.carousel-pause') === null, 'a plain carousel never moves on its own').to.be.true;
  });

  it('advances on its own until the control is pressed', () => {
    const block = build();
    expect(at(block), 'the first slide').to.equal('1 of 3');
    clock.tick(6000);
    expect(at(block), 'one turn later').to.equal('2 of 3');

    block.querySelector('.carousel-pause').click();
    expect(block.querySelector('.carousel-pause').getAttribute('aria-pressed')).to.equal('true');
    clock.tick(24000);
    expect(at(block), 'four turns of the timer with the control pressed').to.equal('2 of 3');
  });

  it('starts again when the control is pressed a second time', () => {
    const block = build();
    const pause = block.querySelector('.carousel-pause');
    pause.click();
    clock.tick(12000);
    expect(at(block), 'held').to.equal('1 of 3');
    pause.click();
    expect(pause.getAttribute('aria-pressed')).to.equal('false');
    clock.tick(6000);
    expect(at(block), 'moving again').to.equal('2 of 3');
  });

  // the existing hover and focus handlers call start() with no idea the reader
  // has stopped the thing, so a mouse crossing the block restarted it
  it('holds the pause across a hover and across focus leaving', () => {
    const block = build();
    block.querySelector('.carousel-pause').click();

    block.dispatchEvent(new MouseEvent('mouseenter'));
    block.dispatchEvent(new MouseEvent('mouseleave'));
    clock.tick(12000);
    expect(at(block), 'a mouse crossing the block does not restart it').to.equal('1 of 3');

    block.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    block.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    clock.tick(12000);
    expect(at(block), 'nor does focus leaving it').to.equal('1 of 3');
  });

  it('still pauses on hover while it is running', () => {
    const block = build();
    block.dispatchEvent(new MouseEvent('mouseenter'));
    clock.tick(12000);
    expect(at(block), 'held while the pointer is on it').to.equal('1 of 3');
    block.dispatchEvent(new MouseEvent('mouseleave'));
    clock.tick(6000);
    expect(at(block), 'and moves again once the pointer leaves').to.equal('2 of 3');
  });

  it('never starts for a reader who has asked for less motion', () => {
    const real = window.matchMedia.bind(window);
    sinon.stub(window, 'matchMedia').callsFake((query) => (/prefers-reduced-motion/.test(query)
      ? {
        matches: true, media: query, addEventListener() {}, removeEventListener() {},
      }
      : real(query)));

    const block = build();
    clock.tick(60000);
    expect(at(block), 'ten turns of the timer and it has not moved').to.equal('1 of 3');
    expect(block.querySelector('.carousel-pause').getAttribute('aria-pressed'), 'the control says so').to.equal('true');
  });

  it('leaves the arrows working for a reader who has asked for less motion', () => {
    const real = window.matchMedia.bind(window);
    sinon.stub(window, 'matchMedia').callsFake((query) => (/prefers-reduced-motion/.test(query)
      ? {
        matches: true, media: query, addEventListener() {}, removeEventListener() {},
      }
      : real(query)));

    const block = build();
    block.querySelector('.carousel-next').click();
    expect(at(block), 'asking for the next slide is not motion they refused').to.equal('2 of 3');
  });
});

/** A control a reader cannot see is not a control, so it gets measured too. */
describe('Carousel autoplay, the control on the page', () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/carousel/carousel.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => { document.body.classList.remove('appear'); });

  beforeEach(async () => {
    document.body.innerHTML = `<div class="carousel autoplay block">
      <div><div><picture><img src="/media_a.png" alt="a"></picture></div><div><h3>a</h3></div></div>
      <div><div><picture><img src="/media_b.png" alt="b"></picture></div><div><h3>b</h3></div></div>
    </div>`;
    block = document.querySelector('.carousel.block');
    decorate(block);
    // the interval is a real one here, and this test is not about it
    block.querySelector('.carousel-pause').click();
    await setViewport({ width: 1440, height: 900 });
  });

  it('gives it the chevrons\' own 24px box', () => {
    const box = block.querySelector('.carousel-pause').getBoundingClientRect();
    const arrow = block.querySelector('.carousel-next').getBoundingClientRect();
    expect(box.width, 'as wide as an arrow').to.be.closeTo(arrow.width, 0.5);
    expect(box.height, 'as tall as an arrow').to.be.closeTo(arrow.height, 0.5);
    expect(box.width, '24px').to.be.closeTo(24, 0.5);
  });

  it('draws a mark inside it, and a different one once it is held', () => {
    const pause = block.querySelector('.carousel-pause');
    const held = getComputedStyle(pause, '::before');
    expect(held.content, 'the mark exists').to.equal('""');
    expect(held.borderLeftWidth, 'a triangle points right while it is held').to.equal('9px');

    pause.click();
    const running = getComputedStyle(pause, '::before');
    expect(running.borderLeftWidth, 'two bars while it runs').to.equal('3px');
    expect(running.borderRightWidth, 'the second bar').to.equal('3px');
  });

  it('sits on the same row as the counter', () => {
    const nav = block.querySelector('.carousel-nav').getBoundingClientRect();
    const box = block.querySelector('.carousel-pause').getBoundingClientRect();
    expect(box.top, 'in the nav row, not below it').to.be.at.least(nav.top - 0.5);
    expect(box.bottom, 'and not under it').to.be.at.most(nav.bottom + 0.5);
  });
});
