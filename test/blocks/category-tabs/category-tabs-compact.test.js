/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/category-tabs/category-tabs.js';

/**
 * Live draws TWO different section strips with the same shape of markup, and
 * this block was built for the wrong one of them.
 *
 * The `/learn` family gets a full-width tab bar with a rule under it and the
 * current tab underlined, which is what the base styles draw and what those
 * five pages match. `/experience` gets something smaller: a row that shrinks to
 * its own content, centres in the container, carries NO rule and marks its
 * current item with nothing at all.
 *
 * Read off continentaltire.com/experience/sports and
 * continentaltire.com/experience/conti-crew at 1440 and 375 on 2026-07-30:
 *
 *   ul     273x41 at x=584 in a 1136 container, no bottom border
 *   li     margin-left 38px on every item but the first at 1440, 20px at 375
 *   a      display block, box-sizing border-box, padding 10px 0, 41px tall
 *   a      12px/16px weight 700, tracking 1.25px, uppercase, rgb(51,51,51)
 *
 * The anchor's computed height is 41px with 10px of padding each side, so its
 * content box is 21px rather than the 16px its own line-height reports. 21px is
 * what reproduces live's box, so that is what this variant sets.
 *
 * The one-item strip on /experience/conti-crew drops its bottom padding: its
 * anchor reads 37x31 inside the same 41px row.
 *
 * The base is NOT touched. Changing it to fit these pages would regress
 * /learn's five pages, which match live today. Issues #213, #251, #252.
 */
function buildStrip(labels, variants = 'compact') {
  document.body.innerHTML = `
    <main><div class="section category-tabs-container"><div class="category-tabs-wrapper">
      <div class="category-tabs ${variants} block"><div><div>
        <ul>${labels.map((l) => `<li><a href="${l.href}">${l.text}</a></li>`).join('')}</ul>
      </div></div></div>
    </div></div></main>`;
  const block = document.querySelector('.category-tabs');
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

const THREE = [
  { href: '/experience/partners', text: 'Partners' },
  { href: '/experience/sports', text: 'Sports' },
  { href: '/experience/conti-crew', text: 'Conti crew' },
];
const ONE = [{ href: '/experience/conti-crew', text: 'Crew' }];

describe("Category tabs, live's compact experience strip", () => {
  before(async () => {
    await adopt('/styles/styles.css', '/blocks/category-tabs/category-tabs.css');
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it('shrinks the row to its content and centres it', async () => {
    await setViewport({ width: 1440, height: 900 });
    const ul = buildStrip(THREE).querySelector('ul');
    const box = ul.getBoundingClientRect();
    const parent = ul.parentElement.getBoundingClientRect();
    expect(box.width, 'narrower than its container').to.be.lessThan(parent.width - 100);
    const lead = box.left - parent.left;
    const trail = parent.right - box.right;
    expect(Math.round(lead), 'centred in its container').to.be.closeTo(Math.round(trail), 1);
  });

  it('draws no rule under the row', async () => {
    await setViewport({ width: 1440, height: 900 });
    const ul = buildStrip(THREE).querySelector('ul');
    expect(getComputedStyle(ul).borderBottomWidth).to.equal('0px');
  });

  it("takes live's 41px row from a 10px padding over a 21px line", async () => {
    await setViewport({ width: 1440, height: 900 });
    const a = buildStrip(THREE).querySelector('a');
    const styles = getComputedStyle(a);
    expect(styles.paddingTop).to.equal('10px');
    expect(styles.paddingBottom).to.equal('10px');
    expect(styles.paddingLeft).to.equal('0px');
    expect(styles.paddingRight).to.equal('0px');
    expect(styles.lineHeight).to.equal('21px');
    expect(Math.round(a.getBoundingClientRect().height)).to.equal(41);
  });

  it('spaces the items 38 apart at 1440 and 20 at 375', async () => {
    await setViewport({ width: 1440, height: 900 });
    let items = buildStrip(THREE).querySelectorAll('li');
    expect(getComputedStyle(items[0]).marginLeft, 'first item flush').to.equal('0px');
    expect(getComputedStyle(items[1]).marginLeft).to.equal('38px');
    await setViewport({ width: 375, height: 812 });
    items = buildStrip(THREE).querySelectorAll('li');
    expect(getComputedStyle(items[1]).marginLeft).to.equal('20px');
  });

  it('marks the current item for a screen reader and draws nothing', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildStrip(THREE);
    const a = block.querySelector('a[href="/experience/sports"]');
    a.classList.add('category-tab-active');
    a.setAttribute('aria-current', 'page');
    const styles = getComputedStyle(a);
    expect(a.getAttribute('aria-current'), 'kept for assistive tech').to.equal('page');
    expect(styles.borderBottomWidth, 'live underlines nothing here').to.equal('0px');
    expect(styles.textDecorationLine).to.equal('none');
  });

  it('drops the bottom padding on a one-item strip', async () => {
    await setViewport({ width: 1440, height: 900 });
    const a = buildStrip(ONE).querySelector('a');
    expect(getComputedStyle(a).paddingBottom).to.equal('0px');
    expect(Math.round(a.getBoundingClientRect().height)).to.equal(31);
  });

  it('leaves the base strip alone for the learn family', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildStrip([
      { href: '/learn/tips', text: 'Tips' },
      { href: '/learn/technology', text: 'Technology' },
    ], '');
    const ul = block.querySelector('ul');
    const a = block.querySelector('a');
    expect(getComputedStyle(ul).borderBottomWidth, 'base keeps its rule').to.equal('1px');
    expect(getComputedStyle(a).paddingLeft, 'base keeps its side padding').to.equal('20px');
  });
});
