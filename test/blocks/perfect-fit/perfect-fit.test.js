/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/** Authored perfect-fit: label row, then a row of three item cells. */
function buildBlock() {
  document.body.innerHTML = `
    <div class="perfect-fit block">
      <div><div><p>Find your perfect fit:</p></div></div>
      <div>
        <div><span>By Vehicle</span></div>
        <div><span>By Tire Size</span></div>
        <div><span>By Plate</span></div>
      </div>
    </div>`;
  return document.querySelector('.perfect-fit.block');
}

describe('Perfect fit block', () => {
  let block;
  beforeEach(() => {
    block = buildBlock();
    decorate(block);
  });

  it('turns the three items into buttons', () => {
    const items = block.querySelectorAll('.perfect-fit-item');
    expect(items).to.have.length(3);
    expect([...items].every((el) => el.tagName === 'BUTTON')).to.be.true;
  });

  it('builds a modal that starts hidden', () => {
    const overlay = block.querySelector('.perfect-fit-overlay');
    expect(overlay).to.exist;
    expect(overlay.hidden).to.be.true;
    expect(overlay.querySelectorAll('[role="tab"]')).to.have.length(3);
  });

  it('opens the modal on the tab matching the clicked item', () => {
    block.querySelectorAll('.perfect-fit-item')[2].click();
    const overlay = block.querySelector('.perfect-fit-overlay');
    expect(overlay.hidden).to.be.false;
    const plateTab = block.querySelector('#perfect-fit-tab-plate');
    expect(plateTab.getAttribute('aria-selected')).to.equal('true');
    expect(block.querySelector('#perfect-fit-panel-plate').hidden).to.be.false;
  });

  it('closes on Escape and restores focus to the trigger', () => {
    const trigger = block.querySelectorAll('.perfect-fit-item')[0];
    trigger.click();
    const dialog = block.querySelector('.perfect-fit-dialog');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(block.querySelector('.perfect-fit-overlay').hidden).to.be.true;
    expect(document.activeElement).to.equal(trigger);
  });

  it('does not navigate when a search form is submitted', () => {
    block.querySelectorAll('.perfect-fit-item')[0].click();
    const form = block.querySelector('.perfect-fit-form');
    const submit = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    expect(submit.defaultPrevented).to.be.true;
  });
});
