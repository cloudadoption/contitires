/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * The promo template. Live builds /promotion and /ccpromotion from one template
 * of its own and gives it bands no other page uses. Every number here was read
 * off continentaltire.com at 1440, 1025, 1024, 900, 769, 768 and 375.
 * Issues #83 and #84.
 */
describe('The promo template', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/promo.css')).text());
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

  // live's bands touch: each one carries its own padding and no margin, so
  // ours had a white gap between the steps and the black band
  it('lets the bands touch, as live\'s do', () => {
    expect(value('main > .section', 'margin')).to.equal('0px');
  });

  // live pads a band 38 top below 769 and 80 above, where ours padded 56 at
  // every width
  it('pads a band the way live pads it, at both widths', () => {
    expect(value('main .section.dark', 'padding')).to.equal('38px 0px 20px');
    expect(value('main .section.dark', 'padding', '769px')).to.equal('80px 0px 38px');
  });

  it('centres a promo band and gives the heading live\'s two voices', () => {
    expect(value('main .section.promo', 'text-align')).to.equal('center');
    expect(value('main .section.promo h2 strong', 'text-transform')).to.equal('uppercase');
    expect(value('main .section.promo h2 strong', 'letter-spacing')).to.equal('6px');
  });

  // the heading takes the same scale as the marquee title, and the same 1025
  it('takes live\'s heading scale', () => {
    expect(value('main .section.promo h2', 'font-size')).to.equal('30px');
    expect(value('main .section.promo h2', 'font-size', '1025px')).to.equal('42px');
  });

  it('marks the list items as live marks them', () => {
    expect(value('main .section.checklist ul', 'list-style')).to.equal('none');
    expect(value('main .section.checklist li::before', 'background-size')).to.equal('14.4px');
    expect(value('main .section.checklist li', 'font-size')).to.equal('18px');
    expect(value('main .section.checklist li', 'font-size', '769px')).to.equal('24px');
  });

  // live numbers the three rebate steps with a 20px yellow disc, and the
  // number is not in the content: it counts the columns
  it('numbers the steps the way live numbers them', () => {
    expect(value('main .section.steps .columns > div > div::before', 'content')).to.equal('counter(promo-step)');
    expect(value('main .section.steps .columns > div > div::before', 'background-color')).to.equal('var(--conti-yellow)');
    expect(value('main .section.steps .columns > div > div::before', 'width')).to.equal('20px');
    expect(value('main .section.steps .columns > div > div::before', 'border-radius')).to.equal('50%');
  });

  it('sets a step the way live sets one', () => {
    expect(value('main .section.steps h2', 'text-transform')).to.equal('uppercase');
    expect(value('main .section.steps h2', 'font-size')).to.equal('14px');
    expect(value('main .section.steps p', 'font-size')).to.equal('18px');
    expect(value('main .section.steps', 'text-align')).to.equal('center');
  });

  // live's qualifying tires run in four columns on a dark band
  it('runs the qualifying tires in live\'s four columns', () => {
    expect(value('main .section.tires ul', 'columns', '769px')).to.equal('4');
    expect(value('main .section.tires ul', 'list-style')).to.equal('none');
    expect(value('main .section.tires h2', 'text-transform')).to.equal('uppercase');
  });

  // the card band pairs a 120px card with a line of copy and two pills, and
  // live puts the three in a row from 769 rather than from 900
  it('holds the banner card to the size live draws it', () => {
    expect(value('main .section.banner .columns-img-col img', 'width')).to.equal('120px');
    expect(value('main .section.banner .columns > div > div:last-child', 'display')).to.equal('flex');
    expect(value('main .section.banner .columns > div > div:last-child', 'flex-direction', '769px')).to.equal('row');
  });

  // the meta row is a badge beside its copy, twice
  it('lays the meta row out as live lays it', () => {
    expect(value('main .section.meta .columns > div', 'grid-template-columns', '900px')).to.equal('auto 1fr auto 1fr');
    expect(value('main .section.meta .columns-img-col img', 'width')).to.equal('100px');
  });

  it('sets the terms as small print with a centred title', () => {
    expect(value('main .section.terms', 'font-size')).to.equal('14px');
    expect(value('main .section.terms h2', 'text-align')).to.equal('center');
    expect(value('main .section.terms h2', 'font-size')).to.equal('14px');
  });
});

/**
 * The card band as it is drawn, not as it is declared. Live's
 * `.promo-banner__inner`, read off continentaltire.com/promotion on 2026-08-03:
 *
 *     width   direction   align    gap   text-align   CTA cell    each pill
 *      1440   row         center   40    start        1013..1288  131 and 132
 *       800   row         center   40    start         509..784   131 and 132
 *       769   row         center   40    start         478..753   131 and 132
 *       768   column      center   20    center        184..584   400 and 400
 *       375   column      center   20    center         20..355   335 and 335
 *
 * So live turns the row at 769 and, below it, centres all three parts and runs
 * the pills full width in a stack capped at 400 with 12px between them. Ours
 * turned at 900, so at 800 it was still a stack where live had a row; and below
 * 769 it left the card and the copy at the column's left edge and drew the two
 * pills at their own width, touching, because two `button-wrapper` paragraphs
 * with no margin sit flush against each other.
 *
 * On main--contitires--cloudadoption.aem.live at 768: Apply Now 20..151
 * y1457..1502 and Find store 20..152 y1502..1547, so 0px between them.
 */
describe("The promo template's card band as drawn", () => {
  let sheets;

  before(async () => {
    sheets = await Promise.all(['/styles/styles.css', '/blocks/columns/columns.css', '/styles/promo.css']
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

  const CARD = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="171" height="108"><rect width="171" height="108" fill="#666"/></svg>',
  )}`;

  function mount() {
    document.body.innerHTML = `
      <main><div class="section black banner columns-container"><div class="columns-wrapper">
        <div class="columns columns-3-cols block">
          <div>
            <div class="columns-img-col"><picture><img src="${CARD}" alt="card" width="171" height="108"></picture></div>
            <div><p>Don't have a card? Apply online or in-store in minutes.</p></div>
            <div>
              <p class="button-wrapper"><a class="button primary" href="https://example.com/apply">Apply Now</a></p>
              <p class="button-wrapper"><a class="button primary" href="/Store-finder">Find store</a></p>
            </div>
          </div>
        </div>
      </div></div></main>`;
    const block = document.querySelector('.columns');
    if (block.getBoundingClientRect().height === 0) {
      throw new Error('the card band fixture rendered with no box, so nothing here was measured');
    }
    return block;
  }

  const rect = (el) => el.getBoundingClientRect();
  const cells = (block) => [...block.firstElementChild.children];
  const pills = (block) => [...block.querySelectorAll('a.button')];
  const mid = (el) => rect(el).left + rect(el).width / 2;

  [768, 375].forEach((width) => {
    describe(`at ${width}, where live stacks it`, () => {
      it('centres the card', async () => {
        await setViewport({ width, height: 900 });
        const block = mount();
        const [card] = cells(block);
        expect(Math.abs(mid(card.querySelector('img')) - mid(block))).to.be.at.most(1);
      });

      it('centres the copy', async () => {
        await setViewport({ width, height: 900 });
        const [, copy] = cells(mount());
        expect(getComputedStyle(copy).textAlign).to.equal('center');
      });

      it('runs each pill the width of its stack', async () => {
        await setViewport({ width, height: 900 });
        const block = mount();
        const cta = cells(block)[2];
        pills(block).forEach((pill) => {
          expect(Math.round(rect(pill).width), 'full width').to.equal(Math.round(rect(cta).width));
        });
      });

      it("leaves live's 12px between them rather than none", async () => {
        await setViewport({ width, height: 900 });
        const [apply, find] = pills(mount());
        expect(Math.round(rect(find).top - rect(apply).bottom)).to.equal(12);
      });

      it('caps the stack at 400 and centres it', async () => {
        await setViewport({ width, height: 900 });
        const block = mount();
        const cta = cells(block)[2];
        expect(Math.round(rect(cta).width)).to.equal(Math.min(400, Math.round(rect(block).width)));
        expect(Math.abs(mid(cta) - mid(block))).to.be.at.most(1);
      });
    });
  });

  [769, 800].forEach((width) => {
    it(`sets the three parts in a row at ${width}, where live sets a row`, async () => {
      await setViewport({ width, height: 900 });
      const block = mount();
      const [card, copy, cta] = cells(block);
      expect(Math.round(rect(copy).left), 'copy beside the card')
        .to.be.at.least(Math.round(rect(card).right));
      expect(Math.round(rect(cta).left), 'pills beside the copy')
        .to.be.at.least(Math.round(rect(copy).right));
      expect(rect(pills(block)[1]).top, 'and the pills side by side')
        .to.equal(rect(pills(block)[0]).top);
    });
  });
});
