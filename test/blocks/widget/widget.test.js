/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import { buildBlock, decorateBlock } from '../../../scripts/aem.js';
import decorate, { loadWidgetScripts } from '../../../blocks/widget/widget.js';

/**
 * A widget's own script is third-party, and the three-phase model keeps
 * third-party code out of the eager phase. The newsletter widget stands in the
 * first section of /newsletter-signup, so the block decorating it there is the
 * eager phase, and the embed it loaded went out with it.
 *
 * The block now takes the widget's markup and its stylesheet at decoration,
 * which is what holds the form's room open, and leaves the script to the
 * delayed phase. Issue #109.
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
  // be in place from decoration rather than from the delayed phase
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

  it('loads it when the delayed phase runs', async () => {
    const block = build();
    await decorate(block);
    await loadWidgetScripts();
    expect(document.head.querySelector(EMBED), 'the third-party embed').to.exist;
  });

  // the delayed phase runs on every page, and all but three carry no widget
  it('loads nothing when the page carries no widget', async () => {
    await loadWidgetScripts();
    expect(document.head.querySelector(EMBED)).to.not.exist;
  });
});
