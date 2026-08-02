/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/cards/cards.js';

/**
 * The product name on /learn's `Product Highlights` row. Live sets it in a span
 * inside its `card__footer`, ours in an h3, and the two boxes differ. Read off
 * continentaltire.com/learn at 1440, 900 and 375 on 2026-08-02:
 *
 *   live   span, 18px/22px, weight 400, 0.25px tracking, height 22
 *   ours   h3,   16px/19.2px, weight 700, height 19.2 (20.2 on the card whose
 *          name carries a `sup`)
 *
 * The 16px comes from a rule shared by all six `cards highlights` rows on the
 * site, and live does not set one number across them. Censused at 1440 and 375
 * over every row:
 *
 *   /learn         Product Highlights           live's `card__footer` span 18/22
 *   /ev-compatible Why Continental?             live's `tile__title`      18/26
 *   /smart-choice  Start Smart                  live's `tile` strong      18/26
 *   /smart-choice  Total Confidence Plan        live's `tile__title`      18/26
 *   /ev-compatible Our Tires Are EV Compatible  live's carousel item      14/18
 *   /smart-choice  Premium Performance          live's carousel item      14/18
 *
 * So 22 belongs to /learn's row alone, and what marks that row out is the link
 * in the card body: it is the only one of the six whose cards carry one, the
 * `Tire details` link the rule below it already names. The two carousel rows
 * would move away from live at 18px, and the two `tile__title` rows want a 26
 * box nobody has taken a second reading on.
 *
 * The element stays an h3. Live carries no heading there, and dropping ours
 * would take a heading level out of the card. Weight is untouched for the same
 * reason the box below 22 is: #399 measured the box, not the weight, and live's
 * 400 on this one row is a separate reading. Issue #399.
 */
function build({ link = true } = {}) {
  const detail = link ? '<p><a href="/tires/extremecontact-dws06-plus">Tire details</a></p>' : '';
  const name = link
    ? '<h3><a href="/tires/extremecontact-dws06-plus">ExtremeContact DWS<sup>06 Plus</sup></a></h3>'
    : '<h3>Designed for Your Needs</h3>';
  document.body.innerHTML = `
    <main><div class="black section cards-container">
      <div class="default-content-wrapper"><h2>Product Highlights</h2></div>
      <div class="cards-wrapper"><div class="cards highlights block">
        <div>
          <div><picture><img src="./tire.jpg?width=750&format=jpg" alt="DWS06Plus"></picture></div>
          <div>${name}${detail}</div>
        </div>
      </div></div>
    </div></main>`;
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

const name = (block) => block.querySelector('.cards-card-body h3');

describe("Cards, the product name on live's highlight card", () => {
  before(async () => {
    await adopt('/styles/styles.css', '/blocks/cards/cards.css');
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    document.adoptedStyleSheets = [];
  });

  [1440, 900, 375].forEach((width) => {
    it(`sets the name at live's 18 over a 22 box at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      const styles = getComputedStyle(name(build()));
      expect(styles.fontSize, 'font-size').to.equal('18px');
      expect(styles.lineHeight, 'line box').to.equal('22px');
    });
  });

  // #399's table gives a rendered height as well as a line box, and the two did
  // not close together. The name is a link and the shared rule for the `Tire
  // details` link puts every link in this body at inline-flex, so the flex box
  // stood 1px past the heading's own line: 20.2 on a 19.2 box before, 23 on a
  // 22 box after the size moved. Live's span renders 22 on a 22 box.
  [1440, 375].forEach((width) => {
    it(`renders the name box at live's 22 at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      const box = name(build()).getBoundingClientRect();
      expect(Math.round(box.height * 10) / 10).to.equal(22);
    });
  });

  it('keeps the name a heading, where live carries none', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(name(build()).tagName).to.equal('H3');
  });

  // The five rows with no card link keep the number they render today: live
  // sets 18/26 on three of them and 14/18 on the two carousel rows, and neither
  // is 22.
  it('leaves a card with no link on the shared 16 over 19.2', async () => {
    await setViewport({ width: 1440, height: 900 });
    const styles = getComputedStyle(name(build({ link: false })));
    expect(styles.fontSize).to.equal('16px');
    expect(styles.lineHeight).to.equal('19.2px');
  });
});
