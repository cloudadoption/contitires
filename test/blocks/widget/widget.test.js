/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import { buildBlock, decorateBlock } from '../../../scripts/aem.js';
import decorate, { initWidgetScripts, loadWidgetScript } from '../../../blocks/widget/widget.js';

/**
 * A widget's own script is third-party, and the three-phase model keeps
 * third-party code out of the eager phase. The newsletter widget stands in the
 * first section of /newsletter-signup, so the block decorating it there is the
 * eager phase, and the embed it loaded went out with it.
 *
 * Decoration now takes the widget's markup and its stylesheet, which is what
 * holds the form's room open. The script follows once the page has loaded and
 * the widget comes near the viewport.
 *
 * Those two conditions are not in these tests, and a test claiming them here
 * would pass for the wrong reason. The runner's page is `complete` before a
 * test runs, so the load gate is already open; and under the full suite the
 * page is `hidden`, so it never renders and an IntersectionObserver on it
 * never fires. Both are measured on the page instead: the embed's own start
 * time against the phases, and /promotion's widget staying unloaded until it
 * is scrolled to. Issues #108, #109.
 */
const EMBED = 'script[src*="js.hsforms.net"]';
const HREF = '/widgets/hubspot/newsletter.html';

/**
 * The shape the pipeline delivers by the time the block is decorated: the
 * authored link built into a widget block, in a wrapper, in a section.
 * @param {string} href the authored widget link
 * @returns {Element} the decorated block
 */
function build(href = HREF) {
  const main = document.createElement('main');
  main.innerHTML = '<div class="section"><div></div></div>';
  const link = document.createElement('a');
  link.href = href;
  link.textContent = 'Newsletter form';
  const block = buildBlock('widget', { elems: [link] });
  main.querySelector('.section > div').append(block);
  document.body.append(main);
  decorateBlock(block);
  return block;
}

describe('The widget block', () => {
  afterEach(() => {
    document.body.querySelectorAll('main').forEach((el) => el.remove());
    document.head.querySelectorAll(EMBED).forEach((el) => el.remove());
  });

  it('names the block, its wrapper and its section after the widget', async () => {
    const block = build();
    await decorate(block);
    expect([...block.classList]).to.include('newsletter');
    expect([...block.classList]).to.not.include('block');
    expect([...block.parentElement.classList]).to.include('newsletter-wrapper');
    expect([...block.parentElement.classList]).to.not.include('widget-wrapper');
    expect([...block.closest('.section').classList]).to.include('newsletter-container');
    expect([...block.closest('.section').classList]).to.not.include('widget-container');
  });

  it('keeps the widget href, which is what names the module to load later', async () => {
    const block = build();
    await decorate(block);
    expect(new URL(block.dataset.source).pathname).to.equal(HREF);
  });

  // the markup is the shell the stylesheet holds the room open on, so it has to
  // be in place from decoration rather than from whenever the script arrives
  it('puts the widget markup in place at decoration', async () => {
    const block = build();
    await decorate(block);
    expect(block.querySelector('.hs-form-frame'), 'the form shell').to.exist;
  });

  it('holds the widget script back', async () => {
    const block = build();
    await decorate(block);
    expect(document.head.querySelector(EMBED), 'the third-party embed').to.not.exist;
  });

  it('loads that script from the href when it is asked to', async () => {
    const block = build();
    await decorate(block);
    await loadWidgetScript(block);
    expect(document.head.querySelector(EMBED), 'the third-party embed').to.exist;
  });

  // a widget whose files are gone leaves the page standing
  it('survives a widget that is not there', async () => {
    const block = build('/widgets/hubspot/nothing.html');
    await decorate(block);
    await loadWidgetScript(block);
    expect(document.head.querySelector(EMBED)).to.not.exist;
  });

  // the lazy phase asks on every page, and all but three carry no widget
  it('watches nothing when the page carries no widget', async () => {
    initWidgetScripts();
    expect(document.head.querySelector(EMBED)).to.not.exist;
  });
});
