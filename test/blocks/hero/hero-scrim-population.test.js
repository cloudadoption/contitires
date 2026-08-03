/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * Three rules on one pseudo-element, `.hero .hero-image::after`, so they are
 * read and fixed together: #471 the `.hero.left` two-layer gradient, #527
 * `/events` below 1025, #528 `/experience/soccer` at 1440. #526's
 * `.hero.stacked.short` rule is settled and is guarded here rather than moved.
 *
 * LIVE'S MODEL, out of continentaltire.com's own stylesheet:
 *
 *     .marquee__background::after { background: rgba(0, 0, 0, var(--marquee-bg-opacity, 0.2)) }
 *     .marquee--with-left-backdrop .marquee__background::after { background: <two layers> }
 *     .marquee--vertical-shade    .marquee__background::after { background: <bottom-dark> }
 *     @media (max-width: 1024px) {
 *       .marquee--mobile-bg-divided …::after { display: none }
 *       .marquee--events.marquee--mobile-bg-divided …::after {
 *         display: block; background: linear-gradient(0deg, #000 0%, transparent 100%);
 *       }
 *     }
 *
 * So the scrim is FLAT and per-marquee through one custom property, and each
 * further treatment belongs to one variant. `marquee--mobile-bg-divided` is our
 * `stacked` and `marquee--has-breadcrumbs` is our `breadcrumb`.
 *
 * THE POPULATION, read at 1440 on 2026-08-02, one probe per page over the 33
 * pages carrying a hero block, against `.plain.html` for the 328 indexed paths
 * on both hosts. Published and preview agree, so #217 has published and `/learn`
 * and `/events` now carry `short` for visitors.
 *
 *     our page                    authored                            live at 1440
 *     /experience                 hero left stacked slim breadcrumb   two-layer backdrop
 *     /experience/conti-crew      hero stacked slim breadcrumb …      two-layer backdrop
 *     /experience/partners        hero stacked slim breadcrumb        two-layer backdrop
 *     /experience/soccer          hero breadcrumb stacked slimmer     flat 0.3
 *     /learn #2                   hero left                           flat 0.3 (banner-with-image)
 *     / #2, /smart-choice #2,     hero left                           live's banner has no photo
 *       /all-new-securecontact #2
 *     / #1                        hero left stacked                   flat 0, nothing painted
 *     /my-first-car-my-first-tires  hero left stacked slim            flat 0, nothing painted
 *     /tires and 11 siblings      hero left short                     flat 0, nothing painted
 *     /learn #1                   hero left stacked short slimmer     flat 0.3   (#526)
 *     /events                     hero stacked tall short             flat 0.4   (#526)
 *
 * SO "FIX THE DIRECTION OF `.hero.left`'s SECOND LAYER" WOULD BE WRONG ON SIX OF
 * THE SEVEN BLOCKS THAT RULE REACHES. Live paints that gradient on three pages,
 * and all three carry `marquee--with-left-backdrop`, which on our side is the
 * three authored `stacked slim breadcrumb`. `/experience/soccer` carries live's
 * breadcrumb class WITHOUT the backdrop one, and takes the flat value.
 *
 * COMPUTED VALUES AT A WIDTH, never declarations: each of these defects is one
 * rule beating another, which reads correct in the CSSOM and never reaches the
 * page.
 */

/* a photo with live's own marquee ratio, inline so nothing waits on the network */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

/* live's own values, copied off the readings rather than retyped from memory */
const BACKDROP = 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 10.83%, rgba(0, 0, 0, 0) 59.1%), '
  + 'linear-gradient(rgba(0, 0, 0, 0.6) 4%, rgba(0, 0, 0, 0) 12.33%)';
const EVENTS_STRIP = 'linear-gradient(0deg, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%)';

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
  const image = block.querySelector('.hero-image');
  const cs = getComputedStyle(image, '::after');
  return {
    content: cs.content,
    color: cs.backgroundColor,
    image: cs.backgroundImage,
    display: cs.display,
    /* the strip below 1025 is `position: static`, so an `inset: 0` pseudo-element
       resolves against `.hero` and would cover the copy as well as the photo.
       The PSEUDO-ELEMENT's own used height is the reading; the `.hero-image` box
       is 224 either way and would pass without testing anything. */
    scrimHeight: Math.round(parseFloat(cs.height)),
    stripHeight: Math.round(image.getBoundingClientRect().height),
    band: Math.round(block.getBoundingClientRect().height),
  };
}

/* live paints nothing: no colour over no image */
const bare = (s) => s.color === 'rgba(0, 0, 0, 0)' && s.image === 'none';

describe('Hero scrim, our rules against live\'s per-marquee treatment (#471, #527, #528)', () => {
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

  describe('#471, the three pages live gives its left backdrop', () => {
    [
      ['/experience', 'left stacked slim breadcrumb'],
      ['/experience/conti-crew', 'stacked slim breadcrumb title-left'],
      ['/experience/partners', 'stacked slim breadcrumb'],
    ].forEach(([page, classes]) => {
      it(`${page} reads live's own two layers at 1440`, async () => {
        const s = await scrim(classes, 1440);
        expect(s.image).to.equal(BACKDROP);
      });
    });

    it('runs the second layer top-down, where ours ran bottom-up', async () => {
      // the whole of #471: live darkens the top 12% where we darkened the
      // bottom 40%, and a `to top` keyword anywhere in the value is the defect
      const s = await scrim('left stacked slim breadcrumb', 1440);
      expect(s.image).to.not.contain('to top');
    });
  });

  describe('#471, the pages live paints nothing on', () => {
    [
      ['/ homepage marquee', 'left stacked'],
      ['/my-first-car-my-first-tires', 'left stacked slim'],
    ].forEach(([page, classes]) => {
      it(`${page} paints nothing at 1440, where live reads opacity 0`, async () => {
        const s = await scrim(classes, 1440);
        expect(bare(s), `painted ${s.color} over ${s.image}`).to.be.true;
      });
    });
  });

  describe('#471, the in-page band authored `hero left`', () => {
    it('reads live\'s flat 30% at 1440, off its banner-with-image on /learn', async () => {
      const s = await scrim('left', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
    });

    it('paints no gradient there', async () => {
      const s = await scrim('left', 1440);
      expect(s.image).to.equal('none');
    });
  });

  describe('#528, /experience/soccer', () => {
    it('reads live\'s flat 30% at 1440, not the block\'s base gradient', async () => {
      const s = await scrim('breadcrumb stacked slimmer', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
    });

    it('paints no gradient at 1440', async () => {
      const s = await scrim('breadcrumb stacked slimmer', 1440);
      expect(s.image).to.equal('none');
    });

    it('is untouched below 1025, where live hides its own', async () => {
      const s = await scrim('breadcrumb stacked slimmer', 1024);
      expect(s.content).to.equal('none');
    });
  });

  describe('#527, /events below 1025', () => {
    [900, 375].forEach((width) => {
      it(`generates the pseudo-element at ${width}, where live draws over the strip`, async () => {
        const s = await scrim('stacked tall short', width);
        expect(s.content).to.not.equal('none');
      });

      it(`draws live's bottom-up black at ${width}`, async () => {
        const s = await scrim('stacked tall short', width);
        expect(s.image).to.equal(EVENTS_STRIP);
      });
    });

    it('covers the photo strip and not the copy below it', async () => {
      // `.hero.stacked .hero-image` is `position: static` below 1025, so an
      // `inset: 0` pseudo-element resolves against `.hero` and would darken the
      // copy as well as the photo
      const s = await scrim('stacked tall short', 900);
      expect(s.stripHeight, 'the strip live divides at 224').to.equal(224);
      expect(s.scrimHeight, `the band is ${s.band}`).to.equal(s.stripHeight);
    });
  });

  describe('the rules this must not move', () => {
    it('leaves #526\'s /learn marquee on its flat 30% at 1440', async () => {
      const s = await scrim('left stacked short slimmer', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.3)');
      expect(s.image).to.equal('none');
    });

    it('leaves #526\'s /events marquee on its flat 40% at 1440', async () => {
      const s = await scrim('stacked tall short', 1440);
      expect(s.color).to.equal('rgba(0, 0, 0, 0.4)');
      expect(s.image).to.equal('none');
    });

    it('leaves the twelve `hero left short` pages painting nothing at 1440', async () => {
      const s = await scrim('left short', 1440);
      expect(bare(s), `painted ${s.color} over ${s.image}`).to.be.true;
    });

    /* the base rule was still the bottom-up gradient when this file was
       written, and #531 is what took it off: live paints nothing on four of the
       blocks it reached and a value of its author's on the rest, so the base is
       now flat, transparent, and keyed on `--hero-scrim-opacity`. The values
       themselves are read in hero-scrim-authored.test.js. */
    it('leaves a hero carrying no variant painting nothing, which is live\'s', async () => {
      const s = await scrim('', 1440);
      expect(bare(s), `painted ${s.color} over ${s.image}`).to.be.true;
    });
  });
});
