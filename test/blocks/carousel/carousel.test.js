/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/carousel/carousel.js';

/** Authored carousel: each row is an image cell plus a text cell. */
function buildBlock(slideCount = 3) {
  const rows = Array.from({ length: slideCount }, (unused, i) => `
    <div>
      <div><picture><img src="/media_slide${i}.png" alt="Slide ${i + 1}"></picture></div>
      <div>
        <h3>Slide ${i + 1} heading</h3>
        <p>Body copy ${i + 1}.</p>
        <p><a href="/learn">Learn more</a></p>
      </div>
    </div>`).join('');
  document.body.innerHTML = `<div class="carousel block">${rows}</div>`;
  return document.querySelector('.carousel.block');
}

describe('Carousel block', () => {
  let block;
  beforeEach(() => {
    block = buildBlock(3);
    decorate(block);
  });

  it('builds a track with one slide per authored row', () => {
    expect(block.querySelectorAll('.carousel-slide')).to.have.length(3);
    expect(block.querySelector('.carousel-track')).to.exist;
    expect(block.querySelector('.carousel-viewport')).to.exist;
  });

  it('builds prev/next arrows and a counter between them, with no dots', () => {
    expect(block.querySelector('.carousel-prev')).to.exist;
    expect(block.querySelector('.carousel-next')).to.exist;
    expect(block.querySelectorAll('.carousel-dot')).to.have.length(0);
    const nav = block.querySelector('.carousel-nav');
    expect(nav.children[1].classList.contains('carousel-counter')).to.be.true;
    expect(block.querySelector('.carousel-counter').textContent).to.equal('1 of 3');
  });

  it('optimizes each slide image into a picture', () => {
    const pictures = block.querySelectorAll('.carousel-media picture');
    expect(pictures).to.have.length(3);
    expect(pictures[0].querySelector('img')).to.exist;
  });

  it('tags the CTA paragraph and link', () => {
    const cta = block.querySelector('.carousel-cta-wrapper .carousel-cta');
    expect(cta).to.exist;
    expect(cta.getAttribute('href')).to.equal('/learn');
  });

  it('shows only the current slide, marking the rest inert', () => {
    const slides = block.querySelectorAll('.carousel-slide');
    expect(slides[0].hasAttribute('inert')).to.be.false;
    expect(slides[1].hasAttribute('inert')).to.be.true;
    expect(slides[0].getAttribute('aria-hidden')).to.equal('false');
  });

  it('advances with the next arrow', () => {
    block.querySelector('.carousel-next').click();
    expect(block.querySelector('.carousel-counter').textContent).to.equal('2 of 3');
    const slides = block.querySelectorAll('.carousel-slide');
    expect(slides[1].hasAttribute('inert')).to.be.false;
  });

  it('wraps around when going back from the first slide', () => {
    block.querySelector('.carousel-prev').click();
    expect(block.querySelector('.carousel-counter').textContent).to.equal('3 of 3');
  });
});

// From 900 the pagination is pinned to the bottom of the content column, so
// the column has to reserve its height. Without that the "1 of 7" pager
// overlapped the TAKE A CLOSER LOOK pill by 11px at 900.
describe('Carousel, the pagination and the pill', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/carousel/carousel.css')).text());
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

  it('reserves the pinned pagination room in the content column', () => {
    expect(value('.carousel-content', 'padding', '900px')).to.equal('0px 0px 72px');
  });
});

// The slide CTA is an outlined pill, and the "a" in the selector was there to
// out-specify the global a:any-link colour. At document level it also claimed
// any other link that happens to carry the class. Issue #112.
describe('Carousel, the CTA it claims', () => {
  let sheet;
  let global;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/carousel/carousel.css')).text());
    global = new CSSStyleSheet();
    await global.replace(await (await fetch('/styles/styles.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, global, sheet];
    document.body.classList.add('appear');
    document.body.innerHTML = `
      <main>
        <div class="section carousel-container">
          <div class="carousel-wrapper">
            <div class="carousel block">
              <div class="carousel-viewport"><div class="carousel-track">
                <div class="carousel-slide"><div class="carousel-content">
                  <p class="carousel-cta-wrapper"><a class="carousel-cta" href="/learn">Learn more</a></p>
                </div></div>
              </div></div>
            </div>
          </div>
        </div>
        <div class="loose"><a class="carousel-cta" href="/learn">Learn more</a></div>
      </main>`;
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((s) => s !== sheet && s !== global);
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it('draws the pill on its own slide CTA', () => {
    const cta = document.querySelector('.carousel .carousel-cta');
    expect(getComputedStyle(cta).borderTopWidth).to.equal('1px');
    expect(getComputedStyle(cta).borderTopLeftRadius).to.equal('24px');
    expect(getComputedStyle(cta).display).to.equal('inline-flex');
  });

  it('leaves a link outside the block alone', () => {
    const loose = document.querySelector('.loose .carousel-cta');
    expect(getComputedStyle(loose).borderTopWidth).to.equal('0px');
    expect(getComputedStyle(loose).display).to.equal('inline');
  });
});
