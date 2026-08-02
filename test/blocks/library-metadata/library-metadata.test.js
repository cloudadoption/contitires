/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/library-metadata/library-metadata.js';

/*
 * The block library picker reads this block's rows out of the sample document's
 * own .plain.html, so the decorator's job is to do nothing and the stylesheet's
 * job is to keep the rows off the rendered page. Both were untested. (#125)
 *
 * test/tools/library.test.js already asserts that the two files are served,
 * which is the #285 half: the loader imports a JS and a CSS for every block it
 * decorates, and the sample pages logged a 404 and a failed import each without
 * them. What is asserted here is what the files then do.
 *
 * The display is read as a computed value on a mounted block rather than out of
 * cssRules, so the assertion sees what wins. The guard paragraph in the same
 * section is why: styles.css holds `body { display: none }` until `.appear`, and
 * an undisplayed page gives the block a 0 box for a reason that has nothing to
 * do with its own rule.
 */

/** The rows the picker reads, in the shape the pipeline delivers them. */
const ROWS = `<div><div>name</div><div>Cards</div></div>
  <div><div>description</div><div>Three cards in a row</div></div>
  <div><div>searchtags</div><div>cards, teaser</div></div>`;

function mount() {
  document.body.innerHTML = `<main>
      <div class="section" data-section-status="loaded">
        <div class="default-content-wrapper"><p id="guard">A paragraph beside it.</p></div>
        <div class="library-metadata block" data-block-name="library-metadata" data-block-status="loaded">${ROWS}</div>
      </div>
    </main>`;
  return document.querySelector('.library-metadata');
}

describe('Library metadata', () => {
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    sheets = await Promise.all(['/styles/styles.css', '/blocks/library-metadata/library-metadata.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
  });

  it('gives the loader a decorator to import', () => {
    expect(decorate).to.be.a('function');
  });

  it('leaves the authored rows exactly as delivered', () => {
    const block = mount();
    const before = block.innerHTML;
    decorate(block);
    expect(block.innerHTML, 'the picker reads this markup').to.equal(before);
  });

  it('reads nothing off the block it is handed', () => {
    expect(decorate.length, 'the decorator takes no argument').to.equal(0);
    expect(() => decorate()).to.not.throw();
  });

  it('keeps the rows out of view on the rendered page', () => {
    const block = mount();
    expect(document.querySelector('#guard').getBoundingClientRect().height, 'the page is rendered')
      .to.be.greaterThan(0);
    expect(getComputedStyle(block).display).to.equal('none');
    expect(block.getBoundingClientRect().height, 'the block takes no height').to.equal(0);
  });
});
