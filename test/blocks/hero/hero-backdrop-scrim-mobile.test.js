/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * Live draws a third gradient over its three `marquee--with-left-backdrop`
 * marquees BELOW 1025, where `.hero.stacked .hero-image::after { content: none }`
 * leaves us generating no pseudo-element at all.
 *
 * Live's own rule, inside `@media (max-width: 1024px)`:
 *
 *     .marquee--with-left-backdrop.marquee--mobile-bg-divided
 *       .marquee__background::after {
 *       display: block;
 *       background: linear-gradient(rgba(0,0,0,0.6) 12.81%, rgba(0,0,0,0) 34.06%);
 *     }
 *
 * Read on continentaltire.com on 2026-08-02 at 375 and 900, naming the box on
 * each side, live's `.marquee__background::after` against our
 * `.hero-image::after`:
 *
 *     page                    our classes                        live ::after
 *     /experience             hero left stacked slim breadcrumb   the gradient
 *     /experience/partners    hero stacked slim breadcrumb        the gradient
 *     /experience/conti-crew  hero stacked slim breadcrumb        the gradient
 *     /experience/soccer      hero breadcrumb stacked slimmer     rgba(0,0,0,0.3)
 *
 * Ours paints nothing on any of the four. /experience/soccer is the control:
 * it carries live's `marquee--has-breadcrumbs` without the backdrop class, so
 * live gives it the flat value and NOT this gradient, and the fix must not
 * reach it. Its own missing scrim below the step is #527/#528's shape rather
 * than this one.
 *
 * `content: ''` is the load-bearing half. A background on a pseudo-element
 * that never generates paints nothing, which is the same failure mode
 * `.hero.stacked.tall .hero-image::after` already works around one variant
 * along for /events.
 *
 * COMPUTED VALUES AT A WIDTH, not declarations: the defect is a `content: none`
 * in an earlier rule, which a declared background reads past.
 */

/* a photo with live's own marquee ratio, inline so nothing waits on the network */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

function mount(classes) {
  document.body.innerHTML = `
    <main><div class="section hero-container"><div class="hero-wrapper">
      <div class="hero ${classes} block">
        <div class="hero-image"><picture><img src="${PHOTO}" alt=""></picture></div>
        <div class="hero-content">
          <nav class="hero-breadcrumb"><ol><li><a href="/experience">Experience</a></li></ol></nav>
          <h1>A marquee title</h1>
          <p>a standfirst that runs on for a line or so</p>
        </div>
      </div>
    </div></div></main>`;
  const block = document.querySelector('.hero.block');
  // styles.css holds `body` at `display: none` until `.appear`, and an
  // undisplayed body reads 0 everywhere, so every assertion would pass on
  // nothing without this
  if (block.getBoundingClientRect().height === 0) {
    throw new Error('the hero fixture rendered with no box, so nothing here was measured');
  }
  return block;
}

async function scrim(classes, width) {
  await setViewport({ width, height: 900 });
  const block = mount(classes);
  const cs = getComputedStyle(block.querySelector('.hero-image'), '::after');
  return { content: cs.content, image: cs.backgroundImage, display: cs.display };
}

/* live's own stops, to the pixel */
const LIVE = 'linear-gradient(rgba(0, 0, 0, 0.6) 12.81%, rgba(0, 0, 0, 0) 34.06%)';

describe("Hero, live's backdrop gradient below the step (#530)", () => {
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

  ['left stacked slim breadcrumb', 'stacked slim breadcrumb'].forEach((classes) => {
    describe(`authored \`hero ${classes}\``, () => {
      [375, 900].forEach((width) => {
        it(`generates the pseudo-element at ${width}, where live shows its own`, async () => {
          const s = await scrim(classes, width);
          expect(s.content).to.equal('""');
          expect(s.display).to.not.equal('none');
        });

        it(`paints live's own gradient at ${width}`, async () => {
          const s = await scrim(classes, width);
          expect(s.image).to.equal(LIVE);
        });
      });

      it('still paints the two-layer desktop gradient at 1440', async () => {
        const s = await scrim(classes, 1440);
        expect(s.image).to.contain('90deg');
        expect(s.image.split('linear-gradient').length - 1).to.equal(2);
      });
    });
  });

  describe('/experience/soccer, the page live does not draw this on', () => {
    [375, 900].forEach((width) => {
      it(`paints no backdrop gradient at ${width}`, async () => {
        const s = await scrim('breadcrumb stacked slimmer', width);
        expect(s.image).to.not.equal(LIVE);
      });
    });
  });
});
