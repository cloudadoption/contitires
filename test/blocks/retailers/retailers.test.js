/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/retailers/retailers.js';

/**
 * Live's /online-retailers draws each retailer as a tile: its logo, linked to
 * the shop, over a Credit Card Financing link that opens the financing terms.
 * Read off continentaltire.com/online-retailers at 1440, 900, 768 and 375.
 * Issue #91.
 *
 * A row is a retailer: the first cell is the logo, linked to the shop, the
 * second the copy behind its financing link.
 */
const FINANCING = '<p>Finance your tire purchase with the Continental Tire Synchrony Car Care'
  + ' credit card.</p><ul><li>No Annual Fee*</li><li>$0 Fraud Liability</li></ul>'
  + '<p>Apply in-store or <a href="https://etail.mysynchrony.com/x">online</a>.</p>'
  + '<p><em>*For new accounts: Purchase APR is 29.99%.</em></p>';

/** A logo the browser sizes without a fetch, standing in for a real one. */
function png(w, h) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}'`
    + ` height='${h}'%3E%3Crect width='${w}' height='${h}' fill='%23333'/%3E%3C/svg%3E`;
}

const SAMPLE = [
  [
    `<a href="https://www.tirerack.com/x"><picture><img src="${png(250, 52)}" alt="Tire Rack" width="250" height="52"></picture></a>`,
    FINANCING,
  ],
  [
    `<a href="https://www.tires-easy.com/x"><picture><img src="${png(240, 100)}" alt="Tires Easy" width="240" height="100"></picture></a>`,
    FINANCING,
  ],
];

/** The tiles the block drew, not the list items inside a financing panel. */
function tiles(block) {
  return block.querySelectorAll(':scope > ul > li');
}

function buildRetailers(rows = SAMPLE) {
  document.body.innerHTML = `
    <main>
      <div class="section retailers-container">
        <div class="retailers-wrapper">
          <div class="retailers block" data-block-name="retailers">
            ${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}
          </div>
        </div>
      </div>
    </main>`;
  return document.querySelector('.retailers.block');
}

describe('Retailers block, what a row holds', () => {
  let block;
  beforeEach(() => { block = buildRetailers(); });

  it('makes one tile of each row', () => {
    decorate(block);
    expect(tiles(block)).to.have.length(2);
  });

  it('links the logo to the shop', () => {
    decorate(block);
    const links = block.querySelectorAll(':scope > ul > li a.retailers-logo');
    expect(links).to.have.length(2);
    expect(links[0].href).to.equal('https://www.tirerack.com/x');
    expect(links[0].querySelector('img'), 'the logo is inside the link').to.exist;
    expect(links[0].querySelector('img').alt, 'the link is named by the logo').to.equal('Tire Rack');
  });

  // an author can write the logo and the shop link as two things in the cell
  it('takes a logo the author did not link itself', () => {
    block = buildRetailers([[
      `<picture><img src="${png(250, 52)}" alt="Tire Rack" width="250" height="52"></picture>`
        + '<p><a href="https://www.tirerack.com/x">Shop Tire Rack</a></p>',
      FINANCING,
    ]]);
    decorate(block);
    const link = block.querySelector(':scope > ul > li a.retailers-logo');
    expect(link, 'the logo is linked').to.exist;
    expect(link.href).to.equal('https://www.tirerack.com/x');
    expect(link.querySelector('img')).to.exist;
  });

  it('draws a tile with no logo link, rather than dropping it', () => {
    block = buildRetailers([['<picture><img src="/x.png" alt="X"></picture>', FINANCING]]);
    decorate(block);
    expect(tiles(block)).to.have.length(1);
    const logo = block.querySelector(':scope > ul > li > .retailers-logo');
    expect(logo, 'the logo still stands in the tile\'s logo row').to.exist;
    expect(logo.tagName, 'as itself, not as a link to nowhere').to.equal('DIV');
    expect(logo.querySelector('picture')).to.exist;
  });

  it('ignores a row that holds nothing', () => {
    block = buildRetailers([[
      '<a href="/x"><picture><img src="/a.png" alt="A"></picture></a>', FINANCING,
    ], ['', '']]);
    decorate(block);
    expect(tiles(block)).to.have.length(1);
  });
});

describe('Retailers block, the financing disclosure', () => {
  let block;
  beforeEach(() => { block = buildRetailers(); });

  it('gives each tile a financing button that opens nothing yet', () => {
    decorate(block);
    const buttons = block.querySelectorAll('button.retailers-financing');
    expect(buttons).to.have.length(2);
    buttons.forEach((button) => {
      expect(button.type).to.equal('button');
      expect(button.textContent.trim().toLowerCase()).to.contain('credit card financing');
      expect(button.getAttribute('aria-expanded')).to.equal('false');
    });
  });

  it('points the button at the panel it opens, and hides the panel', () => {
    decorate(block);
    const button = block.querySelector('button.retailers-financing');
    const panel = block.querySelector('.retailers-panel');
    expect(panel.id, 'the panel is addressable').to.have.length.above(0);
    expect(button.getAttribute('aria-controls')).to.equal(panel.id);
    expect(panel.hasAttribute('hidden')).to.be.true;
  });

  it('keeps the financing copy the author wrote', () => {
    decorate(block);
    const panel = block.querySelector('.retailers-panel');
    expect(panel.textContent).to.contain('Synchrony Car Care');
    expect(panel.querySelectorAll('li')).to.have.length(2);
    expect(panel.querySelector('a').href).to.equal('https://etail.mysynchrony.com/x');
  });

  it('opens the panel when the button is pressed, and closes it again', () => {
    decorate(block);
    const button = block.querySelector('button.retailers-financing');
    const panel = block.querySelector('.retailers-panel');
    button.click();
    expect(button.getAttribute('aria-expanded')).to.equal('true');
    expect(panel.hasAttribute('hidden')).to.be.false;
    button.click();
    expect(button.getAttribute('aria-expanded')).to.equal('false');
    expect(panel.hasAttribute('hidden')).to.be.true;
  });

  it('opens one panel at a time', () => {
    decorate(block);
    const buttons = block.querySelectorAll('button.retailers-financing');
    const panels = block.querySelectorAll('.retailers-panel');
    buttons[0].click();
    buttons[1].click();
    expect(panels[0].hasAttribute('hidden'), 'the first closed').to.be.true;
    expect(panels[1].hasAttribute('hidden'), 'the second opened').to.be.false;
  });

  it('closes on Escape and hands focus back to the button', () => {
    decorate(block);
    const button = block.querySelector('button.retailers-financing');
    const panel = block.querySelector('.retailers-panel');
    button.click();
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(panel.hasAttribute('hidden')).to.be.true;
    expect(document.activeElement).to.equal(button);
  });

  it('closes when the page is clicked outside it', () => {
    decorate(block);
    const button = block.querySelector('button.retailers-financing');
    const panel = block.querySelector('.retailers-panel');
    button.click();
    document.querySelector('main').click();
    expect(panel.hasAttribute('hidden')).to.be.true;
  });

  it('closes on its own close button, and hands focus back', () => {
    decorate(block);
    const button = block.querySelector('button.retailers-financing');
    const panel = block.querySelector('.retailers-panel');
    button.click();
    const close = panel.querySelector('button.retailers-close');
    expect(close, 'the panel closes itself').to.exist;
    expect(close.getAttribute('aria-label')).to.have.length.above(0);
    close.click();
    expect(panel.hasAttribute('hidden')).to.be.true;
    expect(document.activeElement).to.equal(button);
  });

  it('draws no financing link on a row that carries no copy', () => {
    block = buildRetailers([['<a href="/x"><picture><img src="/a.png" alt="A"></picture></a>']]);
    decorate(block);
    expect(tiles(block)).to.have.length(1);
    expect(block.querySelector('button.retailers-financing')).to.not.exist;
  });
});

/**
 * Live's numbers. Three 250 tiles 40 apart, capped at 830 and centred, each a
 * 20/120/20 grid with a shadow and an 8px radius; two tiles 16 apart below
 * 769, on a 10/80/20 grid. The logo is contained, 100 tall at most and 80
 * below 769. The financing link reads 12 bold uppercase, 10 below 769. The
 * panel is a 350 white card, radius 10, padded 24 16 16.
 */
describe('Retailers block, live\'s measurements', () => {
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
    await adopt('/styles/styles.css', '/blocks/retailers/retailers.css');
    const stop = new CSSStyleSheet();
    await stop.replace('* { transition: none !important; animation: none !important }');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, stop];
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
  });

  beforeEach(() => {
    block = buildRetailers([...SAMPLE, [
      `<a href="https://simpletire.com/x"><picture><img src="${png(200, 100)}" alt="SimpleTire" width="200" height="100"></picture></a>`,
      FINANCING,
    ]]);
    decorate(block);
  });

  it('runs three 250 tiles 40 apart, capped at 830 and centred, at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = block.querySelector('ul');
    const drawn = [...tiles(block)];
    expect(Math.round(list.getBoundingClientRect().width)).to.equal(830);
    drawn.forEach((tile) => expect(Math.round(tile.getBoundingClientRect().width)).to.equal(250));
    expect(Math.round(drawn[1].getBoundingClientRect().left
      - drawn[0].getBoundingClientRect().right)).to.equal(40);
    const wrapper = block.closest('.section').firstElementChild.getBoundingClientRect();
    expect(Math.round(list.getBoundingClientRect().left - wrapper.left))
      .to.equal(Math.round(wrapper.right - list.getBoundingClientRect().right));
  });

  it('gives a tile live\'s shadow, radius and rows at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const [tile] = tiles(block);
    const styles = getComputedStyle(tile);
    expect(styles.boxShadow).to.equal('rgba(0, 0, 0, 0.1) 0px 0px 40px 0px');
    expect(styles.borderRadius).to.equal('8px');
    expect(styles.padding).to.equal('16px 18px');
    expect(styles.gridTemplateRows).to.equal('20px 120px 20px');
    expect(Math.round(tile.getBoundingClientRect().height)).to.equal(192);
  });

  it('contains the logo rather than cropping it, 100 tall at most', async () => {
    await setViewport({ width: 1440, height: 900 });
    const img = block.querySelector(':scope > ul > li img');
    const styles = getComputedStyle(img);
    expect(styles.objectFit).to.equal('contain');
    expect(styles.maxHeight).to.equal('100px');
    expect(styles.maxWidth).to.equal('100%');
  });

  it('sets the financing link at 12 bold uppercase, beside its mark', async () => {
    await setViewport({ width: 1440, height: 900 });
    const button = block.querySelector('button.retailers-financing');
    const styles = getComputedStyle(button);
    expect(styles.fontSize).to.equal('12px');
    expect(styles.fontWeight).to.equal('700');
    expect(styles.letterSpacing).to.equal('1.25px');
    expect(styles.textTransform).to.equal('uppercase');
    const icon = button.querySelector('.icon');
    expect(icon, 'live sets a credit card beside it').to.exist;
    expect(Math.round(icon.getBoundingClientRect().width)).to.equal(20);
    // live leaves 7.5 between the mark and the words, and 3 below 769
    expect(getComputedStyle(icon).marginInlineEnd).to.equal('7.5px');
    await setViewport({ width: 768, height: 900 });
    expect(getComputedStyle(icon).marginInlineEnd).to.equal('3px');
  });

  // a picture is inline, and its line box held the logo 5 above live's
  it('centres the logo in its row', async () => {
    await setViewport({ width: 1440, height: 900 });
    const link = block.querySelector('a.retailers-logo');
    const img = link.querySelector('img');
    const row = link.getBoundingClientRect();
    const logo = img.getBoundingClientRect();
    expect(Math.round(row.height), 'the logo takes the whole row').to.equal(120);
    expect(Math.round(logo.width), 'and holds it to the row\'s width').to.equal(214);
    expect(logo.top + logo.height / 2).to.be.closeTo(row.top + row.height / 2, 0.5);
    expect(Math.round(logo.top + logo.height / 2))
      .to.equal(Math.round(row.top + row.height / 2));
  });

  it('draws the open panel as a 350 white card at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    block.querySelector('button.retailers-financing').click();
    const panel = block.querySelector('.retailers-panel');
    const styles = getComputedStyle(panel);
    expect(styles.display, 'a hidden panel stays hidden').to.not.equal('none');
    expect(Math.round(panel.getBoundingClientRect().width)).to.equal(350);
    expect(styles.backgroundColor).to.equal('rgb(255, 255, 255)');
    expect(styles.borderRadius).to.equal('10px');
    expect(styles.padding).to.equal('24px 16px 16px');
    expect(styles.boxShadow).to.equal('rgba(0, 0, 0, 0.1) 0px 0px 40px 0px');
  });

  // live hangs the card off the link, not off the foot of the tile
  it('hangs the card 10 under the link that opened it', async () => {
    await setViewport({ width: 1440, height: 900 });
    const button = block.querySelector('button.retailers-financing');
    button.click();
    const panel = block.querySelector('.retailers-panel');
    expect(panel.getBoundingClientRect().top)
      .to.be.closeTo(button.getBoundingClientRect().bottom + 10, 0.5);
  });

  it('closes the card with live\'s ringed cross', async () => {
    await setViewport({ width: 1440, height: 900 });
    block.querySelector('button.retailers-financing').click();
    const close = block.querySelector('button.retailers-close');
    const box = close.getBoundingClientRect();
    expect(Math.round(box.width)).to.equal(16);
    expect(Math.round(box.height)).to.equal(16);
    expect(getComputedStyle(close).borderRadius, 'live rings it').to.equal('50%');
    expect(getComputedStyle(close).borderTopWidth).to.equal('1px');
  });

  it('keeps a closed panel out of the page', async () => {
    await setViewport({ width: 1440, height: 900 });
    const panel = block.querySelector('.retailers-panel');
    expect(getComputedStyle(panel).display).to.equal('none');
  });

  it('turns to two tiles 16 apart at 375, on live\'s shorter grid', async () => {
    await setViewport({ width: 375, height: 812 });
    const drawn = [...tiles(block)];
    const styles = getComputedStyle(drawn[0]);
    expect(Math.round(drawn[1].getBoundingClientRect().left
      - drawn[0].getBoundingClientRect().right)).to.equal(16);
    expect(Math.round(drawn[2].getBoundingClientRect().top))
      .to.be.above(Math.round(drawn[0].getBoundingClientRect().bottom));
    expect(styles.gridTemplateRows).to.equal('10px 80px 20px');
    expect(styles.padding).to.equal('4px 14px');
    expect(getComputedStyle(block.querySelector(':scope > ul > li img')).maxHeight).to.equal('80px');
  });

  // live pulls the link out past the tile at 375 so the words keep one line
  it('shrinks the financing link at 375 and keeps it on one line', async () => {
    await setViewport({ width: 375, height: 812 });
    const button = block.querySelector('button.retailers-financing');
    expect(getComputedStyle(button).fontSize).to.equal('8px');
    expect(getComputedStyle(button).marginInlineStart).to.equal('-15px');
    expect(Math.round(button.getBoundingClientRect().height)).to.equal(20);
  });

  it('holds the panel inside the page at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    block.querySelector('button.retailers-financing').click();
    const panel = block.querySelector('.retailers-panel');
    const box = panel.getBoundingClientRect();
    expect(Math.round(box.left)).to.be.at.least(0);
    expect(Math.round(box.right)).to.be.at.most(375);
  });
});
