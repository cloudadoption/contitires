/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate from '../../../blocks/tire-specs/tire-specs.js';

const SPECS = {
  'my-tire': [
    { size: '205/45 ZR 16', specs: { 'Load Index': '83', 'Speed Rating': 'W', UTQG: '340 AA A' } },
    { size: '225/45 ZR 17', specs: { 'Load Index': '88', 'Speed Rating': 'W', UTQG: '340 AA A' } },
  ],
};

/** A tire-specs block with the product slug authored in its first cell. */
function build(slug) {
  document.body.innerHTML = `<div class="tire-specs block"><div><div>${slug}</div></div></div>`;
  return document.querySelector('.tire-specs.block');
}

describe('Tire specs block', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  it('renders a size selector and the first size specs', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(SPECS)));
    const block = build('my-tire');
    await decorate(block);

    const opts = block.querySelectorAll('.tire-specs-select option');
    expect(opts).to.have.length(2);
    expect(opts[0].textContent).to.equal('205/45 ZR 16');
    expect(block.textContent).to.contain('Load Index');
    expect(block.textContent).to.contain('83');
    expect(block.querySelector('.tire-specs-count').textContent).to.contain('2');
  });

  it('switches specs when a different size is selected', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(SPECS)));
    const block = build('my-tire');
    await decorate(block);

    const select = block.querySelector('.tire-specs-select');
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    expect(block.textContent).to.contain('88');
  });

  it('renders nothing when the product has no specs', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(SPECS)));
    const block = build('unknown-tire');
    await decorate(block);

    expect(block.querySelector('.tire-specs-select')).to.not.exist;
  });
});
