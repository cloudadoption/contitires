/* eslint-disable no-unused-expressions */
/* global describe it before after afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../widgets/hubspot/newsletter.js';

/**
 * Live's newsletter page embeds one HubSpot form, and we embed the same one.
 * It is the iframe embed rather than the developer embed the offer signup
 * beside it uses, so the form takes none of our CSS and we cannot shorten it.
 *
 * What we can do is hold its room open. The stylesheet styled `.hubspot`, and
 * the block takes the widget's own name, so nothing ever carried that class and
 * the reservation in it never applied. Issue #108.
 */
const PORTAL = '48908421';
const SCRIPT = `script[src="https://js.hsforms.net/forms/embed/${PORTAL}.js"]`;

describe('The newsletter widget', () => {
  afterEach(() => document.head.querySelectorAll(SCRIPT).forEach((s) => s.remove()));

  it('loads the embed live loads', () => {
    decorate();
    expect(document.head.querySelector(SCRIPT), 'the iframe embed').to.exist;
  });

  it('loads it once', () => {
    decorate();
    decorate();
    expect(document.head.querySelectorAll(SCRIPT)).to.have.length(1);
  });

  it('asks for the form live asks for', async () => {
    const html = await (await fetch('/widgets/hubspot/newsletter.html')).text();
    expect(html).to.contain('hs-form-frame');
    expect(html).to.contain('3c44e055-0305-461a-9694-2793b94e410a');
    expect(html).to.contain(PORTAL);
  });
});

/**
 * The form arrives in the delayed phase and expands from nothing, which moved
 * the footer down a page and a half. These are the heights it settles at,
 * read off the form itself at 13 widths from 320 to 1440: 2051 at 320 down to
 * 1807 at 476, where HubSpot switches its own layout, then 1340 at 480 down to
 * 1176 from 768. A band holds the tallest of the widths in it, so the room is
 * never short of the form; where it is over, the form sits in a taller box
 * rather than moving what is under it.
 */
describe('The room the newsletter form takes', () => {
  let widget;

  before(async () => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/widgets/hubspot/newsletter.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    const main = document.createElement('main');
    main.append(document.createElement('div'));
    main.firstElementChild.className = 'widget newsletter';
    document.body.append(main);
    widget = main.firstElementChild;
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.slice(0, -1);
    widget.closest('main').remove();
  });

  it('holds the tallest phone form open', async () => {
    await setViewport({ width: 375, height: 800 });
    expect(Math.round(widget.getBoundingClientRect().height)).to.equal(2051);
  });

  it('holds the short form open from 480', async () => {
    await setViewport({ width: 600, height: 800 });
    expect(Math.round(widget.getBoundingClientRect().height)).to.equal(1340);
  });

  it('holds the desk form open from 768', async () => {
    await setViewport({ width: 900, height: 800 });
    expect(Math.round(widget.getBoundingClientRect().height)).to.equal(1176);
  });
});

/**
 * The room above holds from the first paint and the form reaches it at 3.4s,
 * measured on the published page at 412: the delayed phase starts at 3s and
 * `js.hsforms.net/forms/embed/48908421.js` finishes at 3329ms. On a page whose
 * only content is the form, 2051px of nothing for that long reads as broken
 * rather than as loading, which is issue #230.
 *
 * So the empty box shows the shape of what is coming: a 10px label bar and a
 * 44px field box on an 89px pitch, read off the rendered form at 375, tiled over
 * the room. No text, so nothing is announced and no copy live does not have
 * appears, and `:empty` retires it the moment HubSpot puts its iframe in.
 */
describe('The newsletter form while it is still coming', () => {
  let widget;
  let frame;

  const pseudo = (prop) => getComputedStyle(widget, '::before').getPropertyValue(prop);

  before(async () => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/widgets/hubspot/newsletter.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    const main = document.createElement('main');
    main.innerHTML = '<div class="widget newsletter"><div class="hs-form-frame"></div></div>';
    document.body.append(main);
    widget = main.firstElementChild;
    frame = widget.firstElementChild;
    await setViewport({ width: 375, height: 800 });
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.slice(0, -1);
    widget.closest('main').remove();
  });

  afterEach(() => frame.replaceChildren());

  it('draws the field rows while the frame is empty', () => {
    expect(pseudo('content'), 'the placeholder').to.equal('""');
    expect(pseudo('background-image')).to.contain('gradient');
  });

  it('covers the whole room it is waiting in', () => {
    expect(pseudo('position')).to.equal('absolute');
    expect(pseudo('top')).to.equal('0px');
    expect(pseudo('bottom')).to.equal('0px');
    expect(getComputedStyle(widget).position).to.equal('relative');
  });

  it('announces nothing, because it says nothing', () => {
    expect(pseudo('content')).to.equal('""');
    expect(widget.textContent.trim()).to.equal('');
  });

  it('goes when the form arrives', () => {
    frame.append(document.createElement('iframe'));
    expect(pseudo('content'), 'the placeholder once the iframe is in').to.equal('none');
  });

  it('takes none of the room the form will need', () => {
    expect(Math.round(widget.getBoundingClientRect().height)).to.equal(2051);
    frame.append(document.createElement('iframe'));
    expect(Math.round(widget.getBoundingClientRect().height)).to.equal(2051);
  });
});
