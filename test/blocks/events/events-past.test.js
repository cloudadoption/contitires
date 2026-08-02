/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate from '../../../blocks/events/events.js';

/**
 * Live drops an event once it is over. Ours never compared a date to today, so
 * every event that passed stayed on a page titled Upcoming events and the list
 * grew a stale row every week without anybody touching it.
 *
 * Read on 2026-08-02 from the published sheet: 30 rows, of which `Jul 29–29`
 * and `Aug 01–01` had ended. That is one more than when the issue was filed
 * three days earlier, which is the decay it describes.
 *
 * The filter is in the block rather than in the sheet. The authored rows are the
 * history and deleting them loses it, and the month facet is derived from the
 * same entries, so only one code path deciding what past means keeps the facet
 * and the list agreeing.
 *
 * Two things the pill makes easy to get wrong, both covered below: an event
 * drops when it ENDS, not when it starts, so a multi-day event halfway through
 * stays; and the separator in the authored range is an EN DASH, not a hyphen.
 * Issue #325.
 */
describe('Events block, dropping an event that is over', () => {
  let clock;

  /** A card: a date cell, a detail cell and a category cell. */
  const row = (weekday, year, range, name) => [
    `<p>${weekday}</p><p>${year}</p><p>${range}</p><p>Cincinnati, OH</p>`,
    `<h2>${name}</h2><p>Continental Tire will be on-site.</p>`,
    '<p>Major League Soccer</p>',
  ];

  const build = (rows) => {
    document.body.innerHTML = `
      <main><div class="section"><div class="events block">
        ${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}
      </div></div></main>`;
    const block = document.querySelector('.events.block');
    decorate(block);
    return block;
  };

  const names = (block) => [...block.querySelectorAll('.events-name')].map((h) => h.textContent);
  const monthOptions = (block) => [...block.querySelectorAll('.events-filter input[name="month"] + label')]
    .map((l) => l.textContent);

  // 2026 Aug 02, the day the sheet was read
  beforeEach(() => {
    clock = sinon.useFakeTimers({ now: new Date(2026, 7, 2, 11, 30), toFake: ['Date'] });
  });
  afterEach(() => { clock.restore(); sinon.restore(); });

  it('drops the two rows that had ended, and keeps the rest', () => {
    const block = build([
      row('Wednesday', 2026, 'Jul 29–29', 'MLS Activation: Cincinnati vs. San Jose'),
      row('Saturday', 2026, 'Aug 01–01', 'MLS Activation: Seattle'),
      row('Thursday', 2026, 'Aug 06–09', 'USF Pro 2000 Race'),
      row('Saturday', 2026, 'Nov 07–07', 'MLS Activation: Miami'),
    ]);
    expect(names(block)).to.deep.equal(['USF Pro 2000 Race', 'MLS Activation: Miami']);
  });

  it('keeps an event that ends today', () => {
    const block = build([row('Sunday', 2026, 'Aug 02–02', 'Today only')]);
    expect(names(block), 'still on today').to.deep.equal(['Today only']);
  });

  it('keeps a multi-day event halfway through', () => {
    const block = build([
      row('Thursday', 2026, 'Jul 30–05', 'Started in July, runs to the 5th'),
      row('Friday', 2026, 'Jul 24–26', 'Over in July'),
    ]);
    expect(names(block)).to.deep.equal(['Started in July, runs to the 5th']);
  });

  it('reads the en dash the sheet actually uses, and a hyphen too', () => {
    const block = build([
      row('Thursday', 2026, 'Aug 01–09', 'En dash, ends the 9th'),
      row('Thursday', 2026, 'Aug 01-09', 'Hyphen, ends the 9th'),
      row('Thursday', 2026, 'Aug 01–01', 'En dash, ended the 1st'),
    ]);
    expect(names(block)).to.deep.equal(['En dash, ends the 9th', 'Hyphen, ends the 9th']);
  });

  it('reads a single day with no range at all', () => {
    const block = build([
      row('Sunday', 2026, 'Aug 16', 'One day, later'),
      row('Sunday', 2026, 'Jul 26', 'One day, gone'),
    ]);
    expect(names(block)).to.deep.equal(['One day, later']);
  });

  it('drops before the facet is built, so the facet and the list agree', () => {
    const block = build([
      row('Wednesday', 2026, 'Jul 29–29', 'The only July event'),
      row('Thursday', 2026, 'Aug 06–09', 'An August event'),
      row('Saturday', 2026, 'Sep 05–05', 'A September event'),
    ]);
    expect(monthOptions(block), 'July has nothing left to offer').to.deep.equal(['August 2026', 'September 2026']);
    expect(block.querySelector('.events-count').textContent, 'and the count is of what is listed').to.equal('2 Results');
  });

  it('keeps an event whose pill names no date, which cannot be shown to be over', () => {
    const block = build([[
      '<p>Cincinnati, OH</p>',
      '<h2>Undated</h2><p>No pill.</p>',
      '<p>Major League Soccer</p>',
    ]]);
    expect(names(block)).to.deep.equal(['Undated']);
  });

  it('drops a whole earlier year', () => {
    const block = build([
      row('Saturday', 2025, 'Dec 31–31', 'Last year'),
      row('Saturday', 2027, 'Jan 02–02', 'Next year'),
    ]);
    expect(names(block)).to.deep.equal(['Next year']);
  });

  it('reads a spelled-out or dotted month', () => {
    const block = build([
      row('Thursday', 2026, 'Sept. 24–26', 'Late September'),
      row('Thursday', 2026, 'July 24–26', 'Late July'),
    ]);
    expect(names(block)).to.deep.equal(['Late September']);
  });
});
