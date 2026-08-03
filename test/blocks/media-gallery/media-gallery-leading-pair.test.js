/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * #278. Live's soccer page runs four card sections and gives three of them the
 * leading treatment the block took in #276. The fourth is a different one:
 * `card-list--double_leading`, where the first TWO cards are half the row each.
 *
 * Read off continentaltire.com/experience/soccer on 2026-08-03, the Charity Ball
 * section, in live's 1136 container:
 *
 * | | 1440 | 375 |
 * | --- | --- | --- |
 * | leading card 1 | 549x431, media 549x309, footer 122 | 335x352 |
 * | leading card 2 | 549x431 at x=739 | 335x310 |
 * | the card after | 353x271, media 353x199, footer 72 | 335x260 |
 * | its description | `display: none`, 205 characters authored | `display: none` |
 *
 * 549 twice with live's 38 gap is 1136, and 353 is a third of the same row, so
 * the pair spans three of six columns and each follower spans two.
 *
 * The description is the other half of the variant. Live authors one on all
 * three cards and paints it on the pair alone, which is the same choice its
 * `single_leading` teaser makes, and ours would print all three.
 *
 * The other three sections are unchanged and stay on `cards leading`: live gives
 * each a `card-list-item__teaser` 1136x430 above cards of 353x271, which is what
 * that variant already measures.
 */
const card = (src, alt, href, title, text) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}" width="752" height="423"></picture></div>
    <div>${href ? `<a href="${href}">${title}</a>` : ''}</div>
    ${text ? `<div><p>${text}</p></div>` : ''}
  </div>`;

// the CSS is written against the shape the pipeline delivers, so the block
// stands in a section wrapper inside main or none of it applies
const authored = (rows, variant) => {
  document.body.innerHTML = '<main><div class="dark section"><div class="media-gallery-wrapper">'
    + `<div class="media-gallery ${variant} block">${rows.join('')}</div></div></div></main>`;
  return document.querySelector('.media-gallery.block');
};

/** live's Charity Ball section: three cards, a description authored on each */
const charity = (variant = 'cards leading-pair') => authored([
  card(
    '/media/cover-charity-ball.png',
    'cover charity ball',
    'https://www.youtube.com/watch?v=l35vl9EO3ts',
    'Charity Ball: Building Even Bigger Plans for the Future',
    'Charity Ball has already grown since it first began and founder Ethan King has big plans for the future of the organization and how it will continue to change the world.',
  ),
  card(
    '/media/charity-ball-cover.png',
    'cover',
    'https://www.youtube.com/watch?v=GilXIN0nmLM',
    'Charity Ball: Why Soccer?',
    'See how Charity Ball uses the sport of soccer to build community around the world and bring people together in a positive way.',
  ),
  card(
    '/media/ct-julynewsletter-sports-image.png',
    'cover',
    'https://www.youtube.com/watch?v=YV0SDS-VzLk',
    'Charity Ball: Changing Lives One Soccer Ball at a Time',
    'Continental Tire is a proud supporter of Charity Ball, an organization that is changing lives one soccer ball at a time. See how soccer is building up communities in poverty-stricken areas across the globe.',
  ),
], variant);

describe('Media gallery leading pair, the two cards live features on the soccer page', () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/media-gallery/media-gallery.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => { document.body.classList.remove('appear'); });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  const boxes = () => {
    const list = block.querySelector('.media-gallery-list');
    return {
      list: list.getBoundingClientRect(),
      cells: [...list.children].map((li) => li.getBoundingClientRect()),
    };
  };

  it("stands the pair half a row each at 1440, on live's 549", async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = charity());
    const { list, cells } = boxes();
    expect(Math.round(list.width), "live's container").to.equal(1136);
    expect(Math.round(cells[0].width), "live's 549").to.equal(549);
    expect(Math.round(cells[1].width)).to.equal(549);
    expect(Math.round(cells[1].top), 'the two share a row').to.equal(Math.round(cells[0].top));
    expect(Math.round(cells[1].left - cells[0].right), "live's 38 gap").to.equal(38);
  });

  /*
   * Live's pair is 431 on both cards where each of ours was as tall as its own
   * description, 435 against 413. The base cards rule starts every cell at the
   * top of its row on purpose, because a leading card carries a description its
   * neighbours do not, and the pair is the one row where live gives the two the
   * same height.
   */
  it('gives the pair one height, the way live gives both 431', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = charity());
    const { cells } = boxes();
    expect(Math.round(cells[1].height), 'both cards run to the row')
      .to.equal(Math.round(cells[0].height));
  });

  it('drops the card after the pair to a third of the row', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = charity());
    const { cells } = boxes();
    expect(Math.round(cells[2].width), "live's 353").to.equal(353);
    expect(cells[2].top, 'on the row under the pair').to.be.above(cells[0].top);
  });

  it('paints the description on the pair and hides it after, the way live does', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = charity());
    const text = [...block.querySelectorAll('.media-gallery-caption p')];
    expect(text.length, 'all three author one').to.equal(3);
    expect(getComputedStyle(text[0]).display, 'live paints the first').to.not.equal('none');
    expect(getComputedStyle(text[1]).display, 'and the second').to.not.equal('none');
    expect(getComputedStyle(text[2]).display, 'live hides this one').to.equal('none');
  });

  it('stacks all three full width at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = charity());
    const { list, cells } = boxes();
    cells.forEach((c, i) => {
      expect(Math.round(c.width), `card ${i + 1} takes the column`).to.equal(Math.round(list.width));
    });
    expect(cells[1].top, 'one under the other').to.be.above(cells[0].top);
    const text = [...block.querySelectorAll('.media-gallery-caption p')];
    expect(getComputedStyle(text[2]).display, 'live hides it at 375 too').to.equal('none');
  });

  it('leaves the single leading variant on its full-width teaser', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = charity('cards leading'));
    const { list, cells } = boxes();
    expect(Math.round(cells[0].width), "live's teaser takes the row").to.equal(Math.round(list.width));
    expect(Math.round(cells[1].width), 'and the rest are a third').to.equal(353);
  });
});
