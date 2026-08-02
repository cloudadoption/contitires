/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/hero/hero.js';

/**
 * Live's marquee on /my-first-car-my-first-tires carries a play control over the
 * photo that opens video `HQetV7NlTPI`. We draw none, and the video is on no
 * card below it either: the eight ids authored into that page's gallery are
 * live's, and this one is not among them, read off `.plain.html` on the
 * published host on 2026-08-02. So a reader on our page cannot reach it at all.
 *
 * Live's own markup, read on 2026-08-02:
 *
 *     <section class="marquee … marquee--with-video-overlay marquee--my-1st-car">
 *       <div class="marquee__background" …></div>
 *       <div class="marquee__video-overlay" data-modal-target="#marquee-media">
 *         <con-media-gallery-modal videoid="HQetV7NlTPI" …>
 *           <button class="media-video media--cta" type="button">
 *             <span class="sr-only">Click to play the video</span>
 *           </button>
 *
 * The overlay covers the photo, 375x160 at 375 and 1440x400 at 1440, and the
 * button centres in it: (188,80) and (720,200) from the marquee's top left. Live
 * draws the badge from a stylesheet inside its own custom element, which is why
 * the button reads 0x0 to a probe, so the badge here is the site's own, the one
 * `blocks/video/video.css` already draws on every player.
 *
 * The player is the video block's too, so nothing is asked of YouTube until
 * someone asks to watch. THE CLOSED STATE IS ASSERTED AS WELL AS THE OPEN ONE:
 * a modal that cannot report shut leaves a player running behind it.
 *
 * The control needs the URL authored into the hero block on the DA page. Its
 * published markup today is two picture cells and a copy cell with no link, so
 * there is nothing for this to find until that happens. #468
 */

/* a 3:2 photo, inline so nothing waits on the network */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

const VIDEO = 'https://www.youtube.com/watch?v=HQetV7NlTPI';

/**
 * The block as EDS delivers it, with the video link authored as its own
 * paragraph in the copy cell. `decorateButtons` has already run by the time a
 * block is decorated, so a link on its own line arrives as a button wrapper.
 */
function build({ classes = 'left stacked slim', href = VIDEO } = {}) {
  const link = href
    ? `<p class="button-wrapper"><a class="button" href="${href}">Watch the film</a></p>`
    : '';
  document.body.innerHTML = `
    <main><div class="section hero-container"><div class="hero-wrapper">
      <div class="hero ${classes} block">
        <div><div><picture><img src="${PHOTO}" alt="" width="1440" height="960"></picture></div></div>
        <div><div>
          <h1>MY FIRST CAR. MY FIRST TIRES.</h1>
          <p>your first car holds a special place</p>
          ${link}
        </div></div>
      </div>
    </div></div></main>`;
  return document.querySelector('.hero.block');
}

const centre = (el) => {
  const r = el.getBoundingClientRect();
  const round = (n) => Math.round(n * 100) / 100;
  return { x: round(r.left + r.width / 2), y: round(r.top + r.height / 2) };
};

describe('Hero, the play control live draws over the marquee (#468)', () => {
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

  // `!!` rather than `to.exist`, as perfect-fit.test.js does it: chai
  // stringifies a live DOM node when an assertion fails and walks the document
  // outwards, which hangs the runner instead of failing it
  describe('an authored video link', () => {
    let block;
    beforeEach(() => { block = build(); decorate(block); });

    it('becomes a play control and not a CTA pill', () => {
      expect(!!block.querySelector('.hero-play'), 'the control is drawn').to.be.true;
      expect(!!block.querySelector('.hero-ctas'), 'no CTA row is built for it').to.be.false;
    });

    it('leaves the link out of the copy', () => {
      expect(!!block.querySelector('.hero-content a[href*="youtube"]')).to.be.false;
    });

    it('names what the control does', () => {
      expect(block.querySelector('.hero-play').getAttribute('aria-label'))
        .to.equal('Play Watch the film');
    });

    it('hangs a dialog off the block and reports it shut', () => {
      const modal = block.querySelector('dialog.hero-modal');
      expect(!!modal, 'the dialog is built').to.be.true;
      expect(modal.open, 'the dialog starts closed').to.be.false;
    });

    it('asks nothing of YouTube until someone asks to watch', () => {
      expect(block.querySelectorAll('iframe')).to.have.length(0);
    });
  });

  describe('a hero with no video authored', () => {
    it('draws no control and no dialog', () => {
      const block = build({ href: '' });
      decorate(block);
      expect(!!block.querySelector('.hero-play')).to.be.false;
      expect(!!block.querySelector('dialog')).to.be.false;
    });

    it('still treats an ordinary link as a CTA', () => {
      const block = build({ href: '/tire-search' });
      decorate(block);
      expect(!!block.querySelector('.hero-play')).to.be.false;
      expect(!!block.querySelector('.hero-ctas .button')).to.be.true;
    });
  });

  describe('opening and closing it', () => {
    let block;
    beforeEach(() => { block = build(); decorate(block); });

    it("opens the dialog on live's video", () => {
      block.querySelector('.hero-play').click();
      const modal = block.querySelector('dialog.hero-modal');
      expect(modal.open, 'the dialog reports open').to.be.true;
      const player = modal.querySelector('iframe');
      expect(!!player, 'a player is on the stage').to.be.true;
      expect(player.src).to.contain('HQetV7NlTPI');
    });

    it('stops the player when it shuts, so nothing plays behind it', () => {
      block.querySelector('.hero-play').click();
      block.querySelector('.hero-close').click();
      const modal = block.querySelector('dialog.hero-modal');
      expect(modal.open, 'the dialog reports shut').to.be.false;
      expect(modal.querySelectorAll('iframe')).to.have.length(0);
    });
  });

  describe('where the control sits', () => {
    const at = async (width) => {
      await setViewport({ width, height: 900 });
      const block = build();
      decorate(block);
      return {
        badge: centre(block.querySelector('.hero-play')),
        photo: centre(block.querySelector('.hero-image')),
      };
    };

    [375, 900, 1440].forEach((width) => {
      it(`centres on the photo at ${width}, the way live centres its own`, async () => {
        const r = await at(width);
        expect(r.badge).to.eql(r.photo);
      });
    });
  });
});
