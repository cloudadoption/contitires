/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/hero/hero.js';

/**
 * THE IN-PAGE BAND IS A DIFFERENT LIVE COMPONENT FROM THE MARQUEE, and it steps
 * at 768 where the marquee steps at 1025. Live builds the page-opening art as
 * `section.marquee` and an in-page band as `section.banner-with-image`; this
 * block builds both. Two published pages author the band, /smart-choice and
 * /all-new-securecontact-aw, each `hero left` with a desktop photograph and a
 * mobile one. That pair is live's own discriminator: its band element carries
 * `--mobile-background-image` only where a mobile photograph exists, and the
 * rule that consumes it is the 768 one.
 *
 * Live's two states, read out of continentaltire.com's stylesheet:
 *
 *     .banner-with-image--brand22 .banner-with-image__inner-wrapper {
 *       background-color: #000000;
 *       background-repeat: no-repeat;
 *       background-position: var(--background-position, top right);
 *       padding: var(--space-80) 0;
 *       background-image: var(--default-background-image);
 *       background-size: cover;
 *     }
 *     @media screen and (max-width: 768px) {   // same selector
 *       padding: 125px 0 0;
 *       text-align: center;
 *       background-image: var(--mobile-background-image, var(--default-background-image));
 *       background-position: var(--mobile-background-position, top right);
 *     }
 *     @media screen and (max-width: 768px) {
 *       .banner-with-image--brand22 .banner-with-image__inner-wrapper:before {
 *         content: ""; position: absolute; inset: 0;
 *         background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%);
 *       }
 *     }
 *
 * And the same values read as COMPUTED on both pages at 1440, 769, 768 and 375
 * on 2026-08-02, which is what settles the parts the stylesheet leaves to a
 * custom property:
 *
 *     page                        width  height  background-position  ::before
 *     /all-new-securecontact-aw    1440     333        100% 0%         content: none
 *     /all-new-securecontact-aw     375     205        100% 0%         the gradient
 *     /smart-choice                1440     392        100% 0%         content: none
 *     /smart-choice                 375     325        100% 0%         the gradient
 *
 * Both `--background-position` and `--mobile-background-position` read unset at
 * every one of those widths, so `top right` is in force and the indirection
 * buys nothing here. The band has NO min-height of its own on live: 333 is
 * 80 + 173 + 80 and 205 is 125 + 80 + 0. Ours took `.hero.left`'s 560 floor at
 * 1440 on both pages, cover-scaled the photograph 1.4x to fill it, and laid a
 * flat 30% black over it that live paints nowhere above 768. #446
 */

/* a photograph at the band's own ratio, inline so nothing waits on the network */
const PHOTO = (w, h) => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#333"/></svg>`,
)}`;

/** The band as hero.js leaves it, with the class typed in so the CSS is on its own. */
function mount(classes) {
  document.body.innerHTML = `
    <main>
      <div class="section"><div class="default-content-wrapper"><p>an earlier section</p></div></div>
      <div class="section hero-container"><div class="hero-wrapper">
        <div class="hero ${classes} block">
          <div class="hero-image"><picture><img src="${PHOTO(1400, 400)}" alt=""></picture></div>
          <div class="hero-content">
            <h2>Ready for confidence in every condition?</h2>
            <p><strong><a href="/Store-finder">Find a dealer</a></strong></p>
          </div>
        </div>
      </div></div>
    </main>`;
  const block = document.querySelector('.hero.block');
  if (block.getBoundingClientRect().height === 0) {
    throw new Error('the band fixture rendered with no box, so nothing here was measured');
  }
  return block;
}

/** The block, its photo wrap and the scrim on it, as they compute at a width. */
async function read(classes, width) {
  await setViewport({ width, height: 900 });
  const block = mount(classes);
  const image = block.querySelector('.hero-image');
  const content = block.querySelector('.hero-content');
  const scrim = getComputedStyle(image, '::after');
  return {
    minHeight: getComputedStyle(block).minHeight,
    objectPosition: getComputedStyle(image.querySelector('img')).objectPosition,
    padTop: getComputedStyle(content).paddingTop,
    padBottom: getComputedStyle(content).paddingBottom,
    scrimImage: scrim.backgroundImage,
    scrimColor: scrim.backgroundColor,
  };
}

/** A hero as EDS delivers it, before decoration. */
function authored({ pictures = 2, opensPage = false, classes = 'left' } = {}) {
  const picture = (name, w, h) => `
    <picture>
      <source type="image/webp" srcset="./${name}.jpg?width=2000&amp;format=webply" media="(min-width: 600px)">
      <source type="image/webp" srcset="./${name}.jpg?width=750&amp;format=webply">
      <img loading="lazy" alt="" src="./${name}.jpg?width=750&amp;format=jpg" width="${w}" height="${h}">
    </picture>`;
  document.body.innerHTML = `
    <main>
      ${opensPage ? '' : '<div class="section"><div class="default-content-wrapper"><p>copy above</p></div></div>'}
      <div class="section">
        <div class="hero ${classes} block">
          <div><div>${picture('desktop', 1400, 400)}</div></div>
          ${pictures > 1 ? `<div><div>${picture('mobile', 882, 400)}</div></div>` : ''}
          <div><div>
            <h2>Ready for confidence in every condition?</h2>
            <p><strong><a href="/Store-finder">Find a dealer</a></strong></p>
          </div></div>
        </div>
      </div>
    </main>`;
  return document.querySelector('.hero.block');
}

describe('Hero, the in-page band live builds as banner-with-image (#446)', () => {
  describe('which heroes are the band', () => {
    it('marks an in-page hero the author gave both photographs', () => {
      const block = authored();
      decorate(block);
      expect(block.classList.contains('band')).to.be.true;
    });

    it('leaves the page-opening marquee alone, art-directed or not', () => {
      /* /my-first-car-my-first-tires authors `hero left stacked slim` with both
         photographs and opens the page with it, so live builds it as a marquee
         and it steps at 1025. */
      const block = authored({ opensPage: true, classes: 'left stacked slim' });
      decorate(block);
      expect(block.classList.contains('band')).to.be.false;
    });

    it('leaves an in-page hero carrying one photograph alone', () => {
      /* /learn's band and the homepage's are `hero left` with a single picture.
         Live gives those no `--mobile-background-image`, so its 768 rule has
         nothing to swap and the band keeps the block's own treatment. */
      const block = authored({ pictures: 1 });
      decorate(block);
      expect(block.classList.contains('band')).to.be.false;
    });
  });

  describe('the width the photographs swap at', () => {
    it("puts the band's desktop sources behind 769, which is live's 768 from the other side", () => {
      const block = authored();
      decorate(block);
      const sources = [...block.querySelectorAll('source')];
      const desktop = sources.filter((s) => s.srcset.includes('desktop'));
      expect(desktop).to.not.be.empty;
      desktop.forEach((s) => expect(s.media).to.equal('(min-width: 769px)'));
    });

    it('keeps 1025 for the marquee, whose own step is there', () => {
      const block = authored({ opensPage: true });
      decorate(block);
      const desktop = [...block.querySelectorAll('source')].filter((s) => s.srcset.includes('desktop'));
      expect(desktop).to.not.be.empty;
      desktop.forEach((s) => expect(s.media).to.equal('(min-width: 1025px)'));
    });

    it('still leaves the mobile photograph as the img, so a phone loads only it', () => {
      const block = authored();
      decorate(block);
      expect(block.querySelector('img').getAttribute('src')).to.contain('mobile');
    });
  });

  describe('what the band paints', () => {
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

    it('holds the photograph top right at 1440, where live reads 100% 0%', async () => {
      const s = await read('left band', 1440);
      expect(s.objectPosition).to.equal('100% 0%');
    });

    it('holds it top right at 375 as well', async () => {
      const s = await read('left band', 375);
      expect(s.objectPosition).to.equal('100% 0%');
    });

    it('carries no floor at 1440, so the band is padding plus copy as live\'s is', async () => {
      /* `.hero.left` puts a 560 floor here and live\'s band is 333 and 392 on
         the two pages, both content-driven. */
      const s = await read('left band', 1440);
      expect(s.minHeight).to.equal('0px');
    });

    it("takes live's 80px above and below at 1440", async () => {
      const s = await read('left band', 1440);
      expect(s.padTop).to.equal('80px');
      expect(s.padBottom).to.equal('80px');
    });

    it('takes them at 769 too, where live has already left its mobile rule', async () => {
      const s = await read('left band', 769);
      expect(s.padTop).to.equal('80px');
      expect(s.padBottom).to.equal('80px');
    });

    it("drops the copy to the foot of the band at 375, live's 125 and 0", async () => {
      const s = await read('left band', 375);
      expect(s.padTop).to.equal('125px');
      expect(s.padBottom).to.equal('0px');
    });

    it('paints nothing over the photograph at 1440, where live generates no pseudo-element', async () => {
      const s = await read('left band', 1440);
      expect(s.scrimImage, `painted ${s.scrimImage}`).to.equal('none');
      expect(s.scrimColor, `painted ${s.scrimColor}`).to.equal('rgba(0, 0, 0, 0)');
    });

    it('paints nothing at 769 either', async () => {
      const s = await read('left band', 769);
      expect(s.scrimImage).to.equal('none');
      expect(s.scrimColor).to.equal('rgba(0, 0, 0, 0)');
    });

    it("lays live's bottom-up gradient under the copy at 768", async () => {
      const s = await read('left band', 768);
      expect(s.scrimImage).to.contain('to top');
      expect(s.scrimImage).to.contain('rgba(0, 0, 0, 0.8) 0%');
      expect(s.scrimImage).to.contain('rgba(0, 0, 0, 0) 70%');
    });

    it('lays it at 375 as well, which is where the copy sits over the photograph', async () => {
      const s = await read('left band', 375);
      expect(s.scrimImage).to.contain('rgba(0, 0, 0, 0.8) 0%');
      expect(s.scrimImage).to.contain('rgba(0, 0, 0, 0) 70%');
    });

    it('leaves a `hero left` with no band class to its own flat 30%', async () => {
      /* /learn's band and the homepage's, which live gives no mobile
         photograph and this fix must not reach. */
      const s = await read('left', 1440);
      expect(s.scrimColor).to.equal('rgba(0, 0, 0, 0.3)');
      expect(s.minHeight).to.equal('560px');
    });
  });
});
