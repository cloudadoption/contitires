/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/events/events.js';

/**
 * Live puts a filter beside the calendar: an Event type fieldset holding one
 * checkbox per event type, an Event Date fieldset holding one per month, and a
 * results header counting what is left. Read off continentaltire.com/events on
 * 2026-07-29, and its semantics read off the filtered URLs it serves:
 * `event_type[162]=162` alone returns 3 of 30, adding `event_type[165]=165`
 * returns 4, and `event_type[162]=162&month[]=oct-2026` returns 1. So boxes in
 * one fieldset are OR and the two fieldsets are AND. Issue #258.
 */
const SAMPLE = [
  ['Wednesday', '2026', 'Jul 29–29', 'Cincinnati, OH',
    'MLS Activation: Cincinnati vs. San Jose', 'Major League Soccer'],
  ['Thursday', '2026', 'Aug 06–09', 'Portland International Raceway - Portland, OR',
    'USF Pro 2000', 'USF Pro Championships'],
  ['Thursday', '2026', 'Aug 13–13', 'Pacific Grove, CA',
    'Legends of the Autobahn', 'BMW Car Club of America'],
  ['Monday', '2026', 'Aug 24–29', 'Charlotte, NC',
    'Mustang Week', ''],
  ['Friday', '2026', 'Aug 28–30', 'Elkhart Lake, WI',
    'TRD GR Cup: Rounds 9 & 10', 'Racing'],
  ['Friday', '2026', 'Oct 09–11', 'Indianapolis, IN',
    'TRD GR Cup: Rounds 13 & 14', 'Racing'],
];

function row([day, year, range, venue, name, category]) {
  const date = `<p>${day}</p><p>${year}</p><p>${range}</p><p>${venue}</p>`;
  const detail = `<h2>${name}</h2><p>Come and see us.</p>`;
  const type = category ? `<p>${category}</p>` : '';
  return `<div><div>${date}</div><div>${detail}</div><div>${type}</div></div>`;
}

function buildEvents(rows = SAMPLE) {
  document.body.innerHTML = `
    <main>
      <div class="section">
        <div class="events block">${rows.map(row).join('')}</div>
      </div>
    </main>`;
  return document.querySelector('.events.block');
}

/** The labels of a fieldset's checkboxes, in the order the block built them. */
function options(block, legend) {
  const group = [...block.querySelectorAll('fieldset')]
    .find((f) => f.querySelector('legend').textContent.trim() === legend);
  return [...group.querySelectorAll('label')].map((l) => l.textContent.trim());
}

/** Ticks a box by its visible label and fires the event a click would. */
function check(block, label) {
  const box = [...block.querySelectorAll('label')]
    .find((l) => l.textContent.trim() === label)
    .control;
  box.checked = true;
  box.dispatchEvent(new Event('change', { bubbles: true }));
}

/** The names of the events a reader can still see. */
function shown(block) {
  return [...block.querySelectorAll('ul > li')]
    .filter((li) => !li.hidden)
    .map((li) => li.querySelector('.events-name').textContent.trim());
}

describe('Events filter, the panel live puts beside the calendar', () => {
  let block;
  beforeEach(() => { block = buildEvents(); });

  it('heads the panel the way live does', () => {
    decorate(block);
    const panel = block.querySelector('.events-filter');
    expect(panel, 'the filter panel').to.exist;
    expect(panel.querySelector('h2').textContent.trim()).to.equal('Filter Events By');
  });

  it('offers each event type once, alphabetically, as live lists them', () => {
    decorate(block);
    expect(options(block, 'Event type')).to.eql([
      'BMW Car Club of America',
      'Major League Soccer',
      'Racing',
      'USF Pro Championships',
    ]);
  });

  it('offers each month once, in calendar order', () => {
    decorate(block);
    expect(options(block, 'Event Date')).to.eql(['July 2026', 'August 2026', 'October 2026']);
  });

  // the pill's parts are told apart by what they hold, so the month is too
  it('reads the month off the pill whatever order the author wrote it in', () => {
    document.body.innerHTML = `
      <main><div class="section"><div class="events block"><div>
        <div><p>Indianapolis, IN</p><p>Oct 09–11</p><p>2026</p><p>Friday</p></div>
        <div><h2>TRD GR Cup</h2><p>Come and see us.</p></div>
        <div><p>Racing</p></div>
      </div></div></div></main>`;
    const b = document.querySelector('.events.block');
    decorate(b);
    expect(options(b, 'Event Date')).to.eql(['October 2026']);
  });

  it('counts the events the way live heads its results', () => {
    decorate(block);
    expect(block.querySelector('.events-count').textContent.trim()).to.equal('6 Results');
  });

  it('says Result, not Results, when one is left', () => {
    const b = buildEvents([SAMPLE[0]]);
    decorate(b);
    expect(b.querySelector('.events-count').textContent.trim()).to.equal('1 Result');
  });

  it('announces the count when it changes', () => {
    decorate(block);
    expect(block.querySelector('.events-count').getAttribute('aria-live')).to.equal('polite');
  });
});

describe('Events filter, what a reader is left with', () => {
  let block;
  beforeEach(() => { block = buildEvents(); decorate(block); });

  it('shows only the checked type', () => {
    check(block, 'Racing');
    expect(shown(block)).to.eql(['TRD GR Cup: Rounds 9 & 10', 'TRD GR Cup: Rounds 13 & 14']);
    expect(block.querySelector('.events-count').textContent.trim()).to.equal('2 Results');
  });

  it('adds up two types rather than intersecting them', () => {
    check(block, 'Racing');
    check(block, 'BMW Car Club of America');
    expect(shown(block)).to.eql([
      'Legends of the Autobahn',
      'TRD GR Cup: Rounds 9 & 10',
      'TRD GR Cup: Rounds 13 & 14',
    ]);
    expect(block.querySelector('.events-count').textContent.trim()).to.equal('3 Results');
  });

  it('intersects a type with a month', () => {
    check(block, 'Racing');
    check(block, 'August 2026');
    expect(shown(block)).to.eql(['TRD GR Cup: Rounds 9 & 10']);
    expect(block.querySelector('.events-count').textContent.trim()).to.equal('1 Result');
  });

  // live carries one event with no type at all, Mustang Week, and drops it
  // from every filtered view
  it('drops an event that carries no type once a type is checked', () => {
    check(block, 'Racing');
    expect(shown(block)).to.not.contain('Mustang Week');
    check(block, 'August 2026');
    expect(shown(block)).to.not.contain('Mustang Week');
  });

  it('keeps an event that carries no type when only a month is checked', () => {
    check(block, 'August 2026');
    expect(shown(block)).to.contain('Mustang Week');
  });

  it('shows nothing, and says so, when the two fieldsets do not meet', () => {
    check(block, 'BMW Car Club of America');
    check(block, 'October 2026');
    expect(shown(block)).to.eql([]);
    expect(block.querySelector('.events-count').textContent.trim()).to.equal('0 Results');
  });

  it('gives the whole calendar back on reset', () => {
    check(block, 'Racing');
    check(block, 'October 2026');
    block.querySelector('.events-filter-reset').click();
    expect(shown(block)).to.have.length(6);
    expect(block.querySelector('.events-count').textContent.trim()).to.equal('6 Results');
    expect(block.querySelectorAll('input:checked')).to.have.length(0);
  });
});

describe('Events filter, the panel below live\'s 769', () => {
  it('stands the panel open beside the calendar on a wide viewport', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildEvents();
    decorate(block);
    expect(block.querySelector('.events-filter').hidden, 'the panel is open').to.be.false;
  });

  it('folds the panel behind a button on a narrow one, as live does', async () => {
    await setViewport({ width: 375, height: 800 });
    const block = buildEvents();
    decorate(block);
    const toggle = block.querySelector('.events-filter-toggle');
    expect(toggle, 'the show-filter button').to.exist;
    expect(toggle.textContent.trim()).to.equal('Show filter');
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
    expect(block.querySelector('.events-filter').hidden, 'closed to start').to.be.true;

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).to.equal('true');
    expect(block.querySelector('.events-filter').hidden, 'open once pressed').to.be.false;
  });
});
