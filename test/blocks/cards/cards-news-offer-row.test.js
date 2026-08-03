/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/cards/cards.js';
import styleSheet from '../../helpers/stylesheet.js';

/**
 * `/offers` is the only published page carrying `cards news`, and live lays its
 * three promo teasers out as wide stacked rows rather than as a three-across
 * grid. Read off continentaltire.com/offers on 2026-08-03:
 *
 *   live  `.view-rows` caps the list at `max-width: 940px`, and each
 *         `article.promo-teaser` is a `display: flex` row 940 wide with
 *         `padding: 28px`, `border-radius: 10px` and a
 *         `0 0 40px rgba(0,0,0,0.1)` shadow. `a.promo-teaser__image` is
 *         `width: 270px; max-width: 270px; margin-right: 28px` and
 *         `.promo-teaser__content` takes the remaining 586. Between teasers,
 *         `margin-top: 20px`.
 *   ours  `.cards.news > ul` ran `repeat(auto-fit, minmax(280px, 1fr))` in the
 *         1136 content measure, so three 365.3 tiles sat across with the still
 *         on top of the copy.
 *
 * At 768 and 375 live's card is `display: block` with `padding: 24px` and the
 * still spans the card, so the row engages at live's 769 step.
 *
 * The copy inside the row is measured off the same page. Live's tag line is
 * `span.tag`, 14px/26 weight 700 uppercase at 0.5px tracking, and its title is
 * an h2 at 30px/38 weight 400. Ours had those the other way round: the news
 * heading rule pinned the h2 at 14/20 weight 700 at 0.5px tracking, which is
 * live's tag treatment on live's title element, and left the tag paragraph at
 * the card body's own 18px.
 *
 * Every rule here is scoped to a light band. `cards news` on a dark band is a
 * separate live component with its own flattened tile and its own 14/20 title,
 * and the rules for it further down the stylesheet still hold. Issue #209.
 */
const CARD = (tag, title, body) => `
  <div>
    <div><picture><img src="/icons/search.svg" alt="Offer thumbnail"></picture></div>
    <div>
      <p>${tag}</p>
      <h2 id="t"><a href="/promotion">${title}</a></h2>
      <p>${body}</p>
      <p><em><a href="/promotion">See details</a></em></p>
    </div>
  </div>`;

/** `/offers` as the pipeline delivers it: a plain section holding the block. */
function build() {
  document.body.innerHTML = `
    <main><div class="section cards-container">
      <div class="cards-wrapper"><div class="cards news block">
        ${CARD('Limited Time Offer + Credit Card Offer', 'Get up to a $200 Rebate', 'Purchase a set of 4 qualifying Continental Tires and get a $110 Continental Tire Prepaid Mastercard.')}
        ${CARD('Limited Time Offer &mdash; Promotion Has Ended', 'Get up to a $200 Rebate', 'Purchase a set of 4 qualifying Continental Tires and get a $110 Continental Tire Prepaid Mastercard by mail.')}
        ${CARD('Exclusive Credit Card Offer', 'Finance your new Continental Tires', 'With the Continental Tire Synchrony Car Care credit card it is easy.')}
      </div></div>
    </div></main>`;
  const block = document.querySelector('.cards');
  decorate(block);
  return block;
}

/** The same block on a dark band, which is a different live component. */
function buildDark() {
  document.body.innerHTML = `
    <main><div class="section dark cards-container">
      <div class="cards-wrapper"><div class="cards news block">
        ${CARD('One', 'First teaser', 'Body copy.')}
        ${CARD('Two', 'Second teaser', 'Body copy.')}
        ${CARD('Three', 'Third teaser', 'Body copy.')}
      </div></div>
    </div></main>`;
  const block = document.querySelector('.cards');
  decorate(block);
  return block;
}

const box = (el) => {
  const r = el.getBoundingClientRect();
  return {
    top: Math.round(r.top),
    bottom: Math.round(r.bottom),
    left: Math.round(r.left),
    right: Math.round(r.right),
    width: +r.width.toFixed(1),
  };
};

/** The first card, its still column and its copy column. */
function parts(block) {
  const li = block.querySelector(':scope > ul > li');
  return {
    li,
    image: li.querySelector('.cards-card-image'),
    body: li.querySelector('.cards-card-body'),
  };
}

describe("Cards, live's stacked offer row", () => {
  before(async () => {
    const sheets = await Promise.all([
      styleSheet('/styles/styles.css'),
      styleSheet('/blocks/cards/cards.css'),
    ]);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    document.adoptedStyleSheets = [];
  });

  it("caps the list at live's 940 and runs one teaser per row at 1440", async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    const list = block.querySelector(':scope > ul');
    expect(getComputedStyle(list).gridTemplateColumns.split(' ')).to.have.length(1);
    expect(box(list).width, 'the list measure').to.equal(940);
    expect(box(parts(block).li).width, 'the card box').to.equal(940);
  });

  it("holds the still column at live's 270 beside the copy at 1440", async () => {
    await setViewport({ width: 1440, height: 900 });
    const { li, image, body } = parts(build());
    expect(getComputedStyle(li).display, 'the card is a row').to.equal('flex');
    expect(box(image).width, 'the still column').to.equal(270);
    expect(box(body).width, 'the copy column').to.equal(586);
    expect(box(image).top, 'the two columns start level').to.equal(box(body).top);
    expect(box(body).left - box(image).right, "live's gap between them").to.equal(28);
    expect(getComputedStyle(li).padding).to.equal('28px');
  });

  it('keeps the still column at 270 once the copy has less room, at 900', async () => {
    await setViewport({ width: 900, height: 900 });
    const { li, image, body } = parts(build());
    expect(getComputedStyle(li).display).to.equal('flex');
    expect(box(image).width, 'the still column').to.equal(270);
    expect(box(image).top).to.equal(box(body).top);
    expect(box(body).left - box(image).right).to.equal(28);
  });

  it("stacks the still over the copy below live's 769 step, at 375", async () => {
    await setViewport({ width: 375, height: 812 });
    const { li, image, body } = parts(build());
    expect(getComputedStyle(li).display).to.not.equal('flex');
    expect(box(body).top, 'the copy sits under the still')
      .to.be.greaterThan(box(image).bottom - 1);
    expect(box(image).width, 'the still spans the card').to.equal(box(body).width);
    expect(getComputedStyle(li).padding).to.equal('24px');
  });

  it("gives the card box live's radius and shadow", async () => {
    await setViewport({ width: 1440, height: 900 });
    const { li } = parts(build());
    const cs = getComputedStyle(li);
    expect(cs.borderRadius).to.equal('10px');
    expect(cs.boxShadow).to.equal('rgba(0, 0, 0, 0.1) 0px 0px 40px 0px');
  });

  // live's card bottom is its own 28 below the button: the teaser is 266.8 tall
  // at 1440 with a 210.8 copy column, and ours read 282.8 on a 226.8 column
  // while the call to action carried the copy paragraph's 16 underneath it.
  it('closes the card at the padding below the call to action', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    const { li } = parts(block);
    const cta = [...li.querySelectorAll('.cards-card-body p')].pop();
    expect(box(li).bottom - box(cta).bottom).to.equal(28);
  });

  it("spaces the teasers by live's 20", async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    const [first, second] = [...block.querySelectorAll(':scope > ul > li')];
    expect(box(second).top - box(first).bottom).to.equal(20);
  });

  it("reads the title at live's 30/38 rather than at its tag size", async () => {
    await setViewport({ width: 1440, height: 900 });
    const heading = build().querySelector('.cards-card-body h2');
    const cs = getComputedStyle(heading);
    expect(cs.fontSize).to.equal('30px');
    expect(cs.lineHeight).to.equal('38px');
    expect(cs.fontWeight).to.equal('400');
    expect(cs.letterSpacing).to.equal('normal');
  });

  it("holds the title's link at the heading's own weight", async () => {
    await setViewport({ width: 1440, height: 900 });
    const link = build().querySelector('.cards-card-body h2 a');
    const cs = getComputedStyle(link);
    expect(cs.fontSize).to.equal('30px');
    expect(cs.fontWeight).to.equal('400');
  });

  it("gives the tag line above it live's uppercase 14/26", async () => {
    await setViewport({ width: 1440, height: 900 });
    const tag = build().querySelector('.cards-card-body p');
    const cs = getComputedStyle(tag);
    expect(cs.fontSize).to.equal('14px');
    expect(cs.lineHeight).to.equal('26px');
    expect(cs.fontWeight).to.equal('700');
    expect(cs.letterSpacing).to.equal('0.5px');
    expect(cs.textTransform).to.equal('uppercase');
  });

  it('leaves the dark news band on its own three-up tile', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = buildDark();
    const list = block.querySelector(':scope > ul');
    expect(getComputedStyle(list).gridTemplateColumns.split(' ')).to.have.length(3);
    const { li } = parts(block);
    expect(getComputedStyle(li).display).to.not.equal('flex');
    const heading = block.querySelector('.cards-card-body h2');
    expect(getComputedStyle(heading).fontSize).to.equal('14px');
    expect(getComputedStyle(heading).lineHeight).to.equal('20px');
  });
});
