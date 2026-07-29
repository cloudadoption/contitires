/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { sendKeys, setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/tire-features/tire-features.js';

/**
 * Live draws the SecureContact AW as an annotated tire: four cards down the
 * left, and beside them the tire itself with rings on the parts each card
 * claims. A card opens its own drawing. Live's markup is
 * paragraph--type--tire-features-slider, con-features-slider over four
 * data-panel drawings and eight callouts.
 *
 * Read off continentaltire.com/all-new-securecontact-aw at 1440, 1200, 1181,
 * 1180, 900, 768 and 375. The drawing is 460 by 600 beside a 280 wide note
 * column, the ring is 98 across, and the note stands 47 under the ring it
 * names. Live moves the whole thing to one column under 1181. Issue #255.
 *
 * A ring is placed by the percentages authored beside its words, so the same
 * numbers hold at every width without measuring anything.
 */
const card = (title, text, icon) => `<div>
    ${icon ? `<picture><img src="${icon}" alt=""></picture>` : ''}
    <h3>${title}</h3><p>${text}</p>
  </div>`;

const note = (title, text, place) => `<div>
    <h4>${title}</h4><p>${text}</p>${place ? `<p>${place}</p>` : ''}
  </div>`;

const panel = (src, alt) => `<div><picture><img src="${src}" alt="${alt}"></picture></div>`;

/** The block in the shape the pipeline delivers, on live's black band. */
const authored = (rows) => {
  document.body.innerHTML = '<main><div class="black section"><div class="tire-features-wrapper">'
    + `<div class="tire-features block" data-block-name="tire-features">${rows.join('')}</div>`
    + '</div></div></main>';
  return document.querySelector('.tire-features.block');
};

/** The head of live's page: two of its four features, four of its eight rings. */
const features = () => authored([
  `<div>
    ${panel('/media/tire-1.webp', 'EcoPlus Technology')}
    ${card('EcoPlus Technology', 'Lower fuel consumption, reduced CO2 emissions, cost savings over time.')}
    ${note('Temperature-activated Tg-F Polymers', 'improve molecular bonding in the rubber for longer tread life.', '30.4, 22.8')}
    ${note('+Silane additive', 'boosts grip in wet or slippery conditions, helping to reduce stopping distances.', '17.4, 49')}
  </div>`,
  `<div>
    ${panel('/media/tire-2.webp', '3-Peak Mountain Snowflake Rating')}
    ${card('3-Peak Mountain Snowflake Rating', 'Lab-certified performance in severe snow conditions.')}
    ${note('Variable-angle sipes', 'create more edges and more friction to bite into snow and ice.', '18.4, 26.5')}
    ${note('Elasticity stabilizers', 'do not stiffen in deep cold to stay soft and grippy below 45F.', '40.1, 91.5, down')}
  </div>`,
]);

describe('Tire features, the drawing behind each claim', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '';
    decorate(block = features());
  });

  it('names every feature on a card in one bar', () => {
    const list = block.querySelector('.tire-features-list');
    expect(list.getAttribute('role')).to.equal('tablist');
    const cards = [...list.querySelectorAll('.tire-features-card')];
    expect(cards.map((c) => c.querySelector('h3').textContent)).to.eql([
      'EcoPlus Technology',
      '3-Peak Mountain Snowflake Rating',
    ]);
    cards.forEach((c) => {
      expect(c.tagName).to.equal('BUTTON');
      expect(c.getAttribute('role')).to.equal('tab');
    });
  });

  it('opens the first feature and hides the rest', () => {
    const cards = [...block.querySelectorAll('.tire-features-card')];
    const panels = [...block.querySelectorAll('.tire-features-panel')];
    expect(panels.length).to.equal(2);
    expect(cards[0].getAttribute('aria-selected')).to.equal('true');
    expect(cards[1].getAttribute('aria-selected')).to.equal('false');
    expect(panels[0].hidden).to.be.false;
    expect(panels[1].hidden).to.be.true;
    expect(cards[0].getAttribute('aria-controls')).to.equal(panels[0].id);
  });

  it('opens the drawing the card names', () => {
    const cards = [...block.querySelectorAll('.tire-features-card')];
    const panels = [...block.querySelectorAll('.tire-features-panel')];
    cards[1].click();
    expect(panels[1].hidden).to.be.false;
    expect(panels[0].hidden).to.be.true;
    expect(cards[1].getAttribute('aria-selected')).to.equal('true');
  });

  // live leaves its own cards without a tablist and without arrow handling
  it('keeps one stop in the tab order and walks the bar on the arrows', async () => {
    const cards = [...block.querySelectorAll('.tire-features-card')];
    expect(cards.map((c) => c.tabIndex)).to.eql([0, -1]);
    cards[0].focus();
    await sendKeys({ press: 'ArrowRight' });
    expect(document.activeElement).to.equal(cards[1]);
    expect(cards[1].getAttribute('aria-selected')).to.equal('true');
    await sendKeys({ press: 'ArrowRight' });
    expect(document.activeElement, 'the bar wraps').to.equal(cards[0]);
    await sendKeys({ press: 'End' });
    expect(document.activeElement).to.equal(cards[1]);
  });

  it('carries the words of every ring into its own drawing', () => {
    const panels = [...block.querySelectorAll('.tire-features-panel')];
    const names = (p) => [...p.querySelectorAll('.tire-features-note h4')].map((h) => h.textContent);
    expect(names(panels[0])).to.eql(['Temperature-activated Tg-F Polymers', '+Silane additive']);
    expect(names(panels[1])).to.eql(['Variable-angle sipes', 'Elasticity stabilizers']);
    expect(panels[0].querySelector('.tire-features-note p').textContent)
      .to.contain('molecular bonding');
  });

  it('places a ring at the percentages authored with its words', () => {
    const marks = [...block.querySelectorAll('.tire-features-panel')[0]
      .querySelectorAll('.tire-features-mark')];
    expect(marks.length).to.equal(2);
    expect(marks[0].style.getPropertyValue('--x')).to.equal('30.4%');
    expect(marks[0].style.getPropertyValue('--y')).to.equal('22.8%');
    expect(marks[1].style.getPropertyValue('--x')).to.equal('17.4%');
    expect(marks[1].style.getPropertyValue('--y')).to.equal('49%');
  });

  // the placement paragraph is the ring's, never a line the reader should see
  it('takes the placement out of the words', () => {
    const first = block.querySelector('.tire-features-note');
    expect(first.textContent).to.not.contain('30.4');
    expect(first.querySelectorAll('p').length).to.equal(1);
  });

  it('hangs a ring the other way when the placement says down', () => {
    const panels = [...block.querySelectorAll('.tire-features-panel')];
    const marks = [...panels[1].querySelectorAll('.tire-features-mark')];
    expect(marks[0].classList.contains('tire-features-down')).to.be.false;
    expect(marks[1].classList.contains('tire-features-down')).to.be.true;
    const notes = [...panels[1].querySelectorAll('.tire-features-note')];
    expect(notes[1].classList.contains('tire-features-down')).to.be.true;
  });

  it('widens a ring the placement gives a size', () => {
    const b = authored([`<div>
      ${panel('/media/tire-3.webp', 'Best-In-Class Wet Braking')}
      ${card('Best-In-Class Wet Braking', 'Outperforms premium tire competitors.')}
      ${note('High-silica compounds', 'boost wet braking on slick surfaces.', '22.8, 81.2, down, 1.5')}
    </div>`]);
    decorate(b);
    const mark = b.querySelector('.tire-features-mark');
    expect(mark.style.getPropertyValue('--ring')).to.equal('1.5');
    expect(mark.classList.contains('tire-features-down')).to.be.true;
  });

  it('leaves a note without a placement standing, and draws it no ring', () => {
    const b = authored([`<div>
      ${panel('/media/tire-4.webp', 'Visual Performance Indicators')}
      ${card('Visual Performance Indicators', 'Clear feedback on traction and wear.')}
      ${note('Tuned Performance Indicators', 'D, W and S symbols disappear when the tire is no longer tuned.')}
    </div>`]);
    decorate(b);
    expect(b.querySelectorAll('.tire-features-mark').length).to.equal(0);
    expect(b.querySelector('.tire-features-note h4').textContent)
      .to.equal('Tuned Performance Indicators');
  });

  // live's rings are divs with a click handler, so a keyboard never reaches a
  // one of them and the words behind them are lost under 1181
  it('leaves nothing but the cards in the tab order', () => {
    const stops = [...block.querySelectorAll('a, button, [tabindex]')]
      .filter((el) => el.tabIndex >= 0);
    expect(stops.length).to.equal(1);
    expect(stops[0].classList.contains('tire-features-card')).to.be.true;
    block.querySelectorAll('.tire-features-mark, .tire-features-line')
      .forEach((el) => expect(el.getAttribute('aria-hidden')).to.equal('true'));
  });

  it('takes the icon a card is given', () => {
    const b = authored([`<div>
      ${panel('/media/tire-1.webp', 'EcoPlus Technology')}
      ${card('EcoPlus Technology', 'Lower fuel consumption.', '/media/icon-1.svg')}
    </div>`]);
    decorate(b);
    const icon = b.querySelector('.tire-features-card .tire-features-card-icon');
    expect(icon).to.not.be.null;
    expect(icon.querySelector('img').getAttribute('src')).to.contain('icon-1');
    expect(b.querySelector('.tire-features-card h3').textContent).to.equal('EcoPlus Technology');
  });
});

describe('Tire features, live\'s measurements', () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/tire-features/tire-features.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => { document.body.classList.remove('appear'); });

  beforeEach(() => { document.body.innerHTML = ''; });

  const open = () => block.querySelector('.tire-features-panel:not([hidden])');
  const box = (el) => el.getBoundingClientRect();

  it('stands the cards beside a 460 by 600 drawing at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = features());
    const figure = open().querySelector('.tire-features-figure');
    expect(Math.round(box(figure).width)).to.equal(460);
    expect(Math.round(box(figure).height)).to.equal(600);
    const list = block.querySelector('.tire-features-list');
    expect(Math.round(box(list).right), 'the bar is left of the drawing')
      .to.be.below(Math.round(box(figure).left));
    expect(Math.round(box(list).top)).to.equal(Math.round(box(list).top));
  });

  it('rings the point the percentages name', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = features());
    const figure = open().querySelector('.tire-features-figure');
    const mark = open().querySelector('.tire-features-mark');
    const f = box(figure);
    const m = box(mark);
    // the ring is 98 across and centred on the point
    expect(Math.round(m.width)).to.equal(98);
    expect(Math.round(m.left + m.width / 2 - f.left)).to.equal(Math.round(0.304 * 460));
    expect(Math.round(m.top + m.height / 2 - f.top)).to.equal(Math.round(0.228 * 600));
  });

  it('stands live\'s 280 note column beside the drawing at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = features());
    const figure = open().querySelector('.tire-features-figure');
    const note1 = open().querySelector('.tire-features-note');
    expect(Math.round(box(note1).width)).to.equal(280);
    expect(Math.round(box(note1).left - box(figure).left)).to.equal(520);
    // live rests the words 47 under the ring they name
    const mark = open().querySelector('.tire-features-mark');
    expect(Math.round(box(note1).top - (box(mark).top + box(mark).height / 2))).to.equal(47);
  });

  it('runs the line from the ring to the words', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = features());
    const figure = open().querySelector('.tire-features-figure');
    const line = open().querySelector('.tire-features-line');
    const note1 = open().querySelector('.tire-features-note');
    expect(Math.round(box(line).height)).to.equal(2);
    expect(Math.round(box(line).right)).to.be.closeTo(Math.round(box(note1).left), 6);
    expect(Math.round(box(line).left - box(figure).left)).to.equal(Math.round(0.304 * 460) + 56);
  });

  it('gives a card live\'s type, and dims the ones that are closed', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = features());
    const cards = [...block.querySelectorAll('.tire-features-card')];
    const title = (c) => getComputedStyle(c.querySelector('h3'));
    expect(title(cards[0]).fontSize).to.equal('20px');
    expect(title(cards[0]).lineHeight).to.equal('26px');
    expect(title(cards[0]).fontWeight).to.equal('400');
    expect(title(cards[0]).color, 'the open card is named in yellow').to.equal('rgb(255, 165, 0)');
    expect(title(cards[1]).color).to.equal('rgb(255, 255, 255)');
    expect(getComputedStyle(cards[1]).opacity).to.equal('0.4');
    expect(getComputedStyle(cards[0]).opacity).to.equal('1');
  });

  // live drops the words under 1181 and only a tap brings one back
  it('gives the drawing the width and stands every note under it at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = features());
    const figure = open().querySelector('.tire-features-figure');
    const notes = [...open().querySelectorAll('.tire-features-note')];
    expect(Math.round(box(figure).width)).to.be.above(300);
    notes.forEach((n) => {
      expect(getComputedStyle(n).display, 'the words are read, not tapped for').to.not.equal('none');
      expect(box(n).top).to.be.above(box(figure).top);
    });
    expect(Math.round(box(notes[1]).top)).to.be.above(Math.round(box(notes[0]).top));
  });
});
