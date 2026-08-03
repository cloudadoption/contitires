/* eslint-disable no-unused-expressions */
/* global describe it after */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/**
 * Live rules the bar off the band above it with 4px of yellow, and the homepage
 * is the one page that does not show it. Probed at 1440 on 2026-08-03:
 *
 *     live /ev-compatible   .store-finder-nav-banner  60, border-top 4px
 *                           rgb(255, 165, 0), items 122.48 x 32
 *     ours /ev-compatible   .section.black            56, border-top 0px,
 *                           items 122.48 x 32
 *
 * So the items already match to the hundredth and the rule is the whole 4.
 *
 * The exception is live's own: `.promo-bar--yellow + .store-finder-nav-banner`
 * sets `border-top: 0`, and on the homepage the promo bar sits directly on the
 * bar. /ev-compatible and /smart-choice have no promo bar over theirs, so they
 * get the rule and the homepage keeps its flush edge.
 *
 * Scoped to `.perfect-fit-label`, which is the heading the bar carries and the
 * listing strip does not. The strip's own band on /tires and the eleven category
 * pages was measured against live in #267 and is left where it is, and so is the
 * white card in the product hero. Issue #85.
 */
const round = (n) => Math.round(n * 100) / 100;

/**
 * The bar as `perfect-fit.js` builds it, serialized.
 * @param {boolean} promo whether a promo bar sits in the section above it
 * @returns {string} the decorated `<main>`
 */
function markup(promo) {
  const host = document.createElement('div');
  host.innerHTML = `
    <main>
      ${promo ? '<div class="section promo-bar-container"><div class="promo-bar-wrapper"><div class="promo-bar block"><div><div><p>A promotion</p></div></div></div></div></div>' : ''}
      <div class="section black perfect-fit-container"><div class="perfect-fit-wrapper">
        <div class="perfect-fit block">
          <div><div><p>Find your perfect fit:</p></div></div>
          <div>
            <div><p>By Vehicle</p></div>
            <div><p>By Tire Size</p></div>
            <div><p>By Plate</p></div>
          </div>
        </div>
      </div></div>
    </main>`;
  decorate(host.querySelector('.perfect-fit.block'));
  return host.innerHTML;
}

/** The listing strip, one label-less cell, which this must not reach. */
function stripMarkup() {
  const host = document.createElement('div');
  host.innerHTML = `
    <main><div class="section dark perfect-fit-container"><div class="perfect-fit-wrapper">
      <div class="perfect-fit block">
        <div><div></div></div>
        <div><div><p>Find your perfect fit</p></div></div>
      </div>
    </div></div></main>`;
  decorate(host.querySelector('.perfect-fit.block'));
  return host.innerHTML;
}

const doc = (body) => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/perfect-fit/perfect-fit.css">
</head><body class="appear">${body}</body></html>`;

/**
 * Renders one fixture at one width in an iframe.
 * @param {number} width the viewport width to render at
 * @param {string} body the markup to render
 * @returns {Promise<Document>} the settled document
 */
async function renderAt(width, body) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:900px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = doc(body);
  });
  const settled = frame.contentDocument;
  await settled.fonts.ready;
  return settled;
}

describe('Perfect fit bar, live\'s yellow rule above it', () => {
  const frames = [];

  after(() => frames.forEach((frame) => frame.remove()));

  /** @returns {Promise<Document>} a rendered fixture, tracked for cleanup */
  async function render(body) {
    const rendered = await renderAt(1440, body);
    frames.push(...document.querySelectorAll('iframe'));
    return rendered;
  }

  it('rules the bar off the band above it with 4px of yellow, live\'s 60', async () => {
    const rendered = await render(markup(false));
    const section = rendered.querySelector('.perfect-fit-container');
    const style = rendered.defaultView.getComputedStyle(section);
    expect(style.borderTopWidth).to.equal('4px');
    expect(style.borderTopColor).to.equal('rgb(255, 165, 0)');
    expect(round(section.getBoundingClientRect().height)).to.equal(60);
  });

  it('drops the rule where a promo bar sits directly on it, as live does', async () => {
    const rendered = await render(markup(true));
    const section = rendered.querySelector('.perfect-fit-container');
    expect(rendered.defaultView.getComputedStyle(section).borderTopWidth).to.equal('0px');
  });

  it('leaves the listing strip\'s band alone', async () => {
    const rendered = await render(stripMarkup());
    const section = rendered.querySelector('.perfect-fit-container');
    expect(rendered.defaultView.getComputedStyle(section).borderTopWidth).to.equal('0px');
  });
});
