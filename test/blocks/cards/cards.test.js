/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/cards/cards.js';

// The Confidence on the Road band now sits on every product page, not the
// homepage alone. Live lays its six coverage items out as one row of six from
// 769 up, and as icon-left rows below that. Ours used an auto-fit grid, which
// wrapped to five plus an orphan at 900 and to two columns at 375, and it kept
// the desktop badge, heading and copy sizes all the way down.
describe('Confidence band, live\'s responsive layout', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/cards/cards.css')).text());
  });

  /** The value a property takes in the rule for `selector`, at `media`. */
  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const rule = [...rules].reverse().find((r) => r.selectorText === selector
      && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  const BAND = 'main .section.dark.cards-container .default-content-wrapper';
  // the news band is a dark cards section too, so the heading sizes name the
  // coverage cards to keep it out
  const HEADING = 'main .section.dark.cards-container:has(.cards.coverage) .default-content-wrapper h2';

  it('stacks the coverage items one per row on a narrow screen', () => {
    expect(value('.cards.coverage > ul', 'grid-template-columns')).to.equal('1fr');
  });

  it('lays them out as one row of six from live\'s 769 up', () => {
    expect(value('.cards.coverage > ul', 'grid-template-columns', '769px'))
      .to.equal('repeat(6, 1fr)');
  });

  it('puts the icon beside its label on a narrow screen', () => {
    expect(value('.cards.coverage .cards-card-body', 'flex-direction')).to.equal('row');
    expect(value('.cards.coverage .cards-card-body', 'flex-direction', '769px'))
      .to.equal('column');
  });

  it('shrinks the badge to live\'s 60px on a narrow screen', () => {
    expect(value(`${BAND} .icon`, 'width')).to.equal('60px');
    expect(value(`${BAND} .icon`, 'width', '769px')).to.equal('126px');
  });

  // the badge is an icon span, filled in after the page paints. An auto height
  // leaves it at zero until then, and the band below it jumps: PSI read a CLS
  // of 1.802 on mobile.
  it('reserves the badge\'s height so the band does not jump', () => {
    expect(value(`${BAND} .icon`, 'height')).to.equal('70px');
    expect(value(`${BAND} .icon`, 'height', '769px')).to.equal('148px');
  });

  it('holds the heading to live\'s 30px below the 1025 breakpoint', () => {
    expect(value(HEADING, 'font-size')).to.equal('30px');
    expect(value(HEADING, 'font-size', '1025px')).to.equal('42px');
  });

  it('holds the copy to live\'s 18px on a narrow screen', () => {
    expect(value(`${BAND} p`, 'font-size')).to.equal('18px');
    expect(value(`${BAND} p`, 'font-size', '769px')).to.equal('24px');
  });

  it('gives the button the full row on a narrow screen', () => {
    expect(value(`${BAND} .button`, 'display')).to.equal('block');
  });
});

/*
 * The Sports band on /experience. Live draws it black and edge to edge, with a
 * centred uppercase heading, a line under it, and the teaser's name as a pill
 * over the middle of a 16:9 photo. Every number was read off
 * continentaltire.com/experience at 1440, 1200, 1025, 1024, 900, 769, 768 and
 * 375. Issue #96.
 */
describe("Sports band, live's dark teaser band", () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/cards/cards.css')).text());
  });

  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  const BAND = 'main .section.cards-container:has(.cards.teaser)';

  it('runs the band black, edge to edge', () => {
    expect(value(BAND, 'background-color')).to.equal('rgb(0, 0, 0)');
    expect(value(BAND, 'color')).to.equal('var(--conti-white)');
  });

  // live pads the band 38 below 769 and 80 above
  it('pads the band the way live pads it, at both widths', () => {
    expect(value(BAND, 'padding')).to.equal('38px 0px');
    expect(value(BAND, 'padding', '769px')).to.equal('80px 0px');
  });

  // live holds the band's content to 1136 with 20 of page padding below 769
  // and 16 above, where the site's own container gives 24 and 32
  // the container is content-box, so the cap is live's 1136 of content and the
  // padding sits outside it
  it("measures the band's content the way live measures it", () => {
    expect(value(`${BAND} > div`, 'max-width')).to.equal('1136px');
    expect(value(`${BAND} > div`, 'padding')).to.equal('0px 20px');
    expect(value(`${BAND} > div`, 'padding', '769px')).to.equal('0px 16px');
  });

  it('centres the heading and the line under it', () => {
    expect(value(BAND, 'text-align')).to.equal('center');
  });

  // 30/36 below 1025 and 42/48 above, tracked out 6 and set in capitals
  it("sets the heading on live's scale", () => {
    expect(value(`${BAND} h2`, 'font-size')).to.equal('30px');
    expect(value(`${BAND} h2`, 'line-height')).to.equal('36px');
    expect(value(`${BAND} h2`, 'font-weight')).to.equal('300');
    expect(value(`${BAND} h2`, 'letter-spacing')).to.equal('6px');
    expect(value(`${BAND} h2`, 'text-transform')).to.equal('uppercase');
    expect(value(`${BAND} h2`, 'font-size', '1025px')).to.equal('42px');
    expect(value(`${BAND} h2`, 'line-height', '1025px')).to.equal('48px');
  });

  // the line under the heading sits 8 below it and grows to 24/34 from 769
  it("sets the line under the heading on live's scale", () => {
    expect(value(`${BAND} p`, 'margin')).to.equal('8px 0px 0px');
    expect(value(`${BAND} p`, 'font-size')).to.equal('15px');
    expect(value(`${BAND} p`, 'line-height')).to.equal('22px');
    expect(value(`${BAND} p`, 'font-size', '769px')).to.equal('24px');
    expect(value(`${BAND} p`, 'line-height', '769px')).to.equal('34px');
  });

  // live leaves 16 between the header and the first teaser below 769, 38 above
  it('leaves live\'s gap between the header and the teasers', () => {
    expect(value('.cards.teaser > ul', 'margin-top')).to.equal('16px');
    expect(value('.cards.teaser > ul', 'margin-top', '769px')).to.equal('38px');
  });

  // one teaser per row, the photo at 16:9 and none of the card chrome the
  // other variants carry
  it('draws a teaser as a bare 16:9 photo, one per row', () => {
    expect(value('.cards.teaser > ul', 'grid-template-columns')).to.equal('1fr');
    expect(value('.cards.teaser > ul > li', 'background-color')).to.equal('transparent');
    expect(value('.cards.teaser > ul > li', 'box-shadow')).to.equal('none');
    expect(value('.cards.teaser > ul > li', 'border-radius')).to.equal('0px');
    expect(value('.cards.teaser > ul > li img', 'aspect-ratio')).to.equal('16 / 9');
  });

  it('centres the name over the photo', () => {
    expect(value('.cards.teaser .cards-card-body', 'position')).to.equal('absolute');
    expect(value('.cards.teaser .cards-card-body', 'inset')).to.equal('0px');
    expect(value('.cards.teaser .cards-card-body', 'justify-content')).to.equal('center');
    expect(value('.cards.teaser .cards-card-body', 'align-items')).to.equal('center');
  });

  // live's pill: a yellow ring on a half-black fill, the name set small,
  // bold, tracked and in capitals. 26 of side padding above 769, 20 below.
  it("draws the name as live's pill", () => {
    const pill = 'main .cards.teaser .cards-card-body a:any-link';
    expect(value(pill, 'border')).to.equal('2px solid var(--conti-yellow)');
    expect(value(pill, 'border-radius')).to.equal('26px');
    expect(value(pill, 'background-color')).to.equal('rgba(0, 0, 0, 0.5)');
    expect(value(pill, 'color')).to.equal('var(--conti-white)');
    expect(value(pill, 'font-size')).to.equal('12px');
    expect(value(pill, 'font-weight')).to.equal('700');
    expect(value(pill, 'letter-spacing')).to.equal('1.25px');
    expect(value(pill, 'text-transform')).to.equal('uppercase');
    expect(value(pill, 'text-decoration')).to.equal('none');
    expect(value(pill, 'padding')).to.equal('12px 20px');
    expect(value(pill, 'padding', '769px')).to.equal('12px 26px');
  });

  // an inline box takes its height from the font rather than the line box, so
  // the pill measured 40 against live's 45
  it("gives the pill live's height", () => {
    const pill = 'main .cards.teaser .cards-card-body a:any-link';
    expect(value(pill, 'display')).to.equal('inline-flex');
    expect(value(pill, 'line-height')).to.equal('16.8px');
    expect(value(pill, 'text-align')).to.equal('center');
  });

  // live makes the whole teaser the link, as the other card variants do
  it('makes the whole teaser the link', () => {
    expect(value('.cards.teaser > ul > li', 'position')).to.equal('relative');
    expect(value('.cards.teaser .cards-card-body a::before', 'inset')).to.equal('0px');
  });
});

/*
 * The pill is a control, and live draws it without the underline this site
 * gives a link. Declaring it on the variant is not enough: the site's own link
 * rule names `main :is(.cards, ...) :is(p, li) a:any-link`, which outweighs it.
 */
describe("Sports band, the pill's own text", () => {
  before(async () => {
    const sheets = await Promise.all(['/styles/styles.css', '/blocks/cards/cards.css'].map(async (p) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(p)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    const main = document.createElement('main');
    const section = document.createElement('div');
    section.className = 'section cards-container';
    const wrapper = document.createElement('div');
    wrapper.className = 'cards-wrapper';
    const block = document.createElement('div');
    block.className = 'cards teaser block';
    const row = document.createElement('div');
    row.innerHTML = '<div><picture><img src="/icons/search.svg" alt=""></picture></div><div><h3><a href="/experience/soccer">Soccer</a></h3></div>';
    block.append(row);
    wrapper.append(block);
    section.append(wrapper);
    main.append(section);
    document.body.replaceChildren(main);
    decorate(block);
  });

  after(() => {
    document.body.replaceChildren();
  });

  it('draws the name without the site link underline', () => {
    const pill = document.querySelector('.cards.teaser .cards-card-body a');
    expect(getComputedStyle(pill).textDecorationLine).to.equal('none');
  });
});

/**
 * The Go In-Depth band on a Conti Crew page. Live scrolls short fact cards
 * sideways under a centred title: two visible at 1440 and one at 375, each
 * black with a yellow mark down its left. Read off
 * continentaltire.com/experience/conti-crew/speed-academy. Issue #104.
 */
describe("Go In-Depth band, live's fact scroller", () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(['/styles/styles.css', '/blocks/cards/cards.css'].map(async (p) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(p)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    const main = document.createElement('main');
    main.innerHTML = `
      <div class="section cards-container dark">
        <div class="default-content-wrapper"><h2>Go In-Depth</h2></div>
        <div class="cards-wrapper">
          <div class="cards facts block">
            <div><div><p>We started working with Continental Tire almost 20 years ago.</p></div></div>
            <div><div><p>Earlier this year, we moved into a new shop space.</p></div></div>
            <div><div><p>We are track guys more than show car guys.</p></div></div>
            <div><div><p>Peter bought another BMW.</p></div></div>
          </div>
        </div>
      </div>`;
    document.body.replaceChildren(main);
    block = main.querySelector('.cards.facts');
    decorate(block);
  });

  after(() => { document.body.replaceChildren(); });

  it('draws each fact as a black card, padded 20', async () => {
    await setViewport({ width: 1440, height: 900 });
    const card = block.querySelector('li');
    const styles = getComputedStyle(card);
    expect(styles.backgroundColor).to.equal('rgb(0, 0, 0)');
    expect(styles.padding).to.equal('20px');
    expect(styles.color).to.equal('rgb(255, 255, 255)');
  });

  it('shows two cards at 1440 and scrolls the rest', async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = block.querySelector('ul');
    const cards = block.querySelectorAll('li');
    expect(getComputedStyle(list).overflowX).to.equal('auto');
    expect(Math.round(cards[0].getBoundingClientRect().width)).to.equal(564);
    expect(Math.round(cards[1].getBoundingClientRect().left
      - cards[0].getBoundingClientRect().right)).to.equal(16);
    expect(list.scrollWidth, 'the rest scroll').to.be.greaterThan(list.clientWidth);
  });

  it('shows one card at 375', async () => {
    await setViewport({ width: 375, height: 800 });
    const card = block.querySelector('li');
    expect(Math.round(card.getBoundingClientRect().width)).to.equal(279);
    expect(getComputedStyle(block.querySelector('ul')).scrollSnapType).to.contain('x');
  });

  // the mark is chrome on every card, so it is drawn rather than authored
  it("marks each card with live's yellow mark", async () => {
    await setViewport({ width: 1440, height: 900 });
    const card = block.querySelector('li');
    const mark = getComputedStyle(card, '::before');
    expect(mark.content).to.not.equal('none');
    expect(mark.width).to.equal('40px');
    expect(mark.height).to.equal('40px');
    expect(mark.backgroundColor).to.equal('rgb(255, 165, 0)');
  });
});

/**
 * The You Might Also Like band. Live closes a Conti Crew page with three
 * teasers on black: a 4:3 photo with a round logo and the show name over its
 * foot. 365 wide at 1440, stacked at 375. Issue #104.
 */
describe("You Might Also Like band, live's crew teasers", () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(['/styles/styles.css', '/blocks/cards/cards.css'].map(async (p) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(p)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    const main = document.createElement('main');
    const card = (name, slug) => `
      <div><div><picture><img src="/icons/search.svg" alt="${name}"></picture></div>
      <div><picture><img src="/icons/search.svg" alt="${name} Logo"></picture>
      <p><a href="/experience/conti-crew/${slug}">${name}</a></p></div></div>`;
    main.innerHTML = `
      <div class="section cards-container dark">
        <div class="default-content-wrapper"><h2>You might also like...</h2></div>
        <div class="cards-wrapper">
          <div class="cards crew block">
            ${card('Engineering Explained', 'engineering-explained')}
            ${card('Gears &amp; Gasoline', 'gears-gasoline')}
            ${card('Dinner With Racers', 'dinner-with-racers')}
          </div>
        </div>
      </div>`;
    document.body.replaceChildren(main);
    block = main.querySelector('.cards.crew');
    decorate(block);
  });

  after(() => { document.body.replaceChildren(); });

  it('lays three teasers across at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const cards = block.querySelectorAll('li');
    expect(cards).to.have.length(3);
    expect(Math.round(cards[0].getBoundingClientRect().width)).to.equal(365);
    expect(Math.round(cards[1].getBoundingClientRect().left
      - cards[0].getBoundingClientRect().right)).to.equal(20);
    expect(Math.round(cards[0].getBoundingClientRect().height)).to.equal(274);
  });

  it("rounds the corner and shades the photo's foot", async () => {
    await setViewport({ width: 1440, height: 900 });
    const card = block.querySelector('li');
    expect(getComputedStyle(card).borderRadius).to.equal('12px');
    expect(getComputedStyle(card).overflow).to.equal('hidden');
    expect(getComputedStyle(card, '::after').content).to.not.equal('none');
  });

  it('rings the logo and sets the name over the foot', async () => {
    await setViewport({ width: 1440, height: 900 });
    const logo = block.querySelector('.cards-card-body picture');
    const name = block.querySelector('.cards-card-body a');
    expect(Math.round(logo.getBoundingClientRect().width)).to.equal(70);
    expect(getComputedStyle(logo).borderRadius).to.equal('50%');
    expect(getComputedStyle(name).fontSize).to.equal('18px');
    expect(getComputedStyle(name).color).to.equal('rgb(255, 255, 255)');
    expect(getComputedStyle(name).textDecorationLine).to.equal('none');
  });

  it('stacks the teasers at 375', async () => {
    await setViewport({ width: 375, height: 800 });
    const cards = block.querySelectorAll('li');
    expect(Math.round(cards[1].getBoundingClientRect().top
      - cards[0].getBoundingClientRect().bottom)).to.equal(20);
    expect(Math.round(cards[0].getBoundingClientRect().left))
      .to.equal(Math.round(cards[1].getBoundingClientRect().left));
  });
});
