/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * `hero.css` opened a whole `@media (width >= 900px)` block in a project whose
 * steps are 769 and 1025. The breakpoint was the finding; the values were not,
 * so live was read per rule before anything moved.
 *
 * Read on continentaltire.com on 2026-08-02 at six widths, against
 * main--contitires--cloudadoption.aem.live as the same-path control:
 *
 *     band                  768   769   899   900   1024   1025
 *     /tires        live    220   220   220   220    220    345
 *     /tires        ours    220   220   220   345    345    345
 *     /learn        live    258   258   222   222    222    345
 *     /learn        ours    320   320   320   560    560    560
 *     /cruising...  live    220   220   220   220    220    345
 *     /cruising...  ours    320   320   320   440    440    440
 *
 *     marquee body copy, live /cruisingthecontinentalus
 *     768 18px   899 18px   1024 18px   1025 20px
 *
 * LIVE STEPS AT 1025 AND NOT AT 769. Its band holds one value from 768 through
 * 1024 on each of the three, and changes at 1025; its marquee copy does the
 * same. So this query belongs at the project's other step rather than at its
 * first one, and moving it to 769 would have taken every rule further from live.
 * Live's own min-height is 0 below 1025 and the band there is its content.
 *
 * The two `short` rules are NOT dead. `hero left short` is authored on 12
 * published pages, `/tires` and its eleven category pages, read off the
 * delivered markup of all 328 indexed paths. #513's body says 0 of 60 sampled,
 * and the sample missed them.
 *
 * Two of the block's declarations are left where they are because they change
 * nothing: `.hero-content p` sets `--heading-font-size-xs`, which is 18px, over
 * a base `--body-font-size-m`, which is also 18px, and the `p:has(> a)` rule
 * restates the base 14px so that the 20px rule beside it cannot reach a
 * link-only line.
 *
 * COMPUTED VALUES AT A WIDTH, not declarations. A media-query rule beaten by a
 * later base rule reads correct in the CSSOM and never reaches the page, which
 * is the same reason `hero-marquee-desktop-band.test.js` measures. Issue #513.
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
          <p><a href="/somewhere">a link on its own</a></p>
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

const px = (el, prop) => getComputedStyle(el)[prop];
const content = (block) => block.querySelector('.hero-content');
const standfirst = (block) => block.querySelectorAll('.hero-content p')[0];
const linkLine = (block) => block.querySelectorAll('.hero-content p')[1];

/**
 * The three authored shapes the block's min-heights reach, with the value each
 * takes below live's step and the one it takes above it.
 */
const SHAPES = [
  {
    page: '/cruisingthecontinentalus', classes: '', below: '320px', above: '440px', live: 220, pages: 10,
  },
  {
    page: '/learn', classes: 'left', below: '320px', above: '560px', live: 222, pages: 4,
  },
  {
    page: '/tires', classes: 'left short', below: '220px', above: '345px', live: 220, pages: 12,
  },
];

describe('Hero, the 900 query against live\'s own step (#513)', () => {
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

  SHAPES.forEach(({
    page, classes, below, above, live, pages,
  }) => {
    describe(`${page}, authored \`${`hero ${classes}`.trim()}\` on ${pages} pages`, () => {
      [900, 1024].forEach((width) => {
        it(`holds its ${below} band at ${width}, where live reads ${live}`, async () => {
          await setViewport({ width, height: 900 });
          expect(px(mount(classes), 'minHeight')).to.equal(below);
        });
      });

      it(`takes ${above} at 1025, where live steps`, async () => {
        await setViewport({ width: 1025, height: 900 });
        expect(px(mount(classes), 'minHeight')).to.equal(above);
      });

      it('is unchanged at 899, which no step of ours touches', async () => {
        await setViewport({ width: 899, height: 900 });
        expect(px(mount(classes), 'minHeight')).to.equal(below);
      });
    });
  });

  describe('the copy block', () => {
    it('keeps live\'s 20px side inset through 1024', async () => {
      await setViewport({ width: 1024, height: 900 });
      const box = content(mount('left'));
      expect(px(box, 'paddingLeft')).to.equal('20px');
      expect(px(box, 'paddingTop')).to.equal('56px');
    });

    it('takes the desktop 96 by 32 at 1025', async () => {
      await setViewport({ width: 1025, height: 900 });
      const box = content(mount('left'));
      expect(px(box, 'paddingLeft')).to.equal('32px');
      expect(px(box, 'paddingTop')).to.equal('96px');
    });
  });

  describe('the marquee copy on a left page', () => {
    it('reads live\'s 18px through 1024', async () => {
      await setViewport({ width: 1024, height: 900 });
      expect(px(standfirst(mount('left')), 'fontSize')).to.equal('18px');
    });

    it('takes live\'s 20px at 1025', async () => {
      await setViewport({ width: 1025, height: 900 });
      expect(px(standfirst(mount('left')), 'fontSize')).to.equal('20px');
    });

    it('leaves a link-only line at 14px on both sides of the step', async () => {
      // the guard the 20px rule needs: without it a line holding one link grows
      // with the standfirst beside it
      await setViewport({ width: 1024, height: 900 });
      expect(px(linkLine(mount('left')), 'fontSize')).to.equal('14px');
      await setViewport({ width: 1025, height: 900 });
      expect(px(linkLine(mount('left')), 'fontSize')).to.equal('14px');
    });
  });

  it('leaves no rule stepping at 900 in this stylesheet', async () => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
    const at900 = [...sheet.cssRules]
      .filter((rule) => rule.media && /\b900px\b/.test(rule.conditionText))
      .map((rule) => rule.conditionText);
    expect(at900, 'the project steps at 769 and 1025').to.eql([]);
  });
});
