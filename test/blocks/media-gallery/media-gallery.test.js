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
    expect(block.querySelector('iframe')).to.be.null;
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
    expect(modal.querySelector('iframe'), 'no player for a still').to.be.null;
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
    expect(modal.querySelector('.media-gallery-next'), 'nothing to page to').to.be.null;
    expect(modal.querySelector('.media-gallery-thumbs'), 'nothing to strip').to.be.null;
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
