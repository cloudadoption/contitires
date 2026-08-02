/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/share/share.js';

/**
 * Live's two labelled share controls read EMAIL and PRINT, not Email and Print.
 *
 * Both are `.link-button` on live's own article sharebar, read off
 * continentaltire.com/learn/art-racing-rain on 2026-08-02:
 *
 *   <a class="link-button" href="mailto:..."><span class="icon icon__mail
 *     icon--xs">…</span><span>Email</span></a>
 *   <con-print class="link-button"></con-print>
 *
 * and `.link-button` carries `font-size: var(--font-size-12); font-weight: bold;
 * letter-spacing: var(--letter-spacing-1_25); text-transform: uppercase`, which
 * resolves to 12px, 700 and 1.25px. Nothing under `.sharebar` overrides any of
 * the four, so the four numbers come from that one class.
 *
 * Read on the share row rather than borrowed from /dealers, which the issue
 * asked for because the /dealers reading gave only two of them. Issue #269.
 */
describe('Share block, the case live sets on its two labelled controls', () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/share/share.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => { document.body.classList.remove('appear'); });

  beforeEach(async () => {
    document.body.innerHTML = '<div class="share block"></div>';
    decorate(block = document.querySelector('.share.block'));
    await setViewport({ width: 1440, height: 900 });
  });

  const visible = () => [...block.querySelectorAll('.share-label')]
    .filter((s) => !s.classList.contains('share-label-hidden'));

  it('sets both of them uppercase', () => {
    const labels = visible();
    expect(labels.map((s) => s.textContent), 'the two live labels').to.deep.equal(['Email', 'Print']);
    labels.forEach((s) => {
      expect(getComputedStyle(s).textTransform, `${s.textContent} renders uppercase`).to.equal('uppercase');
    });
  });

  it('gives them live\'s weight, size and tracking', () => {
    visible().forEach((s) => {
      const style = getComputedStyle(s);
      expect(style.fontWeight, `${s.textContent} at live's bold`).to.equal('700');
      expect(style.fontSize, `${s.textContent} at live's 12px`).to.equal('12px');
      expect(style.letterSpacing, `${s.textContent} at live's 1.25px`).to.equal('1.25px');
    });
  });

  it('leaves the authored strings alone, so the case is presentation', () => {
    // a screen reader and a copy-paste both read what share.js wrote
    expect(visible().map((s) => s.textContent)).to.deep.equal(['Email', 'Print']);
  });

  it('keeps the two social labels out of the row', () => {
    const hidden = [...block.querySelectorAll('.share-label-hidden')];
    expect(hidden.map((s) => s.textContent), 'live gives these sr-only text').to.deep.equal(['Facebook', 'X']);
    hidden.forEach((s) => {
      expect(getComputedStyle(s).width, `${s.textContent} takes no room`).to.equal('1px');
    });
  });
});
