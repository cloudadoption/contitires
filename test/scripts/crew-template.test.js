/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * A Conti Crew member page under the marquee: the description on white and
 * the pull quote on black, both in a 960 column, 80 apart at 1440 and 40 at
 * 375. Read off continentaltire.com/experience/conti-crew/speed-academy.
 * Issue #104.
 */
async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

function buildCrewPage() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div class="section copy">
      <div class="default-content-wrapper">
        <p>Speed Academy is a YouTube channel and social media content creation
           team made up of Peter Tarach and Dave Pratte.</p>
        <p>We pride ourselves on building our cars to a high standard.</p>
      </div>
    </div>
    <div class="section quote">
      <div class="default-content-wrapper">
        <blockquote>
          <p>Follow your passion and you&rsquo;ll never work a day in your life.</p>
          <p>~ Speed Academy</p>
        </blockquote>
      </div>
    </div>`;
  document.body.replaceChildren(main);
  return main;
}

describe("Crew template, live's copy column", () => {
  let main;

  before(async () => {
    await adopt('/styles/styles.css', '/styles/crew.css');
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('crew', 'appear');
    main = buildCrewPage();
  });

  after(() => {
    document.body.classList.remove('crew', 'appear');
    document.body.replaceChildren();
  });

  it('runs the copy in a 960 column at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const copy = main.querySelector('.section.copy .default-content-wrapper');
    expect(Math.round(copy.getBoundingClientRect().width)).to.equal(960);
    expect(getComputedStyle(copy).padding).to.equal('80px 0px');
  });

  it("takes live's page padding at 375", async () => {
    await setViewport({ width: 375, height: 800 });
    const copy = main.querySelector('.section.copy .default-content-wrapper');
    expect(Math.round(copy.getBoundingClientRect().width)).to.equal(335);
    expect(getComputedStyle(copy).padding).to.equal('40px 0px');
  });

  /**
   * Live separates consecutive copy paragraphs by 22px, one line of its own
   * 22px leading. Measured on continentaltire.com/experience/conti-crew/
   * straight-pipes at 1440 on 2026-07-30: both paragraphs report `margin: 0`
   * and sit 22px apart, the first ending at 1233 and the second starting at
   * 1255.
   *
   * The zero margin is live's own, so it stays. The gap is what was missing.
   * It went unnoticed because every crew page authored before this one carries
   * a SINGLE copy paragraph, so the rule was never exercised with two.
   */
  it('separates consecutive copy paragraphs by 22px', async () => {
    await setViewport({ width: 1440, height: 900 });
    const paras = main.querySelectorAll('.section.copy .default-content-wrapper p');
    expect(paras.length, 'the fixture needs two paragraphs').to.equal(2);
    const gap = paras[1].getBoundingClientRect().top - paras[0].getBoundingClientRect().bottom;
    expect(Math.round(gap)).to.equal(22);
  });
});

describe("Crew template, live's pull quote", () => {
  let main;

  before(async () => {
    await adopt('/styles/styles.css', '/styles/crew.css');
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('crew', 'appear');
    main = buildCrewPage();
  });

  after(() => {
    document.body.classList.remove('crew', 'appear');
    document.body.replaceChildren();
  });

  it('sets the quote on black at 42 over 48', async () => {
    await setViewport({ width: 1440, height: 900 });
    const section = main.querySelector('.section.quote');
    const text = section.querySelector('blockquote p:first-child');
    expect(getComputedStyle(section).backgroundColor).to.equal('rgb(0, 0, 0)');
    expect(getComputedStyle(text).color).to.equal('rgb(255, 255, 255)');
    expect(getComputedStyle(text).fontSize).to.equal('42px');
    expect(getComputedStyle(text).lineHeight).to.equal('48px');
    expect(getComputedStyle(text).fontWeight).to.equal('300');
  });

  // live opens the quote with a 60 by 43 mark and indents the text past it
  it('opens the quote with live\'s mark', async () => {
    await setViewport({ width: 1440, height: 900 });
    const quote = main.querySelector('blockquote');
    expect(getComputedStyle(quote).paddingLeft).to.equal('112px');
    expect(getComputedStyle(quote).backgroundImage).to.contain('url(');
  });

  it('names the source under it in small caps', async () => {
    await setViewport({ width: 1440, height: 900 });
    const author = main.querySelector('blockquote p:last-child');
    const styles = getComputedStyle(author);
    expect(styles.fontSize).to.equal('12px');
    expect(styles.lineHeight).to.equal('16px');
    expect(styles.textTransform).to.equal('uppercase');
    expect(styles.letterSpacing).to.equal('0.6px');
    expect(styles.marginTop).to.equal('16px');
  });

  it('drops the mark above the quote at 375', async () => {
    await setViewport({ width: 375, height: 800 });
    const quote = main.querySelector('blockquote');
    const text = quote.querySelector('p:first-child');
    expect(getComputedStyle(quote).paddingLeft).to.equal('0px');
    expect(getComputedStyle(quote).paddingTop).to.equal('40px');
    expect(getComputedStyle(text).fontSize).to.equal('24px');
    expect(getComputedStyle(text).lineHeight).to.equal('32px');
  });
});
