/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate from '../../../blocks/share/share.js';

// Live's sharebar is Facebook, Twitter, Email and Print, on articles and on
// experience pages alike. Ours carried LinkedIn, which live has nowhere, and
// no Print.
describe('Share block', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '<div class="share block"></div>';
    block = document.querySelector('.share.block');
  });

  it("renders live's four controls, in live's order", () => {
    decorate(block);
    const labels = [...block.querySelectorAll('.share-label')].map((s) => s.textContent);
    expect(labels).to.deep.equal(['Facebook', 'X', 'Email', 'Print']);
  });

  it('points the social links at the sharer for this page', () => {
    decorate(block);
    const [facebook, x] = block.querySelectorAll('a');
    const url = encodeURIComponent(window.location.href);
    expect(facebook.href).to.contain('facebook.com/sharer/sharer.php');
    expect(facebook.href).to.contain(url);
    expect(x.href).to.contain('twitter.com/intent/tweet');
    expect(x.href).to.contain(url);
    expect(facebook.target).to.equal('_blank');
    expect(facebook.rel).to.contain('noopener');
  });

  it('mails the title and the url, and opens in the same tab', () => {
    decorate(block);
    const mail = [...block.querySelectorAll('a')].find((a) => a.href.startsWith('mailto:'));
    expect(mail.href).to.contain(encodeURIComponent(document.title));
    expect(mail.target).to.equal('');
  });

  it('prints the page from a button, not a link', () => {
    decorate(block);
    const print = block.querySelector('button');
    expect(print).to.exist;
    expect(print.type).to.equal('button');

    const printStub = sinon.stub(window, 'print');
    try {
      print.click();
      expect(printStub.calledOnce).to.be.true;
    } finally {
      printStub.restore();
    }
  });
});
