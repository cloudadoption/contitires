/* eslint-disable no-unused-expressions */
/* global describe it before after afterEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/columns/columns.js';

/**
 * #306. The Highlights label is off all 23 product pages that carried it, and
 * what live draws in its place is a pair of hairlines.
 *
 * Live's own rules, out of its stylesheet, on the box that holds the product
 * sentence and the highlights list:
 *
 *     .tire-page__description > * + * { margin-top: 1rem }
 *     .tire-page__top-right .tire-page__description hr {
 *       background-color: var(--grey); height: 1px; border: none }
 *
 * so the box reads paragraph, hr, list, hr, each 1px at 16px above it. Read as
 * computed on continentaltire.com/tires/4x4contact at 1440 on 2026-08-03: the
 * paragraph 130 tall, an hr of 1 at margin-top 16 in rgb(205, 205, 205), the list
 * 126 at margin-top 16, then a second hr the same. 16 + 1 + 16 is 33 from the
 * sentence to the first row.
 *
 * Ours held 14.4px between the two and drew no line at either end, and no
 * stylesheet a product page loads carries an `hr` selector, so an authored one
 * would not look like live's. A border on the list is the same drawing without
 * two elements an author would have to keep in place.
 *
 * The list is the one the block does not already name. Its three siblings are
 * each found by what stands above them, the plan by the link to /warranty and the
 * other two by their words, and this one has no label at all now.
 */
const authored = (cell) => {
  const block = document.createElement('div');
  block.className = 'columns product-hero block';
  block.innerHTML = '<div><div><p><picture><img src="/tire.png" alt="tire"></picture></p></div>'
    + `<div>${cell}</div></div>`;
  document.body.append(block);
  decorate(block);
  return block;
};

/** /tires/4x4contact's own copy cell, in the order the page authors it */
const CELL = `
  <p><em><a href="/promotion">$110 Rebate Offer</a></em></p>
  <h1>4x4 Contact</h1>
  <p>The 4x4 Contact is a premium, all-season touring tire for crossovers, light
    trucks and SUVs.</p>
  <ul>
    <li>Tuned for original equipment applications</li>
    <li>Responsive handling</li>
    <li>Comfortable, smooth ride</li>
  </ul>
  <p><strong><a href="/store-finder">Find a store</a></strong></p>
  <p><a href="/warranty">Total Confidence Plan</a></p>
  <ul>
    <li>60 Day Trial</li>
    <li>3 Year Roadside Assistance</li>
    <li>12 Month Road Hazard Coverage</li>
  </ul>
  <p><strong>Best for</strong></p>
  <ul>
    <li>Crossover</li>
    <li>Touring</li>
  </ul>
  <p><strong>Technology</strong></p>
  <ul><li>Self Supporting Runflat*</li></ul>`;

describe("product hero, live's hairlines around the highlights list (#306)", () => {
  let sheets;

  before(async () => {
    sheets = await Promise.all(['/styles/styles.css', '/blocks/columns/columns.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
  });

  afterEach(() => {
    document.querySelectorAll('.columns.product-hero').forEach((b) => b.remove());
  });

  it('names the list the block did not name before', () => {
    const block = authored(CELL);
    const list = block.querySelector('.product-hero-highlights');
    expect(list, 'the highlights list').to.exist;
    expect([...list.querySelectorAll('li')].map((li) => li.textContent.trim())).to.deep.equal([
      'Tuned for original equipment applications',
      'Responsive handling',
      'Comfortable, smooth ride',
    ]);
  });

  it('names it on the sentence under the title and on nothing else', () => {
    const block = authored(CELL);
    expect(block.querySelectorAll('.product-hero-highlights').length).to.equal(1);
    ['.product-hero-plan', '.product-hero-best-for', '.product-hero-technology'].forEach((sel) => {
      const other = block.querySelector(sel);
      expect(other, sel).to.exist;
      expect(other.classList.contains('product-hero-highlights'), `${sel} keeps its own name`)
        .to.be.false;
    });
  });

  it('names none where a page authors no such list', () => {
    const block = authored(`
      <h1>ProContact TX</h1>
      <p>An original equipment touring tire.</p>
      <p><a href="/warranty">Total Confidence Plan</a></p>
      <ul><li>60 Day Trial</li></ul>`);
    expect(!!block.querySelector('.product-hero-highlights')).to.be.false;
  });

  it("draws live's 1px #cdcdcd above and below it", () => {
    const block = authored(CELL);
    const cs = getComputedStyle(block.querySelector('.product-hero-highlights'));
    expect(`${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`)
      .to.equal('1px solid rgb(205, 205, 205)');
    expect(`${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`)
      .to.equal('1px solid rgb(205, 205, 205)');
  });

  it("holds live's 16px on each side of both lines", () => {
    const block = authored(CELL);
    const cs = getComputedStyle(block.querySelector('.product-hero-highlights'));
    expect(cs.paddingTop, 'between the first line and the first row').to.equal('16px');
    expect(cs.paddingBottom, 'between the last row and the second line').to.equal('16px');
    expect(cs.marginTop, 'between the sentence and the first line').to.equal('16px');
  });

  /* 16 above the first line, the line, 16 under it: live's 33 from the sentence
     to the first row, where ours ran 14.4 and drew nothing */
  it("stands 33 off the sentence, which is live's", () => {
    const block = authored(CELL);
    const sentence = block.querySelector('h1 ~ p');
    const list = block.querySelector('.product-hero-highlights');
    const gap = list.getBoundingClientRect().top - sentence.getBoundingClientRect().bottom;
    expect(Math.round(gap), 'the sentence to the first line').to.equal(16);
    const cs = getComputedStyle(list);
    expect(Math.round(gap + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop)))
      .to.equal(33);
  });
});
