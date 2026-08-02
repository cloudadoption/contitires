/* eslint-disable no-unused-expressions */
/* global describe it before beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';
import decorateRelated from '../../blocks/related-articles/related-articles.js';

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

    expect(!!main.querySelector('.share')).to.be.false;
  });

  it('adds one share block, however often the page is decorated', () => {
    const main = buildArticle();
    decorateMain(main);
    decorateMain(main);

    expect(main.querySelectorAll('.share')).to.have.length(1);
  });

  // fragment.js runs decorateMain over each fragment it loads, and the header
  // loads the nav that way. Without this the nav grew a share row of its own
  // on every article page.
  it('leaves a fragment alone, even on an article page', () => {
    const page = buildArticle();
    const fragment = document.createElement('main');
    fragment.innerHTML = `
      <div><p>Brand</p></div>
      <div><p>Menu</p></div>`;
    decorateMain(fragment);

    expect(!!fragment.querySelector('.share')).to.be.false;
    expect(!!page.querySelector('.share')).to.be.false;
  });

  it('keeps an authored related list in the same section as the share block', () => {
    const main = buildArticle({ related: true });
    decorateMain(main);

    const related = main.querySelector('.related-articles');
    expect(related).to.exist;
    expect(related.closest('.section')).to.equal(main.querySelector('.share').closest('.section'));
  });

  // #193: two wrappers meant two grid rows, and row 1 held the whole body, so
  // the list fell to the foot of the article. One wrapper is one grid item.
  it('puts the sharebar and the related list in one sidebar element', () => {
    const main = buildArticle({ related: true });
    decorateMain(main);

    const share = main.querySelector('.share');
    const related = main.querySelector('.related-articles');
    expect(related.parentElement, 'one wrapper holds both').to.equal(share.parentElement);
    // live reads the sharebar first, then the list under it, at every width
    expect(share.nextElementSibling, 'sharebar first').to.equal(related);
    expect(main.querySelectorAll('.related-articles-wrapper'), 'no wrapper of its own')
      .to.have.length(1);
  });

  // decorateBlocks reads `div.section > div > div`, so both blocks have to
  // stay one level under the section for their JS and CSS to load at all
  it('leaves both sidebar blocks where decorateBlocks reads them', () => {
    const main = buildArticle({ related: true });
    decorateMain(main);

    ['.share', '.related-articles'].forEach((sel) => {
      const block = main.querySelector(sel);
      expect(block.classList.contains('block'), `${sel} decorated`).to.be.true;
      expect(block.parentElement.parentElement, `${sel} depth`)
        .to.equal(block.closest('.section'));
    });
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

  // 755px is the column live caps at, not the column it always draws: below
  // 1136px of grid the column takes what is left beside the sidebar. See
  // article-column.test.js for the widths it lands on. (#190)
  it("sets the body beside a 300px sidebar at live's 769", () => {
    expect(value(BODY, 'grid-template-columns', '769px')).to.equal('minmax(0px, 755px) 300px');
    expect(value(BODY, 'gap', '769px')).to.equal('45px');
  });

  it('holds the reading column to live\'s measure inside its own column', () => {
    expect(value(`${BODY} .default-content-wrapper`, 'max-width', '769px')).to.equal('74%');
    expect(value(`${BODY} > *`, 'grid-column', '769px')).to.equal('1');
  });

  // a block authored inside the article splits the body into several wrappers,
  // so the reading column takes each of them in turn rather than the first one
  it('gives the reading column every wrapper the sidebar does not', () => {
    expect(value(`${BODY} > *`, 'grid-column', '769px')).to.equal('1');
    expect(value(BODY, 'grid-auto-rows', '769px')).to.equal('auto');
    expect(value(BODY, 'grid-template-rows', '769px')).to.equal(null);
  });

  // the sidebar is one grid item beside the top of the body, so the list it
  // holds cannot land in a row of its own below the article (#193)
  it('puts the whole sidebar in the row the body starts in', () => {
    expect(value(`${BODY} .share-wrapper`, 'grid-column', '769px')).to.equal('2');
    expect(value(`${BODY} .share-wrapper`, 'grid-row', '769px')).to.equal('1');
    expect(value(`${BODY} .share-wrapper`, 'align-self', '769px')).to.equal('start');
    expect(value(`${BODY} .related-articles-wrapper`, 'grid-row', '769px')).to.equal(null);
  });

  it('runs one column on a narrow screen, sidebar under the body', () => {
    expect(value(BODY, 'grid-template-columns')).to.equal('1fr');
  });

  it('marks the related links with live\'s gold bullet', () => {
    expect(value(`${BODY} .related-articles-list li`, 'list-style-type')).to.equal('disc');
    expect(value(`${BODY} .related-articles-list li::marker`, 'color')).to.equal('var(--conti-yellow)');
  });
});

/**
 * The sidebar's own internal spacing. Live's sharebar is a 45px row,
 * `.sharebar { height: var(--space-45) }` over border-box, so its 1px rules and
 * 8px padding come out of the 45. Its related list is a `.panel`, and
 * `.panel { padding-top: var(--space-28) }` opens 28px above the title at every
 * width, which `.news-article__related` takes to 38 below 769.
 *
 * Ours drops the lower rule and the lower padding, which live keeps, so the row
 * measured 33: 1px of rule, 8px of padding and share.css's 24px floor. And the
 * list had no padding of its own. Together the title read 43px higher than
 * live's, measured from the top of the sharebar. Read off
 * continentaltire.com/learn/how-do-i-check-my-tire-pressure. (#204)
 */
describe('Article sidebar spacing', () => {
  let adopted;

  const box = (sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
  };

  before(async () => {
    adopted = document.adoptedStyleSheets;
    const sheets = await Promise.all(['/styles/styles.css', '/blocks/share/share.css',
      '/blocks/related-articles/related-articles.css', '/styles/article.css'].map(async (href) => {
      const s = new CSSStyleSheet();
      await s.replace(await (await fetch(href)).text());
      return s;
    }));
    document.adoptedStyleSheets = [...adopted, ...sheets];
    document.body.classList.add('article', 'appear');

    const main = buildArticle({ related: true });
    decorateMain(main);
    decorateRelated(main.querySelector('.related-articles'));
    main.querySelectorAll('.section').forEach((s) => {
      s.dataset.sectionStatus = 'loaded';
      s.style.display = null;
    });
  });

  after(async () => {
    document.adoptedStyleSheets = adopted;
    document.body.classList.remove('article', 'appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  // live keeps the bar 45 at every width, so this is not a breakpoint of ours
  [1440, 900, 768, 375].forEach((vw) => {
    it(`draws live's 45px sharebar at ${vw}`, async () => {
      await setViewport({ width: vw, height: 900 });
      expect(box('.share').height, `share height at ${vw}`).to.equal(45);
    });
  });

  it("pads the related list on live's 28 beside the body", async () => {
    await setViewport({ width: 1440, height: 900 });
    const related = document.querySelector('.related-articles');
    expect(getComputedStyle(related).paddingTop, 'panel padding').to.equal('28px');
    expect(box('.related-articles').top - box('.share').bottom, 'list follows the bar flush')
      .to.equal(0);
    // live reads 76 here. The last 3px is live's own `.panel__title`, an
    // inline-flex box on a line box taller than itself; ours is a block
    // heading, and its 12/14.4 against live's 12/16 is recorded under #373.
    expect(box('.related-articles-title').top - box('.share').top, 'bar top to title top')
      .to.equal(73);
  });

  it('opens it to 38 where the sidebar follows the body', async () => {
    await setViewport({ width: 768, height: 900 });
    const related = document.querySelector('.related-articles');
    expect(getComputedStyle(related).paddingTop, 'panel padding').to.equal('38px');
    // live reads 86, the same 3px apart
    expect(box('.related-articles-title').top - box('.share').top, 'bar top to title top')
      .to.equal(83);
  });
});

describe('Share row layout', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/share/share.css')).text());
  });

  /** The value a property takes in the rule for `selector`. */
  function value(selector, prop) {
    const rule = [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule))
      .reverse().find((r) => r.selectorText === selector && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  // the block is empty until its own JS runs, so the row grows from nothing to
  // its settled height and everything below it moves
  it('reserves the row so the page does not jump when the block loads', () => {
    expect(value('.share', 'min-height')).to.equal('24px');
  });

  // Lighthouse fails target-size on each control: 20px by 20px against the
  // 24px minimum. The row now sits on 214 article pages, not 2 experience ones.
  it('gives each control a 24px touch target', () => {
    expect(value('.share a', 'min-width')).to.equal('24px');
    expect(value('.share a', 'min-height')).to.equal('24px');
    expect(value('.share button', 'min-width')).to.equal('24px');
    expect(value('.share button', 'min-height')).to.equal('24px');
  });

  // live groups the two social icons at the left of the row and the two
  // controls that act on this page at the right, on articles and experience
  // pages alike
  it('pushes the page controls to the far end of the row', () => {
    const rule = [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule))
      .find((r) => r.selectorText === '.share li:nth-child(2)');
    expect(rule).to.exist;
    expect(rule.style.getPropertyValue('margin-inline-end').trim()).to.equal('auto');
  });
});
