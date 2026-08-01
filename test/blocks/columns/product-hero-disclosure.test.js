/* eslint-disable no-unused-expressions */
/* global describe it before after afterEach */

import { expect } from '@esm-bundle/chai';
import { sendKeys, setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate, { addTechnologyTooltips, setHeroDisclosures } from '../../../blocks/columns/columns.js';

/**
 * Live collapses the hero column's trailing groups into disclosures at narrow
 * widths, and this site draws them open at every width. (#432)
 *
 * Read on continentaltire.com/tires/crosscontact-lx25, bracketed rather than
 * assumed: at 767 and 768 both groups are 61px with no row drawn, at 769 they
 * are 258px and 144px with their rows drawn. So the boundary is live's
 * `max-width: 768`, which is the step AGENTS.md names.
 *
 * It is a working disclosure and not a media query. At 375 live's heading takes
 * a pointer cursor, and a click on it sets the open state and takes Technology
 * from 61px with no rows to 148px with two. At 1440 the same click does
 * nothing, the cursor is `default`, and there is no control to reach: the
 * element carries `mobileonly`.
 *
 * THE SCOPE IS BOTH GROUPS AND NOT THE ONE THE ISSUE NAMES. Live wraps `Best
 * for` in the same `con-details` it wraps `Technology` in, so the pattern
 * belongs to the hero column. Counted off live's own delivered HTML for the 46
 * product pages: 80 groups, `Best for` on 46 and `Technology` on 34.
 *
 * The plan summary is NOT one of them. Live leaves it outside `con-details` on
 * every page, so it never collapses.
 *
 * Live's mark is `#plus-outline` from its sprite, an 11px viewBox holding two
 * 1px strokes in `currentColor`, drawn 20px wide inside a 28px box. It becomes
 * `#minus-outline` when the group opens.
 */

const authored = (cell) => {
  const block = document.createElement('div');
  block.className = 'columns product-hero block';
  block.innerHTML = `<div><div><p><picture><img src="/tire.png" alt="tire"></picture></p></div><div>${cell}</div></div>`;
  document.body.append(block);
  return block;
};

const BOTH = `
  <h1>CrossContact LX25</h1>
  <p><a href="/warranty">Total Confidence Plan</a></p>
  <ul>
    <li>60 Day Trial</li>
    <li>3 Year Roadside Assistance</li>
  </ul>
  <p><strong>Best for</strong></p>
  <ul>
    <li>Crossover</li>
    <li>Light Truck/SUV</li>
  </ul>
  <p><strong>Technology</strong></p>
  <ul>
    <li>EcoPlus</li>
    <li>QuickView Indicators</li>
  </ul>`;

const BEST_FOR_ONLY = `
  <h1>sContact</h1>
  <p><strong>Best for</strong></p>
  <ul><li>Passenger</li></ul>`;

/**
 * The subscriptions a block made to live's own step, with the handler each one
 * registered. Under the whole suite these pages are BACKGROUNDED, and a
 * backgrounded page is not delivered a media-query change promptly: the two
 * tests that waited for one passed alone and timed out under `npm test`, at
 * concurrency 1 and at the default respectively. Calling the handler is the
 * same code path without the wait, and it also names the query rather than
 * inferring the boundary from a rendered width.
 * @param {Function} spy a sinon spy on MediaQueryList.prototype.addEventListener
 * @returns {Array<{media: string, event: string, handler: Function}>}
 */
const subscriptions = (spy) => spy.getCalls()
  .map((call, i) => ({
    media: spy.thisValues[i].media,
    event: call.args[0],
    handler: call.args[1],
  }))
  .filter((s) => s.media === '(width <= 768px)');

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

const toggles = (block) => [...block.querySelectorAll('.product-hero-group-toggle')];
const labels = (block) => [
  block.querySelector('.product-hero-best-for-label'),
  block.querySelector('.product-hero-technology-label'),
];
const lists = (block) => [
  block.querySelector('.product-hero-best-for'),
  block.querySelector('.product-hero-technology'),
];

describe('product hero groups, closed at live\'s narrow widths', () => {
  let block;

  before(async () => {
    await setViewport({ width: 375, height: 812 });
  });

  after(async () => {
    await setViewport({ width: 800, height: 600 });
  });

  afterEach(() => {
    if (block) block.remove();
  });

  it('gives both groups a control and hides their rows', async () => {
    block = authored(BOTH);
    decorate(block);

    expect(toggles(block).map((t) => t.tagName), 'a real button, so the browser handles it')
      .to.eql(['BUTTON', 'BUTTON']);
    expect(toggles(block).map((t) => t.type)).to.eql(['button', 'button']);
    expect(toggles(block).map((t) => t.getAttribute('aria-expanded'))).to.eql(['false', 'false']);
    expect(lists(block).map((l) => l.hidden), 'both lists hidden').to.eql([true, true]);
  });

  it('keeps the label\'s own words in the control', async () => {
    block = authored(BOTH);
    decorate(block);

    expect(toggles(block).map((t) => t.textContent.trim())).to.eql(['Best for', 'Technology']);
    // the label element stays where it was, so the hairline above it is unmoved
    expect(labels(block).map((l) => l.tagName)).to.eql(['P', 'P']);
    expect(labels(block).map((l) => l.firstElementChild.className))
      .to.eql(['product-hero-group-toggle', 'product-hero-group-toggle']);
  });

  it('points each control at the list it opens, by its own id', async () => {
    block = authored(BOTH);
    decorate(block);

    const [bestFor, technology] = lists(block);
    expect(toggles(block)[0].getAttribute('aria-controls')).to.equal(bestFor.id);
    expect(toggles(block)[1].getAttribute('aria-controls')).to.equal(technology.id);
    expect(bestFor.id, 'an id on each').to.not.equal('');
    expect(bestFor.id, 'and not the same id twice').to.not.equal(technology.id);
  });

  // THE ASSERTION THAT MATTERS. A group that renders closed and cannot be
  // opened reproduces live's appearance and not its function.
  it('opens the group a reader presses, and closes it again', async () => {
    block = authored(BOTH);
    decorate(block);
    const [, technology] = lists(block);
    const toggle = toggles(block)[1];

    toggle.click();
    expect(toggle.getAttribute('aria-expanded'), 'open').to.equal('true');
    expect(technology.hidden, 'the rows are drawn').to.be.false;
    expect(technology.getBoundingClientRect().height, 'and take room').to.be.greaterThan(0);

    toggle.click();
    expect(toggle.getAttribute('aria-expanded'), 'closed again').to.equal('false');
    expect(technology.hidden).to.be.true;
    expect(technology.getBoundingClientRect().height).to.equal(0);
  });

  it('opens one group without opening the other', async () => {
    block = authored(BOTH);
    decorate(block);

    toggles(block)[0].click();
    expect(lists(block).map((l) => l.hidden)).to.eql([false, true]);
  });

  // live hangs its own handler on a custom element, so no keyboard reaches it.
  // A button gets Enter and Space from the browser.
  it('opens from the keyboard', async () => {
    block = authored(BOTH);
    decorate(block);
    const toggle = toggles(block)[1];
    const [, technology] = lists(block);

    toggle.focus();
    expect(document.activeElement, 'the control takes focus').to.equal(toggle);
    await sendKeys({ press: 'Enter' });
    expect(toggle.getAttribute('aria-expanded'), 'Enter opens it').to.equal('true');
    expect(technology.hidden).to.be.false;

    await sendKeys({ press: ' ' });
    expect(toggle.getAttribute('aria-expanded'), 'Space closes it').to.equal('false');
    expect(technology.hidden).to.be.true;
  });

  it('leaves the plan summary open, as live does', async () => {
    block = authored(BOTH);
    decorate(block);

    const plan = block.querySelector('.product-hero-plan');
    expect(plan.hidden, 'the plan is not one of the two').to.be.false;
    expect(!!block.querySelector('.product-hero-plan-link .product-hero-group-toggle')).to.be.false;
  });

  it('collapses the one group on a page with no Technology', async () => {
    block = authored(BEST_FOR_ONLY);
    decorate(block);

    expect(block.querySelector('.product-hero-best-for').hidden).to.be.true;
    expect(!!block.querySelector('.product-hero-technology-label'), 'none to collapse').to.be.false;
  });

  it('still builds the tooltips the rows carry', async () => {
    sinon.stub(window, 'fetch').callsFake(() => Promise.resolve(new Response(JSON.stringify({
      total: 1,
      offset: 0,
      limit: 1,
      data: [{ name: 'EcoPlus', description: 'Saves fuel and optimizes range' }],
    }))));
    block = authored(BOTH);
    decorate(block);
    await addTechnologyTooltips(block);
    window.fetch.restore();

    const help = block.querySelectorAll('.product-hero-technology .product-hero-technology-help');
    expect(help, 'a collapsed list is still filled').to.have.length(1);
  });
});

describe('product hero groups, open at live\'s wide widths', () => {
  let block;

  before(async () => {
    await setViewport({ width: 900, height: 900 });
  });

  after(async () => {
    await setViewport({ width: 800, height: 600 });
  });

  afterEach(() => {
    if (block) block.remove();
  });

  it('draws no control at all, the way live draws none', async () => {
    block = authored(BOTH);
    decorate(block);

    expect(toggles(block), 'nothing to press').to.have.length(0);
    expect(labels(block).map((l) => l.textContent.trim())).to.eql(['Best for', 'Technology']);
    expect(lists(block).map((l) => l.getBoundingClientRect().height > 0)).to.eql([true, true]);
  });

  // live's own step, bracketed rather than assumed: 768 collapsed, 769 open
  it('closes at 768 and draws no control at 769', async () => {
    await setViewport({ width: 768, height: 812 });
    block = authored(BOTH);
    decorate(block);
    expect(toggles(block), 'a control at 768').to.have.length(2);
    expect(lists(block).map((l) => l.hidden), 'closed at 768').to.eql([true, true]);
    block.remove();

    await setViewport({ width: 769, height: 812 });
    block = authored(BOTH);
    decorate(block);
    expect(toggles(block), 'none at 769').to.have.length(0);
    expect(lists(block).map((l) => l.hidden), 'open at 769').to.eql([false, false]);
    await setViewport({ width: 900, height: 900 });
  });

  it('subscribes to live\'s step, and closes the groups when it fires', async () => {
    const spy = sinon.spy(MediaQueryList.prototype, 'addEventListener');
    block = authored(BOTH);
    decorate(block);
    const subs = subscriptions(spy);
    spy.restore();

    expect(subs, 'one subscription to live\'s own step').to.have.length(1);
    expect(subs[0].event).to.equal('change');
    expect(toggles(block), 'open to begin with').to.have.length(0);

    await setViewport({ width: 375, height: 812 });
    subs[0].handler();
    expect(toggles(block), 'closed when the step fires').to.have.length(2);
    expect(lists(block).map((l) => l.hidden)).to.eql([true, true]);

    await setViewport({ width: 900, height: 900 });
    subs[0].handler();
    expect(toggles(block), 'open again above it').to.have.length(0);
    expect(labels(block).map((l) => l.textContent.trim()), 'the label reads as it did')
      .to.eql(['Best for', 'Technology']);
  });
});

/**
 * The treatments, read as COMPUTED values at a width rather than as
 * declarations: a media-query declaration defeated by a later base rule on the
 * same selector passes a declaration read and fails on the page.
 */
describe('product hero groups, the treatment live gives the closed row', () => {
  let block;

  before(async () => {
    // styles.css as well as the block's own: the hairline is drawn in
    // var(--conti-grey), and an undefined custom property makes the whole
    // shorthand invalid, so the border reads 0px and the test measures nothing
    await adopt('/styles/styles.css', '/blocks/columns/columns.css');
    document.body.classList.add('appear');
    await setViewport({ width: 375, height: 812 });
  });

  after(async () => {
    document.body.classList.remove('appear');
    await setViewport({ width: 800, height: 600 });
  });

  afterEach(() => {
    if (block) block.remove();
  });

  it('draws live\'s plus, and turns it into a minus when the group opens', async () => {
    block = authored(BOTH);
    decorate(block);
    const toggle = toggles(block)[1];

    // the computed value carries commas inside each colour, so the bars are
    // counted by their own function rather than by splitting on a comma
    const bars = (el) => (getComputedStyle(el, '::before').backgroundImage
      .match(/linear-gradient\(/g) || []).length;

    const closed = getComputedStyle(toggle, '::before');
    expect(closed.width, 'live draws the mark 20px wide in a 28px box').to.equal('28px');
    expect(closed.height).to.equal('20px');
    expect(bars(toggle), 'two bars make the plus').to.equal(2);
    expect(getComputedStyle(toggle, '::before').backgroundSize, 'one across, one down')
      .to.equal('20px 2px, 2px 20px');

    toggle.click();
    expect(bars(toggle), 'one bar makes the minus').to.equal(1);
    expect(getComputedStyle(toggle, '::before').backgroundSize, 'the bar across')
      .to.equal('20px 2px');
  });

  it('keeps the row live\'s height by holding 20px under the mark', async () => {
    block = authored(BOTH);
    decorate(block);
    const [label] = labels(block);

    // live's closed group is 61px: its 1px rule, 20px above the 20px mark, 20px under
    expect(getComputedStyle(label).paddingTop).to.equal('20px');
    expect(getComputedStyle(label).paddingBottom).to.equal('20px');
    expect(getComputedStyle(label).borderTopWidth).to.equal('1px');
    expect(Math.round(label.getBoundingClientRect().height), 'the closed row').to.equal(61);
  });

  // live measures 20px between the mark and the first row when the group opens,
  // and this site's list already carries that 20px as its own top margin
  it('leaves one 20px gap above the rows rather than two', async () => {
    block = authored(BOTH);
    decorate(block);
    const toggle = toggles(block)[1];
    const [, technology] = lists(block);

    toggle.click();
    const gap = technology.getBoundingClientRect().top - toggle.getBoundingClientRect().bottom;
    expect(Math.round(gap), 'live reads 20').to.equal(20);
  });

  // the block's own tooltip button already takes this ring, and so do
  // perfect-fit, tire-specs and the promo bar. Without a rule the one new
  // control on the page takes Chrome's blue `auto 1px rgb(0, 95, 204)`.
  it('shows a keyboard where it is, in the ring this block already uses', async () => {
    block = authored(BOTH);
    decorate(block);
    const toggle = toggles(block)[1];

    toggle.focus({ focusVisible: true });
    expect(toggle.matches(':focus-visible'), 'the control takes keyboard focus').to.be.true;
    // read into a string while it is focused: the declaration is live, and read
    // later it reports whatever the element is doing then
    const cs = getComputedStyle(toggle);
    const ring = `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineOffset}`;
    expect(ring).to.equal('solid 2px 2px');
  });

  it('leaves the wide row as it was, with no mark and no extra space', async () => {
    await setViewport({ width: 900, height: 900 });
    block = authored(BOTH);
    decorate(block);
    const [label] = labels(block);

    expect(getComputedStyle(label).paddingBottom, 'nothing added above 768').to.equal('0px');
    expect(getComputedStyle(label, '::before').content, 'no mark').to.equal('none');
    await setViewport({ width: 375, height: 812 });
  });
});

describe('setHeroDisclosures, called directly', () => {
  let block;

  afterEach(() => {
    if (block) block.remove();
  });

  it('collapses and restores on demand, whatever the viewport says', () => {
    block = authored(BOTH);
    decorate(block);

    setHeroDisclosures(block, true);
    expect(toggles(block)).to.have.length(2);
    expect(lists(block).map((l) => l.hidden)).to.eql([true, true]);

    setHeroDisclosures(block, false);
    expect(toggles(block)).to.have.length(0);
    expect(lists(block).map((l) => l.hidden)).to.eql([false, false]);
    expect(labels(block).map((l) => l.textContent.trim())).to.eql(['Best for', 'Technology']);
  });

  // above live's step there is no control, so a group the reader left closed
  // has to come back open or its rows are unreachable
  it('opens a group the reader had closed, on the way up', () => {
    block = authored(BOTH);
    decorate(block);

    setHeroDisclosures(block, true);
    toggles(block)[0].click();
    expect(lists(block).map((l) => l.hidden), 'one open, one closed').to.eql([false, true]);

    setHeroDisclosures(block, false);
    expect(lists(block).map((l) => l.hidden), 'both drawn again').to.eql([false, false]);
  });

  it('collapses once, however many times it is called', () => {
    block = authored(BOTH);
    decorate(block);

    setHeroDisclosures(block, true);
    setHeroDisclosures(block, true);
    expect(toggles(block), 'no control inside a control').to.have.length(2);
    expect(toggles(block)[0].textContent.trim()).to.equal('Best for');
  });

  it('touches a columns block that is not a product hero not at all', () => {
    block = document.createElement('div');
    block.className = 'columns block';
    block.innerHTML = '<div><div><p><strong>Best for</strong></p><ul><li>Crossover</li></ul></div></div>';
    document.body.append(block);
    decorate(block);

    setHeroDisclosures(block, true);
    expect(toggles(block)).to.have.length(0);
    expect(block.querySelector('ul').hidden).to.be.false;
  });
});
