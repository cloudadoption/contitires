/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/category-tabs/category-tabs.js';

/**
 * An inbound link built against live ends `#year2021`, and it has to land on the
 * 2021 section.
 *
 * Read on 2026-08-02. Live's /cruisingthecontinentalus tabs are
 * `href="#year2021"` and `href="#year2020"`, and live carries the id on the
 * SECTION rather than on the heading:
 *
 *   <section class="card-list card-list--single_leading" id="year2021">
 *     <div class="container"><h2 class="card-list__title">The 2021 …</h2>
 *
 * Ours point at the pipeline's generated heading ids,
 * `#the-2021-cruising-the-continental-us-road-trip` and its 2020 twin, so
 * neither `year2021` nor `year2020` resolves anywhere on the page.
 *
 * The fix aliases live's fragment onto the section the tab already targets,
 * which leaves the generated ids working for our own tabs. Issue #491.
 */
describe('Category tabs, live\'s year fragments', () => {
  /** The published page: a jump row over two year sections. */
  function crossingPage() {
    document.body.innerHTML = `
      <main>
        <div class="section category-tabs-container">
          <div class="category-tabs-wrapper">
            <div class="category-tabs jump block"><div><div><ul>
              <li><a href="#the-2021-cruising-the-continental-us-road-trip">2021</a></li>
              <li><a href="#the-2020-cruising-the-continental-us-road-trip">2020</a></li>
            </ul></div></div></div>
          </div>
        </div>
        <div class="section dark">
          <div class="default-content-wrapper">
            <h2 id="the-2021-cruising-the-continental-us-road-trip">The 2021 Cruising the Continental U.S. Road Trip!</h2>
          </div>
        </div>
        <div class="section dark">
          <div class="default-content-wrapper">
            <h2 id="the-2020-cruising-the-continental-us-road-trip">The 2020 Cruising the Continental U.S. Road Trip!</h2>
          </div>
        </div>
      </main>`;
    return document.querySelector('.category-tabs.block');
  }

  beforeEach(() => { document.body.innerHTML = ''; });

  it('resolves live\'s two fragments', () => {
    decorate(crossingPage());
    expect(document.getElementById('year2021'), '#year2021 lands somewhere').to.exist;
    expect(document.getElementById('year2020'), '#year2020 lands somewhere').to.exist;
  });

  it('lands each one on the section holding that year', () => {
    decorate(crossingPage());
    ['2021', '2020'].forEach((year) => {
      const target = document.getElementById(`year${year}`);
      expect(target.classList.contains('section'), `year${year} is on the section, as live's is`).to.be.true;
      expect(target.querySelector('h2').textContent, `year${year} holds the ${year} heading`).to.contain(year);
    });
  });

  it('leaves the generated heading ids alone, so our own tabs keep working', () => {
    const block = decorate(crossingPage());
    expect(document.getElementById('the-2021-cruising-the-continental-us-road-trip'), 'the generated id').to.exist;
    const hrefs = [...document.querySelectorAll('.category-tabs a')].map((a) => a.getAttribute('href'));
    expect(hrefs, 'the authored anchors are untouched').to.deep.equal([
      '#the-2021-cruising-the-continental-us-road-trip',
      '#the-2020-cruising-the-continental-us-road-trip',
    ]);
    expect(block, 'decorate returns nothing, as before').to.be.undefined;
  });

  it('aliases nothing outside the jump variant', () => {
    document.body.innerHTML = `
      <main>
        <div class="section category-tabs-container"><div class="category-tabs-wrapper">
          <div class="category-tabs block"><div><div><ul>
            <li><a href="#the-2021-cruising-the-continental-us-road-trip">2021</a></li>
          </ul></div></div></div>
        </div></div>
        <div class="section"><div class="default-content-wrapper">
          <h2 id="the-2021-cruising-the-continental-us-road-trip">The 2021 …</h2>
        </div></div>
      </main>`;
    decorate(document.querySelector('.category-tabs.block'));
    expect(document.getElementById('year2021') === null, 'the base strip is a row of pages').to.be.true;
  });

  it('aliases nothing for a label that is not a year', () => {
    document.body.innerHTML = `
      <main>
        <div class="section category-tabs-container"><div class="category-tabs-wrapper">
          <div class="category-tabs jump block"><div><div><ul>
            <li><a href="#tire-tips">Tire tips</a></li>
            <li><a href="/learn/technology">Technology</a></li>
          </ul></div></div></div>
        </div></div>
        <div class="section"><div class="default-content-wrapper">
          <h2 id="tire-tips">Tire tips</h2>
        </div></div>
      </main>`;
    decorate(document.querySelector('.category-tabs.block'));
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(ids.some((id) => id.startsWith('year')), 'no year alias for a worded tab').to.be.false;
  });

  it('leaves a section that already carries an id alone', () => {
    document.body.innerHTML = `
      <main>
        <div class="section category-tabs-container"><div class="category-tabs-wrapper">
          <div class="category-tabs jump block"><div><div><ul>
            <li><a href="#h">2021</a></li>
          </ul></div></div></div>
        </div></div>
        <div class="section" id="already-named"><div class="default-content-wrapper">
          <h2 id="h">The 2021 …</h2>
        </div></div>
      </main>`;
    decorate(document.querySelector('.category-tabs.block'));
    expect(document.querySelector('.section[id="already-named"]'), 'the authored id survives').to.exist;
    expect(document.getElementById('year2021') === null, 'and no alias overwrites it').to.be.true;
  });

  it('survives a tab pointing at nothing', () => {
    document.body.innerHTML = `
      <main><div class="section category-tabs-container"><div class="category-tabs-wrapper">
        <div class="category-tabs jump block"><div><div><ul>
          <li><a href="#year1999-missing">2021</a></li>
        </ul></div></div></div>
      </div></div></main>`;
    const block = document.querySelector('.category-tabs.block');
    expect(() => decorate(block), 'a dangling fragment is not a crash').to.not.throw();
  });
});
