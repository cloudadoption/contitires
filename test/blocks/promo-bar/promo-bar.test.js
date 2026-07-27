/* eslint-disable no-unused-expressions */
/* global describe it before beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/promo-bar/promo-bar.js';

/** Authored promo-bar: row 1 is the toggle label, row 2 is the rebate detail. */
function buildBlock() {
  document.body.innerHTML = `
    <div class="promo-bar block">
      <div><div><p>See how to get a $110 Rebate</p></div></div>
      <div><div>
        <h2>Get a $110 Rebate</h2>
        <p>when you purchase a set of 4 qualifying Continental Tires!</p>
        <p><a href="/offers">See Full Details</a></p>
      </div></div>
    </div>`;
  return document.querySelector('.promo-bar.block');
}

describe('Promo bar block', () => {
  let block;
  beforeEach(() => {
    block = buildBlock();
    decorate(block);
  });

  it('turns row 1 into a collapsed toggle button', () => {
    const toggle = block.querySelector('button.promo-bar-toggle');
    expect(toggle).to.exist;
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
    expect(toggle.getAttribute('aria-controls')).to.have.length.greaterThan(0);
    expect(toggle.textContent).to.contain('See how to get a $110 Rebate');
  });

  it('holds the panel padding on an inner content wrapper so it can collapse', () => {
    // the grid item (.promo-bar-panel-inner) must stay padding-free; the
    // visual padding lives on .promo-bar-panel-content. This is the fix that
    // lets the collapsed panel crush to zero height.
    const inner = block.querySelector('.promo-bar-panel-inner');
    const content = block.querySelector('.promo-bar-panel-content');
    expect(inner).to.exist;
    expect(content).to.exist;
    expect(inner.contains(content)).to.be.true;
    expect(content.querySelector(':is(h1, h2, h3, h4, h5, h6)')).to.exist;
  });

  it('starts the panel inert and wired to the toggle', () => {
    const panel = block.querySelector('.promo-bar-panel');
    const toggle = block.querySelector('.promo-bar-toggle');
    expect(panel.hasAttribute('inert')).to.be.true;
    expect(panel.id).to.equal(toggle.getAttribute('aria-controls'));
    expect(panel.classList.contains('promo-bar-panel-open')).to.be.false;
  });

  it('styles the detail link as a secondary button', () => {
    const link = block.querySelector('.promo-bar-panel-content a[href="/offers"]');
    expect(link.classList.contains('button')).to.be.true;
    expect(link.classList.contains('secondary')).to.be.true;
  });

  it('expands and collapses on toggle click', () => {
    const toggle = block.querySelector('.promo-bar-toggle');
    const panel = block.querySelector('.promo-bar-panel');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).to.equal('true');
    expect(panel.classList.contains('promo-bar-panel-open')).to.be.true;
    expect(panel.hasAttribute('inert')).to.be.false;

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
    expect(panel.classList.contains('promo-bar-panel-open')).to.be.false;
    expect(panel.hasAttribute('inert')).to.be.true;
  });
});

describe('Promo bar affordance', () => {
  // Live prefixes the toggle label with a plus and turns it into a minus once
  // the panel is open. Ours put a chevron after the label.
  let block;
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/promo-bar/promo-bar.css')).text());
  });

  beforeEach(() => {
    block = buildBlock();
    decorate(block);
  });

  it('puts the plus in front of the label', () => {
    const toggle = block.querySelector('.promo-bar-toggle');
    expect(toggle.firstElementChild.classList.contains('promo-bar-plus')).to.be.true;
    expect(toggle.querySelector('.promo-bar-chevron'), 'the chevron is gone').to.not.exist;
  });

  it('hides the plus from assistive tech, which reads the toggle state', () => {
    expect(block.querySelector('.promo-bar-plus').getAttribute('aria-hidden')).to.equal('true');
  });

  it('drops the upright stroke while the panel is open, leaving a minus', () => {
    const rule = [...sheet.cssRules].find((r) => r.selectorText
      === '.promo-bar-toggle[aria-expanded="true"] .promo-bar-plus::after');
    expect(rule, 'the open toggle restyles the upright stroke').to.exist;
    expect(rule.style.transform).to.equal('scaleY(0)');
  });

  it('renders live\'s 36px row', () => {
    // the header reserves this row too, but an authored bar has no reservation
    // behind it, so the row has to measure 36 on its own
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    try {
      const bar = block.querySelector('.promo-bar-bar');
      expect(Math.round(bar.getBoundingClientRect().height)).to.equal(36);
    } finally {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    }
  });
});
