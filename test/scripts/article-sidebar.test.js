/* eslint-disable no-unused-expressions */
/* global describe it before beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { decorateMain } from '../../scripts/scripts.js';

/** An article as authored: a title section, a body section, then metadata. */
function buildArticle({ related = false } = {}) {
  const main = document.createElement('main');
  main.innerHTML = `
    <div><h1>Inspiring Confidence</h1></div>
    <div>
      <p><img src="/learn/hero.png" alt="Inspiring Confidence"></p>
      <p>Continental Tire has been inspiring confidence for 150 years.</p>
      ${related ? `<div class="related-articles">
        <div><div><ul><li><a href="/learn/a">A</a></li></ul></div></div>
      </div>` : ''}
    </div>`;
  document.body.replaceChildren(main);
  return main;
}

// Live's articles put a sharebar, and on 75 of 217 pages a curated Related
// articles list, in a 300px sidebar beside the body. Every article gets the
// sharebar, so it is auto-blocked rather than authored 217 times.
describe('Article sidebar', () => {
  beforeEach(() => document.body.classList.add('article'));
  afterEach(() => {
    document.body.classList.remove('article');
    document.body.replaceChildren();
  });

  it('gives every article a share block', () => {
    const main = buildArticle();
    decorateMain(main);

    const share = main.querySelector('.share');
    expect(share).to.exist;
    // it belongs to the body section, beside the copy, not to the title
    expect(share.closest('.section')).to.equal(main.querySelectorAll('.section')[1]);
  });

  it('leaves the share block out of a page that is not an article', () => {
    document.body.classList.remove('article');
    const main = buildArticle();
    decorateMain(main);

    expect(main.querySelector('.share')).to.not.exist;
  });

  it('adds one share block, however often the page is decorated', () => {
    const main = buildArticle();
    decorateMain(main);
    decorateMain(main);

    expect(main.querySelectorAll('.share')).to.have.length(1);
  });

  it('keeps an authored related list in the same section as the share block', () => {
    const main = buildArticle({ related: true });
    decorateMain(main);

    const related = main.querySelector('.related-articles');
    expect(related).to.exist;
    expect(related.closest('.section')).to.equal(main.querySelector('.share').closest('.section'));
  });
});

describe('Article layout', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/article.css')).text());
  });

  /** The value a property takes in the rule for `selector`, at `media`. */
  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  const BODY = 'body.article main .section:has(.share-wrapper)';

  it("sets the body beside a 300px sidebar at live's 769", () => {
    expect(value(BODY, 'grid-template-columns', '769px')).to.equal('755px 300px');
    expect(value(BODY, 'gap', '769px')).to.equal('45px');
  });

  it('holds the reading column to live\'s measure inside its own column', () => {
    expect(value(`${BODY} .default-content-wrapper`, 'max-width', '769px')).to.equal('559px');
    expect(value(`${BODY} .default-content-wrapper`, 'grid-column', '769px')).to.equal('1');
  });

  // the body spans every row, so without explicit rows the first one stretches
  // to the body's full height and the related list lands past the end of it
  it('holds the sidebar to the top of the body column', () => {
    expect(value(BODY, 'grid-template-rows', '769px')).to.equal('auto auto 1fr');
  });

  it('stacks the sharebar over the related list in the sidebar', () => {
    expect(value(`${BODY} .share-wrapper`, 'grid-column', '769px')).to.equal('2');
    expect(value(`${BODY} .share-wrapper`, 'grid-row', '769px')).to.equal('1');
    expect(value(`${BODY} .related-articles-wrapper`, 'grid-column', '769px')).to.equal('2');
    expect(value(`${BODY} .related-articles-wrapper`, 'grid-row', '769px')).to.equal('2');
  });

  it('runs one column on a narrow screen, sidebar under the body', () => {
    expect(value(BODY, 'grid-template-columns')).to.equal('1fr');
  });
});
