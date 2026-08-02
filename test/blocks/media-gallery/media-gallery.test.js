/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

const tile = (src, alt, href, title) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}"></picture></div>
    <div>${href ? `<a href="${href}">${title}</a>` : ''}</div>
  </div>`;

const authored = (rows) => {
  document.body.innerHTML = `<div class="media-gallery block">${rows.join('')}</div>`;
  return document.querySelector('.media-gallery.block');
};

/** the article gallery on /learn/continental-science-guy, cut to three */
const science = () => authored([
  tile('/media/csg-e4.png', 'CSG tire compounds thumbnail', 'https://www.youtube.com/watch?v=K6Cy13grU5A', 'Continental Science Guy - E4'),
  tile('/media/csg-e3.png', 'Continental Science Guy Episode 3', 'https://www.youtube.com/watch?v=h-mPmgxug4Q', 'Continental Science Guy - E3'),
  tile('/media/duo-car.png', 'duo car shot csg', '', ''),
]);

// Live shows a grid of square tiles, stills and videos together, and opens the
// selected one in a modal. The player is the video block's, so the facade holds:
// with five videos on the science guy article, nothing reaches YouTube until a
// tile is clicked.
describe('Media gallery block', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('builds one tile per authored row, in order', () => {
    decorate(block = science());
    const tiles = block.querySelectorAll('.media-gallery-tile');
    expect(tiles.length).to.equal(3);
    expect([...tiles].map((t) => t.querySelector('img').getAttribute('src')))
      .to.eql(['/media/csg-e4.png', '/media/csg-e3.png', '/media/duo-car.png']);
  });

  it('tells a video tile from a still one', () => {
    decorate(block = science());
    const tiles = [...block.querySelectorAll('.media-gallery-tile')];
    expect(tiles.map((t) => t.classList.contains('media-gallery-tile-video')))
      .to.eql([true, true, false]);
  });

  it('names each tile for what opening it does', () => {
    decorate(block = science());
    const tiles = [...block.querySelectorAll('.media-gallery-tile')];
    expect(tiles[0].getAttribute('aria-label')).to.equal('Play Continental Science Guy - E4');
    expect(tiles[2].getAttribute('aria-label')).to.equal('View duo car shot csg');
  });

  // the whole point of the slice: five videos on one page cost nothing until asked
  it('asks nothing of YouTube before a tile is clicked', () => {
    decorate(block = science());
    expect(!!block.querySelector('iframe')).to.be.false;
    const srcs = [...block.querySelectorAll('[src]')].map((e) => e.getAttribute('src'));
    expect(srcs.some((s) => /youtube|ytimg|googlevideo/i.test(s)), 'no youtube host in any src').to.be.false;
  });

  it('opens the modal on the video block player when a video tile is clicked', async () => {
    decorate(block = science());
    block.querySelectorAll('.media-gallery-tile')[1].click();
    const modal = block.querySelector('dialog');
    expect(modal, 'modal').to.exist;
    expect(modal.open, 'modal open').to.be.true;
    const frame = modal.querySelector('iframe');
    expect(frame, 'player').to.exist;
    expect(frame.getAttribute('src')).to.contain('youtube-nocookie.com/embed/h-mPmgxug4Q');
    expect(frame.getAttribute('src')).to.contain('autoplay=1');
  });

  it('shows the still itself when a still tile is clicked', () => {
    decorate(block = science());
    block.querySelectorAll('.media-gallery-tile')[2].click();
    const modal = block.querySelector('dialog');
    expect(modal.open).to.be.true;
    expect(modal.querySelector('.media-gallery-stage img').getAttribute('src')).to.equal('/media/duo-car.png');
    expect(!!modal.querySelector('iframe'), 'no player for a still').to.be.false;
  });

  // count rather than the element itself: a failing assertion on a live
  // cross-origin iframe hangs the runner while chai renders the diff
  it('closes on the close control and takes the player with it', () => {
    decorate(block = science());
    block.querySelectorAll('.media-gallery-tile')[0].click();
    const modal = block.querySelector('dialog');
    expect(modal.querySelectorAll('iframe').length, 'playing').to.equal(1);
    modal.querySelector('.media-gallery-close').click();
    expect(modal.open, 'closed').to.be.false;
    expect(modal.querySelectorAll('iframe').length, 'player torn out so the sound stops').to.equal(0);
  });

  // Escape never reaches the close control, so cancel is what empties the stage
  // on that path. Both user paths are synchronous on purpose. The dialog's own
  // close event stays in the block as a backstop, and is not asserted here: it
  // is queued, and waiting on a queued event in a backgrounded test page turns
  // the run flaky under the suite's parallelism
  it('empties the stage on the cancel Escape raises', () => {
    decorate(block = science());
    block.querySelectorAll('.media-gallery-tile')[0].click();
    const modal = block.querySelector('dialog');
    modal.dispatchEvent(new Event('cancel'));
    expect(modal.querySelectorAll('iframe').length, 'player torn out on the key').to.equal(0);
  });

  // the tile hands its own still and link to the player, and the player takes
  // them over. Opening the same tile twice has to find them again
  it('opens the same video tile a second time', () => {
    decorate(block = science());
    const first = block.querySelectorAll('.media-gallery-tile')[0];
    const modal = block.querySelector('dialog');
    first.click();
    modal.querySelector('.media-gallery-close').click();
    first.click();
    expect(modal.open, 'open again').to.be.true;
    expect(modal.querySelector('iframe')?.getAttribute('src') ?? '')
      .to.contain('youtube-nocookie.com/embed/K6Cy13grU5A');
  });

  it('opens the same still tile a second time', () => {
    decorate(block = science());
    const still = block.querySelectorAll('.media-gallery-tile')[2];
    const modal = block.querySelector('dialog');
    still.click();
    modal.querySelector('.media-gallery-close').click();
    still.click();
    expect(modal.querySelector('.media-gallery-stage img')?.getAttribute('src')).to.equal('/media/duo-car.png');
  });

  it('names the modal for the tile that opened it', () => {
    decorate(block = science());
    block.querySelectorAll('.media-gallery-tile')[2].click();
    expect(block.querySelector('dialog').getAttribute('aria-label')).to.equal('View duo car shot csg');
  });

  it('skips a row that carries neither a still nor a video', () => {
    decorate(block = authored([tile('/media/a.png', 'a', '', ''), '<div><div></div><div></div></div>']));
    expect(block.querySelectorAll('.media-gallery-tile').length).to.equal(1);
  });
});

/*
 * #187. Live drives both galleries from one carousel: the product viewer on
 * /tires/extremecontact-dws06-plus opens 5 tiles onto 11 slides with an 11
 * thumbnail strip, and the article gallery on
 * /experience/bmw-car-club-america-bmw-cca opens 3 onto 3. Ours showed the tile
 * that was clicked and nothing else, so the modal gains the paging and both
 * surfaces gain it at once.
 *
 * Measured on live at 1440: 76px thumbnails 10px apart, centered under a 16/9
 * stage, and 30px arrows at the edges of it.
 */
describe('Media gallery, paging the modal', () => {
  let block;
  const stageSrc = () => block.querySelector('.media-gallery-stage img')?.getAttribute('src');
  const open = (i) => {
    const t = block.querySelectorAll('.media-gallery-tile')[i];
    t.focus();
    t.click();
    return t;
  };
  const key = (name, on) => (on || block.querySelector('dialog'))
    .dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

  beforeEach(() => {
    document.body.innerHTML = '';
    decorate(block = science());
  });

  it('builds a previous, a next and one thumbnail per row', () => {
    const modal = block.querySelector('dialog');
    expect(modal.querySelector('.media-gallery-prev'), 'previous').to.exist;
    expect(modal.querySelector('.media-gallery-next'), 'next').to.exist;
    const thumbs = modal.querySelectorAll('.media-gallery-thumb');
    expect(thumbs.length, 'one thumbnail per row').to.equal(3);
    expect([...thumbs].map((t) => t.querySelector('img').getAttribute('src')))
      .to.eql(['/media/csg-e4.png', '/media/csg-e3.png', '/media/duo-car.png']);
    expect([...thumbs].map((t) => t.classList.contains('media-gallery-thumb-video')))
      .to.eql([true, true, false]);
  });

  it('pages to the next item', () => {
    open(2);
    block.querySelector('.media-gallery-next').click();
    expect(stageSrc(), 'wrapped past the last still to the first video').to.equal('/media/csg-e4.png');
  });

  it('pages back to the previous item', () => {
    open(2);
    block.querySelector('.media-gallery-prev').click();
    expect(stageSrc()).to.equal('/media/csg-e3.png');
  });

  it('wraps backwards off the first item', () => {
    open(0);
    block.querySelector('.media-gallery-prev').click();
    expect(stageSrc()).to.equal('/media/duo-car.png');
  });

  it('shows the item a thumbnail names', () => {
    open(0);
    block.querySelectorAll('.media-gallery-thumb')[2].click();
    expect(stageSrc()).to.equal('/media/duo-car.png');
  });

  it('marks the thumbnail of the item on the stage', () => {
    open(0);
    const thumbs = [...block.querySelectorAll('.media-gallery-thumb')];
    expect(thumbs.map((t) => t.getAttribute('aria-current'))).to.eql(['true', null, null]);
    block.querySelector('.media-gallery-next').click();
    expect(thumbs.map((t) => t.getAttribute('aria-current'))).to.eql([null, 'true', null]);
  });

  it('renames the modal for the item it pages to', () => {
    open(0);
    block.querySelector('.media-gallery-next').click();
    expect(block.querySelector('dialog').getAttribute('aria-label'))
      .to.equal('Play Continental Science Guy - E3');
  });

  it('takes a playing video off the stage when it pages away', () => {
    open(0);
    const modal = block.querySelector('dialog');
    expect(modal.querySelectorAll('iframe').length, 'playing').to.equal(1);
    modal.querySelector('.media-gallery-next').click();
    expect(modal.querySelectorAll('iframe').length, 'the sound stops on the page turn').to.equal(0);
  });

  // the tile click is a request to watch; a page turn is not, so the facade
  // holds and the visitor asks for the player themselves
  it('leaves a video it pages onto unplayed', () => {
    open(2);
    const modal = block.querySelector('dialog');
    modal.querySelector('.media-gallery-next').click();
    expect(modal.querySelectorAll('iframe').length, 'nothing reaches YouTube yet').to.equal(0);
    expect(modal.querySelector('.video-play'), 'the facade instead').to.exist;
    modal.querySelector('.video-play').click();
    expect(modal.querySelector('iframe')?.getAttribute('src') ?? '')
      .to.contain('youtube-nocookie.com/embed/K6Cy13grU5A');
  });

  it('pages with the arrow keys', () => {
    open(0);
    key('ArrowRight');
    expect(stageSrc(), 'forward').to.equal('/media/csg-e3.png');
    key('ArrowLeft');
    expect(stageSrc(), 'back').to.equal('/media/csg-e4.png');
  });

  // live leaves its thumbnails at whatever the tab landed on, so a keyboard
  // visitor pages the stage away from the thumbnail they are standing on
  it('follows the carousel with the focus when the keys came from the strip', () => {
    open(0);
    const thumbs = [...block.querySelectorAll('.media-gallery-thumb')];
    thumbs[0].focus();
    key('ArrowRight', thumbs[0]);
    expect(document.activeElement, 'focus moved to the thumbnail now current').to.equal(thumbs[1]);
  });

  it('leaves the focus alone when the keys came from elsewhere', () => {
    open(0);
    const next = block.querySelector('.media-gallery-next');
    next.focus();
    key('ArrowRight', next);
    expect(document.activeElement).to.equal(next);
  });

  it('leaves a single item without paging controls', () => {
    decorate(block = authored([tile('/media/only.png', 'the only one', '', '')]));
    const modal = block.querySelector('dialog');
    expect(!!modal.querySelector('.media-gallery-next'), 'nothing to page to').to.be.false;
    expect(!!modal.querySelector('.media-gallery-thumbs'), 'nothing to strip').to.be.false;
  });
});

/*
 * What the keyboard gets, which is where we part company with live. Live's
 * modal is a div with role=dialog: Escape does not close it, the arrow keys do
 * nothing, it carries no name and it has no close control at all. Ours is a
 * native dialog opened modally, so the platform gives the focus trap, Escape
 * and the focus handoff back, and the rest is above.
 */
describe('Media gallery, what the keyboard gets', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '';
    decorate(block = science());
  });

  it('opens modally, so focus is trapped and Escape closes', () => {
    block.querySelectorAll('.media-gallery-tile')[2].click();
    expect(block.querySelector('dialog').matches(':modal'), 'in the top layer').to.be.true;
  });

  it('hands the focus back to the tile that opened it', () => {
    const tile2 = block.querySelectorAll('.media-gallery-tile')[2];
    tile2.focus();
    tile2.click();
    block.querySelector('.media-gallery-close').click();
    expect(document.activeElement).to.equal(tile2);
  });
});

/**
 * Live's /learn/product-highlights is one grid of video cards: a 16:9 still
 * that opens the video in a modal, the product name under it, and a link on to
 * that tire's page. Ours stacked nine full-width players and then repeated the
 * nine names in a card grid below with no stills, so a reader scrolled past
 * every player before reaching a name.
 *
 * The third cell already carries a card's description on
 * /cruisingthecontinentalus. It carries a LINK here, and the two are told apart
 * by what the cell holds rather than by a variant, so an author keeps one shape:
 * still, video, then a sentence about the card or a link off it. Issue #244.
 */
describe('Media gallery, a card that links on', () => {
  const highlight = (src, video, name, href, cta) => `
    <div>
      <div><picture><img src="${src}" alt="${name}"></picture></div>
      <div><a href="${video}">${name}</a></div>
      <div>${href ? `<a href="${href}">${cta}</a>` : ''}</div>
    </div>`;

  /** two of live's nine product highlight cards */
  const highlights = () => {
    document.body.innerHTML = `<div class="media-gallery cards block">${[
      highlight('/media/dws06.jpg', 'https://www.youtube.com/watch?v=D22tEOe9gNY', 'ExtremeContact DWS06 Plus', '/tires/extremecontact-dws06-plus', 'Tire details'),
      highlight('/media/sport02.jpg', 'https://www.youtube.com/watch?v=ceNl2QunqJI', 'ExtremeContact Sport02', '/tires/extremecontact-sport-02', 'Tire details'),
    ].join('')}</div>`;
    return document.querySelector('.media-gallery.block');
  };

  it('renders the third cell as a link when it holds one', () => {
    const block = highlights();
    decorate(block);
    const links = block.querySelectorAll('.media-gallery-caption a');
    expect(links.length).to.equal(2);
    expect(links[0].getAttribute('href')).to.equal('/tires/extremecontact-dws06-plus');
    expect(links[0].textContent.trim()).to.equal('Tire details');
  });

  it('keeps the still a video tile beside the card link', () => {
    const block = highlights();
    decorate(block);
    expect(block.querySelectorAll('.media-gallery-tile-video').length).to.equal(2);
    expect(block.querySelector('.media-gallery-tile').getAttribute('aria-label'))
      .to.equal('Play ExtremeContact DWS06 Plus');
  });

  it('names the card from the video link, above the card link', () => {
    const block = highlights();
    decorate(block);
    const caption = block.querySelector('.media-gallery-caption');
    expect(caption.querySelector('h3').textContent).to.equal('ExtremeContact DWS06 Plus');
    // the name comes first, the link on is last
    expect(caption.lastElementChild.querySelector('a')).to.exist;
  });

  /*
   * The name on this card is the left half of a label row, with TIRE DETAILS on
   * the right, and live marks it up as neither a heading nor anything else: its
   * footer carries the two side by side. A span keeps that, and it is what
   * leaves /learn/product-highlights with the h1 it authors and nothing under
   * it. The cards that carry no call to action take an h2. Issue #375.
   */
  it('names a card that links on with a span rather than a heading', () => {
    const block = highlights();
    decorate(block);
    const caption = block.querySelector('.media-gallery-caption');
    expect(caption.firstElementChild.tagName).to.equal('SPAN');
    expect(caption.firstElementChild.textContent).to.equal('ExtremeContact DWS06 Plus');
    expect(block.querySelectorAll('.media-gallery-caption :is(h1, h2, h3, h4, h5, h6)').length,
      'live gives this one no heading').to.equal(0);
  });

  it('still renders a plain third cell as description text, not a link', () => {
    document.body.innerHTML = `<div class="media-gallery cards block">
      <div>
        <div><picture><img src="/media/b.png" alt="bloopers"></picture></div>
        <div><a href="https://www.youtube.com/watch?v=hH8nclY39fc">Bloopers</a></div>
        <div>No road trip is complete without a blooper reel.</div>
      </div></div>`;
    const block = document.querySelector('.media-gallery.block');
    decorate(block);
    const caption = block.querySelector('.media-gallery-caption');
    expect(!!caption.querySelector('a')).to.be.false;
    expect(caption.querySelector('p').textContent)
      .to.equal('No road trip is complete without a blooper reel.');
  });
});
