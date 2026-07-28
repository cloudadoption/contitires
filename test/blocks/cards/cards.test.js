/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/cards/cards.js';
import { decorateIcons } from '../../../scripts/aem.js';

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
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('appear');
    block = main.querySelector('.cards.facts');
    decorate(block);
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it('draws each fact as a black card, padded 20', async () => {
    await setViewport({ width: 1440, height: 900 });
    const card = block.querySelector('li');
    const styles = getComputedStyle(card);
    expect(styles.backgroundColor).to.equal('rgb(0, 0, 0)');
    expect(styles.padding).to.equal('20px');
    expect(styles.color).to.equal('rgb(255, 255, 255)');
  });

  // the card body carries the block's own #333, which is 1.3 to 1 on black.
  // PSI read accessibility 95 on the branch preview and named this text.
  it('sets the fact itself against the black', async () => {
    await setViewport({ width: 1440, height: 900 });
    const text = block.querySelector('.cards-card-body p');
    expect(getComputedStyle(text).color).to.equal('rgb(255, 255, 255)');
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

  // live keeps the second card down to 641 and the row's own inset from 769,
  // read off the page at 769, 768, 660, 645 and 640
  it('keeps the second card down to 641', async () => {
    await setViewport({ width: 768, height: 800 });
    expect(Math.round(block.querySelector('li').getBoundingClientRect().width)).to.equal(288);
    await setViewport({ width: 640, height: 800 });
    expect(Math.round(block.querySelector('li').getBoundingClientRect().width)).to.equal(544);
  });

  // the row snaps to its own inset rather than scrolling past it
  it('opens on the first card, at the inset', async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = block.querySelector('ul');
    expect(list.scrollLeft).to.equal(0);
    expect(Math.round(block.querySelector('li').getBoundingClientRect().left)).to.equal(136);
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
          <div class="cards members block">
            ${card('Engineering Explained', 'engineering-explained')}
            ${card('Gears &amp; Gasoline', 'gears-gasoline')}
            ${card('Dinner With Racers', 'dinner-with-racers')}
          </div>
        </div>
      </div>`;
    document.body.replaceChildren(main);
    document.body.classList.add('appear');
    block = main.querySelector('.cards.members');
    decorate(block);
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

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

  // live puts three across from 769 and stacks them below
  it('stacks the teasers below 769', async () => {
    await setViewport({ width: 768, height: 800 });
    expect(Math.round(block.querySelector('li').getBoundingClientRect().width)).to.equal(728);
    await setViewport({ width: 769, height: 800 });
    expect(Math.round(block.querySelector('li').getBoundingClientRect().width)).to.equal(232);
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

/**
 * The Register your tires band on /warranty. Live sets the six benefits on a
 * #333 band, centred and white: a mark at its own size over an uppercase title
 * and a line of copy, three across from 769 and one below. The intro above and
 * the roadside line below stand on the same band, 38 from the items.
 *
 * Read off continentaltire.com/warranty at 1440, 900, 768 and 375. Issue #94.
 */
describe("Register your tires band, live's six benefits", () => {
  let block;
  let section;

  const BENEFITS = [
    ['limited-warranty', 'Limited Warranty +**', 'If your tires become unserviceable within the first 12 months, we\'ll replace them for free.'],
    ['mileage-warranty', 'Mileage Warranty +', 'We\'ll cover replacements on select products up to 80,000 miles.'],
    ['satisfaction-trial', 'Customer Satisfaction Trial +', 'If you\'re not happy with your purchase, we\'ll replace your tires with Continental brand tires in the first 60 days.'],
    ['road-hazard', 'Road Hazard Coverage +**', 'We\'ll replace your damaged tires for free within the first 12 months of purchase.'],
    ['roadside-assistance', 'Flat Tire Roadside Assistance +', 'Get a flat change and spare installed (or tow if needed for free up to 150 miles).'],
    ['trip-interruption', 'Emergency Trip Interruption Coverage +', 'If you have a mechanical breakdown during a road trip, we\'ll help cover eligible expenses.'],
  ];

  before(async () => {
    const sheets = await Promise.all(['/styles/styles.css', '/blocks/cards/cards.css'].map(async (p) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(p)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    const main = document.createElement('main');
    const item = ([icon, title, copy]) => `
      <div><div><p><span class="icon icon-${icon}"></span></p>
      <h2 id="${icon}">${title}</h2><p>${copy}</p></div></div>`;
    main.innerHTML = `
      <div class="section cards-container dark">
        <div class="default-content-wrapper">
          <p>Register your tires online at <strong><a href="https://register.roadsideprotect.com/continental/">totalconfidence-plan.com</a></strong> to receive these benefits.</p>
        </div>
        <div class="cards-wrapper">
          <div class="cards benefits block">${BENEFITS.map(item).join('')}</div>
        </div>
        <div class="default-content-wrapper">
          <p>Need roadside assistance now? Call <strong><a href="tel:1-888-990-6125">1-888-990-6125</a></strong></p>
          <p><em>Must be registered.</em></p>
        </div>
      </div>`;
    document.body.replaceChildren(main);
    document.body.classList.add('appear');
    section = main.querySelector('.section');
    block = main.querySelector('.cards.benefits');
    decorateIcons(block);
    decorate(block);
    // the marks are real files, and their own width is what the row measures
    await Promise.all([...block.querySelectorAll('img')].map((img) => (img.complete
      ? Promise.resolve()
      : new Promise((done) => { img.addEventListener('load', done); img.addEventListener('error', done); }))));
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it('paints the band #333 and centres it, white', async () => {
    await setViewport({ width: 1440, height: 900 });
    const styles = getComputedStyle(section);
    expect(styles.backgroundColor).to.equal('rgb(51, 51, 51)');
    expect(styles.color).to.equal('rgb(255, 255, 255)');
    expect(styles.textAlign).to.equal('center');
  });

  // live pads the band 60 from 769 and 38 below
  it("pads the band live's 38, and 60 from 769", async () => {
    await setViewport({ width: 768, height: 900 });
    expect(getComputedStyle(section).padding).to.equal('38px 0px');
    await setViewport({ width: 769, height: 900 });
    expect(getComputedStyle(section).padding).to.equal('60px 0px');
  });

  it('runs three benefits across 38 apart at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const list = block.querySelector('ul');
    const items = [...block.querySelectorAll('li')];
    expect(items).to.have.length(6);
    expect(getComputedStyle(list).gap).to.equal('38px');
    expect(Math.round(items[0].getBoundingClientRect().width * 100) / 100).to.equal(353.33);
    expect(Math.round(items[1].getBoundingClientRect().left
      - items[0].getBoundingClientRect().right)).to.equal(38);
    expect(Math.round(items[3].getBoundingClientRect().top
      - items[0].getBoundingClientRect().bottom)).to.equal(38);
  });

  it('stacks the benefits one per row below 769', async () => {
    await setViewport({ width: 768, height: 900 });
    const items = [...block.querySelectorAll('li')];
    expect(Math.round(items[0].getBoundingClientRect().width)).to.equal(720);
    expect(Math.round(items[1].getBoundingClientRect().top
      - items[0].getBoundingClientRect().bottom)).to.equal(38);
  });

  // live holds a benefit to 228 in a 16 gutter, centred in its column
  it('holds a benefit to 260 and centres it in its column', async () => {
    await setViewport({ width: 1440, height: 900 });
    const [item] = block.querySelectorAll('li');
    const body = item.querySelector('.cards-card-body');
    const styles = getComputedStyle(body);
    expect(styles.maxWidth).to.equal('228px');
    expect(styles.padding).to.equal('0px 16px');
    expect(styles.boxSizing).to.equal('content-box');
    const inner = body.getBoundingClientRect();
    const column = item.getBoundingClientRect();
    expect(Math.round(inner.width)).to.equal(260);
    expect(Math.round(inner.left - column.left)).to.equal(Math.round(column.right - inner.right));
  });

  it('draws no card chrome on the band', async () => {
    await setViewport({ width: 1440, height: 900 });
    const [item] = block.querySelectorAll('li');
    const styles = getComputedStyle(item);
    expect(styles.backgroundColor).to.equal('rgba(0, 0, 0, 0)');
    expect(styles.boxShadow).to.equal('none');
    expect(styles.borderRadius).to.equal('0px');
  });

  // live draws each mark at the size it declares: five 55 tall, the sixth 50
  it('draws each mark at its own size, centred', async () => {
    await setViewport({ width: 1440, height: 900 });
    const marks = [...block.querySelectorAll('.icon img')];
    expect(marks).to.have.length(6);
    expect(marks.slice(0, 5).map((m) => Math.round(m.getBoundingClientRect().height)))
      .to.eql([55, 55, 55, 55, 55]);
    expect(Math.round(marks[5].getBoundingClientRect().height)).to.equal(50);
    expect(Math.round(marks[0].getBoundingClientRect().width)).to.equal(53);
    const mark = marks[0].getBoundingClientRect();
    const body = block.querySelector('.cards-card-body').getBoundingClientRect();
    expect(Math.round(mark.left - body.left)).to.equal(Math.round(body.right - mark.right));
  });

  it('sets the title 14/20 bold uppercase, 12 under the mark', async () => {
    await setViewport({ width: 1440, height: 900 });
    const title = block.querySelector('h2');
    const styles = getComputedStyle(title);
    expect(styles.fontSize).to.equal('14px');
    expect(styles.lineHeight).to.equal('20px');
    expect(styles.fontWeight).to.equal('700');
    expect(styles.letterSpacing).to.equal('0.5px');
    expect(styles.textTransform).to.equal('uppercase');
    const mark = block.querySelector('.icon img');
    expect(Math.round(title.getBoundingClientRect().top - mark.getBoundingClientRect().bottom))
      .to.equal(12);
  });

  it('opens the copy 4 under the title, at 15/22', async () => {
    await setViewport({ width: 1440, height: 900 });
    const title = block.querySelector('h2');
    const copy = block.querySelector('h2 + p');
    const styles = getComputedStyle(copy);
    expect(styles.fontSize).to.equal('15px');
    expect(styles.lineHeight).to.equal('22px');
    expect(Math.round(copy.getBoundingClientRect().top - title.getBoundingClientRect().bottom))
      .to.equal(4);
  });

  // live leaves 38 between the intro, the items and the roadside line
  it('stands the items 38 from the intro and the roadside line', async () => {
    await setViewport({ width: 1440, height: 900 });
    const intro = section.querySelector('.default-content-wrapper p');
    const list = block.querySelector('ul');
    const roadside = section.querySelector('.cards-wrapper + .default-content-wrapper p');
    expect(Math.round(list.getBoundingClientRect().top - intro.getBoundingClientRect().bottom))
      .to.equal(38);
    expect(Math.round(roadside.getBoundingClientRect().top - list.getBoundingClientRect().bottom))
      .to.equal(38);
  });

  it("sets the intro and the roadside line at live's two sizes", async () => {
    await setViewport({ width: 768, height: 900 });
    const intro = section.querySelector('.default-content-wrapper p');
    const roadside = section.querySelector('.cards-wrapper + .default-content-wrapper p');
    expect(getComputedStyle(intro).fontSize).to.equal('15px');
    expect(getComputedStyle(intro).lineHeight).to.equal('22px');
    expect(getComputedStyle(roadside).fontSize).to.equal('15px');
    await setViewport({ width: 769, height: 900 });
    expect(getComputedStyle(intro).fontSize).to.equal('24px');
    expect(getComputedStyle(intro).lineHeight).to.equal('32px');
    expect(getComputedStyle(roadside).fontSize).to.equal('24px');
  });

  // live keeps the registration note small where the line above it is not
  it('keeps the registration note at 15/22', async () => {
    await setViewport({ width: 1440, height: 900 });
    const note = section.querySelector('.cards-wrapper + .default-content-wrapper em');
    expect(getComputedStyle(note).fontSize).to.equal('15px');
    expect(getComputedStyle(note).lineHeight).to.equal('22px');
    expect(getComputedStyle(note).fontStyle).to.equal('italic');
  });
});
