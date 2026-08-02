/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/video/video.js';

/**
 * Live draws one play mark on an article video, and it is the mark the media
 * gallery already carries: a 72px ringed circle with a yellow triangle.
 *
 * Read off continentaltire.com on 2026-08-02. The article player is
 * `class="align-center media--cta media-video media--embed"`, so live's
 * `.media-video.media--cta:after` is the rule that paints it:
 *
 *   content:'';width:72px;height:72px;position:absolute;top:50%;left:50%;
 *   transform:translate3d(-50%,-50%,0);z-index:1;background-image:url(<the
 *   76-viewBox circle, #000 at .6 behind a 2px white stroke, triangle #FFA503>)
 *
 * 72px is the whole story: the only other rule live gives the badge is
 * `.marquee__video-overlay .media-video.media--cta:after`, which restates the
 * same 72 and the same drawing. There is no width at which live grows it, so
 * ours steps at none either. Issue #199.
 */
describe('Video block, live\'s play badge', () => {
  let block;

  const authored = () => {
    document.body.innerHTML = `
      <main><div class="section"><div class="video-wrapper">
        <div class="video block">
          <div><div>
            <picture><img src="/media/poster.jpg" alt="Mod My Toyota Supra"></picture>
            <p><a href="https://www.youtube.com/watch?v=d6w6bGy1eM8">Mod My Toyota Supra</a></p>
          </div></div>
        </div>
      </div></div></main>`;
    return document.querySelector('.video.block');
  };

  before(async () => {
    const sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/video/video.css'].map(async (path) => {
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
    document.body.innerHTML = '';
    decorate(block = authored());
    await setViewport({ width: 1440, height: 900 });
  });

  const badge = () => getComputedStyle(block.querySelector('.video-play'), '::after');

  it('carries live\'s own drawing rather than a field of its own', () => {
    const mark = badge();
    expect(mark.backgroundImage, 'the yellow triangle live fills the mark with').to.match(/FFA503/);
    expect(mark.backgroundImage, 'the 76-unit circle it sits in').to.match(/76%2076|76 76/);
    expect(mark.backgroundSize, 'the drawing fills the mark').to.equal('cover');
    expect(mark.backgroundColor, 'no translucent slab under it').to.equal('rgba(0, 0, 0, 0)');
    expect(mark.borderRadius, 'the mark is the circle in the drawing, not a rounded box').to.equal('0px');
  });

  it('is 72 square, the one size live gives it', () => {
    const mark = badge();
    expect(mark.width, "live's 72px").to.equal('72px');
    expect(mark.height, "live's 72px").to.equal('72px');
  });

  it('draws no second triangle over it', () => {
    const before = getComputedStyle(block.querySelector('.video-play'), '::before');
    expect(before.content, 'the CSS triangle is gone, the drawing carries its own').to.equal('none');
  });

  it('keeps the 72 at every width live keeps it at', async () => {
    await setViewport({ width: 375, height: 700 });
    expect(badge().width, 'at 375').to.equal('72px');
    await setViewport({ width: 900, height: 800 });
    expect(badge().width, 'at 900').to.equal('72px');
    await setViewport({ width: 1440, height: 900 });
    expect(badge().width, 'at 1440').to.equal('72px');
  });

  it('centres the mark on the poster', () => {
    const frame = block.querySelector('.video-frame').getBoundingClientRect();
    const mark = badge();
    expect(mark.position).to.equal('absolute');
    expect(frame.width, 'the frame is the 747px player live sets').to.be.closeTo(747, 1);
    // a 72px mark pulled back by half itself lands on the frame's centre
    expect(parseFloat(mark.top), 'half the frame down').to.be.closeTo(frame.height / 2, 1);
    expect(parseFloat(mark.left), 'half the frame across').to.be.closeTo(frame.width / 2, 1);
  });

  it('still outlines the control for a keyboard visitor', () => {
    // :focus-visible cannot be forced from a test, so this reads the rule
    const sheet = [...document.adoptedStyleSheets]
      .flatMap((s) => [...s.cssRules])
      .find((r) => r.selectorText === 'main .video .video-play:focus-visible');
    expect(sheet, 'the focus outline survives the badge change').to.exist;
    expect(sheet.style.outline).to.contain('2px');
  });
});
