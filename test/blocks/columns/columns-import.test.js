/* eslint-disable no-unused-expressions */
/* global describe it after */

import { expect } from '@esm-bundle/chai';

/*
 * Importing the columns block must not read the viewport. (#125)
 *
 * columns.js evaluated `window.matchMedia('(width <= 768px)')` at module scope,
 * the same defect header.js carried and the same one footer.js carried. Six
 * files under test/blocks/columns/ import the module, and every page that
 * authors a plain two-column row loads it, so the read happened on pages that
 * have no product hero and never consult the query at all.
 *
 * product-hero-disclosure.test.js already drives the step, and it reaches the
 * subscription by spying on `MediaQueryList.prototype.addEventListener`. That
 * works around the import-time read rather than removing it: a spy sees the call
 * but cannot decide what the query answers, so the test has to move the real
 * viewport to change the outcome. With the query created on first use, a caller
 * can hand the block a query it drives, which is what the second test does.
 *
 * The import is dynamic, because a static one is hoisted above the spy, and a
 * module is evaluated once per page, so this file imports columns.js nowhere
 * else and the clean-import test is declared first. The query is kept after the
 * first call, so the decorate test is the only one here that runs decorate.
 */

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

/** A product hero with both trailing groups, the shape live collapses. */
const AUTHORED = `<div><div><p><picture><img src="/tire.png" alt="tire"></picture></p></div><div>
  <h1>CrossContact LX25</h1>
  <p><strong>Best for</strong></p>
  <ul><li>Crossover</li><li>Light Truck/SUV</li></ul>
  <p><strong>Technology</strong></p>
  <ul><li>EcoPlus</li><li>QuickView Indicators</li></ul>
</div></div>`;

const toggles = (block) => block.querySelectorAll('.product-hero-group-toggle');
const lists = (block) => [...block.querySelectorAll('.product-hero-best-for, .product-hero-technology')];

describe('Columns module, imported', () => {
  it('reads no media query before decorate runs', async () => {
    const real = window.matchMedia;
    const queries = [];
    window.matchMedia = function spy(query) {
      queries.push(query);
      return real.call(window, query);
    };

    try {
      const module = await import('../../../blocks/columns/columns.js');
      expect(typeof module.default, 'the block exports a decorator').to.equal('function');
    } finally {
      window.matchMedia = real;
    }

    expect(queries, 'media queries read at import time').to.eql([]);
  });
});

describe('Product hero, the step it subscribes to', () => {
  after(() => {
    document.body.innerHTML = '';
  });

  it('creates the query when decorate runs, and flips the groups when it fires', async () => {
    const real = window.matchMedia;
    const driver = fakeQuery(false);
    const asked = [];
    window.matchMedia = function stub(query) {
      asked.push(query);
      return driver.query;
    };

    let block;
    try {
      const { default: decorate } = await import('../../../blocks/columns/columns.js');
      document.body.innerHTML = `<div class="columns product-hero block">${AUTHORED}</div>`;
      block = document.querySelector('.columns.product-hero');
      decorate(block);
    } finally {
      window.matchMedia = real;
    }

    expect(asked, 'decorate reads one media query, its own').to.have.length(1);
    expect(asked[0], 'the query names live\'s 768 step').to.contain('768');

    expect(lists(block), 'the fixture has both trailing groups').to.have.length(2);
    expect(driver.subscriptions(), 'one change subscription').to.equal(1);
    expect(toggles(block), 'open to begin with').to.have.length(0);

    driver.change(true);
    expect(toggles(block), 'a control per group when the step fires').to.have.length(2);
    expect(lists(block).map((list) => list.hidden), 'both groups closed').to.eql([true, true]);

    driver.change(false);
    expect(toggles(block), 'no control above it').to.have.length(0);
    expect(lists(block).map((list) => list.hidden), 'both groups open').to.eql([false, false]);
  });
});
