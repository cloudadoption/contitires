/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * The documents template. Live builds /customer-support/technical-documents as
 * a stack of rows: a hairline above each one, a centred heading, and the link
 * under it. Ours drew ten yellow pill buttons down a left-aligned page, because
 * the five download links were authored bold and a lone bold link is a button.
 * Read off continentaltire.com at 1440: the row pads 38px and carries a 1px
 * #e9e9e9 top border, the heading is 30px on 38px at weight 400, and the
 * download link is 12px, weight 700, 1.25px letter-spacing, uppercase and
 * underlined with a 20px arrow after it. (#262)
 */
describe('The documents template', () => {
  let sheet;
  let host;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/documents.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    host = document.createElement('main');
    host.innerHTML = `
      <div class="section hero-container">
        <div class="hero-wrapper"><div class="hero"><div><div><h1>Technical Documents</h1></div></div></div></div>
      </div>
      <div class="section" id="download-row">
        <div class="default-content-wrapper">
          <h2 id="tire-repair">Tire Repair for Passenger Car and Light Truck Tires</h2>
          <p><a href="/tire_repair_en.pdf">Download now</a></p>
        </div>
      </div>
      <div class="section" id="read-row">
        <div class="default-content-wrapper">
          <h2 id="storage">Tire Storage Tips</h2>
          <p class="button-wrapper"><a href="/learn/seven-tips-storing-tires" class="button secondary">Read more</a></p>
        </div>
      </div>
      <div class="section" id="empty-row"><div class="default-content-wrapper"></div></div>`;
    document.body.append(host);
  });

  after(() => {
    host.remove();
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
  });

  const row = (id) => host.querySelector(`#${id}`);
  const style = (el, pseudo) => getComputedStyle(el, pseudo);

  it('draws a hairline above every row and pads it the way live does', () => {
    const s = style(row('download-row'));
    expect(s.borderTopWidth).to.equal('1px');
    expect(s.borderTopStyle).to.equal('solid');
    expect(s.borderTopColor).to.equal('rgb(233, 233, 233)');
    expect(s.paddingTop).to.equal('38px');
    expect(s.paddingBottom).to.equal('38px');
  });

  it('centres the row, which live does for the heading and the link alike', () => {
    expect(style(row('download-row')).textAlign).to.equal('center');
    expect(style(row('read-row')).textAlign).to.equal('center');
  });

  // The hero holds an h1 and the metadata leaves an empty section behind. A
  // rule above either one is a line live does not draw.
  it('leaves the hero and the empty trailing section alone', () => {
    expect(style(host.querySelector('.hero-container')).borderTopWidth).to.equal('0px');
    expect(style(row('empty-row')).borderTopWidth).to.equal('0px');
  });

  it('sets the heading to live\'s size, leading and weight', () => {
    const s = style(row('download-row').querySelector('h2'));
    expect(s.fontSize).to.equal('30px');
    expect(s.lineHeight).to.equal('38px');
    expect(s.fontWeight).to.equal('400');
    expect(s.marginBottom).to.equal('0px');
  });

  it('draws the download as a small letter-spaced label, not a button', () => {
    const s = style(row('download-row').querySelector('a'));
    expect(s.fontSize).to.equal('12px');
    expect(s.fontWeight).to.equal('700');
    expect(s.letterSpacing).to.equal('1.25px');
    expect(s.textTransform).to.equal('uppercase');
    expect(s.textDecorationLine).to.equal('underline');
    expect(s.marginTop).to.equal('16px');
    expect(s.backgroundColor).to.equal('rgba(0, 0, 0, 0)');
  });

  it('puts a 20px arrow after the download label', () => {
    const s = style(row('download-row').querySelector('a'), '::after');
    expect(s.content).to.equal('""');
    expect(s.width).to.equal('20px');
    expect(s.height).to.equal('20px');
    expect(s.maskImage).to.contain('download-arrow.svg');
  });

  // The five Read more links already match live, which draws them as an
  // outline button. Nothing here may reach them.
  it('leaves a Read more button a button, with no arrow', () => {
    const a = row('read-row').querySelector('a');
    expect(style(a).textTransform).to.not.equal('uppercase');
    expect(style(a, '::after').maskImage).to.not.contain('download-arrow.svg');
  });
});
