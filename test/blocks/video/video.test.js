/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/video/video.js';

// Live shows a poster and builds the YouTube player when the poster is clicked,
// so nothing is fetched from YouTube until someone asks for the video. The block
// does the same, and the authored anchor is what a viewer without JavaScript
// gets.
describe('Video block', () => {
  let block;

  const authored = (href = 'https://www.youtube.com/watch?v=d6w6bGy1eM8') => {
    document.body.innerHTML = `
      <div class="video block">
        <div><div>
          <picture><img src="/media/poster.jpg" alt="Mod My Toyota Supra"></picture>
          <p><a href="${href}">Mod My Toyota Supra</a></p>
        </div></div>
      </div>`;
    block = document.querySelector('.video.block');
    return block;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the authored poster and no iframe', () => {
    decorate(authored());
    expect(block.querySelector('img')?.getAttribute('src')).to.equal('/media/poster.jpg');
    expect(!!block.querySelector('iframe')).to.be.false;
  });

  it('gives the play control the video title', () => {
    decorate(authored());
    const button = block.querySelector('button');
    expect(button, 'play control').to.exist;
    expect(button.getAttribute('aria-label')).to.equal('Play Mod My Toyota Supra');
  });

  // the no-cookie host serves the same player and sets nothing until playback,
  // which is what a page with a cookie banner should ask for
  it('builds the player on the embed url when the control is clicked', () => {
    decorate(authored());
    block.querySelector('button').click();
    const frame = block.querySelector('iframe');
    expect(frame, 'iframe').to.exist;
    expect(frame.getAttribute('src')).to.contain('youtube-nocookie.com/embed/d6w6bGy1eM8');
    expect(frame.getAttribute('title')).to.equal('Mod My Toyota Supra');
    expect(frame.getAttribute('allowfullscreen')).to.exist;
  });

  it('plays without a second click', () => {
    decorate(authored());
    block.querySelector('button').click();
    expect(block.querySelector('iframe').getAttribute('src')).to.contain('autoplay=1');
  });

  it('reads the id from a youtu.be link and from an embed link', () => {
    decorate(authored('https://youtu.be/K6Cy13grU5A'));
    block.querySelector('button').click();
    expect(block.querySelector('iframe').getAttribute('src')).to.contain('/embed/K6Cy13grU5A');

    decorate(authored('https://www.youtube.com/embed/h-mPmgxug4Q?rel=0'));
    block.querySelector('button').click();
    expect(block.querySelector('iframe').getAttribute('src')).to.contain('/embed/h-mPmgxug4Q');
  });

  it('keeps the poster out of the flow once the player is in', () => {
    decorate(authored());
    block.querySelector('button').click();
    expect(!!block.querySelector('img'), 'poster').to.be.false;
  });

  // two of these videos have no poster on live, so the block still has to offer
  // the video rather than render an empty box
  it('offers the video when there is no poster', () => {
    document.body.innerHTML = `
      <div class="video block">
        <div><div><p><a href="https://www.youtube.com/watch?v=A0B_zWAkBQ4">Kicking Childhood Cancer</a></p></div></div>
      </div>`;
    block = document.querySelector('.video.block');
    decorate(block);
    expect(block.querySelector('button'), 'play control').to.exist;
    expect(block.classList.contains('video-no-poster')).to.be.true;
    block.querySelector('button').click();
    expect(block.querySelector('iframe').getAttribute('src')).to.contain('/embed/A0B_zWAkBQ4');
  });

  it('leaves the content alone when no video is authored', () => {
    document.body.innerHTML = '<div class="video block"><div><div><p>No link here</p></div></div></div>';
    block = document.querySelector('.video.block');
    decorate(block);
    expect(!!block.querySelector('button')).to.be.false;
    expect(block.textContent).to.contain('No link here');
  });

  // the platform promotes the page's own LCP image, so a poster far down the
  // article stays lazy rather than being loaded because it is a poster
  it('leaves the loading attribute to the platform', () => {
    document.body.innerHTML = `
      <div class="video block">
        <div><div>
          <picture><img src="/media/poster.jpg" alt="a" loading="lazy"></picture>
          <p><a href="https://www.youtube.com/watch?v=d6w6bGy1eM8">a</a></p>
        </div></div>
      </div>`;
    block = document.querySelector('.video.block');
    decorate(block);
    expect(block.querySelector('img').getAttribute('loading')).to.equal('lazy');
  });

  it('reserves the frame so arriving at the player shifts nothing', () => {
    decorate(authored());
    expect(block.querySelector('.video-frame')?.getAttribute('style') ?? '')
      .to.contain('aspect-ratio');
  });
});
