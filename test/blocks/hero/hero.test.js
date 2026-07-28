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

/**
 * The marquee both promo pages open with. Live drops a flat 50% black over the
 * whole photo here rather than the gradient its other marquees use, sets the
 * title in uppercase at 6px of letter-spacing, and offers a control that opens
 * the tire finder where it stands. Measured on /promotion and /ccpromotion at
 * 1440, 900 and 375. Issues #83 and #84.
 */
function buildPromoHero({ variant = 'promo', cta = 'accent' } = {}) {
  document.body.innerHTML = `
    <main>
      <div class="section">
        <div class="hero ${variant} block">
          <div><div><picture><img src="./promo.jpg" alt=""></picture></div></div>
          <div><div>
            <h1>Get a $110 Rebate</h1>
            <p>Purchase a set of 4 qualifying Continental Tires.</p>
            <p class="button-wrapper"><a class="button ${cta}" href="/Store-finder">Find stores</a></p>
            <p class="button-wrapper"><a class="button ${cta}" href="/perfect-fit">Find tires</a></p>
          </div></div>
        </div>
      </div>
    </main>`;
  return document.querySelector('.hero.block');
}

describe('Hero, the promo variant opens the finder', () => {
  it('turns the finder CTA into a control that opens it where it stands', () => {
    const block = buildPromoHero();
    decorate(block);

    const trigger = block.querySelector('[data-tire-finder]');
    expect(trigger, 'the finder control').to.exist;
    expect(trigger.tagName).to.equal('BUTTON');
    expect(trigger.type).to.equal('button');
  });

  // live's control says "find tire size" and opens By Vehicle, on both pages
  it("opens the tab live opens, which is By Vehicle", () => {
    const block = buildPromoHero();
    decorate(block);

    expect(block.querySelector('[data-tire-finder]').dataset.tireFinder).to.equal('vehicle');
  });

  it('keeps the authored label and the pill it is drawn as', () => {
    const block = buildPromoHero();
    decorate(block);

    const trigger = block.querySelector('[data-tire-finder]');
    expect(trigger.textContent.trim()).to.equal('Find tires');
    expect(trigger.classList.contains('button')).to.be.true;
    expect(trigger.classList.contains('accent')).to.be.true;
  });

  it('navigates nowhere, as live\'s own control does', () => {
    const block = buildPromoHero();
    decorate(block);

    expect(block.querySelector('[data-tire-finder]').hasAttribute('href')).to.be.false;
    expect(block.querySelectorAll('a[href="/perfect-fit"]')).to.have.length(0);
  });

  it('leaves the CTAs that do navigate alone', () => {
    const block = buildPromoHero();
    decorate(block);

    const store = block.querySelector('a[href="/Store-finder"]');
    expect(store, 'the store finder link').to.exist;
    expect(store.tagName).to.equal('A');
    expect(store.hasAttribute('data-tire-finder')).to.be.false;
  });

  // the finder page is a page, and a link to it stays a link everywhere the
  // promo marquee is not
  it('leaves a finder link alone in a hero that is not a promo hero', () => {
    const block = buildPromoHero({ variant: 'left' });
    decorate(block);

    expect(block.querySelector('[data-tire-finder]')).to.not.exist;
    expect(block.querySelector('a[href="/perfect-fit"]')).to.exist;
  });

  it('puts both CTAs in the row the hero builds for them', () => {
    const block = buildPromoHero();
    decorate(block);

    const ctas = block.querySelector('.hero-ctas');
    expect(ctas.querySelectorAll('a, button')).to.have.length(2);
  });
});

describe('Hero, the promo marquee', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
  });

  function value(selector, prop) {
    const rules = [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  // ours was a gradient clear from 60% of the height up, and the title sits at
  // 28% down, so on /ccpromotion's bright sky the h1 was close to invisible
  it("lays live's flat 50% black over the whole photo", () => {
    expect(value('.hero.promo .hero-image::after', 'background')).to.equal('rgb(0 0 0 / 50%)');
  });

  it('sets the title as live sets it, uppercase at 6px', () => {
    expect(value('.hero.promo .hero-content h1', 'text-transform')).to.equal('uppercase');
    expect(value('.hero.promo .hero-content h1', 'letter-spacing')).to.equal('6px');
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
    expect(value('.hero.promo .hero-ctas .button-wrapper:has(.secondary)', 'flex-basis')).to.equal('100%');
  });
});
