/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/related-articles/related-articles.js';

// Live puts a curated Related articles list in the article sidebar, under the
// sharebar. 75 of its 217 articles have one, with 1 to 7 hand-picked links, so
// the links are authored rather than derived from the category.
describe('Related articles block', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="related-articles block">
        <div><div>
          <ul>
            <li><a href="/learn/dandelions-future-tires">Dandelions, the Future of Tires?</a></li>
            <li><a href="/learn/five-fun-facts-about-dandelion-tires">Five Fun Facts</a></li>
          </ul>
        </div></div>
      </div>`;
    block = document.querySelector('.related-articles.block');
  });

  it('titles the list, so the author writes only the links', () => {
    decorate(block);
    const title = block.querySelector('.related-articles-title');
    expect(title).to.exist;
    expect(title.textContent).to.equal('Related articles');
  });

  it('keeps the authored links, in the authored order', () => {
    decorate(block);
    const links = [...block.querySelectorAll('.related-articles-list a')];
    expect(links).to.have.length(2);
    expect(links[0].getAttribute('href')).to.equal('/learn/dandelions-future-tires');
    expect(links[0].textContent).to.equal('Dandelions, the Future of Tires?');
    expect(links[1].getAttribute('href')).to.equal('/learn/five-fun-facts-about-dandelion-tires');
  });

  it('drops the authoring wrappers', () => {
    decorate(block);
    expect(block.children).to.have.length(2);
    expect(!!block.querySelector('div div')).to.be.false;
  });

  it('renders nothing at all when no links are authored', () => {
    document.body.innerHTML = '<div class="related-articles block"><div><div></div></div></div>';
    const empty = document.querySelector('.related-articles.block');
    decorate(empty);
    expect(empty.textContent.trim()).to.equal('');
  });
});
