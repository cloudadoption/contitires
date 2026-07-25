/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

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
