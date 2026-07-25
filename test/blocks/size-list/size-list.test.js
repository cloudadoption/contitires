/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/size-list/size-list.js';

describe('Size list block', () => {
  it('renders one chip per authored size', () => {
    document.body.innerHTML = `
      <div class="size-list block">
        <div><div>
          <ul><li>225/45R17</li><li>245/40R18</li><li>265/70R17</li></ul>
        </div></div>
      </div>`;
    const block = document.querySelector('.size-list.block');
    decorate(block);
    const chips = block.querySelectorAll('.size-chip');
    expect(chips).to.have.length(3);
    expect(chips[0].textContent).to.equal('225/45R17');
    expect(block.querySelector('.size-list-chips')).to.exist;
  });
});
