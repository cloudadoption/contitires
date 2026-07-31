/* eslint-disable no-unused-expressions */
/* global describe it before afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate, { addTechnologyTooltips } from '../../../blocks/columns/columns.js';

/**
 * The trailing groups of live's product hero column, read off
 * continentaltire.com/tires/4x4sportcontact at 1440.
 *
 * Total Confidence Plan: each line with a gold checkmark drawn at 15px in
 * #a36a00, set 14.88px on a 22px line. The issue names two lines. Live shows
 * three on 21 of its 46 product pages, four on 20 of them where the product's
 * own mileage warranty leads, and no plan block at all on 4. So the list is
 * authored per page and the block only names it.
 *
 * Best for: a 12px/700 label at 1.25px letter-spacing in caps, then one row per
 * entry, a 30px line icon and a 14.88px/700 label 8px to its right on a 30px
 * row. Live's 14.88 is its own rem scale and the site's equivalent is 15.
 *
 * A hairline rules each group off: 1px solid #cdcdcd with 20px above and below.
 * (#241)
 */
const authored = (cell) => {
  const block = document.createElement('div');
  block.className = 'columns product-hero block';
  block.innerHTML = `<div><div><p><picture><img src="/tire.png" alt="tire"></picture></p></div><div>${cell}</div></div>`;
  document.body.append(block);
  return block;
};

const cell = `
  <h1>4x4 SportContact</h1>
  <p>The ideal ultra-high perfomance light truck/SUV tire.</p>
  <p><a href="/warranty">Total Confidence Plan</a></p>
  <ul>
    <li>60 Day Trial</li>
    <li>3 Year Roadside Assistance</li>
    <li>12 Month Road Hazard Coverage</li>
  </ul>
  <p><strong>Best for</strong></p>
  <ul>
    <li>Crossover</li>
    <li>Light Truck/SUV</li>
    <li>Original Equipment</li>
    <li>Ultra-High Performance</li>
    <li>Summer</li>
  </ul>`;

describe('product hero, the Best for icons', () => {
  it('gives every entry the badge live draws beside it', () => {
    const block = authored(cell);
    decorate(block);

    const list = block.querySelector('.product-hero-best-for');
    expect(list, 'the Best for list').to.exist;
    const icons = [...list.querySelectorAll('li > span.icon')].map((s) => s.className);
    expect(icons).to.deep.equal([
      'icon icon-badge-crossover',
      'icon icon-badge-light-truck-suv',
      'icon icon-badge-original-equipment',
      'icon icon-badge-ultra-high-performance',
      'icon icon-badge-summer',
    ]);
    block.remove();
  });

  it('names the label so the group can be ruled off', () => {
    const block = authored(cell);
    decorate(block);

    const label = block.querySelector('.product-hero-best-for-label');
    expect(label, 'the label').to.exist;
    expect(label.textContent.trim()).to.equal('Best for');
    expect(label.nextElementSibling.classList.contains('product-hero-best-for')).to.be.true;
    block.remove();
  });

  it('leaves the plan summary out of it, and names it instead', () => {
    const block = authored(cell);
    decorate(block);

    const plan = block.querySelector('.product-hero-plan');
    expect(plan, 'the plan list').to.exist;
    expect([...plan.querySelectorAll('li')].map((li) => li.textContent.trim())).to.deep.equal([
      '60 Day Trial', '3 Year Roadside Assistance', '12 Month Road Hazard Coverage',
    ]);
    expect(plan.querySelectorAll('span.icon').length, 'no badges on the plan').to.equal(0);
    block.remove();
  });

  // 20 of live's 46 product pages lead the plan with the product's own mileage
  // warranty, and 4 show no plan block at all
  it('names a plan of any length, and none where none is authored', () => {
    const four = authored(`
      <p><a href="/warranty">Total Confidence Plan</a></p>
      <ul><li>Up To 65K Limited Warranty</li><li>60 Day Trial</li>
        <li>3 Year Roadside Assistance</li><li>12 Month Road Hazard Coverage</li></ul>`);
    decorate(four);
    expect(four.querySelectorAll('.product-hero-plan li').length).to.equal(4);
    expect(four.querySelector('.product-hero-plan li').textContent.trim())
      .to.equal('Up To 65K Limited Warranty');
    four.remove();

    const none = authored('<p><strong>Best for</strong></p><ul><li>Crossover</li></ul>');
    decorate(none);
    expect(!!none.querySelector('.product-hero-plan')).to.be.false;
    expect(!!none.querySelector('.product-hero-plan-link')).to.be.false;
    none.remove();
  });

  it('leaves an entry with no badge of its own alone', () => {
    const block = authored(`
      <p><strong>Best for</strong></p>
      <ul><li>Crossover</li><li>Sunday drives</li></ul>`);
    decorate(block);

    const items = block.querySelectorAll('.product-hero-best-for li');
    expect(items[0].querySelector('span.icon'), 'the one with a badge').to.exist;
    expect(!!items[1].querySelector('span.icon'), 'the one without').to.be.false;
    expect(items[1].textContent.trim()).to.equal('Sunday drives');
    block.remove();
  });

  it('touches nothing on a columns block that is not a product hero', () => {
    const block = document.createElement('div');
    block.className = 'columns block';
    block.innerHTML = '<div><div><p><strong>Best for</strong></p><ul><li>Crossover</li></ul></div></div>';
    document.body.append(block);
    decorate(block);

    expect(!!block.querySelector('.product-hero-best-for')).to.be.false;
    expect(!!block.querySelector('span.icon')).to.be.false;
    block.remove();
  });
});

/**
 * Technology, the second group live rules off in that column, and it gets the
 * same treatment as Best for. Live sets both as `h2.text-cta` at 12px/700, 1.25px
 * in caps on a 16px line, each in a `con-details` wrapper with a 1px #cdcdcd
 * hairline and 20px above it. Read on continentaltire.com/tires/4x4contact at
 * 1440 and at 375, where both wrappers report the same border and padding.
 *
 * Ours had the paragraph unnamed, so it fell through to body copy at 18px with no
 * hairline. 33 of the 45 product pages carry the group and 12 carry none, so the
 * block names what is authored and draws nothing where it is absent. (#367)
 */
describe('product hero, the Technology label', () => {
  const withTech = `
    <h1>4x4 Contact</h1>
    <p><strong>Best for</strong></p>
    <ul><li>Crossover</li><li>Touring</li></ul>
    <p><strong>Technology</strong></p>
    <ul><li>Self Supporting Runflat*</li></ul>`;

  it('names the label so the group can be ruled off', () => {
    const block = authored(withTech);
    decorate(block);

    const label = block.querySelector('.product-hero-technology-label');
    expect(label, 'the Technology label').to.exist;
    expect(label.textContent.trim()).to.equal('Technology');
    expect(label.nextElementSibling.tagName).to.equal('UL');
    block.remove();
  });

  // 12 of the 45 product pages carry no Technology group
  it('draws nothing where no Technology group is authored', () => {
    const block = authored(cell);
    decorate(block);

    expect(!!block.querySelector('.product-hero-technology-label')).to.be.false;
    block.remove();
  });

  it('leaves the Best for group where it was', () => {
    const block = authored(withTech);
    decorate(block);

    expect(block.querySelector('.product-hero-best-for-label'), 'the Best for label').to.exist;
    expect(block.querySelector('.product-hero-best-for'), 'the Best for list').to.exist;
    const tech = block.querySelector('.product-hero-technology-label');
    expect(tech.classList.contains('product-hero-best-for-label'), 'not both names').to.be.false;
    expect(tech.nextElementSibling.classList.contains('product-hero-best-for'), 'no badge list').to.be.false;
    block.remove();
  });

  it('touches nothing on a columns block that is not a product hero', () => {
    const block = document.createElement('div');
    block.className = 'columns block';
    block.innerHTML = '<div><div><p><strong>Technology</strong></p><ul><li>Self Supporting Runflat*</li></ul></div></div>';
    document.body.append(block);
    decorate(block);

    expect(!!block.querySelector('.product-hero-technology-label')).to.be.false;
    block.remove();
  });
});

/**
 * The rebate, on the 19 of 46 live product pages that show one. Campaign copy
 * with an end date, so it is authored and an author takes an expired offer down
 * by deleting two paragraphs.
 *
 * Live puts a `$110 Rebate Offer` flag above the title: 132 by 20, 11px/700 at
 * 0.5px in `rgb(29, 29, 29)` on `rgb(255, 165, 0)`, a 4px radius down its left
 * edge and a notch cut out of its right by
 * `polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%)`. Below the store CTA it
 * pairs the sentence with its `Offer details` link in a 20px-gapped row, the
 * sentence at 12px/700 on a 20px line. (#241)
 */
describe('product hero, the rebate', () => {
  const rebate = `
    <p><em><a href="/promotion">$110 Rebate Offer</a></em></p>
    <h1>4x4 SportContact</h1>
    <p>The ideal ultra-high perfomance light truck/SUV tire.</p>
    <p><strong><a href="/store-finder">Find a store</a></strong></p>
    <p>Get a $110 Continental Tire Prepaid Mastercard&reg; by mail when you purchase a set of 4 qualifying Continental Tires through August 31, 2026.</p>
    <p><em><a href="/promotion">Offer details</a></em></p>
    <p><a href="/warranty">Total Confidence Plan</a></p>
    <ul><li>60 Day Trial</li></ul>`;

  it('names the flag above the title', () => {
    const block = authored(rebate);
    decorate(block);

    const flag = block.querySelector('.product-hero-rebate');
    expect(flag, 'the flag').to.exist;
    expect(flag.textContent.trim()).to.equal('$110 Rebate Offer');
    expect(flag.nextElementSibling.tagName).to.equal('H1');
    block.remove();
  });

  it('pairs the sentence with its Offer details link', () => {
    const block = authored(rebate);
    decorate(block);

    const panel = block.querySelector('.product-hero-offer');
    expect(panel, 'the offer row').to.exist;
    expect(panel.children.length).to.equal(2);
    expect(panel.children[0].textContent).to.contain('August 31, 2026');
    expect(panel.children[1].querySelector('a').getAttribute('href')).to.equal('/promotion');
    expect(panel.previousElementSibling.querySelector('a[href="/store-finder"]'), 'under the store CTA').to.exist;
    block.remove();
  });

  it('leaves the plan and Best for where they were', () => {
    const block = authored(rebate);
    decorate(block);

    expect(block.querySelector('.product-hero-plan'), 'the plan list').to.exist;
    expect(block.querySelector('.product-hero-plan-link'), 'the plan link').to.exist;
    expect(block.querySelector('.product-hero-offer').nextElementSibling
      .classList.contains('product-hero-plan-link')).to.be.true;
    block.remove();
  });

  // 27 of live's 46 product pages carry no rebate, and an expired offer is
  // taken down by deleting the two paragraphs
  it('draws nothing on a page with no rebate authored', () => {
    const block = authored(cell);
    decorate(block);

    expect(!!block.querySelector('.product-hero-rebate')).to.be.false;
    expect(!!block.querySelector('.product-hero-offer')).to.be.false;
    block.remove();
  });
});

describe('product hero, the treatments live gives those groups', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/columns/columns.css')).text());
  });

  function value(selector, prop) {
    const rules = [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText && r.selectorText.split(',')
      .map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  // live rules the rebate row and Best for and leaves the plan without one.
  // Read on /tires/4x4sportcontact, which has a rebate, and on
  // /tires/procontact-tx, which has none: the plan has no top border on either.
  it('rules a hairline above the rebate row and above Best for, and not above the plan', () => {
    expect(value('.columns.product-hero .product-hero-offer', 'border-top'))
      .to.equal('1px solid var(--conti-grey)');
    expect(value('.columns.product-hero .product-hero-best-for-label', 'border-top'))
      .to.equal('1px solid var(--conti-grey)');
    expect(value('.columns.product-hero .product-hero-plan-link', 'border-top')).to.equal(null);
    expect(value('.columns.product-hero .product-hero-offer', 'padding-top')).to.equal('20px');
    expect(value('.columns.product-hero .product-hero-plan-link', 'padding-top')).to.equal('20px');
    expect(value('.columns.product-hero .product-hero-best-for-label', 'padding-top')).to.equal('20px');
  });

  it('sets the Best for label the way live sets it', () => {
    expect(value('.columns.product-hero .product-hero-best-for-label', 'font-size')).to.equal('12px');
    expect(value('.columns.product-hero .product-hero-best-for-label', 'font-weight')).to.equal('700');
    expect(value('.columns.product-hero .product-hero-best-for-label', 'letter-spacing')).to.equal('1.25px');
    expect(value('.columns.product-hero .product-hero-best-for-label', 'text-transform')).to.equal('uppercase');
  });

  // live gives Technology the same label and the same hairline as Best for, read
  // off the two con-details wrappers on /tires/4x4contact: both report
  // 1px solid rgb(205, 205, 205) with 20px padding-top, at 1440 and at 375
  it('sets the Technology label and rules it off the same way', () => {
    expect(value('.columns.product-hero .product-hero-technology-label', 'font-size')).to.equal('12px');
    expect(value('.columns.product-hero .product-hero-technology-label', 'font-weight')).to.equal('700');
    expect(value('.columns.product-hero .product-hero-technology-label', 'letter-spacing')).to.equal('1.25px');
    expect(value('.columns.product-hero .product-hero-technology-label', 'text-transform')).to.equal('uppercase');
    expect(value('.columns.product-hero .product-hero-technology-label', 'line-height')).to.equal('16px');
    expect(value('.columns.product-hero .product-hero-technology-label', 'border-top'))
      .to.equal('1px solid var(--conti-grey)');
    expect(value('.columns.product-hero .product-hero-technology-label', 'padding-top')).to.equal('20px');
  });

  it('draws the badge at live\'s 30px, 8px from its label', () => {
    expect(value('.columns.product-hero .product-hero-best-for li', 'gap')).to.equal('8px');
    expect(value('.columns.product-hero .product-hero-best-for .icon', 'width')).to.equal('30px');
    expect(value('.columns.product-hero .product-hero-best-for .icon', 'height')).to.equal('30px');
    expect(value('.columns.product-hero .product-hero-best-for li', 'font-size')).to.equal('15px');
    expect(value('.columns.product-hero .product-hero-best-for li', 'font-weight')).to.equal('700');
  });

  it('checks off each line of the plan in live\'s gold', () => {
    expect(value('.columns.product-hero .product-hero-plan li', 'font-size')).to.equal('15px');
    expect(value('.columns.product-hero .product-hero-plan li', 'line-height')).to.equal('22px');
    expect(value('.columns.product-hero .product-hero-plan li::before', 'border-color'))
      .to.equal('var(--conti-yellow-contrast)');
  });

  it('draws the rebate flag at live\'s size, colour and notch', () => {
    expect(value('.columns.product-hero .product-hero-rebate a.button', 'font-size')).to.equal('11px');
    expect(value('.columns.product-hero .product-hero-rebate a.button', 'letter-spacing')).to.equal('0.5px');
    expect(value('.columns.product-hero .product-hero-rebate a.button', 'line-height')).to.equal('16px');
    expect(value('.columns.product-hero .product-hero-rebate a.button', 'padding')).to.equal('2px 16px 2px 12px');
    expect(value('.columns.product-hero .product-hero-rebate a.button', 'background-color')).to.equal('var(--conti-yellow)');
    expect(value('.columns.product-hero .product-hero-rebate a.button', 'color')).to.equal('var(--conti-dark-black)');
    // the serialized form, which is what live reports too
    expect(value('.columns.product-hero .product-hero-rebate a.button', 'border-radius')).to.equal('4px 0px 0px 4px');
    expect(value('.columns.product-hero .product-hero-rebate a.button', 'clip-path'))
      .to.equal('polygon(0px 0px, 100% 0px, 95% 50%, 100% 100%, 0px 100%)');
  });

  it('sets the offer sentence beside its link, as live pairs them', () => {
    expect(value('.columns.product-hero .product-hero-offer', 'display')).to.equal('flex');
    expect(value('.columns.product-hero .product-hero-offer', 'gap')).to.equal('20px');
    expect(value('.columns.product-hero .product-hero-offer p', 'font-size')).to.equal('12px');
    expect(value('.columns.product-hero .product-hero-offer p', 'font-weight')).to.equal('700');
    expect(value('.columns.product-hero .product-hero-offer p', 'line-height')).to.equal('20px');
  });

  it('drops the marker both lists would otherwise carry', () => {
    expect(value('.columns.product-hero .product-hero-plan', 'list-style')).to.equal('none');
    expect(value('.columns.product-hero .product-hero-best-for', 'list-style')).to.equal('none');
  });
});

/**
 * The Technology rows, which live draws the way it draws Best for: a 30px row,
 * a 30px icon, the name beside it. Then the part Best for has no counterpart
 * for, a `?` that opens the item's description.
 *
 * Live's markup, read off continentaltire.com/tires/procontact-tx10 at the apex
 * on 2026-07-31 and captured in `.mossy/parity/380/`:
 *
 *   <li class="item-list__item tire-feature">
 *     <img width="30px" class="item-list__avatar" src="...CT_IconImages_contiseal.svg">
 *     <con-tooltip><b slot="target">ContiSeal*</b><span slot="icon">?</span>
 *       <div slot="tooltip"><p>A proprietary sealant compound ...</p></div></con-tooltip>
 *   </li>
 *
 * Where the two sides split, and why. Live hangs a click handler on a custom
 * element, so a keyboard reaches none of the tooltips. Ours is a button with
 * aria-expanded, the same choice tire-features made on live's rings. (#380)
 *
 * The name is the key and it needs no new authoring. Across the 34 product pages
 * carrying the group, our authored names match live's item for item in the same
 * order, 34 of 34, and the products workbook already carries the same 14 values
 * in its `technology` column (`.mossy/parity/380/name-match.json`).
 *
 * The icons are live's own files, downloaded rather than redrawn per guardrail 8:
 * 15 URLs, 3 pairs byte-identical, so 12 drawings for 14 names. The three Tuned
 * Performance Indicators variants are one file served three times. (#406)
 */
describe('product hero, the Technology icons', () => {
  const withTech = (items) => authored(`
    <h1>ProContact TX10</h1>
    <p><strong>Best for</strong></p>
    <ul><li>Passenger</li></ul>
    <p><strong>Technology</strong></p>
    <ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`);

  it('gives every entry the drawing live puts beside it', () => {
    const block = withTech(['ContiSeal*', 'ContiSilent*']);
    decorate(block);

    const list = block.querySelector('.product-hero-technology');
    expect(list, 'the Technology list').to.exist;
    const icons = [...list.querySelectorAll('li > span.icon')].map((s) => s.className);
    expect(icons).to.deep.equal([
      'icon icon-tech-contiseal',
      'icon icon-tech-contisilent',
    ]);
    block.remove();
  });

  // three names, one drawing: live serves the same bytes at three URLs
  it('resolves the three Tuned Performance Indicators names to one drawing', () => {
    const block = withTech([
      'Tuned Performance Indicators (DW)',
      'Tuned Performance Indicators (DWS)',
      'Tuned Performance Indicators (SRS)',
    ]);
    decorate(block);

    const icons = [...block.querySelectorAll('.product-hero-technology li > span.icon')]
      .map((s) => s.className);
    expect(icons).to.deep.equal(new Array(3).fill('icon icon-tech-tuned-performance-indicators'));
    block.remove();
  });

  it('leaves an entry with no drawing of its own alone', () => {
    const block = withTech(['ContiSeal*', 'Something An Author Typed']);
    decorate(block);

    const items = block.querySelectorAll('.product-hero-technology li');
    expect(items[0].querySelector('span.icon'), 'the one with a drawing').to.exist;
    expect(!!items[1].querySelector('span.icon'), 'the one without').to.be.false;
    expect(items[1].textContent.trim()).to.equal('Something An Author Typed');
    block.remove();
  });

  it('puts no drawing on the Best for list', () => {
    const block = withTech(['ContiSeal*']);
    decorate(block);

    const badges = [...block.querySelectorAll('.product-hero-best-for li > span.icon')]
      .map((s) => s.className);
    expect(badges).to.deep.equal(['icon icon-badge-passenger']);
    block.remove();
  });
});

/**
 * The tooltip half. The descriptions are live's own words, carried verbatim,
 * and they are CONTENT rather than code: they go in a `technology` sheet in the
 * products workbook so an author reaches them in DA without reading a block.
 * That is MISSION's third quality and guardrail 6's content-fixes-for-content.
 *
 * It loads in the LAZY phase. No existing reader fetches the workbook whole,
 * every one of them asks for a single sheet by name, so there is no request to
 * ride along on and a tooltip must not sit in front of LCP. Measured
 * 2026-07-31: tire-listing and tire-rating take `?sheet=catalog`, tire-specs
 * `?sheet=specs`, perfect-fit both.
 *
 * The `Self Supporting Runflat*` text carries a stray backslash on 11 of the 14
 * pages that show it and none on 3. That is live's, it fails no external
 * standard, and guardrail 5 says live wins where it is arguable. Carried
 * verbatim rather than normalised either way.
 */
describe('product hero, the Technology tooltips', () => {
  const SHEET = {
    total: 3,
    offset: 0,
    limit: 3,
    data: [
      {
        name: 'ContiSeal*',
        description: 'A proprietary sealant compound that is applied to the inner liner of select tire lines to self-seal punctures from sharp objects within the tread area of the tire.\n*Select tire sizes',
      },
      {
        name: 'Self Supporting Runflat*',
        description: 'Tires with self supporting runflat (SSR) technology are designed with sturdy, reinforced sidewalls that help to support a vehicle\'s weight when the tires are deflated.\\\n*Select tire sizes',
      },
      { name: 'SportPlus', description: 'Provides responsive handling' },
    ],
  };

  const withTech = (items) => authored(`
    <h1>ProContact TX10</h1>
    <p><strong>Technology</strong></p>
    <ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`);

  afterEach(() => {
    if (window.fetch.restore) window.fetch.restore();
  });

  it('asks for the technology sheet alone', async () => {
    const fetched = sinon.stub(window, 'fetch')
      .callsFake(() => Promise.resolve(new Response(JSON.stringify(SHEET))));
    const block = withTech(['ContiSeal*']);
    decorate(block);
    await addTechnologyTooltips(block);

    expect(fetched.calledOnce, 'one request').to.be.true;
    expect(fetched.firstCall.args[0]).to.contain('sheet=technology');
    block.remove();
  });

  it('opens the item description live shows behind its question mark', async () => {
    sinon.stub(window, 'fetch')
      .callsFake(() => Promise.resolve(new Response(JSON.stringify(SHEET))));
    const block = withTech(['ContiSeal*']);
    decorate(block);
    await addTechnologyTooltips(block);

    const button = block.querySelector('.product-hero-technology li button');
    expect(button, 'the question mark').to.exist;
    expect(button.getAttribute('aria-expanded'), 'shut to start with').to.equal('false');

    const tip = block.querySelector(`#${button.getAttribute('aria-controls')}`);
    expect(tip, 'the tip it controls').to.exist;
    expect(tip.hidden, 'hidden to start with').to.be.true;
    expect(tip.textContent).to.contain('A proprietary sealant compound');
    expect(tip.textContent).to.contain('*Select tire sizes');

    button.click();
    expect(button.getAttribute('aria-expanded')).to.equal('true');
    expect(tip.hidden).to.be.false;
    button.click();
    expect(button.getAttribute('aria-expanded')).to.equal('false');
    expect(tip.hidden).to.be.true;
    block.remove();
  });

  it('names the item in the button so a screen reader hears which one', async () => {
    sinon.stub(window, 'fetch')
      .callsFake(() => Promise.resolve(new Response(JSON.stringify(SHEET))));
    const block = withTech(['ContiSeal*']);
    decorate(block);
    await addTechnologyTooltips(block);

    const button = block.querySelector('.product-hero-technology li button');
    expect(button.textContent).to.contain('ContiSeal*');
    block.remove();
  });

  // live's own stray backslash, carried rather than normalised (guardrail 5)
  it('carries the text exactly as live writes it', async () => {
    sinon.stub(window, 'fetch')
      .callsFake(() => Promise.resolve(new Response(JSON.stringify(SHEET))));
    const block = withTech(['Self Supporting Runflat*']);
    decorate(block);
    await addTechnologyTooltips(block);

    const tip = block.querySelector('.product-hero-technology li [id]');
    expect(tip.textContent).to.contain('are deflated.\\');
    block.remove();
  });

  it('leaves an item the sheet has no row for without a question mark', async () => {
    sinon.stub(window, 'fetch')
      .callsFake(() => Promise.resolve(new Response(JSON.stringify(SHEET))));
    const block = withTech(['ContiSeal*', 'Something An Author Typed']);
    decorate(block);
    await addTechnologyTooltips(block);

    const items = block.querySelectorAll('.product-hero-technology li');
    expect(items[0].querySelector('button'), 'the one with a row').to.exist;
    expect(!!items[1].querySelector('button'), 'the one without').to.be.false;
    block.remove();
  });

  it('keeps the drawings when the sheet cannot be read', async () => {
    sinon.stub(window, 'fetch')
      .callsFake(() => Promise.resolve(new Response('', { status: 404 })));
    const block = withTech(['ContiSeal*']);
    decorate(block);
    await addTechnologyTooltips(block);

    expect(block.querySelector('.product-hero-technology li span.icon'), 'the drawing').to.exist;
    expect(!!block.querySelector('.product-hero-technology li button'), 'no question mark').to.be.false;
    block.remove();
  });

  it('does nothing on a page with no Technology group', async () => {
    const fetched = sinon.stub(window, 'fetch')
      .callsFake(() => Promise.resolve(new Response(JSON.stringify(SHEET))));
    const block = authored('<h1>ProContact TX10</h1><p><strong>Best for</strong></p><ul><li>Passenger</li></ul>');
    decorate(block);
    await addTechnologyTooltips(block);

    expect(fetched.called, 'no request for a group that is not there').to.be.false;
    block.remove();
  });
});
