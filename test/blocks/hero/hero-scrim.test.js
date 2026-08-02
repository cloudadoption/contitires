/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * `.hero.short .hero-image::after { background: none }` and
 * `.hero.left .hero-image::after { background: <gradient> }` both score 0-3-0,
 * and `short` is declared second, so on a hero carrying both the background is
 * cancelled. Below 1025 nothing shows because `.hero.stacked` stops the
 * pseudo-element generating; at 1025 `.hero.stacked` brings it back, and it
 * comes back with no background. So white copy sits on a bare photo. #519
 *
 * LIVE'S OWN TREATMENT IS A FLAT rgba, NOT THE GRADIENT `short` REMOVED, which
 * is why "restore what short cancelled" would ship the wrong thing. Read out of
 * continentaltire.com's own stylesheet on 2026-08-02:
 *
 *     .marquee__background::after {
 *       content: ""; position: absolute; inset: 0;
 *       background: rgba(0, 0, 0, var(--marquee-bg-opacity, 0.2));
 *     }
 *     @media (max-width: 1024px) {
 *       .marquee--mobile-bg-divided .marquee__background:not(...)::after { display: none }
 *     }
 *     .marquee--with-left-backdrop .marquee__background::after { background: <two gradients> }
 *
 * So live's scrim is FLAT by default and per-marquee through one custom
 * property; the two-layer gradient belongs to `marquee--with-left-backdrop`
 * alone, which is #471's rule and not this one. `marquee--mobile-bg-divided` is
 * our `stacked`: both hide the scrim below 1025 and both divide the band there.
 *
 * Painted `::after` on live, read through capture.sh --probe at three widths on
 * 2026-08-02. `hidden` is the pseudo-element generating with `display: none`,
 * which paints nothing:
 *
 *     page                 our classes (preview)             375      900      1440
 *     /learn               hero left stacked short slimmer   hidden   hidden   rgba(0,0,0,0.3)
 *     /events              hero stacked tall short           gradient gradient rgba(0,0,0,0.4)
 *     /tires (+11)         hero left short                   none     none     none
 *     /experience/soccer   hero breadcrumb stacked slimmer   hidden   hidden   rgba(0,0,0,0.3)
 *
 * THE 12 `/tires` PAGES ARE THE REASON THIS IS NOT A FIX ON `.hero.short`.
 * `hero left short` is authored on `/tires` and its eleven category pages and
 * they are PUBLISHED, read off `.plain.html` for all 328 indexed paths on both
 * hosts. Live gives those marquees `--marquee-bg-opacity: 0` and paints nothing,
 * so `background: none` is CORRECT there and must survive this. #519's body says
 * `short` is on no published page; that is the same miscount #513 made and it is
 * wrong in the same direction.
 *
 * `stacked` is what tells the two apart: the pages live paints a scrim on are
 * the ones it divides below 1025, and `/tires` is not divided on either side.
 *
 * COMPUTED VALUES AT A WIDTH, not declarations. The defect is one rule beating
 * another at equal specificity, which reads correct in the CSSOM and never
 * reaches the page.
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

/* the scrim as it actually paints: the pseudo-element on `.hero-image`, read
   for what it draws AND for whether it is generated at all */
async function scrim(classes, width) {
  await setViewport({ width, height: 900 });
  const block = mount(classes);
  const cs = getComputedStyle(block.querySelector('.hero-image'), '::after');
  return {
    content: cs.content,
    color: cs.backgroundColor,
    image: cs.backgroundImage,
    display: cs.display,
  };
}

/* live paints nothing at all: `rgba(0, 0, 0, 0)` over no image */
const BARE = (s) => s.color === 'rgba(0, 0, 0, 0)' && s.image === 'none';

describe('Hero, the scrim `short` cancels above 1025 (#519)', () => {
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

  describe('/learn, authored `hero left stacked short slimmer`', () => {
    it('paints live\'s flat 30% black at 1025, where live reads rgba(0, 0, 0, 0.3)', async () => {
      const s = await scrim('left stacked short slimmer', 1025);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
    });

    it('paints no gradient at 1025, where live\'s is a flat colour', async () => {
      const s = await scrim('left stacked short slimmer', 1025);
      expect(s.image).to.equal('none');
    });

    it('still paints the flat 30% at 1440', async () => {
      const s = await scrim('left stacked short slimmer', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
    });

    it('generates no pseudo-element at 1024, where live hides its own', async () => {
      const s = await scrim('left stacked short slimmer', 1024);
      expect(s.content).to.equal('none');
    });
  });

  describe('/events, authored `hero stacked tall short`', () => {
    it('paints live\'s flat 40% black at 1025, where live reads rgba(0, 0, 0, 0.4)', async () => {
      const s = await scrim('stacked tall short', 1025);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.4)');
    });

    it('paints no gradient at 1025, where live\'s is a flat colour', async () => {
      const s = await scrim('stacked tall short', 1025);
      expect(s.image).to.equal('none');
    });

    it('still paints the flat 40% at 1440', async () => {
      const s = await scrim('stacked tall short', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.4)');
    });

    it('draws live\'s own strip scrim at 1024 rather than nothing', async () => {
      /* THIS ASSERTION READ `content: none` UNTIL #527. `/learn` is the page
         live hides its scrim on below the step; `/events` is the one it draws
         over, from its own `.marquee--events.marquee--mobile-bg-divided` rule,
         and #519 recorded that difference without fixing it. The value is
         asserted in hero-scrim-population.test.js. */
      const s = await scrim('stacked tall short', 1024);
      expect(s.content).to.not.equal('none');
      expect(s.image).to.contain('linear-gradient(0deg');
    });
  });

  describe('/tires and its eleven category pages, authored `hero left short`', () => {
    it('paints nothing at 1025, where live gives the marquee opacity 0', async () => {
      const s = await scrim('left short', 1025);
      expect(BARE(s), `painted ${s.color} over ${s.image}`).to.be.true;
    });

    it('paints nothing at 1440 either', async () => {
      const s = await scrim('left short', 1440);
      expect(BARE(s), `painted ${s.color} over ${s.image}`).to.be.true;
    });

    it('paints nothing at 1024, below the step', async () => {
      const s = await scrim('left short', 1024);
      expect(BARE(s), `painted ${s.color} over ${s.image}`).to.be.true;
    });
  });

  describe('a hero carrying neither class', () => {
    it('keeps the block\'s own bottom-up gradient at 1440', async () => {
      const s = await scrim('', 1440);
      expect(s.image).to.contain('linear-gradient');
      expect(s.image).to.contain('to top');
    });

    it('keeps it at 1024 as well', async () => {
      const s = await scrim('', 1024);
      expect(s.image).to.contain('linear-gradient');
    });
  });

  describe('the two heroes this fix must not reach', () => {
    it('leaves `hero left` to its own rule rather than reaching it', async () => {
      /* THIS ASSERTION READ THE TWO-LAYER GRADIENT UNTIL #471, which took it off
         `.hero.left` because live paints it on three pages and that rule reached
         seven. What matters here is unchanged: `short`'s fix does not decide
         what a `hero left` band paints. */
      const s = await scrim('left', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
    });

    it('leaves `hero breadcrumb stacked slimmer` to its own rule', async () => {
      /* /experience/soccer: same `stacked`, no `short`. It read the base
         gradient until #528 gave it live's flat 30%, and the point this guards
         is the same either way: `short`'s rule is not what decides it. */
      const s = await scrim('breadcrumb stacked slimmer', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
    });
  });
});
