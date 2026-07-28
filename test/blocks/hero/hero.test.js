/* eslint-disable no-unused-expressions */
/* global describe it before beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/hero/hero.js';

/**
 * A hero as EDS delivers it: two authored pictures, each with the same
 * `min-width: 600px` sources, then the copy. Issue #105.
 */
function buildHero({ pictures = 2, firstSection = true } = {}) {
  const picture = (name, w, h) => `
    <picture>
      <source type="image/webp" srcset="./${name}.jpg?width=2000&amp;format=webply" media="(min-width: 600px)">
      <source type="image/webp" srcset="./${name}.jpg?width=750&amp;format=webply">
      <source type="image/jpeg" srcset="./${name}.jpg?width=2000&amp;format=jpg" media="(min-width: 600px)">
      <img loading="lazy" alt="" src="./${name}.jpg?width=750&amp;format=jpg" width="${w}" height="${h}">
    </picture>`;
  document.body.innerHTML = `
    <main>
      ${firstSection ? '' : '<div class="section"><p>an earlier section</p></div>'}
      <div class="section">
        <div class="hero left block">
          <div><div>${picture('desktop', 2880, 1000)}</div></div>
          ${pictures > 1 ? `<div><div>${picture('mobile', 1024, 356)}</div></div>` : ''}
          <div><div>
            <p>Welcome to</p>
            <h1>THE SMART CHOICE IN TIRES</h1>
            <p><strong><a href="/tire-search">Find Tires That Fit</a></strong></p>
          </div></div>
        </div>
      </div>
    </main>`;
  return document.querySelector('.hero.block');
}

describe('Hero block, one picture for one download', () => {
  let block;
  beforeEach(() => { block = buildHero(); });

  it('merges the two authored pictures into one', () => {
    decorate(block);
    expect(block.querySelectorAll('picture')).to.have.length(1);
    expect(block.querySelectorAll('img')).to.have.length(1);
  });

  it("puts the desktop sources behind live's 1025 and the mobile ones first", () => {
    decorate(block);
    const sources = [...block.querySelectorAll('source')];
    const desktop = sources.filter((s) => s.srcset.includes('desktop'));
    const mobile = sources.filter((s) => s.srcset.includes('mobile'));

    expect(desktop).to.not.be.empty;
    expect(mobile).to.not.be.empty;
    // a picture takes the first matching source, so the desktop ones lead
    expect(sources.indexOf(desktop[0])).to.be.lessThan(sources.indexOf(mobile[0]));
    desktop.forEach((s) => expect(s.media).to.equal('(min-width: 1025px)'));
    // the smallest mobile source stays unconditional, as the default
    expect(mobile.some((s) => !s.media)).to.be.true;
  });

  it('leaves the mobile asset as the img, so a narrow screen loads only it', () => {
    decorate(block);
    const img = block.querySelector('img');
    expect(img.getAttribute('src')).to.contain('mobile');
  });

  // waitForFirstImage eagers the first img of the first section. That was the
  // desktop picture, hidden on mobile, while the visible one stayed lazy.
  it('eagers the single image when the hero opens the page', () => {
    decorate(block);
    const img = block.querySelector('img');
    expect(img.getAttribute('loading')).to.equal('eager');
    expect(img.getAttribute('fetchpriority')).to.equal('high');
  });

  it('leaves a hero further down the page lazy', () => {
    const below = buildHero({ firstSection: false });
    decorate(below);
    const img = below.querySelector('img');
    expect(img.getAttribute('loading')).to.equal('lazy');
    expect(img.getAttribute('fetchpriority')).to.equal(null);
  });

  it('leaves a hero authored with one picture alone', () => {
    const single = buildHero({ pictures: 1 });
    decorate(single);
    expect(single.querySelectorAll('picture')).to.have.length(1);
    const sources = [...single.querySelectorAll('source')];
    expect(sources.every((s) => s.media !== '(min-width: 1025px)')).to.be.true;
    expect(single.querySelector('img').getAttribute('src')).to.contain('desktop');
  });
});

// Live divides the homepage marquee below 1025: a 200px photo strip on top,
// then centred copy on black. Measured on continentaltire.com at 1023 and
// 1025. Only that one marquee is divided, so it is a variant.
describe('Hero, the stacked variant', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
  });

  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  it('stacks the photo over the copy below the breakpoint', () => {
    expect(value('.hero.stacked', 'flex-direction')).to.equal('column');
    expect(value('.hero.stacked', 'background-color')).to.equal('rgb(0, 0, 0)');
  });

  it("holds the photo strip to live's 200px", () => {
    expect(value('.hero.stacked .hero-image', 'position')).to.equal('static');
    expect(value('.hero.stacked .hero-image', 'height')).to.equal('200px');
  });

  it('centres the copy, as live does', () => {
    expect(value('.hero.stacked .hero-content', 'text-align')).to.equal('center');
    expect(value('.hero.stacked .hero-content h1', 'font-size')).to.equal('30px');
  });

  it('returns to the overlay at 1025', () => {
    expect(value('.hero.stacked .hero-image', 'position', '1025px')).to.equal('absolute');
    expect(value('.hero.stacked', 'flex-direction', '1025px')).to.equal('row');
  });

  // the stacked heading is 30px, and the variant held it there at every width,
  // so the desktop hero read 30px against live's 42px
  it("gives the heading back live's 42px at 1025", () => {
    expect(value('.hero.stacked .hero-content h1', 'font-size', '1025px')).to.equal('42px');
  });
});

describe('Hero, the promo marquee', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
  });

  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  // ours was a gradient clear from 60% of the height up, and the title sits at
  // 28% down, so on /ccpromotion's bright sky the h1 was close to invisible
  it("lays live's flat 50% black over the whole photo", () => {
    expect(value('.hero.promo .hero-image::after', 'background')).to.equal('rgba(0, 0, 0, 0.5)');
  });

  it('sets the title as live sets it, uppercase and tracked out', () => {
    expect(value('.hero.promo .hero-content h1', 'text-transform')).to.equal('uppercase');
    expect(value('.hero.promo .hero-content h1', 'letter-spacing')).to.equal('5px');
    expect(value('.hero.promo .hero-content h1', 'letter-spacing', '1025px')).to.equal('6px');
  });

  // live's marquee CTAs are white by default, which the base hero draws
  // already; /promotion opts its pair into the offer's own yellow
  it("gives the high-impact CTA live's yellow", () => {
    expect(value('.hero.promo .button.accent', 'background-color')).to.equal('var(--conti-yellow)');
    expect(value('.hero.promo .button.accent', 'color')).to.equal('var(--conti-black)');
  });

  it('draws the third CTA as live does, outlined and on its own row', () => {
    expect(value('.hero.promo .button.secondary', 'border-color')).to.equal('var(--conti-yellow)');
    expect(value('.hero.promo .button.secondary', 'background-color')).to.equal('transparent');
    expect(value('.hero.promo .hero-ctas .button-wrapper:has(.secondary)', 'flex-basis', '769px')).to.equal('100%');
  });

  // uppercase at 6px is wider than the same words were, and the base hero
  // holds its copy to 840, so /ccpromotion's title wrapped where live's fits
  // one line. Live runs the title to its container and caps the copy under it.
  it('gives the title live\'s measure, and holds the copy to live\'s', () => {
    expect(value('.hero.promo .hero-content', 'max-width')).to.equal('1136px');
    expect(value('.hero.promo .hero-content > p', 'max-width')).to.equal('900px');
  });

  // live drops the marquee title to 30px below 1025 and holds it there. Ours
  // stayed at 42, so /ccpromotion's title took two lines at 900 where live
  // fits one, and /promotion's took two at 375 where live fits one.
  it("takes live's smaller title below 1025", () => {
    expect(value('.hero.promo .hero-content h1', 'font-size')).to.equal('30px');
    expect(value('.hero.promo .hero-content h1', 'line-height')).to.equal('36px');
    expect(value('.hero.promo .hero-content h1', 'font-size', '1025px')).to.equal('42px');
  });

  // below 769 live runs each pill the width of the column
  it('runs the pills full width below 769, as live does', () => {
    expect(value('.hero.promo .hero-ctas .button', 'width')).to.equal('100%');
    expect(value('.hero.promo .hero-ctas .button', 'width', '769px')).to.equal('auto');
  });

  // live sets the pair in equal columns, 150 apiece 24 apart
  it('draws the pair at one width, as live does', () => {
    expect(value('.hero.promo .button.accent', 'min-width')).to.equal('150px');
    expect(value('.hero.promo .hero-ctas', 'gap')).to.equal('24px');
  });

  // live's fourth control is a plain link above the pills, set small and
  // uppercase rather than at the size of the copy it follows
  it('sets the details link the size live sets it', () => {
    const selector = '.hero.promo p:has(> a:only-child)';
    expect(value(selector, 'text-transform')).to.equal('uppercase');
    expect(value(selector, 'font-size')).to.equal('var(--body-font-size-xs)');
  });
});

// Live's divided marquee is 160 tall on a page whose marquee carries a
// breadcrumb trail, against the homepage's 200. Read off
// continentaltire.com/experience at 1024, 900, 768 and 375, where the strip
// measured 160 at every one. Issue #96.
describe('Hero, the slim divided band', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
  });

  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  it("holds the strip to live's 160 where live divides at 160", () => {
    expect(value('.hero.stacked.slim .hero-image', 'height')).to.equal('160px');
  });

  it('leaves the homepage strip at its own 200', () => {
    expect(value('.hero.stacked .hero-image', 'height')).to.equal('200px');
  });
});
