/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * Live divides four more marquees below 1025, at three heights this stylesheet
 * does not have. Read off the published host on 2026-08-02, naming the box on
 * each side: live's is `div.marquee__background` inside `section[class*=marquee]`
 * and ours is `.hero-image` inside `.hero`.
 *
 *     page                        live strip   ours   authored today
 *     /experience/soccer          130          320    hero breadcrumb
 *     /learn                      130          320    hero left
 *     /events                     224          320    hero
 *     /all-new-securecontact-aw   125          320    hero
 *
 * `stacked` divides the marquee and a second class takes the strip off its 200,
 * which is how `slim` reaches live's 160 on the three `/experience` hubs. Three
 * more heights need three more of those, and the 130 has to serve two pages
 * carrying different modifiers, `breadcrumb` on one and `left` on the other.
 *
 * NO PAGE CARRIES THESE CLASSES YET. The four are authored `hero`, `hero left`
 * and `hero breadcrumb`, and they gain the variant after this merges: authoring
 * first would match `.hero.stacked` alone and put a 200px strip on `main`.
 *
 * THE DEFECT THIS GUARDS IS #466, AND IT IS WHY THE NUMBERS ARE READ AT A WIDTH.
 * A media query adds no specificity, so a base `.hero.stacked.slimmer
 * .hero-image` at 0-4-0 outscores the query's `.hero.stacked .hero-image
 * { height: auto }` at 0-3-0 and wins above 1025 too. That shipped once: it left
 * `/experience` showing a 160px strip over 240px of black inside a 400px band,
 * and a test reading declarations out of the CSSOM passed the whole time.
 * So each variant is asserted on both sides of live's own 1025 step. Issue #217.
 */

/** Live's strip below 1025, and the modifier each page already carries. */
const VARIANTS = [
  {
    name: 'tall', strip: 224, page: '/events', modifiers: '',
  },
  {
    name: 'slimmer', strip: 130, page: '/experience/soccer', modifiers: 'breadcrumb',
  },
  {
    name: 'slimmer', strip: 130, page: '/learn', modifiers: 'left',
  },
  {
    name: 'slimmest', strip: 125, page: '/all-new-securecontact-aw', modifiers: '',
  },
];

/** The two strips already in the file, which none of this may move. */
const UNCHANGED = [
  { classes: 'left stacked slim breadcrumb', strip: 160, what: 'the /experience hubs' },
  { classes: 'stacked', strip: 200, what: 'the base divided marquee' },
];

/* a 3:2 photo, inline so nothing waits on the network */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

/**
 * The marquee as `hero.js` builds it, under the section the page decoration
 * puts it in.
 * @param {string} classes the block's authored classes
 * @returns {Element} the block
 */
function mount(classes) {
  document.body.innerHTML = `
    <main><div class="section hero-container"><div class="hero-wrapper">
      <div class="hero ${classes} block">
        <div class="hero-image"><picture><img src="${PHOTO}" alt=""></picture></div>
        <div class="hero-content"><h1>A marquee title</h1><p>a standfirst</p></div>
      </div>
    </div></div></main>`;
  const block = document.querySelector('.hero.block');
  // refuse a fixture with no box: styles.css holds `body` at `display: none`
  // until `.appear`, and every assertion below is a height, so an undisplayed
  // body reads 0 everywhere and each one passes on nothing
  if (block.getBoundingClientRect().height === 0) {
    throw new Error('the hero fixture rendered with no box, so nothing here was measured');
  }
  return block;
}

const heightOf = (selector) => getComputedStyle(document.querySelector(selector)).height;

describe('Hero, live\'s three further marquee strips (#217)', () => {
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

  VARIANTS.forEach(({
    name, strip, page, modifiers,
  }) => {
    const classes = `${modifiers} stacked ${name}`.trim();
    describe(`${page}, authored \`${classes}\``, () => {
      /* 1024 is the pixel below live's step and 375 is the phone */
      [375, 1024].forEach((width) => {
        it(`divides the marquee at live's ${strip} at ${width}`, async () => {
          await setViewport({ width, height: 900 });
          mount(classes);
          expect(heightOf('.hero-image')).to.equal(`${strip}px`);
          /* IN FLOW is the claim, and `static` was the letter of it. The strip
             took `position: relative` under #527, which is in flow exactly as
             `static` is and gives the /events scrim over the strip something to
             resolve against: `.hero` is otherwise the closest positioned
             ancestor, so an `inset: 0` pseudo-element covers the copy too.
             `absolute` is what would undivide the marquee, and that is what
             this reads. */
          expect(getComputedStyle(document.querySelector('.hero-image')).position)
            .to.not.equal('absolute');
          /* and the copy sits BELOW the photo rather than over it, which is
             what being in flow buys and what a keyword alone cannot show */
          const image = document.querySelector('.hero-image').getBoundingClientRect();
          const copy = document.querySelector('.hero-content').getBoundingClientRect();
          expect(Math.round(copy.top)).to.be.at.least(Math.round(image.bottom));
        });
      });

      /*
       * THE #466 HALF. Above the step the strip is the whole band again, and a
       * base rule at 0-4-0 that the query cannot reach leaves it at its divided
       * height inside a 560 band. Asserted as filling the band rather than as
       * the string `auto`, because a used height is always px.
       */
      [1025, 1440].forEach((width) => {
        it(`fills the band rather than staying ${strip} at ${width}`, async () => {
          await setViewport({ width, height: 900 });
          const block = mount(classes);
          const band = getComputedStyle(block).height;
          expect(getComputedStyle(document.querySelector('.hero-image')).position, 'the overlay')
            .to.equal('absolute');
          expect(heightOf('.hero-image'), 'the photo fills the band').to.equal(band);
          expect(parseFloat(band), 'and the band is taller than the strip')
            .to.be.greaterThan(strip);
        });
      });
    });
  });

  /*
   * The two strips that are already right. Both pass before the change, so each
   * gets its break in the red run rather than standing as decoration: renaming
   * the new variants' selector to `.hero.stacked` fails them.
   */
  describe('the strips already in the file do not move', () => {
    UNCHANGED.forEach(({ classes, strip, what }) => {
      it(`holds ${what} at ${strip} below the step`, async () => {
        await setViewport({ width: 375, height: 900 });
        mount(classes);
        expect(heightOf('.hero-image')).to.equal(`${strip}px`);
      });
    });
  });
});
