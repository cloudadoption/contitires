/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/accordion/accordion.js';
import styleSheet from '../../helpers/stylesheet.js';

/**
 * /ev-compatible closes on eight questions. Live collapses them and ours printed
 * every answer, including a three-item list, so the band ran 1205.34 where live
 * runs 734. Read at 1440 on 2026-08-03:
 *
 *   live   section.faqs 1440x734   .faqs__list 890 centred at x=275
 *          8 details, all closed, rows 32 tall and 56 apart
 *          summary 24/32, padding-left 24, list-style none, cursor pointer
 *          summary::before 16x16 at left 0 top 7, a #c27e00 plus
 *          [open] swaps the plus for a 16x2 bar of the same colour
 *          .faq__answer 18/26, padding-left 24, margin-top 8
 *   ours   the section 1440x1205.34, eight h3 and their copy in the flow
 *
 * LIVE'S OWN CONTROL IS A NATIVE details/summary, which is what this block
 * builds. `<details class="faq"><summary class="faq__question"><span>…</span>
 * </summary><div class="faq__answer">…</div></details>`. So the keyboard, the
 * Enter and Space handling and the expanded state a screen reader announces are
 * the platform's rather than ours, and no JS runs after decoration.
 *
 * THE QUESTION KEEPS ITS HEADING. Live's summary holds a bare span and drops the
 * outline; ours moves the authored h3 inside the summary, which HTML allows as
 * summary content and which keeps the eight questions under their h2 in the
 * document outline. Below 769 the heading takes live's 18/26 rather than the
 * site's h3 size, because live steps its question there.
 *
 * The marker is DRAWN, two bars rather than a fetched file, the way cards.css
 * draws live's scroll arrow and columns.css its plus. Live's own is an inline
 * data URI in its stylesheet, not a sprite symbol, so there is no asset to take.
 *
 * Issue #88.
 */
const QUESTIONS = [
  ['Do Electric Vehicles require special tires?', '<p>No. All Continental tires are designed for usage on both ICE vehicles and EVs.</p>'],
  ['Are EV vehicles different than internal combustion vehicles?', '<p>There are 3 main differences:</p><ol><li>Heavier.</li><li>Less cabin noise.</li><li>A range per charge.</li></ol>'],
  ['Does Continental have EV expertise?', '<p>Continental has significant EV expertise.</p>'],
  ['What is EV Compatible?', '<p><img src="/ev-compatible/ev-logo.png" alt="EV Compatible logo"></p><p>It identifies that the tire meets the needs of an EV.</p>'],
  ['Why do some products carry it on the sidewall?', '<p>The marking will be added to all new tires.</p>'],
  ['Are there differences between OE and Replacement tires?', '<p>Replacement is focused on grip and tread life.</p>'],
  ['Are there any unique tire needs for electric vehicles?', '<p>No.</p>'],
  ['Is there a specific tire I should buy for my EV?', '<p>It depends on your needs and priorities.</p>'],
];

/**
 * The section as the pipeline delivers it: the band's own heading as default
 * content, then the block holding one flat run of question and answer.
 * @param {string} inner the block's rows
 * @returns {Element} the block, decorated
 */
function build(inner) {
  document.body.innerHTML = `
    <main>
      <div class="section accordion-container">
        <div class="default-content-wrapper">
          <h2 id="frequently-asked-questions">Frequently Asked Questions</h2>
        </div>
        <div class="accordion-wrapper">
          <div class="accordion block">${inner}</div>
        </div>
      </div>
    </main>`;
  const block = document.querySelector('.accordion');
  decorate(block);
  return block;
}

/** @returns {Element} the block holding all eight in one cell */
const buildFlat = () => build(`<div><div>${QUESTIONS
  .map(([q, a]) => `<h3 id="q">${q}</h3>${a}`).join('')}</div></div>`);

/** @returns {Element} the same eight authored one row each */
const buildRows = () => build(QUESTIONS
  .map(([q, a]) => `<div><div><h3>${q}</h3>${a}</div></div>`).join(''));

describe("Accordion, live's collapsed questions", () => {
  before(async () => {
    const sheets = await Promise.all([
      styleSheet('/styles/styles.css'),
      styleSheet('/blocks/accordion/accordion.css'),
    ]);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    document.adoptedStyleSheets = [];
  });

  it('builds one native details per question, all closed', () => {
    const rows = buildFlat().querySelectorAll('details');
    expect(rows.length).to.equal(8);
    expect([...rows].every((d) => !d.open), 'none open').to.be.true;
    expect([...rows].every((d) => d.querySelector(':scope > summary')), 'each has a summary').to.be.true;
  });

  it('keeps the authored heading inside the summary', () => {
    const first = buildFlat().querySelector('details');
    const heading = first.querySelector('summary h3');
    expect(heading, 'the h3 moved into the summary').to.exist;
    expect(heading.textContent).to.equal(QUESTIONS[0][0]);
  });

  it('puts the answer in its own element after the summary', () => {
    const first = buildFlat().querySelector('details');
    const answer = first.querySelector('.accordion-answer');
    expect(answer).to.exist;
    expect(answer.previousElementSibling.tagName).to.equal('SUMMARY');
    expect(answer.querySelector('p').textContent).to.contain('No. All Continental tires');
  });

  it('carries a list in an answer through', () => {
    const second = buildFlat().querySelectorAll('details')[1];
    expect(second.querySelectorAll('.accordion-answer ol li').length).to.equal(3);
  });

  it('reads the same eight when they are authored one row each', () => {
    const rows = buildRows().querySelectorAll('details');
    expect(rows.length).to.equal(8);
    expect(rows[7].querySelector('summary h3').textContent).to.equal(QUESTIONS[7][0]);
  });

  it('leaves copy written above the first question in the block', () => {
    const block = build('<div><div><p>Pick a question.</p><h3>Only one</h3><p>Yes.</p></div></div>');
    expect(block.firstElementChild.tagName, 'the intro leads').to.equal('P');
    expect(block.querySelectorAll('details').length).to.equal(1);
  });

  // live's own numbers, and the ones that make the 734: eight rows of 32 with 24
  // between them is 488, under an 80 / 48 / 38 head and over an 80 foot.
  it("takes live's 24 by 32 question and its 24 of room for the marker", async () => {
    await setViewport({ width: 1440, height: 900 });
    const summary = buildFlat().querySelector('summary');
    const cs = getComputedStyle(summary);
    expect(cs.fontSize, 'size').to.equal('24px');
    expect(cs.lineHeight, 'box').to.equal('32px');
    expect(cs.paddingLeft, 'the marker column').to.equal('24px');
    expect(cs.cursor).to.equal('pointer');
    expect(cs.listStyleType, 'the UA triangle live also drops').to.equal('none');
  });

  it('collapses a one-line row to 32 and spaces the rows 24 apart', async () => {
    await setViewport({ width: 1440, height: 900 });
    const rows = [...buildFlat().querySelectorAll('details')];
    const first = rows[0].getBoundingClientRect();
    expect(Math.round(first.height), 'the collapsed row').to.equal(32);
    const second = rows[1].getBoundingClientRect();
    expect(Math.round(second.top - first.bottom), 'the gap').to.equal(24);
  });

  // live's question renders at 400 and the site's headings at 300, so moving the
  // authored h3 into the summary brought a lighter question with it. Read off a
  // rendered /ev-compatible at 1440 on 2026-08-03: live's summary and its span
  // both compute 400 in Stag Sans at #333, and ours computed 400 on the summary
  // with 300 on the h3 inside it.
  it("sets the question at live's own weight rather than the heading's", async () => {
    await setViewport({ width: 1440, height: 900 });
    const heading = buildFlat().querySelector('summary h3');
    expect(getComputedStyle(heading).fontWeight).to.equal('400');
  });

  it("steps the question to live's 18 by 26 below the tablet bound", async () => {
    await setViewport({ width: 375, height: 900 });
    const cs = getComputedStyle(buildFlat().querySelector('summary'));
    expect(cs.fontSize).to.equal('18px');
    expect(cs.lineHeight).to.equal('26px');
  });

  it("draws live's plus in its dark yellow and swaps it for a bar when open", async () => {
    await setViewport({ width: 1440, height: 900 });
    const summary = buildFlat().querySelector('summary');
    const bar = getComputedStyle(summary, '::before');
    expect(bar.width, 'the bar across').to.equal('16px');
    expect(bar.height).to.equal('2px');
    expect(bar.backgroundColor, "live's #c27e00").to.equal('rgb(194, 126, 0)');
    const upright = getComputedStyle(summary, '::after');
    expect(upright.width).to.equal('2px');
    expect(upright.height, 'the upright').to.equal('16px');
    expect(upright.backgroundColor).to.equal('rgb(194, 126, 0)');

    summary.closest('details').open = true;
    expect(getComputedStyle(summary, '::after').display, 'the upright goes').to.equal('none');
    expect(getComputedStyle(summary, '::before').width, 'the bar stays').to.equal('16px');
  });

  it("gives the answer live's 18 by 26 in the marker's own column", async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildFlat();
    block.querySelector('details').open = true;
    const cs = getComputedStyle(block.querySelector('.accordion-answer'));
    expect(cs.fontSize).to.equal('18px');
    expect(cs.lineHeight).to.equal('26px');
    expect(cs.paddingLeft).to.equal('24px');
    expect(cs.marginTop).to.equal('8px');
  });

  it("steps the answer to live's 15 by 22 below the tablet bound", async () => {
    await setViewport({ width: 375, height: 900 });
    const block = buildFlat();
    block.querySelector('details').open = true;
    const cs = getComputedStyle(block.querySelector('.accordion-answer'));
    expect(cs.fontSize).to.equal('15px');
    expect(cs.lineHeight).to.equal('22px');
  });

  it("caps the column at live's 890 and centres it", async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildFlat();
    expect(getComputedStyle(block).maxWidth).to.equal('890px');
    const list = block.getBoundingClientRect();
    const wrap = block.closest('.accordion-wrapper').getBoundingClientRect();
    expect(Math.round(list.width)).to.equal(890);
    expect(Math.round(list.left - wrap.left)).to.equal(Math.round(wrap.right - list.right));
  });

  // live's band: 80 of room above and below, its title centred in capitals, and
  // 38 between that title and the first question.
  it("sets the band's title the way live sets it", async () => {
    await setViewport({ width: 1440, height: 900 });
    buildFlat();
    const cs = getComputedStyle(document.querySelector('h2'));
    expect(cs.fontSize).to.equal('42px');
    expect(cs.lineHeight).to.equal('48px');
    expect(cs.letterSpacing).to.equal('6px');
    expect(cs.textTransform).to.equal('uppercase');
    expect(cs.textAlign).to.equal('center');
  });

  it("holds the title at live's 30 by 36 below the desktop step", async () => {
    await setViewport({ width: 1000, height: 900 });
    buildFlat();
    const cs = getComputedStyle(document.querySelector('h2'));
    expect(cs.fontSize).to.equal('30px');
    expect(cs.lineHeight).to.equal('36px');
  });

  // live's 734 is 80 + 48 + 38 + 488 + 80, and the four numbers this asserts are
  // the ones the band contributes. The 488 is eight questions at live's own type,
  // so it belongs to the live-against-ours reading rather than to a fixture.
  it("gives the band live's 80 of room and takes the title's own margin off", async () => {
    await setViewport({ width: 1440, height: 900 });
    buildFlat();
    const section = getComputedStyle(document.querySelector('.section.accordion-container'));
    expect(section.paddingTop).to.equal('80px');
    expect(section.paddingBottom).to.equal('80px');
    expect(section.marginTop, 'the band pays its own room').to.equal('0px');
    const title = getComputedStyle(document.querySelector('h2'));
    expect(title.marginTop).to.equal('0px');
    expect(title.marginBottom).to.equal('0px');
  });

  it("leaves live's 38 between the title and the first question", async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildFlat();
    const title = document.querySelector('h2').getBoundingClientRect();
    const first = block.querySelector('details').getBoundingClientRect();
    expect(Math.round(first.top - title.bottom)).to.equal(38);
  });

  it("narrows the band's room to live's 38 below the tablet bound", async () => {
    await setViewport({ width: 375, height: 900 });
    buildFlat();
    const section = getComputedStyle(document.querySelector('.section.accordion-container'));
    expect(section.paddingTop).to.equal('38px');
    expect(section.paddingBottom).to.equal('38px');
  });
});
