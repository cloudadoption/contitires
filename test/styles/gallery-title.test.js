/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * The title a band puts over a gallery of cards. Issue #278.
 *
 * Live calls that band `section.card-list` and gives its title a treatment of its
 * own: 42px on a 48px box above 1024 and 30 on 36 below it, weight 300, tracked
 * out 6px, centred and in capitals, with nothing above it and 38px under it.
 * Read off continentaltire.com/experience/soccer at 375, 900, 1024 and 1440, and
 * confirmed on /my-first-car-my-first-tires and /cruisingthecontinentalus, which
 * carry the same band. Ours read the site h2, 30 on 38, left, untracked and in
 * the case it was authored in.
 *
 * IT IS SCOPED AND THE SITE h2 DOES NOT MOVE. Live's own h2 is not 42/48: the
 * card titles inside these same bands are h2 at 14/20, and my-first-car's are
 * 12/16, so 42/48 belongs to the band's title rather than to the level. The
 * counterpart here is the default content of a section that names a gallery of
 * cards, which is 9 titles on 4 pages across the 327 published paths
 * (/experience/soccer 4, /my-first-car-my-first-tires 2,
 * /cruisingthecontinentalus 2, /events 2 in one section). /events is excluded by
 * the `.cards` in the selector, because its gallery is the `social` variant and
 * `main .section.two-columns h2` already gives its two titles live's own
 * treatment there, which goes left from 769 where this one stays centred.
 *
 * The two margins are pins rather than live's numbers. Live pads the band 80 and
 * leaves the title no top margin; ours pads 56 and the shared `margin-top: 0.8em`
 * adds 24, so the title lands 80 into the band on both sides at 1440. Left
 * proportional it would resolve to 33.6px once the size steps to 42 and break a
 * match that holds today. Below 769 live pads that band 38 against our 56, so
 * the space above the title is 42px wider here at 375. That is the band's
 * padding and not the title's, so it is recorded and not touched.
 */
const LIVE = [
  { vw: 375, size: '30px', lh: '36px' },
  { vw: 900, size: '30px', lh: '36px' },
  { vw: 1440, size: '42px', lh: '48px' },
];

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

/**
 * Two sections as the pipeline delivers them: a dark band holding a title and a
 * gallery of cards, then a plain section holding a title of its own, which is
 * the control that says the site h2 did not move.
 */
function build() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <h2 id="this-is-mls">This is MLS</h2>
      <div class="media-gallery cards leading">
        <div><div><picture><img src="/icons/search.svg" alt="one"></picture></div><div>Passionate MLS Fans</div></div>
        <div><div><picture><img src="/icons/search.svg" alt="two"></picture></div><div>Opposing MLS Fans</div></div>
      </div>
      <div class="section-metadata"><div><div>Style</div><div>black</div></div></div>
    </div>
    <div>
      <h2 id="a-plain-title">A plain title</h2>
      <p>Default content in a section that names no gallery.</p>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

describe('The title over a gallery of cards (#278)', () => {
  let band;
  let control;

  before(async () => {
    await adopt('/styles/styles.css', '/blocks/media-gallery/media-gallery.css');
    document.body.classList.add('appear');
    const main = build();
    band = main.querySelector('#this-is-mls');
    control = main.querySelector('#a-plain-title');
  });

  after(async () => {
    await setViewport({ width: 1440, height: 900 });
  });

  it('puts the gallery in a section the selector can find', () => {
    // the whole rule hangs off this shape: the title is the section's own
    // default content and the gallery is a sibling wrapper in the same section
    const section = band.closest('.section');
    expect(section, 'the title sits in a section').to.exist;
    expect(band.parentElement.classList.contains('default-content-wrapper')).to.be.true;
    expect(section.querySelector('.media-gallery.cards'), 'the gallery is in the same section').to.exist;
    expect(control.closest('.section')).to.not.equal(section);
  });

  LIVE.forEach(({ vw, size, lh }) => {
    describe(`at ${vw}`, () => {
      let cs;
      let ctl;

      before(async () => {
        await setViewport({ width: vw, height: 900 });
        cs = getComputedStyle(band);
        ctl = getComputedStyle(control);
      });

      it(`takes live's ${size} on a ${lh} box`, () => {
        expect(cs.fontSize).to.equal(size);
        expect(cs.lineHeight).to.equal(lh);
      });

      it('is centred, tracked out 6px and in capitals at weight 300', () => {
        expect(cs.textAlign).to.equal('center');
        expect(cs.letterSpacing).to.equal('6px');
        expect(cs.textTransform).to.equal('uppercase');
        expect(cs.fontWeight).to.equal('300');
      });

      it("leaves live's 38px under it and holds the 24px above it", () => {
        expect(cs.marginBottom).to.equal('38px');
        expect(cs.marginTop).to.equal('24px');
      });

      it('leaves the site h2 where it was', () => {
        expect(ctl.fontSize, 'size').to.equal('30px');
        expect(ctl.lineHeight, 'line box').to.equal('38px');
        expect(ctl.letterSpacing, 'tracking').to.equal('normal');
        expect(ctl.textTransform, 'case').to.equal('none');
        expect(ctl.textAlign, 'alignment').to.equal('start');
        expect(ctl.marginBottom, 'margin below').to.equal('7.5px');
      });
    });
  });
});
