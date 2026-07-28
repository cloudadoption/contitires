/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { buildBlock, decorateBlock } from '../../../scripts/aem.js';
import decorate, { initWidgetScripts } from '../../../blocks/widget/widget.js';

/**
 * A widget's own script is third-party, and the three-phase model keeps
 * third-party code out of the eager phase. The newsletter widget stands in the
 * first section of /newsletter-signup, so the block decorating it there is the
 * eager phase, and the embed it loaded went out with it.
 *
 * Decoration now takes the widget's markup and its stylesheet, which is what
 * holds the form's room open, and the script waits for the widget to come near
 * the viewport. The page has to have finished loading first, which these tests
 * cannot reach: the runner's page is `complete` before a test runs. That half
 * is measured on the page instead, as the embed's own start time. Issue #109.
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

/**
 * Waits for a condition, or gives up. An observer fires on a frame and the
 * module it then loads arrives on a network round trip, so neither is ready on
 * the turn that triggers it.
 * @param {Function} done what to wait for
 * @param {number} ms how long to wait
 * @returns {Promise<boolean>} whether it came true
 */
async function until(done, ms = 2000) {
  for (let waited = 0; waited < ms; waited += 50) {
    if (done()) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((go) => setTimeout(go, 50));
  }
  return done();
}

describe('The widget block', () => {
  afterEach(() => {
    document.body.querySelectorAll('main').forEach((el) => el.remove());
    document.head.querySelectorAll(EMBED).forEach((el) => el.remove());
    window.scrollTo(0, 0);
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
});

describe('When the widget script loads', () => {
  afterEach(() => {
    document.body.querySelectorAll('main').forEach((el) => el.remove());
    document.head.querySelectorAll(EMBED).forEach((el) => el.remove());
    window.scrollTo(0, 0);
  });

  it('loads it when the widget is in view', async () => {
    await setViewport({ width: 900, height: 800 });
    const block = build();
    await decorate(block);
    initWidgetScripts();
    expect(await until(() => document.head.querySelector(EMBED)), 'the embed').to.be.true;
  });

  // a widget far enough down a page costs a visitor who stops above it nothing
  it('leaves it alone while the widget is out of reach', async () => {
    await setViewport({ width: 900, height: 800 });
    const block = build();
    const spacer = document.createElement('div');
    spacer.style.height = '4000px';
    block.closest('main').prepend(spacer);
    await decorate(block);
    initWidgetScripts();
    await new Promise((go) => setTimeout(go, 400));
    expect(document.head.querySelector(EMBED), 'the embed').to.not.exist;
  });

  // and it arrives before the visitor does, rather than as they reach it
  it('loads it once the widget comes near', async () => {
    await setViewport({ width: 900, height: 800 });
    const block = build();
    const spacer = document.createElement('div');
    spacer.style.height = '4000px';
    block.closest('main').prepend(spacer);
    await decorate(block);
    initWidgetScripts();
    await new Promise((go) => setTimeout(go, 200));
    block.scrollIntoView();
    expect(await until(() => document.head.querySelector(EMBED)), 'the embed').to.be.true;
  });

  // it runs on every page, and all but three carry no widget
  it('watches nothing when the page carries no widget', async () => {
    initWidgetScripts();
    await new Promise((go) => setTimeout(go, 200));
    expect(document.head.querySelector(EMBED)).to.not.exist;
  });
});
