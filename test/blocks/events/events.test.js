/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/events/events.js';

/**
 * Live renders an event as a two-part card: an orange band carrying the
 * weekday, the year, the date range and the venue with a pin, beside the
 * event's name, description, category and link. Read off
 * continentaltire.com/events at 1440 and 375. Issue #99.
 */
const SAMPLE = [
  [
    '<p>Wednesday</p><p>2026</p><p>Jul 29–29</p><p>Cincinnati, OH</p>',
    '<h2>MLS Activation: Cincinnati vs. San Jose</h2>'
      + '<p>Continental Tire will be on-site for Cincinnati vs. San Jose.</p>',
    '<p>Major League Soccer</p>',
  ],
  [
    '<p>Thursday</p><p>2026</p><p>Aug 06–09</p>'
      + '<p>Portland International Raceway - Portland, OR</p>',
    '<h2>USF Pro 2000 &amp; USF 200 Race</h2>'
      + '<p>Portland International Raceway | 1.964-Mile | 12-Turn Road Course</p>'
      + '<p><a href="https://www.usfprochampionships.info/">More details</a></p>',
    '<p>USF Pro Championships</p>',
  ],
];

function buildEvents(rows = SAMPLE) {
  document.body.innerHTML = `
    <main>
      <div class="section">
        <div class="events block">
          ${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}
        </div>
      </div>
    </main>`;
  return document.querySelector('.events.block');
}

describe('Events block, the card', () => {
  let block;
  beforeEach(() => { block = buildEvents(); });

  it('makes one card of each authored row', () => {
    decorate(block);
    const cards = block.querySelectorAll('ul > li');
    expect(cards).to.have.length(2);
    expect(cards[0].querySelector('.events-date'), 'the date band').to.exist;
    expect(cards[0].querySelector('.events-detail'), 'the detail column').to.exist;
  });

  it('lists the events, so a reader is told how many there are', () => {
    decorate(block);
    expect(block.querySelector('ul'), 'a list').to.exist;
    expect(block.querySelector('ul').children).to.have.length(2);
  });

  it('splits the pill into the weekday, the year and the range', () => {
    decorate(block);
    const pill = block.querySelector('.events-pill');
    expect(pill.querySelector('.events-day').textContent).to.equal('Wednesday');
    expect(pill.querySelector('.events-year').textContent).to.equal('2026');
    expect(pill.querySelector('.events-range').textContent).to.equal('Jul 29–29');
  });

  // the pill's parts are told apart by what they hold, so an author can write
  // them in any order and leave any of them out
  it('reads the pill by what each line holds, not by its position', () => {
    const shuffled = [[
      '<p>Cincinnati, OH</p><p>Jul 29–29</p><p>2026</p><p>Wednesday</p>',
      '<h2>MLS Activation: Cincinnati vs. San Jose</h2><p>On site.</p>',
      '<p>Major League Soccer</p>',
    ]];
    const b = buildEvents(shuffled);
    decorate(b);
    expect(b.querySelector('.events-day').textContent).to.equal('Wednesday');
    expect(b.querySelector('.events-year').textContent).to.equal('2026');
    expect(b.querySelector('.events-range').textContent).to.equal('Jul 29–29');
    expect(b.querySelector('.events-location').textContent).to.contain('Cincinnati, OH');
  });

  // the pin is chrome, so the block draws it rather than the author. Live's
  // own mark: a white teardrop outlined dark, with an orange dot.
  it('marks the venue with live\'s pin', () => {
    decorate(block);
    const location = block.querySelector('.events-location');
    const icon = location.querySelector('span.icon.icon-pin-outline');
    expect(icon, 'pin icon').to.exist;
    expect(icon.querySelector('img').getAttribute('src')).to.equal('/icons/pin-outline.svg');
    expect(location.textContent.trim()).to.equal('Cincinnati, OH');
  });

  it('keeps the event name as the card\'s heading', () => {
    decorate(block);
    const name = block.querySelector('.events-name');
    expect(name.tagName).to.equal('H2');
    expect(name.textContent).to.equal('MLS Activation: Cincinnati vs. San Jose');
  });

  it('holds the description apart from the name', () => {
    decorate(block);
    const description = block.querySelector('.events-description');
    expect(description.textContent).to.contain('will be on-site');
    expect(description.querySelector('h2'), 'no heading in the description').to.not.exist;
  });

  it('puts the category in the card\'s footer', () => {
    decorate(block);
    const footer = block.querySelector('.events-footer');
    expect(footer.querySelector('.events-category').textContent).to.equal('Major League Soccer');
  });

  it('makes the details link a button beside the category', () => {
    decorate(block);
    const cta = block.querySelectorAll('ul > li')[1].querySelector('.events-cta a');
    expect(cta, 'the call to action').to.exist;
    expect(cta.classList.contains('button')).to.be.true;
    expect(cta.getAttribute('href')).to.equal('https://www.usfprochampionships.info/');
    expect(cta.closest('.events-footer'), 'sits in the footer').to.exist;
  });
});

describe('Events block, what an author leaves out', () => {
  it('drops the footer when there is neither a category nor a link', () => {
    const block = buildEvents([[
      '<p>Wednesday</p><p>2026</p><p>Jul 29–29</p><p>Cincinnati, OH</p>',
      '<h2>MLS Activation</h2><p>On site.</p>',
      '',
    ]]);
    decorate(block);
    expect(block.querySelector('.events-category')).to.not.exist;
    expect(block.querySelector('.events-footer')).to.not.exist;
    expect(block.querySelector('.events-name'), 'the card still builds').to.exist;
  });

  it('builds the pill without a year or a weekday', () => {
    const block = buildEvents([[
      '<p>Jul 29–29</p><p>Cincinnati, OH</p>',
      '<h2>MLS Activation</h2><p>On site.</p>',
      '<p>Major League Soccer</p>',
    ]]);
    decorate(block);
    expect(block.querySelector('.events-range').textContent).to.equal('Jul 29–29');
    expect(block.querySelector('.events-day')).to.not.exist;
    expect(block.querySelector('.events-year')).to.not.exist;
    expect(block.querySelector('.events-location').textContent).to.contain('Cincinnati, OH');
  });

  it('builds a card with only a name', () => {
    const block = buildEvents([['', '<h2>MLS Activation</h2>', '']]);
    decorate(block);
    expect(block.querySelectorAll('ul > li')).to.have.length(1);
    expect(block.querySelector('.events-name').textContent).to.equal('MLS Activation');
    expect(block.querySelector('.events-location')).to.not.exist;
  });
});

/**
 * Live's numbers, read off the rendered page. At 1440 the card is a 256
 * column beside the rest, rounded 10 and shadowed; the band is orange and
 * padded 32/24/20, the range runs 42 over a 12 weekday and year, and the
 * detail column is padded 32 26 20 32 with the name at 24/26. At 375 the card
 * stacks, the range drops to 32 with the weekday and year beside it, and the
 * footer stands the category over a full-width button.
 */
describe('Events block, live\'s measurements', () => {
  let block;

  async function adopt(...paths) {
    const sheets = await Promise.all(paths.map(async (p) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(p)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
  }

  before(async () => {
    await adopt('/styles/styles.css', '/blocks/events/events.css');
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
  });

  beforeEach(() => {
    block = buildEvents();
    decorate(block);
  });

  it('sets a 256 band beside the rest at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const card = block.querySelector('ul > li');
    const band = card.querySelector('.events-date');
    const detail = card.querySelector('.events-detail');
    expect(Math.round(band.getBoundingClientRect().width)).to.equal(256);
    expect(Math.round(detail.getBoundingClientRect().left
      - band.getBoundingClientRect().right)).to.equal(0);
    expect(Math.round(band.getBoundingClientRect().height))
      .to.equal(Math.round(card.getBoundingClientRect().height));
  });

  it('rounds and shadows the card, and leaves 20 to the next', async () => {
    await setViewport({ width: 1440, height: 900 });
    const cards = block.querySelectorAll('ul > li');
    const styles = getComputedStyle(cards[0]);
    expect(styles.borderRadius).to.equal('10px');
    expect(styles.boxShadow).to.equal('rgba(0, 0, 0, 0.1) 0px 0px 40px 0px');
    expect(styles.overflow).to.equal('hidden');
    expect(Math.round(cards[1].getBoundingClientRect().top
      - cards[0].getBoundingClientRect().bottom)).to.equal(20);
  });

  it('paints the band orange and pads it 32 over and 20 under at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const band = block.querySelector('.events-date');
    const styles = getComputedStyle(band);
    expect(styles.backgroundColor).to.equal('rgb(255, 165, 0)');
    expect(styles.padding).to.equal('32px 24px 20px');
  });

  it('runs the range 42 under a 12 weekday and year at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const day = block.querySelector('.events-day');
    const year = block.querySelector('.events-year');
    const range = block.querySelector('.events-range');
    expect(getComputedStyle(day).fontSize).to.equal('12px');
    expect(getComputedStyle(day).letterSpacing).to.equal('1.75px');
    expect(getComputedStyle(day).textTransform).to.equal('uppercase');
    expect(getComputedStyle(range).fontSize).to.equal('42px');
    expect(getComputedStyle(range).lineHeight).to.equal('42px');
    expect(getComputedStyle(range).fontWeight).to.equal('400');
    // the year closes the pill's own width, opposite the weekday
    expect(Math.round(year.getBoundingClientRect().right))
      .to.equal(Math.round(block.querySelector('.events-pill').getBoundingClientRect().right));
    expect(Math.round(range.getBoundingClientRect().height)).to.equal(42);
  });

  it('sets the venue at 14 over 22 beside an 18 pin', async () => {
    await setViewport({ width: 1440, height: 900 });
    const location = block.querySelector('.events-location');
    const icon = location.querySelector('.icon');
    const styles = getComputedStyle(location);
    expect(styles.fontSize).to.equal('14px');
    expect(styles.lineHeight).to.equal('22px');
    expect(styles.letterSpacing).to.equal('0.5px');
    expect(styles.fontWeight).to.equal('700');
    expect(Math.round(icon.getBoundingClientRect().width)).to.equal(18);
    expect(Math.round(icon.getBoundingClientRect().height)).to.equal(18);
  });

  it('pads the detail column 32 26 20 32 and names the event at 24 over 26', async () => {
    await setViewport({ width: 1440, height: 900 });
    const detail = block.querySelector('.events-detail');
    const name = block.querySelector('.events-name');
    const description = block.querySelector('.events-description');
    expect(getComputedStyle(detail).padding).to.equal('32px 26px 20px 32px');
    expect(getComputedStyle(name).fontSize).to.equal('24px');
    expect(getComputedStyle(name).lineHeight).to.equal('26px');
    expect(getComputedStyle(name).fontWeight).to.equal('300');
    expect(getComputedStyle(description).fontSize).to.equal('15px');
    expect(getComputedStyle(description).lineHeight).to.equal('22px');
    expect(getComputedStyle(description).fontWeight).to.equal('700');
    expect(Math.round(description.getBoundingClientRect().top
      - name.getBoundingClientRect().bottom)).to.equal(12);
  });

  it('sinks the footer to the foot of the card at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const footer = block.querySelector('.events-footer');
    const detail = block.querySelector('.events-detail');
    expect(getComputedStyle(footer).minHeight).to.equal('44px');
    expect(Math.round(detail.getBoundingClientRect().bottom
      - footer.getBoundingClientRect().bottom)).to.equal(20);
  });

  it('sets the category on a grey chip at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const category = block.querySelector('.events-category');
    const styles = getComputedStyle(category);
    expect(styles.backgroundColor).to.equal('rgb(233, 233, 233)');
    expect(styles.borderRadius).to.equal('4px');
    expect(styles.fontSize).to.equal('12px');
    expect(styles.letterSpacing).to.equal('1.25px');
    expect(styles.textTransform).to.equal('uppercase');
    expect(Math.round(category.getBoundingClientRect().height)).to.equal(24);
  });

  it('rings the details button in yellow on white at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const cta = block.querySelectorAll('ul > li')[1].querySelector('.events-cta a');
    const styles = getComputedStyle(cta);
    expect(styles.borderColor).to.equal('rgb(255, 165, 0)');
    expect(styles.backgroundColor).to.equal('rgb(255, 255, 255)');
    expect(styles.color).to.equal('rgb(51, 51, 51)');
    expect(styles.borderRadius).to.equal('26px');
    expect(Math.round(cta.getBoundingClientRect().height)).to.equal(45);
  });

  it('stacks the card and pads the band 20 16 12 12 at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    const card = block.querySelector('ul > li');
    const band = card.querySelector('.events-date');
    const detail = card.querySelector('.events-detail');
    expect(getComputedStyle(band).padding).to.equal('20px 16px 12px 12px');
    expect(Math.round(band.getBoundingClientRect().width))
      .to.equal(Math.round(card.getBoundingClientRect().width));
    expect(Math.round(detail.getBoundingClientRect().top
      - band.getBoundingClientRect().bottom)).to.equal(0);
    expect(Math.round(band.getBoundingClientRect().height)).to.equal(98);
  });

  it('sets the range at 32 with the weekday over the year beside it at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    const pill = block.querySelector('.events-pill');
    const range = block.querySelector('.events-range');
    const day = block.querySelector('.events-day');
    const year = block.querySelector('.events-year');
    expect(getComputedStyle(range).fontSize).to.equal('32px');
    expect(getComputedStyle(range).lineHeight).to.equal('32px');
    const left = range.getBoundingClientRect();
    const right = day.getBoundingClientRect();
    expect(left.right, 'the range opens the pill').to.be.below(right.left);
    expect(Math.round(right.right)).to.equal(Math.round(pill.getBoundingClientRect().right));
    expect(Math.round(year.getBoundingClientRect().top - right.bottom)).to.equal(4);
    expect(getComputedStyle(day).textAlign).to.equal('right');
  });

  it('names the event at 20 over 24 and pads the detail 12 at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    const name = block.querySelector('.events-name');
    expect(getComputedStyle(block.querySelector('.events-detail')).padding).to.equal('12px');
    expect(getComputedStyle(name).fontSize).to.equal('20px');
    expect(getComputedStyle(name).lineHeight).to.equal('24px');
  });

  it('stands the category over a full-width button at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    const card = block.querySelectorAll('ul > li')[1];
    const footer = card.querySelector('.events-footer');
    const category = card.querySelector('.events-category');
    const cta = card.querySelector('.events-cta a');
    expect(getComputedStyle(category).fontSize).to.equal('10px');
    expect(Math.round(category.getBoundingClientRect().height)).to.equal(22);
    expect(cta.getBoundingClientRect().top, 'the button is under the chip')
      .to.be.above(category.getBoundingClientRect().bottom);
    expect(Math.round(cta.getBoundingClientRect().width))
      .to.equal(Math.round(footer.getBoundingClientRect().width));
  });
});
