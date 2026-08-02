/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';

/*
 * Importing the header must not read the viewport. (#125)
 *
 * header.js evaluated `window.matchMedia(DESKTOP_MEDIA_QUERY)` at module scope,
 * so the width the nav treats as desktop was captured the moment any test, or
 * any other block, imported the module. Four files under test/blocks/header/
 * import it for its pure helpers and pay that read; a test that wants to drive
 * the query itself has nowhere to stand, because the MediaQueryList already
 * exists by the time its first line runs.
 *
 * This is the block's half of the claim. The rest of the graph header.js pulls
 * in is not: scripts/scripts.js calls loadPage() at line 586, so importing any
 * block that reaches scripts.js decorates the test page. That is the
 * boilerplate's own entry point and no block-level change removes it.
 *
 * The import here is dynamic on purpose. A static import is hoisted above the
 * spy, and a module is evaluated once per page, so this file imports header.js
 * nowhere else.
 */

describe('Header module, imported', () => {
  it('reads no media query before decorate runs', async () => {
    const real = window.matchMedia;
    const queries = [];
    window.matchMedia = function spy(query) {
      queries.push(query);
      return real.call(window, query);
    };

    try {
      const module = await import('../../../blocks/header/header.js');
      expect(typeof module.default, 'the block exports a decorator').to.equal('function');
    } finally {
      window.matchMedia = real;
    }

    expect(queries, 'media queries read at import time').to.eql([]);
  });
});
