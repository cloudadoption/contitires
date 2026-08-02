/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * The promo marquee below live's step. Live divides this one the way it divides
 * the homepage's, and `.hero.stacked` in this stylesheet is already that shape:
 * the photo becomes a band in flow and the copy sits under it on black.
 *
 * THE STEP IS 1025 AND NOT 1200. Read off continentaltire.com/promotion on
 * 2026-08-03, `.marquee__background` at seven widths:
 *
 *     width   position   image               box
 *      1440   absolute   marquee.jpg         0..1440 y76..526, copy over it
 *      1201   absolute   marquee.jpg         0..1201 y76..526, copy over it
 *      1200   absolute   marquee.jpg         0..1200 y76..526, copy over it
 *      1025   absolute   marquee.jpg         0..1025 y92..542, copy over it
 *      1024   static     marquee-mobile.jpg  0..1024 y49..526, copy at y526
 *       768   static     marquee-mobile.jpg  0..768  y49..407, copy at y407
 *       375   static     marquee-mobile.jpg  0..375  y49..224, copy at y224
 *
 * So 1200 is unremarkable on live and 1025 is the whole of it, which is this
 * project's own second step. /ccpromotion, the other page this variant serves,
 * divides at the same width.
 *
 * Live's own numbers below the step: the marquee is `flex-direction: column` on
 * `rgb(0, 0, 0)` with `padding-bottom: 50px`, the strip carries
 * `min-height: 160px`, the copy takes `padding: 28px 0`, and no scrim is drawn
 * over the divided strip. Its stylesheet says so directly, and this file's
 * `stacked` comment already quotes the rule:
 *
 *     @media (max-width: 1024px) {
 *       .marquee--mobile-bg-divided .marquee__background::after { display: none }
 *     }
 *
 * THE STRIP HEIGHT IS NOT LIVE'S AND CANNOT BE. Live reads 477 at 1024 and 175
 * at 375 on /promotion, from an `aspect-ratio: 1024 / 477` its July campaign
 * theme puts on a mobile-only product photograph. /ccpromotion reads a flat 160
 * at both widths from the shared floor, so 477 is the campaign's number rather
 * than the variant's, and taking it would push /ccpromotion 317px out at 1024.
 * One asset is authored here, the 1440x400 desktop one, so the strip takes its
 * own ratio over live's shared 160 floor.
 *
 * Ours before this: `position: absolute; inset: 0` at every width, so at 1024,
 * 768 and 375 the whole marquee was one 386/483/541 tall photo with the title,
 * the copy, See full details and three pills on top of it.
 */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="400"><rect width="1440" height="400" fill="#333"/></svg>',
)}`;

function mount() {
  document.body.innerHTML = `
    <main><div class="section hero-container"><div class="hero-wrapper">
      <div class="hero promo block">
        <div class="hero-image"><picture><img src="${PHOTO}" alt=""></picture></div>
        <div class="hero-content">
          <h1>Get a $110 Rebate</h1>
          <p>Purchase a set of 4 qualifying Continental Tires and get a $110 Prepaid Mastercard.</p>
          <p><a href="#terms">See full details</a></p>
          <div class="hero-ctas">
            <p class="button-wrapper"><a class="button accent" href="/Store-finder">Find stores</a></p>
            <p class="button-wrapper"><a class="button accent" href="/perfect-fit">Find tires</a></p>
            <p class="button-wrapper"><a class="button secondary" href="#rebate">Submit rebate</a></p>
          </div>
        </div>
      </div>
    </div></div></main>`;
  const block = document.querySelector('.hero.block');
  if (block.getBoundingClientRect().height === 0) {
    throw new Error('the promo hero fixture rendered with no box, so nothing here was measured');
  }
  return block;
}

const rect = (el) => el.getBoundingClientRect();
const px = (el, prop) => getComputedStyle(el)[prop];
const photo = (block) => block.querySelector('.hero-image');
const copy = (block) => block.querySelector('.hero-content');

describe('Hero, the promo marquee at live\'s own 1025 step', () => {
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    sheets = await Promise.all(['/styles/styles.css', '/blocks/hero/hero.css']
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

  [1024, 768, 375].forEach((width) => {
    describe(`at ${width}, where live divides it`, () => {
      it('takes the photo out of the overlay and puts it in flow', async () => {
        await setViewport({ width, height: 900 });
        const block = mount();
        expect(px(photo(block), 'position')).to.equal('relative');
        expect(px(block, 'flexDirection')).to.equal('column');
      });

      it('sets the copy under the photo rather than over it', async () => {
        await setViewport({ width, height: 900 });
        const block = mount();
        expect(Math.round(rect(copy(block)).top), 'below the strip')
          .to.be.at.least(Math.round(rect(photo(block)).bottom));
      });

      it('holds the strip to live\'s shared 160 floor', async () => {
        await setViewport({ width, height: 900 });
        expect(px(photo(mount()), 'minHeight')).to.equal('160px');
      });

      it('draws no scrim over a divided strip, as live draws none', async () => {
        await setViewport({ width, height: 900 });
        expect(getComputedStyle(photo(mount()), '::after').content).to.equal('none');
      });

      it('takes live\'s black behind the copy', async () => {
        await setViewport({ width, height: 900 });
        expect(px(mount(), 'backgroundColor')).to.equal('rgb(0, 0, 0)');
      });

      it('lets the band be its content, as live\'s divided one is', async () => {
        await setViewport({ width, height: 900 });
        expect(px(mount(), 'minHeight')).to.equal('0px');
      });
    });
  });

  describe('at 1025, where live keeps the overlay', () => {
    it('leaves the photo covering the band', async () => {
      await setViewport({ width: 1025, height: 900 });
      const block = mount();
      expect(px(photo(block), 'position')).to.equal('absolute');
      expect(Math.round(rect(photo(block)).height)).to.equal(Math.round(rect(block).height));
    });

    it('keeps the copy over the photo', async () => {
      await setViewport({ width: 1025, height: 900 });
      const block = mount();
      expect(Math.round(rect(copy(block)).top)).to.equal(Math.round(rect(block).top));
    });

    it('keeps live\'s flat 50% tint there', async () => {
      await setViewport({ width: 1025, height: 900 });
      expect(getComputedStyle(photo(mount()), '::after').backgroundColor)
        .to.equal('rgba(0, 0, 0, 0.5)');
    });
  });
});
