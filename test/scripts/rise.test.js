/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport, emulateMedia } from '@web/test-runner-commands';

/**
 * Blocks rise into place as the reader reaches them, which is the motion live
 * carries and this site did not.
 *
 * Live's values, read off the rendered pages rather than guessed. Every animated
 * element on continentaltire.com runs the same `fadeInUp`, `opacity: 0` and
 * `translate3d(0, 100%, 0)` to `opacity: 1` and no transform, over
 * `--animate-duration: 1s` with `ease` and `animation-fill-mode: both`. The
 * stagger is `animation-delay` in 100ms steps down the DOM: on
 * continentaltire.com/learn/technology the ten news teasers carry 0.1s to 1s,
 * and on the homepage the six warranty list items carry 0s to 0.5s.
 *
 * Live triggers all of it at load: on three pages probed at 1440x900 every
 * animation reported a `startTime` between 96ms and 158ms, and none started
 * after the page was scrolled. Here it triggers on entry instead, because a
 * page here runs 2178px to 6284px against live's 2033px to 5437px and because
 * fading the first screen in would hold LCP behind the fade. That is the one
 * deliberate difference from live.
 *
 * Three things this must not do, from #247. It must not need JavaScript for the
 * content to be visible, so the hidden state is a class the script adds and
 * never anything the pipeline delivers. It must be off under
 * `prefers-reduced-motion: reduce`, and off means the content is simply there.
 * And it must animate `transform` and `opacity` only, so it cannot show up in
 * CLS.
 */
describe('Rise into view: the stylesheet', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/lazy-styles.css')).text());
  });

  const norm = (t) => t.replace(/\s+/g, ' ').trim();

  /** Every value `prop` takes in a rule whose selector list holds `selector`. */
  function anyRule(selector, prop, rules = sheet.cssRules) {
    const want = norm(selector);
    const out = [];
    const walk = (list) => [...list].forEach((r) => {
      if (r.cssRules) walk(r.cssRules);
      if (!r.selectorText) return;
      if (!r.selectorText.split(',').map(norm).includes(want)) return;
      const v = r.style.getPropertyValue(prop);
      if (v) out.push(norm(v));
    });
    walk(rules);
    return out;
  }

  /** The rules inside the `prefers-reduced-motion: reduce` block. */
  function reducedMotionRules() {
    const found = [];
    const walk = (list) => [...list].forEach((r) => {
      if (r.media && [...r.media].join(' ').includes('prefers-reduced-motion')) found.push(r);
      else if (r.cssRules) walk(r.cssRules);
    });
    walk(sheet.cssRules);
    return found;
  }

  it("carries live's duration, easing and stagger as named values", () => {
    const root = anyRule(':root', '--rise-duration');
    expect(root, '--rise-duration').to.include('1s');
    expect(anyRule(':root', '--rise-stagger'), '--rise-stagger').to.include('100ms');
    // live translates by 100% of the element's own height, which is 24px on a
    // list item and over 1000px on a grid container. Capped, so a tall block
    // does not slide a full screen.
    expect(anyRule(':root', '--rise-distance').join(' '), '--rise-distance').to.contain('100%');
  });

  it('hides an armed element with opacity and a transform, and nothing else', () => {
    expect(anyRule('.rise', 'opacity'), 'opacity').to.include('0');
    expect(anyRule('.rise', 'transform').join(' '), 'transform').to.contain('--rise-distance');
    // anything that takes room out of the flow would move the layout below it
    ['display', 'visibility', 'height', 'max-height', 'position'].forEach((prop) => {
      expect(anyRule('.rise', prop), prop).to.have.length(0);
    });
  });

  it('rises from below over 1s with a per-item delay', () => {
    const anim = anyRule('.rise-in', 'animation').join(' ');
    expect(anim, 'animation').to.contain('--rise-duration');
    expect(anim, 'the fill holds the from-frame through the delay').to.contain('both');
    expect(anim, "live's easing").to.contain('ease');
    const delay = anyRule('.rise-in', 'animation-delay').join(' ');
    expect(delay, 'animation-delay').to.contain('--rise-order');
    expect(delay, 'animation-delay').to.contain('--rise-stagger');
  });

  it('animates transform and opacity only, so it cannot move the layout', () => {
    const frames = [...sheet.cssRules].filter((r) => r.name === 'rise-up');
    expect(frames, 'a rise-up keyframes rule').to.have.length(1);
    const props = new Set();
    [...frames[0].cssRules].forEach((frame) => {
      [...frame.style].forEach((p) => props.add(p));
    });
    expect([...props].sort()).to.eql(['opacity', 'transform']);
    const from = [...frames[0].cssRules].find((f) => f.keyText === '0%');
    const to = [...frames[0].cssRules].find((f) => f.keyText === '100%');
    expect(from.style.getPropertyValue('opacity'), 'from opacity').to.equal('0');
    expect(to.style.getPropertyValue('opacity'), 'to opacity').to.equal('1');
    expect(to.style.getPropertyValue('transform'), 'to transform').to.equal('none');
  });

  it('shows the content outright under prefers-reduced-motion', () => {
    const blocks = reducedMotionRules();
    expect(blocks, 'a prefers-reduced-motion block').to.have.length.greaterThan(0);
    const inside = blocks.flatMap((b) => [...b.cssRules]);
    ['.rise', '.rise-in'].forEach((sel) => {
      const rule = inside.find((r) => r.selectorText
        && r.selectorText.split(',').map(norm).includes(sel));
      expect(rule, `${sel} inside the reduced-motion block`).to.exist;
      expect(norm(rule.style.getPropertyValue('opacity')), `${sel} opacity`).to.equal('1');
      expect(norm(rule.style.getPropertyValue('transform')), `${sel} transform`).to.equal('none');
      expect(norm(rule.style.getPropertyValue('animation')), `${sel} animation`).to.contain('none');
    });
  });
});

describe('Rise into view: what the script arms', () => {
  let riseIntoView;
  let observer;

  before(async () => {
    ({ default: riseIntoView } = await import('../../scripts/rise.js'));
    await setViewport({ width: 1440, height: 900 });
  });

  after(async () => {
    await emulateMedia({ reducedMotion: 'no-preference' });
    document.body.replaceChildren();
  });

  /**
   * Three sections the way decorateSections leaves them: a section holds
   * wrappers, and a wrapper holds either default content or one block. The
   * first two stand inside a 900px viewport and the third starts at 1600px.
   */
  function mount() {
    const main = document.createElement('main');
    main.innerHTML = `
      <div class="section" style="height: 400px">
        <div class="default-content-wrapper"><h1>Engineering and technology</h1></div>
      </div>
      <div class="section" style="height: 1200px">
        <div class="default-content-wrapper"><h2>In the fold</h2><p>copy</p></div>
      </div>
      <div class="section" style="height: 2000px">
        <div class="cards-wrapper">
          <div class="cards block">
            <ul><li>one</li><li>two</li><li>three</li></ul>
          </div>
        </div>
      </div>
      <div class="section" style="height: 900px">
        <div class="default-content-wrapper"><h2>Last</h2><p>copy</p></div>
      </div>`;
    document.body.replaceChildren(main);
    window.scrollTo(0, 0);
    return main;
  }

  /** Waits for `test` to hold, up to 2s of frames. */
  async function until(test, what) {
    for (let i = 0; i < 120; i += 1) {
      if (test()) return;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { requestAnimationFrame(resolve); });
    }
    expect.fail(`timed out waiting for ${what}`);
  }

  it('leaves the first section alone, so LCP is never behind the fade', async () => {
    const main = mount();
    observer = riseIntoView(main);
    expect(main.querySelectorAll('.section:first-child .rise')).to.have.length(0);
    expect(main.querySelector('h1').className).to.equal('');
  });

  it('leaves anything already on screen alone, so nothing blinks out', async () => {
    const main = mount();
    observer = riseIntoView(main);
    const second = main.children[1];
    expect(second.querySelectorAll('.rise'), 'the second section is in the fold').to.have.length(0);
  });

  it('arms what is below the fold, one item per card rather than the grid', async () => {
    const main = mount();
    observer = riseIntoView(main);
    const items = [...main.querySelectorAll('.rise')];
    const cards = [...main.querySelectorAll('.cards li')];
    expect(cards.every((li) => li.classList.contains('rise')), 'each card armed').to.be.true;
    expect(items).to.include.members(cards);
    expect(main.querySelector('.cards').classList.contains('rise'), 'not the grid itself').to.be.false;
  });

  it('plays on entry, staggered down the DOM, and only once', async () => {
    const main = mount();
    observer = riseIntoView(main);
    const cards = [...main.querySelectorAll('.cards li')];
    window.scrollTo(0, 1800);
    await until(() => cards[0].classList.contains('rise-in'), 'the cards to play');
    cards.forEach((li, i) => {
      expect(li.classList.contains('rise'), `card ${i} no longer armed`).to.be.false;
      expect(li.classList.contains('rise-in'), `card ${i} playing`).to.be.true;
      expect(li.style.getPropertyValue('--rise-order'), `card ${i} order`).to.equal(String(i));
    });
    window.scrollTo(0, 0);
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(main.querySelectorAll('.cards li.rise'), 'not re-armed on the way back up').to.have.length(0);
  });

  it('adds nothing at all under prefers-reduced-motion', async () => {
    await emulateMedia({ reducedMotion: 'reduce' });
    const main = mount();
    observer = riseIntoView(main);
    expect(observer, 'no observer').to.not.exist;
    expect(main.querySelectorAll('[class*="rise"]'), 'nothing armed').to.have.length(0);
    await emulateMedia({ reducedMotion: 'no-preference' });
  });
});
