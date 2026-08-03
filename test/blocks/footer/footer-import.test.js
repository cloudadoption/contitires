/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/*
 * Importing the footer must not read the viewport, and the step it subscribes to
 * must be the one a caller can reach. (#125)
 *
 * footer.js evaluated `window.matchMedia('(width < 769px)')` at module scope, so
 * the MediaQueryList existed the moment anything imported the module. Six files
 * under test/blocks/footer/ import it, three of them for `buildFooterContent`
 * and `setFooterDisclosures` alone, and each paid that read on the way in.
 *
 * The cost is not a wrong `.matches`: a MediaQueryList is live, so the one built
 * at import reports the width correctly later. The cost is that nothing can
 * stand in for it. footer.js line 235 subscribes to `change` and flips the
 * disclosures when it fires, and no test asserted that, because a stub installed
 * before `decorate` was never consulted. The columns block has the same
 * assertion at test/blocks/columns/product-hero-disclosure.test.js, and this is
 * the footer's missing half.
 *
 * This mirrors test/blocks/header/header-import.test.js, which holds the same
 * claim for header.js. The rest of the graph footer.js pulls in is not asserted
 * here: scripts/scripts.js calls loadPage() at import, and no block-level change
 * removes the boilerplate's own entry point.
 *
 * Both imports below are dynamic. A static import is hoisted above the spy, and
 * a module is evaluated once per page, so this file imports footer.js nowhere
 * else and the clean-import test is declared first. The query is created on
 * first use and then kept, so the decorate test is the only one here that runs
 * decorate: a second would reuse the first one's stub.
 */

const FIXTURE = '/test/blocks/footer/mock-footer-columns';

/** A MediaQueryList a test drives itself, in place of the one the viewport gives. */
function fakeQuery(initial) {
  const handlers = [];
  const query = {
    matches: initial,
    addEventListener(event, handler) {
      if (event === 'change') handlers.push(handler);
    },
    removeEventListener() {},
  };
  return {
    query,
    subscriptions: () => handlers.length,
    change(matches) {
      query.matches = matches;
      handlers.forEach((handler) => handler.call(query, { matches }));
    },
  };
}

/** The lists of the plain link columns, the ones live collapses. */
const navLists = (block) => [...block.querySelectorAll('.footer-links-group ul')]
  .filter((ul) => !ul.querySelector('.icon'));

describe('Footer module, imported', () => {
  it('reads no media query before decorate runs', async () => {
    const real = window.matchMedia;
    const queries = [];
    window.matchMedia = function spy(query) {
      queries.push(query);
      return real.call(window, query);
    };

    try {
      const module = await import('../../../blocks/footer/footer.js');
      expect(typeof module.default, 'the block exports a decorator').to.equal('function');
    } finally {
      window.matchMedia = real;
    }

    expect(queries, 'media queries read at import time').to.eql([]);
  });
});

describe('Footer, the step it subscribes to', () => {
  before(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    const meta = document.createElement('meta');
    meta.name = 'footer';
    meta.content = FIXTURE;
    document.head.append(meta);
  });

  after(() => {
    document.head.querySelector('meta[name="footer"]')?.remove();
    document.body.innerHTML = '';
  });

  it('creates the query when decorate runs, and flips the columns when it fires', async () => {
    const real = window.matchMedia;
    const driver = fakeQuery(false);
    const asked = [];
    window.matchMedia = function stub(query) {
      asked.push(query);
      return driver.query;
    };

    let block;
    try {
      const { default: decorate } = await import('../../../blocks/footer/footer.js');
      document.body.innerHTML = '<footer><div class="footer block"></div></footer>';
      block = document.querySelector('.footer.block');
      await decorate(block);
    } finally {
      window.matchMedia = real;
    }

    expect(asked, 'decorate reads one media query, its own').to.have.length(1);
    expect(asked[0], 'the query names live\'s 769 step').to.contain('769');

    const links = block.querySelector('.footer-links');
    expect(links, 'the footer fixture decorated').to.exist;
    // the fixture's own count, so the assertion cannot drift from it. Four of the
    // five groups are plain link columns; the fifth carries icons and stays open.
    const columns = navLists(block).length;
    expect(columns, 'the fixture has plain link columns to collapse').to.be.at.least(4);
    expect(driver.subscriptions(), 'one change subscription').to.equal(1);
    expect(links.classList.contains('footer-links-stacked'), 'open to begin with').to.be.false;
    expect(block.querySelectorAll('.footer-links-toggle'), 'no control to begin with').to.have.length(0);

    driver.change(true);
    expect(links.classList.contains('footer-links-stacked'), 'stacked when the step fires').to.be.true;
    expect(block.querySelectorAll('.footer-links-toggle'), 'a control per plain column').to.have.length(columns);
    expect(navLists(block).filter((ul) => !ul.hidden), 'no plain column open').to.eql([]);

    driver.change(false);
    expect(links.classList.contains('footer-links-stacked'), 'open again above it').to.be.false;
    expect(block.querySelectorAll('.footer-links-toggle'), 'no control above it').to.have.length(0);
    expect(navLists(block).filter((ul) => ul.hidden), 'no plain column closed').to.eql([]);
  });
});
