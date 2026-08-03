/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * #467's fourth row. Live rules one card band off from the next with a yellow
 * hairline, and no block of ours drew one.
 *
 * The rule is live's own and it is not this page's:
 *
 *     * + .card-list { border-top: 1px solid var(--yellow) }
 *
 * so any band with a band above it takes it, `--yellow` being #ffa500, which is
 * `--conti-yellow` here. Read on 2026-08-03 at 1440 over the three pages that
 * run more than one band: /my-first-car-my-first-tires 0 then 1px, its
 * `card-list--centered` second band; /experience/soccer 0 then 1px three times;
 * /cruisingthecontinentalus 0 then 1px. Six bands with it, three without, and
 * the one without is the first on its page every time.
 *
 * Live paints it on the band, which is full bleed there: 1440 wide at x=0 with
 * its own title inside. Ours is the section, because the block inside it is
 * capped at the container and a border on the block would draw a 1136 line where
 * live draws a 1440 one.
 */
const card = (title) => `
  <div>
    <div><picture><img src="/media/still.png" alt="" width="752" height="423"></picture></div>
    <div><a href="https://www.youtube.com/watch?v=l35vl9EO3ts">${title}</a></div>
  </div>`;

/**
 * A page of sections, one gallery each, the way the pipeline delivers them.
 * @param {string[]} variants one per section, or null for a section with no gallery
 * @returns {Element[]} the section elements, in document order
 */
const page = (variants) => {
  document.body.innerHTML = `<main>${variants.map((variant) => (variant === null
    ? '<div class="section"><div class="default-content-wrapper"><h2>Words</h2></div></div>'
    : '<div class="dark section"><div class="media-gallery-wrapper">'
      + `<div class="media-gallery ${variant} block">${card('One')}${card('Two')}${card('Three')}</div>`
      + '</div></div>')).join('')}</main>`;
  document.querySelectorAll('.media-gallery.block').forEach((block) => decorate(block));
  return [...document.querySelectorAll('main > .section')];
};

/* the colour is dropped when there is no line, because a border of no width
   reports whatever colour the section inherits and the section styles differ */
const rule = (section) => {
  const cs = getComputedStyle(section);
  if (cs.borderTopWidth === '0px') return `${cs.borderTopWidth} ${cs.borderTopStyle}`;
  return `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`;
};

describe("Media gallery, live's hairline between card bands (#467)", () => {
  let sheets;

  before(async () => {
    sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/media-gallery/media-gallery.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
    await setViewport({ width: 1440, height: 900 });
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
  });

  beforeEach(() => { document.body.innerHTML = ''; });

  it('leaves the first band without one, the way live leaves all three pages', () => {
    const [first] = page(['cards', 'cards']);
    expect(rule(first)).to.equal('0px none');
  });

  it("draws live's 1px #ffa500 on the second band of my-first-car", () => {
    const [, second] = page(['cards', 'cards']);
    expect(rule(second)).to.equal('1px solid rgb(255, 165, 0)');
  });

  it('draws it on all three bands after soccer\'s first', () => {
    const sections = page(['cards leading', 'cards leading', 'cards leading', 'cards leading-pair']);
    expect(rule(sections[0])).to.equal('0px none');
    sections.slice(1).forEach((section, i) => {
      expect(rule(section), `band ${i + 2}`).to.equal('1px solid rgb(255, 165, 0)');
    });
  });

  it('draws none on a page with a single band', () => {
    const [only] = page(['cards leading']);
    expect(rule(only)).to.equal('0px none');
  });

  it('leaves a section holding no gallery alone', () => {
    const sections = page(['cards', null, 'cards']);
    expect(rule(sections[1]), 'the words between the bands').to.equal('0px none');
    expect(rule(sections[2]), 'and the band under them still takes it').to.equal('1px solid rgb(255, 165, 0)');
  });

  it('leaves a tile gallery alone, which live builds as another component', () => {
    const sections = page(['', '']);
    sections.forEach((section) => {
      expect(rule(section)).to.equal('0px none');
    });
  });
});
