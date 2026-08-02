/* eslint-disable no-unused-expressions */
/* global describe it before afterEach after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { loadsFontsEagerly } from '../../scripts/scripts.js';

/**
 * When the eager phase requests fonts.css, which decides whether a page paints
 * in Stag or paints in the fallback and changes into Stag afterwards.
 *
 * The condition read `window.innerWidth >= 900 || sessionStorage.getItem(
 * 'fonts-loaded')`. Below 900 that gave one URL at one width two paint
 * profiles, and the tab's history picked which: a fresh tab has no flag and
 * takes fonts in the lazy phase, a tab that had already shown a page has the
 * flag and takes them eagerly. Measured on #511 at FCP + 1155ms against
 * FCP - 2ms, 1.76 seconds apart across the three Stag faces.
 *
 * THE FLAG TERM IS THE DEFECT AND THE WIDTH TERM IS NOT. A width proxy for
 * connection speed is a choice somebody can argue with. A flag that makes the
 * same page at the same width paint two ways depending on what the visitor
 * opened before it is not. So the flag stops being READ here and goes on being
 * WRITTEN by `loadFonts`, which `loadLazy` still calls unconditionally.
 *
 * Whether the width proxy should exist at all stays open on #511. Removing it
 * as well would load fonts eagerly on every mobile view and the LCP cost of
 * that is unmeasured, and two changes under one gate cannot be told apart.
 *
 * The 900 goes to 769, which is where AGENTS.md puts this project's step
 * against live's 768 pivot. It is the fifth boilerplate 900 found this watch,
 * after three in `perfect-fit.css` and one in `hero.css`. Issue #511.
 */
describe('The eager phase\'s font decision (#511)', () => {
  const FLAG = 'fonts-loaded';

  /** Reads the decision at a width, with the flag in a known state. */
  async function at(width, flag) {
    await setViewport({ width, height: 900 });
    if (flag) sessionStorage.setItem(FLAG, 'true');
    else sessionStorage.removeItem(FLAG);
    return loadsFontsEagerly();
  }

  before(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
  });

  afterEach(() => {
    sessionStorage.removeItem(FLAG);
  });

  after(async () => {
    await setViewport({ width: 1440, height: 900 });
  });

  describe('the width term, at the project\'s own step', () => {
    it('holds the fonts back at 768, live\'s last small width', async () => {
      expect(await at(768, false)).to.be.false;
    });

    it('takes them at 769, where AGENTS.md puts the step', async () => {
      expect(await at(769, false)).to.be.true;
    });

    it('reads the same at 899 and at 900, so no step is left there', async () => {
      // the boilerplate's own breakpoint, and the thing that makes this the
      // fifth of its family rather than a judgment call of ours
      expect(await at(899, false)).to.equal(await at(900, false));
    });

    it('holds them back on a phone and takes them on a desktop', async () => {
      expect(await at(375, false)).to.be.false;
      expect(await at(1440, false)).to.be.true;
    });
  });

  describe('the flag term, which is gone', () => {
    it('answers the same at 375 whether the tab has been used or not', async () => {
      // the defect itself: one URL, one width, two paint profiles, and the
      // visitor never chose which of them they got
      const fresh = await at(375, false);
      const reused = await at(375, true);
      expect(reused, 'a reused tab paints the way a fresh one does').to.equal(fresh);
    });

    it('answers the same at 1440 either way, so the flag decides nothing there', async () => {
      expect(await at(1440, true)).to.equal(await at(1440, false));
    });

    it('answers the same at 768 either way, on the small side of the step', async () => {
      expect(await at(768, true)).to.equal(await at(768, false));
    });
  });
});

/*
 * There is no assertion here that `loadFonts` still writes the flag. The first
 * draft had one and it read `sessionStorage.setItem` then `getItem`, which
 * tests the browser rather than this file: it cannot go red for any reason we
 * would want to hear about. `loadFonts` is internal, so the write has no
 * reachable witness, and the claim belongs in the note above instead. Same
 * lesson as #518, one slice earlier.
 */
