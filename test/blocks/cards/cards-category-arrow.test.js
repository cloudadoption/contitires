/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/cards/cards.js';

/**
 * The homepage category tile draws a right arrow under its title. Read off
 * continentaltire.com/ at 1440, 1200, 900, 769, 768 and 375 on 2026-08-02:
 *
 *   title   30px/38px above 768 and 24px/38px below, text-decoration none
 *   arrow   `.tire-category-card__title .icon` at display block and font-size
 *           18px, holding an `arrow-right-outline` svg at 1em by 1em, so an 18
 *           by 18 box at every one of those widths
 *   place   left edge 0 from the title's own, top 34 below it on a one-line
 *           title and 72 on a two-line one. It takes a line of its own in all
 *           three tiles, whatever the title length
 *
 * Ours drew an 8px chevron from two rotated borders at inline-block with a 10px
 * start margin, so it shared the last text line when the title left room and
 * dropped below when it did not. At 1440 "Light Truck / SUV Tires" had it beside
 * the second line and the other two had it under; at 769 all three had it
 * beside. The placement moved with the text. Issue #236.
 */
const TITLES = ['Passenger Tires', 'Crossover Tires', 'Light Truck / SUV Tires'];

function build() {
  const card = (name) => `
    <div>
      <div><picture><img src="./tire.png" alt="${name}"></picture></div>
      <div><h2><a href="/tires/${name.split(' ')[0].toLowerCase()}">${name}</a></h2></div>
    </div>`;
  document.body.innerHTML = `
    <main><div class="section cards-container"><div class="cards-wrapper">
      <div class="cards category block">${TITLES.map(card).join('')}</div>
    </div></div></main>`;
  const block = document.querySelector('.cards');
  decorate(block);
  return block;
}

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

const links = (block) => [...block.querySelectorAll('.cards-card-body a')];

/** The link's fragments, one per line it occupies, empty ones dropped. */
const rows = (a) => [...a.getClientRects()].filter((r) => r.width > 0 && r.height > 0);

describe("Cards, live's arrow under a category tile title", () => {
  before(async () => {
    await adopt('/styles/styles.css', '/blocks/cards/cards.css');
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    document.adoptedStyleSheets = [];
  });

  it("draws live's 18 by 18 arrow, not an 8px chevron", async () => {
    await setViewport({ width: 1440, height: 900 });
    links(build()).forEach((a) => {
      const after = getComputedStyle(a, '::after');
      expect(after.width, a.textContent).to.equal('18px');
      expect(after.height, a.textContent).to.equal('18px');
    });
  });

  // the chevron was two rotated borders, so it carried no mark of its own
  it('draws a right arrow rather than a rotated corner', async () => {
    await setViewport({ width: 1440, height: 900 });
    const after = getComputedStyle(links(build())[0], '::after');
    expect(after.maskImage).to.contain('arrow-right.svg');
    expect(after.transform, 'no rotation').to.equal('none');
  });

  // The arrow's line carries the arrow and no text, so its box is 18 tall where
  // a shared line is the title's own 30 at 1440 and 28 at 375. That is the
  // measurement that separates live's placement from ours.
  [1440, 900, 769, 375].forEach((width) => {
    it(`holds the arrow on a line of its own at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      links(build()).forEach((a, i) => {
        const fragments = rows(a);
        const arrow = fragments[fragments.length - 1];
        expect(fragments.length, `${TITLES[i]}: a line for the text and one under it`)
          .to.be.greaterThan(1);
        expect(Math.round(arrow.height), `${TITLES[i]}: the arrow's line`).to.equal(18);
      });
    });
  });

  it("starts the arrow at the title's own left edge", async () => {
    await setViewport({ width: 1440, height: 900 });
    links(build()).forEach((a, i) => {
      const fragments = rows(a);
      const arrow = fragments[fragments.length - 1];
      expect(Math.round(arrow.left - fragments[0].left), TITLES[i]).to.equal(0);
      expect(arrow.top, `${TITLES[i]}: under the text, not beside it`)
        .to.be.at.least(fragments[fragments.length - 2].bottom);
    });
  });

  // The third claim in #236 was an underline on the title. It did not
  // reproduce. Live reads `none` on `.tire-category-card__title`, and the rule
  // in styles.css that drops the underline for a heading link inside a cards
  // block already reaches this one. Held here so it stays dropped.
  it('carries no underline, the way live carries none', async () => {
    await setViewport({ width: 1440, height: 900 });
    links(build()).forEach((a) => {
      expect(getComputedStyle(a).textDecorationLine, a.textContent).to.equal('none');
    });
  });
});
