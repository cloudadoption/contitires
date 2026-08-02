/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/cards/cards.js';

/**
 * One `highlights` variant covers two different live components, and the tile's
 * own image is what tells them apart.
 *
 * A tile holding a photograph is live's `tile`: transparent ground, #333 title.
 * A tile holding a drawn icon is live's `cards-carousel__item`: a #1d1d1d
 * ground under a white-stroked mark. Read off continentaltire.com on
 * 2026-08-02 at 1440 and 375:
 *
 *   /ev-compatible  Our Tires Are EV Compatible  band #333  tile rgb(29,29,29)
 *                                                icon 56x56  title 14/18 yellow
 *   /smart-choice   Total Confidence Plan        band transparent, tile
 *                                                transparent, title #333 18/26
 *
 * Ours painted both white. The three marks on /ev-compatible are single paths
 * at `fill="none" stroke="#fff"`, so on a white tile all three vanish and the
 * Noise card, whose mark is one such path and nothing else, renders as an empty
 * 590 by 332 box. Repainting the ground is what makes them visible again.
 *
 * The reach was read off all 327 published paths rather than guessed from the
 * variant name: six `cards highlights` rows exist, two sit in a `dark` section,
 * and only one of those two holds drawn icons. Widening this to every dark
 * highlights row would repaint /smart-choice's four photo tiles, which live
 * leaves on white. Issue #398.
 */
function build({ section = 'dark', icons = true } = {}) {
  const media = icons
    ? '<picture><img src="/ev-compatible/media_18b.svg?width=750&format=svg&optimize=medium" alt=""></picture>'
    : '<picture><img src="/smart-choice/media_146.jpg?width=750&format=jpg&optimize=medium" alt=""></picture>';
  const card = (name) => `
    <div>
      <div>${media}</div>
      <div><h3>${name}</h3><p>Body copy for the ${name} card.</p></div>
    </div>`;
  document.body.innerHTML = `
    <main><div class="${section} section cards-container">
      <div class="default-content-wrapper"><h2>Our Tires Are EV Compatible</h2></div>
      <div class="cards-wrapper"><div class="cards highlights block">
        ${['Weight', 'Noise', 'Range'].map(card).join('')}
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

const tile = (block) => block.querySelector(':scope > ul > li');
const body = (block) => block.querySelector('.cards-card-body');
const head = (block) => block.querySelector('.cards-card-body h3');

describe("Cards, live's dark ground under a drawn mark", () => {
  before(async () => {
    await adopt('/styles/styles.css', '/blocks/cards/cards.css');
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    document.adoptedStyleSheets = [];
  });

  it("paints the icon tile live's #1d1d1d instead of white", async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    expect(getComputedStyle(tile(block)).backgroundColor).to.equal('rgb(29, 29, 29)');
  });

  it('holds the ground at 375 too, where live paints the same tile', async () => {
    await setViewport({ width: 375, height: 900 });
    const block = build();
    expect(getComputedStyle(tile(block)).backgroundColor).to.equal('rgb(29, 29, 29)');
  });

  // #333 on #1d1d1d is 1.28 to 1. The ground and the text move together or the
  // repaint trades three invisible marks for a page of invisible copy.
  it('reads the name and the copy white on that ground', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    expect(getComputedStyle(head(block)).color, 'the name').to.equal('rgb(255, 255, 255)');
    expect(getComputedStyle(body(block)).color, 'the copy').to.equal('rgb(255, 255, 255)');
  });

  // /smart-choice's Total Confidence Plan row. Same variant, same `dark`
  // section, photographs rather than marks, and live leaves it on white.
  it('leaves a photo tile in the same dark section on white', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build({ icons: false });
    expect(getComputedStyle(tile(block)).backgroundColor).to.equal('rgb(255, 255, 255)');
    expect(getComputedStyle(head(block)).color).to.equal('rgb(51, 51, 51)');
  });

  // /ev-compatible's own Why Continental? row sits in a section with no style
  // class, and #245 owns it.
  it('leaves an icon tile outside a dark section on white', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build({ section: '' });
    expect(getComputedStyle(tile(block)).backgroundColor).to.equal('rgb(255, 255, 255)');
  });

  // the ground moves, the mark does not: live's stroke is white there too, so
  // recolouring the mark would diverge from live twice over
  it('leaves the mark itself alone', async () => {
    await setViewport({ width: 1440, height: 900 });
    const img = build().querySelector('img');
    expect(getComputedStyle(img).filter).to.equal('none');
  });
});
