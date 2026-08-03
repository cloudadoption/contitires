/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * The base scrim is authored per marquee, which is live's own model. #531
 *
 * `.hero .hero-image::after` painted one bottom-up gradient for every block no
 * more specific rule reached, and live takes a different value on each of them.
 * Read off continentaltire.com on 2026-08-03, the computed `::after` of
 * `.marquee__background` at 1440 beside the inline custom property the page
 * carries:
 *
 *     page                                  authored          painted at 1440
 *     /forwhatyoudo                         0.0               rgba(0, 0, 0, 0)
 *     /lightscameratraction                 0.0               rgba(0, 0, 0, 0)
 *     /smart-choice                         0.0               rgba(0, 0, 0, 0)
 *     /ev-compatible                        0.0               rgba(0, 0, 0, 0)
 *     /cruisingthecontinentalus             0.0               rgba(0, 0, 0, 0)
 *     /customer-support/technical-documents  0.3              rgba(0, 0, 0, 0.3)
 *     /emilytalkstires                      0.4               rgba(0, 0, 0, 0.4)
 *     /promotionended                        .5               rgba(0, 0, 0, 0.5)
 *     /all-new-securecontact-aw             0.0 + shade       the gradient below
 *
 * Live's rule, out of its own stylesheet:
 *
 *     .marquee__background::after { background: rgba(0, 0, 0, var(--marquee-bg-opacity, 0.2)) }
 *     .marquee--vertical-shade …::after   { background: <bottom-dark> }
 *
 * So the value is the author's, one custom property per marquee, with each
 * further treatment on a variant class of its own. Nothing about the page
 * predicts it, which is why no selector over our existing classes can close
 * this: the nine blocks are indistinguishable in our markup and differ only in
 * the number live's author picked.
 *
 * OURS FOLLOWS THE SAME SHAPE. The base is flat and transparent by default, the
 * number rides `--hero-scrim-opacity`, and the four values live uses are four
 * authored classes. Zero rather than live's own 0.2 default, because live sets
 * 0.0 on eight of the nineteen marquees read and there is no block here that
 * wants a value nobody authored.
 *
 * COMPUTED VALUES AT A WIDTH, not declarations: each of these is one rule
 * beating another at equal specificity, which reads correct in the CSSOM and
 * never reaches the page.
 */

/* a photo with live's own marquee ratio, inline so nothing waits on the network */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

/* live's `marquee--vertical-shade`, read off /all-new-securecontact-aw at 1440 */
const SHADE = 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 75%, rgba(0, 0, 0, 0.8) 90%)';
const BACKDROP = 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 10.83%, rgba(0, 0, 0, 0) 59.1%), '
  + 'linear-gradient(rgba(0, 0, 0, 0.6) 4%, rgba(0, 0, 0, 0) 12.33%)';

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

/* live paints nothing: no colour over no image */
const bare = (s) => s.color === 'rgba(0, 0, 0, 0)' && s.image === 'none';

describe('Hero scrim, authored per marquee the way live authors it (#531)', () => {
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

  describe('the four blocks live paints nothing on', () => {
    [
      ['/forwhatyoudo', ''],
      ['/lightscameratraction', ''],
      ['/smart-choice', ''],
      ['/ev-compatible', 'stacked slim bottom jump'],
    ].forEach(([page, classes]) => {
      [1440, 375].forEach((width) => {
        it(`${page} paints nothing at ${width}, where live reads opacity 0`, async () => {
          const s = await scrim(classes, width);
          // below 1025 `stacked` stops the pseudo-element generating at all,
          // which paints nothing by another route and is live's own behaviour
          if (s.content === 'none') return;
          expect(bare(s), `painted ${s.color} over ${s.image}`).to.be.true;
        });
      });
    });
  });

  describe('the values live\'s authors picked', () => {
    [
      ['/customer-support/technical-documents', 'scrim-30', 'rgba(0, 0, 0, 0.3)'],
      ['/emilytalkstires', 'left scrim-40', 'rgba(0, 0, 0, 0.4)'],
      ['/promotionended', 'scrim-50', 'rgba(0, 0, 0, 0.5)'],
    ].forEach(([page, classes, colour]) => {
      it(`${page} reads live's ${colour} at 1440`, async () => {
        const s = await scrim(classes, 1440);
        expect(s.color).to.equal(colour);
        expect(s.image).to.equal('none');
      });

      it(`${page} holds that value at 375, where live's is still painted`, async () => {
        const s = await scrim(classes, 375);
        expect(s.color).to.equal(colour);
      });
    });

    it('/cruisingthecontinentalus paints nothing, against the 30% its `left` band defaults to', async () => {
      const s = await scrim('left scrim-0', 1440);
      expect(bare(s), `painted ${s.color} over ${s.image}`).to.be.true;
    });

    it('/all-new-securecontact-aw reads live\'s vertical shade at 1440', async () => {
      const s = await scrim('vertical-shade', 1440);
      expect(s.image).to.equal(SHADE);
    });

    it('runs that shade top-down, where the base gradient ran bottom-up', async () => {
      const s = await scrim('vertical-shade', 1440);
      expect(s.image).to.not.contain('to top');
    });
  });

  describe('the blocks with no live marquee to read, which carry no photograph', () => {
    ['logo', ''].forEach((classes) => {
      it(`\`hero ${classes}\` paints nothing over its own background`, async () => {
        const s = await scrim(classes, 1440);
        expect(bare(s), `painted ${s.color} over ${s.image}`).to.be.true;
      });
    });
  });

  describe('the rules this must not move', () => {
    it('leaves the in-page `hero left` band on live\'s flat 30%', async () => {
      const s = await scrim('left', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
      expect(s.image).to.equal('none');
    });

    it('leaves /learn\'s marquee on its flat 30% at 1440', async () => {
      const s = await scrim('left stacked short slimmer', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
    });

    it('leaves /events on its flat 40% at 1440', async () => {
      const s = await scrim('stacked tall short', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.4)');
    });

    it('leaves /experience/soccer on its flat 30% at 1440', async () => {
      const s = await scrim('breadcrumb stacked slimmer', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
    });

    it('leaves the two promo marquees on live\'s flat 50%', async () => {
      const s = await scrim('promo', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.5)');
    });

    it('leaves the twelve `hero left short` pages painting nothing', async () => {
      const s = await scrim('left short', 1440);
      expect(bare(s), `painted ${s.color} over ${s.image}`).to.be.true;
    });

    it('leaves the three backdrop pages on live\'s two layers', async () => {
      const s = await scrim('left stacked slim breadcrumb', 1440);
      expect(s.image).to.equal(BACKDROP);
    });
  });
});
