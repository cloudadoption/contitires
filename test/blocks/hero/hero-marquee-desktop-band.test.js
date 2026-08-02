/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * `.hero.stacked` sets `min-height: 560px` from 1025 and outscores `.hero` at
 * 440 and `.hero.left` at 560, so a page gains a 560 band the moment it is
 * authored into the divided variant. Live runs 345 to 480 on those pages, so
 * three of #217's four would move FURTHER from live at desktop.
 *
 * Read on the published host on 2026-08-02, seven pages, bracketed at 1024 and
 * 1025, every row carrying the probe's own `location.pathname`:
 *
 *     page                        live 1440   ours 1440   trail
 *     /experience/conti-crew           400         400     yes
 *     /experience/partners             400         400     yes
 *     /experience/soccer               400         440     yes
 *     /learn                           345         560      no
 *     /events                          345         440      no
 *     /ev-compatible                   360         400      no
 *     /all-new-securecontact-aw        480         440      no
 *
 * THE TRAIL PREDICTS 400 AND NOTHING PREDICTS THE REST. Live carries
 * `marquee--has-breadcrumbs` on exactly the three that read 400, and the four
 * without it take three different values from three different mechanisms. So
 * two rules are supported and the other two pages are a documentation line:
 * `/ev-compatible` runs a 440 container inside a 360 section, which is live
 * contradicting itself, and `/all-new-securecontact-aw` is an aspect-driven box
 * reading 480, 341.66 and 467.33 across three widths, which no `min-height` can
 * reproduce.
 *
 * BOTH RULES CARRY `stacked`, AND THAT IS A SPECIFICITY REQUIREMENT RATHER THAN
 * A STYLE. `.hero.short` and `.hero.stacked` both score 0-2-0 and `.hero.stacked`
 * is later in source, `:577` against `:467`, so on a page authored
 * `hero short stacked` the 560 wins and `short` does nothing. Media queries add
 * no specificity. `.hero.stacked.short` at 0-3-0 is what beats it, which is the
 * shape `.hero.stacked.slim` already uses.
 *
 * `short` IS THIS SITE'S FIRST USE OF THAT CLASS. `.hero.short` and
 * `.hero.left.short` at `:467` are reached by no page today, checked across the
 * indexed paths.
 *
 * THESE ARE COMPUTED VALUES AT A WIDTH. A rule beaten on source order reads
 * correct in the CSSOM and never reaches the page, and the expected side is
 * live's own number rather than another element on the page: an assertion that
 * compares two boxes to each other is blind to a change that moves both.
 * Issue #509.
 */

/** Live's desktop band, per authored shape, from 1025 up. */
const BANDS = [
  {
    what: 'a section hub with a trail', classes: 'breadcrumb stacked slimmer', band: 400, below: '0px', page: '/experience/soccer',
  },
  {
    what: 'the learn hub', classes: 'left stacked slimmer short', band: 345, below: '0px', page: '/learn',
  },
  {
    what: 'the events hub', classes: 'stacked tall short', band: 345, below: '0px', page: '/events',
  },
];

/** The control: divided, but carrying neither rule's class. */
const CONTROL = { classes: 'stacked tall', band: 560 };

/* a photo with live's own marquee ratio, inline so nothing waits on the network */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

function mount(classes) {
  document.body.innerHTML = `
    <main><div class="section hero-container"><div class="hero-wrapper">
      <div class="hero ${classes} block">
        <div class="hero-image"><picture><img src="${PHOTO}" alt=""></picture></div>
        <div class="hero-content"><h1>A marquee title</h1><p>a standfirst</p></div>
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

const minHeightOf = (el) => getComputedStyle(el).minHeight;

describe('Hero, live\'s desktop band on the divided marquee (#509)', () => {
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

  BANDS.forEach(({
    what, classes, band, below, page,
  }) => {
    describe(`${page}, authored \`${classes}\``, () => {
      [1025, 1440].forEach((width) => {
        it(`takes live's ${band}px band at ${width}`, async () => {
          await setViewport({ width, height: 900 });
          expect(minHeightOf(mount(classes))).to.equal(`${band}px`);
        });
      });

      /*
       * The other side of live's own step: the three release the band to their
       * content at 0, which is what live does below 1025.
       *
       * `/learn` read 345 here until #513. `.hero.left.short` scores 0-3-0 and
       * fired from 900, so it beat `.hero.stacked`'s `min-height: 0` and held
       * 345 through the 900-to-1024 band against live's 222, while `/events`
       * carrying `short` without `left` lost to that same 0 on source order.
       * The block those rules sit in now opens at 1025, where live's own step
       * is, so the asymmetry is gone and all three read 0. Asserted per page so
       * it cannot come back unnoticed.
       */
      it(`reads ${below} below the step at 1024`, async () => {
        await setViewport({ width: 1024, height: 900 });
        expect(minHeightOf(mount(classes))).to.equal(below);
      });

      it(`keeps ${what} on its own strip height`, async () => {
        await setViewport({ width: 375, height: 900 });
        const block = mount(classes);
        const strip = getComputedStyle(block.querySelector('.hero-image')).height;
        const want = classes.includes('slimmer') ? '130px' : '224px';
        expect(strip, 'the band rules do not disturb the strip').to.equal(want);
      });
    });
  });

  /*
   * The control, and it is the half that can pass without meaning anything: a
   * page carrying neither class must still read 560, or the two rules are
   * reaching further than the trail and the short hub.
   */
  describe(`a divided page carrying neither, authored \`${CONTROL.classes}\``, () => {
    [1025, 1440].forEach((width) => {
      it(`is left at ${CONTROL.band} at ${width}`, async () => {
        await setViewport({ width, height: 900 });
        expect(minHeightOf(mount(CONTROL.classes))).to.equal(`${CONTROL.band}px`);
      });
    });
  });

  /*
   * `short` without `stacked` is the route that does not work, and this records
   * why the rules are shaped the way they are. `.hero.short` and `.hero.stacked`
   * tie at 0-2-0 and `.hero.stacked` is later in source, so on `hero short
   * stacked` the 560 wins unless a 0-3-0 rule beats it.
   */
  it('needs the `stacked` in its selector, because `.hero.short` alone loses to it', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(minHeightOf(mount('short')), '`short` alone, where nothing competes')
      .to.equal('345px');
    expect(minHeightOf(mount('short stacked')), '`short stacked`, where a 0-3-0 rule is what wins')
      .to.equal('345px');
  });
});
