/* eslint-disable no-unused-expressions */
/* global describe it before after afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import styleSheet from '../../helpers/stylesheet.js';
import { addFinderIcons } from '../../../blocks/header/header.js';

/** The two sheets these measurements stand on, parsed once for the file. */
const HEADER_CSS = '/blocks/header/header.css';
const GLOBAL_CSS = '/styles/styles.css';

/**
 * The open TIRES panel, against live. Measured on continentaltire.com at 1440
 * on 2026-08-02 with the panel open, and on
 * main--contitires--cloudadoption.aem.live the same way:
 *
 *                              live                       ours, before this
 *   panel background           rgb(0, 0, 0)               rgb(29, 29, 29)
 *   finder icons               3, 25x25, rgb(255,165,0)   none
 *   hairlines in the panel     1, on Fleet                2, on OE and on Fleet
 *   hairline box               x 313.2, w 1084.8          x 88, w 1264
 *
 * Live's single hairline starts at the left edge of its second column and runs
 * to the panel's right content edge, and ORIGINAL EQUIPMENT sits above it with
 * none of its own. Issue #237.
 */
describe('Header mega panel, the TIRES panel against live', () => {
  let sheets;
  let panel;
  let columns;
  let headingRows;
  let pin;

  const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]);

  before(async () => {
    await setViewport({ width: 1440, height: 900 });
    sheets = await Promise.all([GLOBAL_CSS, HEADER_CSS].map((path) => styleSheet(path)));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');

    // the wrapper is what the panel hangs off: `top: 100%` measures the
    // viewport without it and puts the panel below the fold
    document.body.innerHTML = `
      <header><div class="nav-wrapper"><nav id="nav" aria-expanded="true"><div class="nav-sections">
        <div class="default-content-wrapper">
          <ul>
            <li class="nav-drop nav-mega">
              <p><button type="button" aria-expanded="true">Tires</button></p>
              <ul>
                <li>
                  <p><strong>Search for Tire</strong></p>
                  <ul>
                    <li><button type="button" data-tire-finder="vehicle"><span class="icon icon-vehicle"></span>By Vehicle</button></li>
                    <li><button type="button" data-tire-finder="tire-size"><span class="icon icon-tire-size"></span>By Tire Size</button></li>
                    <li><button type="button" data-tire-finder="plate"><span class="icon icon-license-plate"></span>By Plate</button></li>
                  </ul>
                </li>
                <li>
                  <p><a href="/tires/ultra-high-performance">Ultra-High Performance</a></p>
                  <ul>
                    <li><a href="/tires/extremecontact-sport-02">ExtremeContact Sport02</a></li>
                  </ul>
                </li>
                <li>
                  <p><a href="/tires/touring">Touring</a></p>
                  <ul>
                    <li><a href="/tires/purecontact-ls">PureContact LS</a></li>
                  </ul>
                </li>
                <li><p><a href="/original-equipment">Original Equipment (OE)</a></p></li>
                <li><p><a href="/fleet">Fleet</a></p></li>
              </ul>
            </li>
          </ul>
        </div>
      </div></nav></div></header>`;

    panel = document.querySelector('li.nav-mega > ul');
    columns = [...panel.children];
    headingRows = columns.filter((li) => !li.querySelector(':scope > ul'));
    expect(panel.getBoundingClientRect().height, 'the panel is open').to.be.above(0);

    // The indent is the finder column's own width plus the panel's column gap,
    // and the finder column is content-sized, so it measures what the fonts
    // give it. The test server serves no web font, so the column is pinned to
    // the 110px it measures on the published host and the arithmetic is read
    // off that. Adopted last, so it beats header.css.
    pin = new CSSStyleSheet();
    pin.replaceSync('li.nav-mega > ul > li:first-child { width: 110px; }');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, pin];
  });

  // a failed assertion at another width would leave every test after it
  // reading there, so the width goes back after each rather than at the end of
  // the ones that move it
  afterEach(async () => {
    await setViewport({ width: 1440, height: 900 });
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((sheet) => !sheets.includes(sheet) && sheet !== pin);
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
  });

  it('paints the panel live\'s black rather than the site\'s near-black', () => {
    expect(getComputedStyle(panel).backgroundColor).to.equal('rgb(0, 0, 0)');
  });

  it('leaves the mobile drawer on the token the panel stopped reading', async () => {
    // the census that decided this: 13 rules across 8 files read
    // --conti-dark-black, among them this drawer, the tire-specs band, the
    // category card hover and the hero. The panel takes its own colour so
    // none of them move.
    await setViewport({ width: 900, height: 900 });
    const nav = document.getElementById('nav');
    expect(getComputedStyle(nav).backgroundColor).to.equal('rgb(29, 29, 29)');
  });

  it('draws one rule under the columns, where live draws one', () => {
    const ruled = columns.filter((li) => px(li, 'borderTopWidth') >= 1);
    expect(ruled.length).to.equal(1);
  });

  it('puts that rule under ORIGINAL EQUIPMENT rather than above it', () => {
    expect(headingRows.length, 'two heading-only rows, so there is a rule between them').to.equal(2);
    expect(px(headingRows[0], 'borderTopWidth'), 'OE carries none').to.equal(0);
    expect(px(headingRows[1], 'borderTopWidth'), 'Fleet carries it').to.be.at.least(1);
  });

  it('starts those rows at the second column, as live does', () => {
    const secondColumn = columns[1].getBoundingClientRect().left;
    headingRows.forEach((row) => {
      expect(row.getBoundingClientRect().left).to.be.closeTo(secondColumn, 0.5);
    });
  });

  it('derives that indent from the finder column and the panel\'s own gap', () => {
    // stated as arithmetic rather than as a number, so a change to the gap
    // fails here instead of drifting a pixel at a time
    const indent = px(headingRows[0], 'marginInlineStart');
    expect(indent).to.equal(110 + px(panel, 'columnGap'));
  });

  it('runs the rule to the panel\'s right edge', () => {
    const rule = headingRows[1].getBoundingClientRect().right;
    const content = panel.getBoundingClientRect().right - px(panel, 'paddingRight');
    expect(rule).to.be.closeTo(content, 0.5);
  });

  it('leaves the rows at the drawer\'s left edge below the desktop breakpoint', async () => {
    await setViewport({ width: 900, height: 900 });
    expect(px(headingRows[0], 'marginInlineStart')).to.equal(0);
  });

  it('keeps the glyph out of the mobile drawer, where the panel does not exist', async () => {
    // measured at 375 on the running instance: the drawer's labels start at
    // x 76, and an empty span left in the flow took each of them to 100
    await setViewport({ width: 375, height: 812 });
    const icon = document.querySelector('[data-tire-finder="vehicle"] .icon');
    expect(getComputedStyle(icon).display).to.equal('none');
  });

  it('draws each finder icon at live\'s 25px in the site\'s orange', () => {
    const icon = document.querySelector('[data-tire-finder="vehicle"] .icon');
    const cs = getComputedStyle(icon);
    expect(px(icon, 'width')).to.equal(25);
    expect(px(icon, 'height')).to.equal(25);
    expect(cs.backgroundColor, 'live fills the glyph rgb(255, 165, 0)').to.equal('rgb(255, 165, 0)');
    expect(cs.maskImage, 'the file paints through a mask, not an img').to.contain('vehicle.svg');
  });

  it('gives each search the file live draws beside it', () => {
    const masks = ['vehicle', 'tire-size', 'plate'].map((tab) => getComputedStyle(
      document.querySelector(`[data-tire-finder="${tab}"] .icon`),
    ).maskImage);
    expect(masks[0]).to.contain('vehicle.svg');
    expect(masks[1]).to.contain('tire-size.svg');
    expect(masks[2]).to.contain('license-plate.svg');
  });

  it('leaves the label its own row height, whatever the glyph is', () => {
    const rows = [...document.querySelectorAll('[data-tire-finder]')]
      .map((b) => b.closest('li').getBoundingClientRect().height);
    expect(new Set(rows.map((h) => Math.round(h * 10))).size, 'the three rows are level').to.equal(1);
  });
});

/**
 * The three glyphs are injected rather than authored. The DA edit canvas drops
 * an empty span on save, so an authored `:icon:` in that column disappears the
 * next time anyone edits the nav page, and `nav.plain.html` carries the three
 * labels as plain text today. Issue #237.
 */
describe('Header mega panel finder icons', () => {
  /** A finder trigger, as markFinderTriggers leaves it. */
  function trigger(tab, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.tireFinder = tab;
    button.textContent = label;
    return button;
  }

  it('gives each search the glyph live draws beside it', () => {
    const triggers = [trigger('vehicle', 'By Vehicle'), trigger('tire-size', 'By Tire Size'), trigger('plate', 'By Plate')];
    addFinderIcons(triggers);
    expect(triggers.map((t) => t.firstElementChild.className))
      .to.eql(['icon icon-vehicle', 'icon icon-tire-size', 'icon icon-license-plate']);
  });

  it('puts the glyph before the label, as live does', () => {
    const one = trigger('vehicle', 'By Vehicle');
    addFinderIcons([one]);
    expect(one.firstElementChild.classList.contains('icon')).to.be.true;
    expect(one.textContent.trim()).to.equal('By Vehicle');
  });

  it('leaves the span empty, so the mask paints it and no img is fetched', () => {
    const one = trigger('plate', 'By Plate');
    addFinderIcons([one]);
    expect(one.querySelector('.icon').childNodes.length).to.equal(0);
  });

  it('leaves a trigger it has no glyph for alone', () => {
    const other = trigger('rim-size', 'By Rim Size');
    addFinderIcons([other]);
    expect(!!other.querySelector('.icon')).to.be.false;
  });

  it('adds nothing a second time', () => {
    const one = trigger('vehicle', 'By Vehicle');
    addFinderIcons([one]);
    addFinderIcons([one]);
    expect(one.querySelectorAll('.icon').length).to.equal(1);
  });
});
