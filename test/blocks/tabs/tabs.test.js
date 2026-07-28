/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/tabs/tabs.js';

/**
 * Live's /media shows one panel at a time behind two tabs, and gives the logos
 * panel a sidebar down its right. Read off continentaltire.com/media at 1440,
 * 1024, 900, 768 and 375. Issue #100.
 *
 * A row is a tab: the first cell names it, the second is its panel, and an
 * optional third stands beside the panel.
 */
const SAMPLE = [
  [
    '<p>Logos</p>',
    '<h2>Continental Tire Logos</h2><div class="cards block"><div><div>a logo</div></div></div>',
    '<h2>Usage guidelines</h2><p>Our logo consists of the wordmark and the horse symbol.</p>'
      + '<ul><li>It is not allowed to distort the logo.</li></ul>'
      + '<p class="button-wrapper"><a class="button primary" href="/g">Download Guidelines</a></p>'
      + '<h2>Available formats</h2><p>Logos are available in the following formats:</p>',
  ],
  [
    '<p>Tires</p>',
    '<h2>Tire Images</h2><div class="cards block"><div><div>a tire</div></div></div>',
  ],
];

function buildTabs(rows = SAMPLE) {
  document.body.innerHTML = `
    <main>
      <div class="section tabs-container">
        <div class="tabs-wrapper">
          <div class="tabs block" data-block-name="tabs">
            ${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}
          </div>
        </div>
      </div>
    </main>`;
  return document.querySelector('.tabs.block');
}

/** The keydown a tab bar reads, from the tab that has focus. */
function press(key) {
  document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('Tabs block, the control', () => {
  let block;
  beforeEach(() => { block = buildTabs(); });

  it('makes one tab of each row, named by its first cell', () => {
    decorate(block);
    const tabs = block.querySelectorAll('[role="tab"]');
    expect(tabs).to.have.length(2);
    expect([...tabs].map((t) => t.textContent.trim())).to.eql(['Logos', 'Tires']);
  });

  it('stands the tabs in a tablist, as buttons that submit nothing', () => {
    decorate(block);
    const list = block.querySelector('[role="tablist"]');
    expect(list, 'a tablist').to.exist;
    [...block.querySelectorAll('[role="tab"]')].forEach((tab) => {
      expect(tab.tagName).to.equal('BUTTON');
      expect(tab.type).to.equal('button');
      expect(tab.parentElement).to.equal(list);
    });
  });

  it('opens on the first tab and shows only its panel', () => {
    decorate(block);
    const tabs = block.querySelectorAll('[role="tab"]');
    const panels = block.querySelectorAll('[role="tabpanel"]');
    expect(panels).to.have.length(2);
    expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
    expect(tabs[1].getAttribute('aria-selected')).to.equal('false');
    expect(panels[0].hasAttribute('hidden'), 'the first panel is shown').to.be.false;
    expect(panels[1].hasAttribute('hidden'), 'the second panel is hidden').to.be.true;
  });

  it('points each tab at its own panel, and each panel back at its tab', () => {
    decorate(block);
    const tabs = [...block.querySelectorAll('[role="tab"]')];
    const panels = [...block.querySelectorAll('[role="tabpanel"]')];
    expect(tabs).to.have.length(2);
    tabs.forEach((tab, i) => {
      expect(tab.id, 'the tab is addressable').to.have.length.above(0);
      expect(panels[i].id, 'the panel is addressable').to.have.length.above(0);
      expect(tab.getAttribute('aria-controls')).to.equal(panels[i].id);
      expect(panels[i].getAttribute('aria-labelledby')).to.equal(tab.id);
    });
  });

  it('leaves one stop in the tab order, on the selected tab', () => {
    decorate(block);
    const tabs = block.querySelectorAll('[role="tab"]');
    expect(tabs[0].tabIndex).to.equal(0);
    expect(tabs[1].tabIndex).to.equal(-1);
  });

  it('moves the selection when a tab is clicked', () => {
    decorate(block);
    const tabs = block.querySelectorAll('[role="tab"]');
    const panels = block.querySelectorAll('[role="tabpanel"]');
    tabs[1].click();
    expect(tabs[1].getAttribute('aria-selected')).to.equal('true');
    expect(tabs[0].getAttribute('aria-selected')).to.equal('false');
    expect(panels[1].hasAttribute('hidden')).to.be.false;
    expect(panels[0].hasAttribute('hidden')).to.be.true;
    expect(tabs[1].tabIndex).to.equal(0);
    expect(tabs[0].tabIndex).to.equal(-1);
  });

  // live's own tabs leave the unselected tab at tabindex -1 with no arrow
  // handling, so a keyboard never reaches the second one
  it('walks the tabs with the arrow keys, wrapping at each end', () => {
    decorate(block);
    const tabs = block.querySelectorAll('[role="tab"]');
    tabs[0].focus();
    press('ArrowRight');
    expect(document.activeElement).to.equal(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).to.equal('true');
    press('ArrowRight');
    expect(document.activeElement, 'wraps to the first').to.equal(tabs[0]);
    press('ArrowLeft');
    expect(document.activeElement, 'wraps back to the last').to.equal(tabs[1]);
  });

  it('goes to the first and last tab on Home and End', () => {
    decorate(block);
    const tabs = block.querySelectorAll('[role="tab"]');
    tabs[0].focus();
    press('End');
    expect(document.activeElement).to.equal(tabs[1]);
    press('Home');
    expect(document.activeElement).to.equal(tabs[0]);
  });
});

describe('Tabs block, what a row holds', () => {
  let block;
  beforeEach(() => { block = buildTabs(); });

  it('stands a third cell beside the panel', () => {
    decorate(block);
    const panels = block.querySelectorAll('[role="tabpanel"]');
    expect(panels[0].querySelector('.tabs-aside'), 'the logos panel has one').to.exist;
    expect(panels[0].querySelector('.tabs-aside h2').textContent).to.equal('Usage guidelines');
    expect(panels[1].querySelector('.tabs-aside'), 'the tires panel has none').to.not.exist;
  });

  it('keeps the panel content it was given', () => {
    decorate(block);
    const panels = block.querySelectorAll('[role="tabpanel"]');
    expect(panels[0].querySelector('.tabs-main h2').textContent).to.equal('Continental Tire Logos');
    expect(panels[0].querySelectorAll('.tabs-main .cards.block'), 'the cards survive').to.have.length(1);
    expect(panels[1].querySelector('.tabs-main h2').textContent).to.equal('Tire Images');
  });

  // a cell holding one paragraph is delivered as bare text, with no paragraph
  it('reads a label the pipeline delivered as bare text', () => {
    block = buildTabs([['Logos', '<p>one</p>'], ['Tires', '<p>two</p>']]);
    decorate(block);
    expect([...block.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim()))
      .to.eql(['Logos', 'Tires']);
  });

  it('ignores a row that names no tab', () => {
    block = buildTabs([['<p>Logos</p>', '<p>one</p>'], ['', '<p>orphan</p>']]);
    decorate(block);
    expect(block.querySelectorAll('[role="tab"]')).to.have.length(1);
    expect(block.querySelectorAll('[role="tabpanel"]')).to.have.length(1);
  });
});

/**
 * Live's numbers. The bar centres two 12/16 bold uppercase tabs 60 apart and
 * underlines the selected one with 5px of yellow. A panel is padded 80 over
 * and under at 769 and up, 38 below it. The logos panel runs a 310 sidebar
 * beside the rest with 100 between them, capped at 1015 and centred; below 769
 * the sidebar drops under the panel, 28 below it.
 */
describe('Tabs block, live\'s measurements', () => {
  let block;

  async function adopt(...paths) {
    const sheets = await Promise.all(paths.map(async (p) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(p)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
  }

  before(async () => {
    await adopt('/styles/styles.css', '/blocks/tabs/tabs.css');
    // the underline animates in, and a measurement mid-transition is noise
    const stop = new CSSStyleSheet();
    await stop.replace('* { transition: none !important }');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, stop];
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
  });

  beforeEach(() => {
    block = buildTabs();
    decorate(block);
  });

  it('sets the tabs at 12 over 16, 60 apart and centred, at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const tabs = block.querySelectorAll('[role="tab"]');
    const styles = getComputedStyle(tabs[0]);
    expect(styles.fontSize).to.equal('12px');
    expect(styles.lineHeight).to.equal('16px');
    expect(styles.fontWeight).to.equal('700');
    expect(styles.letterSpacing).to.equal('1.25px');
    expect(styles.textTransform).to.equal('uppercase');
    expect(styles.padding).to.equal('12px 0px');
    expect(Math.round(tabs[0].getBoundingClientRect().height)).to.equal(40);
    expect(Math.round(tabs[1].getBoundingClientRect().left
      - tabs[0].getBoundingClientRect().right)).to.equal(60);
    const list = block.querySelector('[role="tablist"]');
    const bar = list.getBoundingClientRect();
    expect(Math.round(tabs[0].getBoundingClientRect().left - bar.left))
      .to.equal(Math.round(bar.right - tabs[1].getBoundingClientRect().right));
  });

  it('underlines the selected tab with 5 of yellow, and no other', async () => {
    await setViewport({ width: 1440, height: 900 });
    const tabs = block.querySelectorAll('[role="tab"]');
    const selected = getComputedStyle(tabs[0], '::after');
    const rest = getComputedStyle(tabs[1], '::after');
    expect(selected.height).to.equal('5px');
    expect(selected.backgroundColor).to.equal('rgb(255, 165, 0)');
    expect(Math.round(parseFloat(selected.width)))
      .to.equal(Math.round(tabs[0].getBoundingClientRect().width));
    expect(rest.backgroundColor).to.equal('rgba(0, 0, 0, 0)');
    expect(Math.round(parseFloat(rest.width))).to.equal(0);
  });

  // a panel is a grid, and a grid outranks the hidden attribute's own display
  it('draws one panel at a time', async () => {
    await setViewport({ width: 1440, height: 900 });
    const panels = block.querySelectorAll('[role="tabpanel"]');
    expect(getComputedStyle(panels[0]).display).to.equal('grid');
    expect(getComputedStyle(panels[1]).display).to.equal('none');
  });

  // live opens the bar straight under the marquee above it
  it('stands the bar flush against what comes before it', async () => {
    await setViewport({ width: 1440, height: 900 });
    const section = block.closest('.section');
    expect(getComputedStyle(section).marginTop).to.equal('0px');
    expect(getComputedStyle(section).marginBottom).to.equal('0px');
  });

  it('runs a 310 sidebar beside the panel at 1440, 100 apart', async () => {
    await setViewport({ width: 1440, height: 900 });
    const panel = block.querySelector('[role="tabpanel"]');
    const main = panel.querySelector('.tabs-main');
    const aside = panel.querySelector('.tabs-aside');
    expect(Math.round(panel.getBoundingClientRect().width)).to.equal(1015);
    expect(Math.round(main.getBoundingClientRect().width)).to.equal(605);
    expect(Math.round(aside.getBoundingClientRect().width)).to.equal(310);
    expect(Math.round(aside.getBoundingClientRect().left
      - main.getBoundingClientRect().right)).to.equal(100);
    expect(getComputedStyle(panel).paddingTop).to.equal('80px');
    expect(getComputedStyle(panel).paddingBottom).to.equal('80px');
  });

  // the cap is the sidebar's; a panel without one takes the page container,
  // which this site measures 1200 wide
  it('gives a panel with no sidebar the whole container at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const tabs = block.querySelectorAll('[role="tab"]');
    tabs[1].click();
    const panel = block.querySelectorAll('[role="tabpanel"]')[1];
    const wrapper = block.closest('.section').firstElementChild;
    expect(Math.round(panel.getBoundingClientRect().width)).to.equal(1200);
    expect(Math.round(panel.getBoundingClientRect().width))
      .to.equal(Math.round(wrapper.getBoundingClientRect().width) - 64);
  });

  it('drops the sidebar under the panel at 375, 28 below it', async () => {
    await setViewport({ width: 375, height: 812 });
    const panel = block.querySelector('[role="tabpanel"]');
    const main = panel.querySelector('.tabs-main');
    const aside = panel.querySelector('.tabs-aside');
    expect(Math.round(aside.getBoundingClientRect().left))
      .to.equal(Math.round(main.getBoundingClientRect().left));
    expect(Math.round(aside.getBoundingClientRect().top
      - main.getBoundingClientRect().bottom)).to.equal(28);
    expect(getComputedStyle(panel).paddingTop).to.equal('38px');
  });

  it('centres the sidebar titles and fills its button at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    const title = block.querySelector('.tabs-aside h2');
    const wrapper = block.querySelector('.tabs-aside .button-wrapper');
    const button = wrapper.querySelector('a.button');
    expect(getComputedStyle(title).textAlign).to.equal('center');
    expect(Math.round(button.getBoundingClientRect().width))
      .to.equal(Math.round(wrapper.getBoundingClientRect().width));
  });

  it('titles a sidebar panel at 12 over a hairline, 28 clear of it', async () => {
    await setViewport({ width: 1440, height: 900 });
    const titles = block.querySelectorAll('.tabs-aside h2');
    const styles = getComputedStyle(titles[0]);
    expect(styles.fontSize).to.equal('12px');
    expect(styles.fontWeight).to.equal('700');
    expect(styles.letterSpacing).to.equal('1.25px');
    expect(styles.textTransform).to.equal('uppercase');
    expect(styles.borderTopWidth).to.equal('1px');
    expect(styles.borderTopColor).to.equal('rgb(205, 205, 205)');
    expect(styles.paddingTop).to.equal('28px');
    // the second title opens a panel of its own, 38 under what came before
    expect(getComputedStyle(titles[1]).marginTop).to.equal('38px');
  });

  it('sets the sidebar copy at 15 over 22 and marks its list', async () => {
    await setViewport({ width: 1440, height: 900 });
    const aside = block.querySelector('.tabs-aside');
    const item = aside.querySelector('li');
    expect(getComputedStyle(aside).fontSize).to.equal('15px');
    expect(getComputedStyle(aside).lineHeight).to.equal('22px');
    expect(getComputedStyle(aside.querySelector('ul')).listStyleType).to.equal('none');
    expect(getComputedStyle(item, '::before').backgroundImage).to.contain('svg');
  });

  it('sets the sidebar button 16 under the copy, yellow', async () => {
    await setViewport({ width: 1440, height: 900 });
    const wrapper = block.querySelector('.tabs-aside .button-wrapper');
    const button = wrapper.querySelector('a.button');
    expect(getComputedStyle(wrapper).marginTop).to.equal('16px');
    expect(getComputedStyle(button).backgroundColor).to.equal('rgb(255, 165, 0)');
    expect(Math.round(button.getBoundingClientRect().height)).to.equal(45);
  });
});
