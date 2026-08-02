/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/hero/hero.js';

/**
 * The breadcrumb trail belongs at the top of the marquee, over the photo, where
 * live puts it. Ours put it inside the centred copy, where it adds its own line
 * plus the gap under it to the band.
 *
 * Read on continentaltire.com on 2026-08-02, `nav.breadcrumb` offset from the
 * top left of `section.marquee`, at four widths on all four pages that carry
 * one. Live's own answer is the same everywhere:
 *
 *     page                    375     768     900     1440
 *     /experience             (12,12) (12,12) (20,20) (20,20)
 *     /experience/partners    (12,12) (12,12) (20,20) (20,20)
 *     /experience/conti-crew  (12,12) (12,12) (20,20) (20,20)
 *     /experience/soccer      (12,12) (12,12) (20,20) (20,20)
 *
 * So the trail is pinned to the edge of the band with an inset of its own, 12
 * below live's 769 and 20 above it, and NOT to the copy column, whose inset is
 * 20 below the desktop step and 64 above. The band is the photo strip plus the
 * copy box on all four: /experience/partners at 375 reads 318 over a 160 strip
 * and a 158 copy, with the 46-tall trail inside the strip's own 160.
 *
 * Ours read (20,188) at every width, which is the first line of the copy box.
 * The band it costs, read on main--contitires--cloudadoption.aem.live the same
 * day against live at the same widths:
 *
 *     page                    width       live   ours   after
 *     /experience             375         362    430.39 390.39
 *     /experience             768…1024    318    372.80 332.80
 *     /experience/partners    375…1024    318    372.80 332.80
 *     /experience/conti-crew  375…1024    282    336.80 296.80
 *     /experience/soccer      768…1024    332    306.80 266.80
 *
 * /experience/soccer moves the other way, and it was already short: live pads
 * that copy 28 over and 68 under where ours pads 28 both ways, so the trail's 40
 * was standing in for padding we do not have. That is its own reading and not
 * this one.
 *
 * Above 1025 nothing moves. The band is a 400 floor there and the copy is under
 * it either way, so `.hero.stacked.slim .hero-content`'s 88px trim, which was
 * only ever paying for the trail inside the copy, goes back to `stacked`'s 96.
 * #470
 */

/* a photo with live's own marquee ratio, inline so nothing waits on the network */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960"><rect width="1440" height="960" fill="#333"/></svg>',
)}`;

/* the block as EDS delivers /experience: one picture cell, then the copy */
function build(classes) {
  document.body.innerHTML = `
    <main><div class="section hero-container"><div class="hero-wrapper">
      <div class="hero ${classes} block">
        <div><div><picture><img src="${PHOTO}" alt="" width="1440" height="960"></picture></div></div>
        <div><div>
          <h1>EXPERIENCE</h1>
          <p>a standfirst that runs on for a line or so</p>
        </div></div>
      </div>
    </div></div></main>`;
  return document.querySelector('.hero.block');
}

describe('Hero, the trail live draws over the photo (#470)', () => {
  let sheets;
  let label;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    // the trail's label is the name the page gives itself, which /experience
    // carries as page metadata. The runner serves the fixture at `/`, where the
    // two-step builder has no section to name, so this is the one-step hub
    // trail live paints there.
    label = document.createElement('meta');
    label.name = 'breadcrumb';
    label.content = 'Experience';
    document.head.append(label);
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
    label.remove();
    await setViewport({ width: 1440, height: 900 });
  });

  // `!!` and class names rather than `to.exist` and element identity, the way
  // perfect-fit.test.js does it: chai stringifies the value it was given when an
  // assertion fails, and a live DOM node walks the document outwards. Written the
  // other way these hang the runner for two minutes instead of failing.
  describe('where the trail lands in the DOM', () => {
    let block;
    beforeEach(() => { block = build('left stacked slim breadcrumb'); decorate(block); });

    it('hangs the trail off the block, not off the copy', () => {
      const trail = block.querySelector('.hero-breadcrumb');
      expect(!!trail, 'the trail is built').to.be.true;
      expect(trail.parentElement.classList.contains('hero')).to.be.true;
    });

    it('puts it ahead of the photo and the copy, the way live orders it', () => {
      expect([...block.children].map((el) => el.className))
        .to.eql(['hero-breadcrumb', 'hero-image', 'hero-content']);
    });

    it('leaves the copy with only what the author wrote in it', () => {
      expect(!!block.querySelector('.hero-content .hero-breadcrumb')).to.be.false;
      expect(block.querySelector('.hero-content').firstElementChild.tagName).to.equal('H1');
    });
  });

  describe('a hero with no trail authored', () => {
    it('is still a photo and a copy box, in that order', () => {
      const block = build('left stacked slim');
      decorate(block);
      expect([...block.children].map((el) => el.className)).to.eql(['hero-image', 'hero-content']);
    });
  });

  describe('where the trail lands on the page', () => {
    const at = async (width) => {
      await setViewport({ width, height: 900 });
      const block = build('left stacked slim breadcrumb');
      decorate(block);
      const box = block.getBoundingClientRect();
      const step = block.querySelector('.hero-breadcrumb li').getBoundingClientRect();
      return {
        band: Math.round(box.height * 100) / 100,
        x: Math.round((step.left - box.left) * 100) / 100,
        y: Math.round((step.top - box.top) * 100) / 100,
      };
    };

    [375, 768].forEach((width) => {
      it(`sits at live's (12, 12) at ${width}`, async () => {
        const r = await at(width);
        expect(r.x).to.equal(12);
        expect(r.y).to.equal(12);
      });
    });

    [900, 1024, 1440].forEach((width) => {
      it(`sits at live's (20, 20) at ${width}`, async () => {
        const r = await at(width);
        expect(r.x).to.equal(20);
        expect(r.y).to.equal(20);
      });
    });

    it('is out of flow, so the band is the strip plus the copy', async () => {
      const r = await at(900);
      const block = document.querySelector('.hero.block');
      const strip = block.querySelector('.hero-image').getBoundingClientRect().height;
      const copy = block.querySelector('.hero-content').getBoundingClientRect().height;
      expect(strip).to.equal(160);
      expect(Math.round((strip + copy) * 100) / 100).to.equal(r.band);
    });

    it("holds live's 400 desktop band, which the trail no longer pays for", async () => {
      const r = await at(1440);
      expect(r.band).to.equal(400);
      const copy = document.querySelector('.hero-content');
      expect(getComputedStyle(copy).paddingTop).to.equal('96px');
    });
  });
});
