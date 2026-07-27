/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

// Live shows a grid of square tiles, stills and videos together, and opens the
// selected one in a modal. The player is the video block's, so the facade holds:
// with five videos on the science guy article, nothing reaches YouTube until a
// tile is clicked.
describe('Media gallery block', () => {
  let block;

  const tile = (src, alt, href, title) => `
    <div>
      <div><picture><img src="${src}" alt="${alt}"></picture></div>
      <div>${href ? `<p><a href="${href}">${title}</a></p>` : ''}</div>
    </div>`;

  const authored = (rows) => {
    document.body.innerHTML = `<div class="media-gallery block">${rows.join('')}</div>`;
    block = document.querySelector('.media-gallery.block');
    return block;
  };

  const science = () => authored([
    tile('/media/csg-e4.png', 'CSG tire compounds thumbnail', 'https://www.youtube.com/watch?v=K6Cy13grU5A', 'Continental Science Guy - E4'),
    tile('/media/csg-e3.png', 'Continental Science Guy Episode 3', 'https://www.youtube.com/watch?v=h-mPmgxug4Q', 'Continental Science Guy - E3'),
    tile('/media/duo-car.png', 'duo car shot csg', '', ''),
  ]);

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('builds one tile per authored row, in order', () => {
    decorate(science());
    const tiles = block.querySelectorAll('.media-gallery-tile');
    expect(tiles.length).to.equal(3);
    expect([...tiles].map((t) => t.querySelector('img').getAttribute('src')))
      .to.eql(['/media/csg-e4.png', '/media/csg-e3.png', '/media/duo-car.png']);
  });

  it('tells a video tile from a still one', () => {
    decorate(science());
    const tiles = [...block.querySelectorAll('.media-gallery-tile')];
    expect(tiles.map((t) => t.classList.contains('media-gallery-tile-video')))
      .to.eql([true, true, false]);
  });

  it('names each tile for what opening it does', () => {
    decorate(science());
    const tiles = [...block.querySelectorAll('.media-gallery-tile')];
    expect(tiles[0].getAttribute('aria-label')).to.equal('Play Continental Science Guy - E4');
    expect(tiles[2].getAttribute('aria-label')).to.equal('View duo car shot csg');
  });

  // the whole point of the slice: five videos on one page cost nothing until asked
  it('asks nothing of YouTube before a tile is clicked', () => {
    decorate(science());
    expect(block.querySelector('iframe')).to.be.null;
    const srcs = [...block.querySelectorAll('[src]')].map((e) => e.getAttribute('src'));
    expect(srcs.some((s) => /youtube|ytimg|googlevideo/i.test(s)), 'no youtube host in any src').to.be.false;
  });

  it('opens the modal on the video block player when a video tile is clicked', async () => {
    decorate(science());
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
    decorate(science());
    block.querySelectorAll('.media-gallery-tile')[2].click();
    const modal = block.querySelector('dialog');
    expect(modal.open).to.be.true;
    expect(modal.querySelector('img').getAttribute('src')).to.equal('/media/duo-car.png');
    expect(modal.querySelector('iframe'), 'no player for a still').to.be.null;
  });

  // count rather than the element itself: a failing assertion on a live
  // cross-origin iframe hangs the runner while chai renders the diff
  it('closes on the close control and takes the player with it', () => {
    decorate(science());
    block.querySelectorAll('.media-gallery-tile')[0].click();
    const modal = block.querySelector('dialog');
    expect(modal.querySelectorAll('iframe').length, 'playing').to.equal(1);
    modal.querySelector('.media-gallery-close').click();
    expect(modal.open, 'closed').to.be.false;
    expect(modal.querySelectorAll('iframe').length, 'player torn out so the sound stops').to.equal(0);
  });

  // Escape never reaches our close control, so the dialog's own close event is
  // what has to empty the stage. It fires a task after the key
  it('takes the player out when Escape closes the modal', async () => {
    decorate(science());
    block.querySelectorAll('.media-gallery-tile')[0].click();
    const modal = block.querySelector('dialog');
    modal.close();
    await new Promise((r) => { setTimeout(r, 0); });
    expect(modal.querySelectorAll('iframe').length, 'player torn out').to.equal(0);
  });

  it('skips a row that carries neither a still nor a video', () => {
    decorate(authored([tile('/media/a.png', 'a', '', ''), '<div><div></div><div></div></div>']));
    expect(block.querySelectorAll('.media-gallery-tile').length).to.equal(1);
  });
});
