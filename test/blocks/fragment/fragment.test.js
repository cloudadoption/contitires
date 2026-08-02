/* eslint-disable no-unused-expressions */
/* global describe it before afterEach */

import { expect } from '@esm-bundle/chai';
import decorate, { loadFragment } from '../../../blocks/fragment/fragment.js';

/*
 * The fragment block had no test, and it is the block the header and the footer
 * both stand on: header.js loads /nav and /fragments/promo-bar through it, and
 * footer.js loads /footer. (#125)
 *
 * Two things here are its own logic rather than the platform's. The path guard
 * refuses anything that is not a site-absolute path, which is what keeps an
 * authored `//host/x` from fetching off-site. And the media rebase resolves the
 * pipeline's `./media_<hash>.ext` against the FRAGMENT's path rather than the
 * page's, so an image in an included fragment is not looked for beside the page
 * that includes it. This file is served from /test/blocks/fragment/ and the test
 * page from the origin root, so a rebase that did not happen reads differently
 * from one that did.
 *
 * The fixture's image 404s and web-test-runner.config.mjs answers it with an
 * empty 200, the way it answers every other fixture image in the suite.
 */

/** The fixture, as a path a fragment would be authored with. */
const FRAGMENT = '/test/blocks/fragment/mock-fragment';

/** Where the fixture's `./media_1a2b3c.*` has to land. */
const MEDIA_BASE = `${window.location.origin}/test/blocks/fragment/media_1a2b3c`;

/** A path that must never reach the network. */
const REFUSED = ['', 'mock-fragment', './mock-fragment', '//example.com/nav', 'https://example.com/nav'];

describe('Fragment', () => {
  let realFetch;
  let requested;

  before(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
  });

  afterEach(() => {
    if (realFetch) window.fetch = realFetch;
    realFetch = null;
  });

  /** Records every URL fetched, and answers with `response` when given one. */
  function spyFetch(response) {
    requested = [];
    realFetch = window.fetch;
    window.fetch = function spy(url, ...rest) {
      requested.push(String(url));
      return response ? Promise.resolve(response) : realFetch.call(window, url, ...rest);
    };
  }

  it('loads the fragment at a site-absolute path', async () => {
    const fragment = await loadFragment(FRAGMENT);
    expect(fragment, 'a root element came back').to.be.an('HTMLElement');
    expect(fragment.tagName).to.equal('MAIN');
    expect(fragment.textContent).to.contain('A fragment');
  });

  it('asks for the plain markup and nothing else', async () => {
    spyFetch();
    await loadFragment(FRAGMENT);
    expect(requested.some((url) => url.endsWith(`${FRAGMENT}.plain.html`)), `asked for ${FRAGMENT}.plain.html`).to.be.true;
  });

  it('decorates the sections it brought back', async () => {
    const fragment = await loadFragment(FRAGMENT);
    const section = fragment.querySelector('.section');
    expect(!!section, 'the fragment carries a decorated section').to.be.true;
    expect(section.dataset.sectionStatus, 'the section was loaded').to.equal('loaded');
  });

  it('resolves an image against the fragment path, not the page', async () => {
    const fragment = await loadFragment(FRAGMENT);
    const img = fragment.querySelector('img');
    expect(!!img, 'the fragment carries an image').to.be.true;
    expect(img.src).to.equal(`${MEDIA_BASE}.png`);
  });

  it('resolves a srcset against the fragment path too', async () => {
    const fragment = await loadFragment(FRAGMENT);
    const source = fragment.querySelector('source');
    expect(!!source, 'the fragment carries a source').to.be.true;
    expect(source.srcset).to.equal(`${MEDIA_BASE}.webp`);
  });

  REFUSED.forEach((path) => {
    it(`refuses ${path === '' ? 'an empty path' : path} without a request`, async () => {
      spyFetch();
      const fragment = await loadFragment(path);
      expect(fragment === null, 'nothing came back').to.be.true;
      expect(requested, 'nothing was requested').to.eql([]);
    });
  });

  it('gives back nothing when the fragment is not published', async () => {
    spyFetch({ ok: false, status: 404 });
    const fragment = await loadFragment('/fragments/not-published');
    expect(fragment === null, 'nothing came back').to.be.true;
    expect(requested, 'the path was asked for once').to.have.lengthOf(1);
  });

  describe('decorate', () => {
    /** A block as the pipeline delivers one, holding `inner`. */
    function block(inner) {
      const el = document.createElement('div');
      el.className = 'fragment block';
      el.innerHTML = inner;
      return el;
    }

    it('replaces the block with the fragment it links to', async () => {
      const el = block(`<div><div><a href="${FRAGMENT}">${FRAGMENT}</a></div></div>`);
      await decorate(el);
      expect(el.textContent).to.contain('A fragment');
      expect(!!el.querySelector('a'), 'the authored link is gone').to.be.false;
    });

    it('takes the path from the block text when authors write no link', async () => {
      const el = block(`<div><div>${FRAGMENT}</div></div>`);
      await decorate(el);
      expect(el.textContent).to.contain('A fragment');
    });

    it('leaves the block alone when the fragment is missing', async () => {
      spyFetch({ ok: false, status: 404 });
      const el = block('<div><div><a href="/fragments/not-published">/fragments/not-published</a></div></div>');
      await decorate(el);
      expect(!!el.querySelector('a[href="/fragments/not-published"]'), 'the authored link is still there').to.be.true;
    });
  });
});
