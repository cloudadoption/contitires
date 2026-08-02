/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * A news teaser title, which is a link, and the line under it.
 *
 * Read as line and colour together, because the line alone says the wrong
 * thing. Both sides declare `text-decoration-line: underline` on these titles.
 * Live paints it `rgba(0, 0, 0, 0)` so a reader sees nothing; ours paints it
 * `rgb(255, 255, 255)` on a black band so a reader sees a white rule under
 * every headline. Measured on continentaltire.com/events and the published host
 * at the same path, three teasers on each side:
 *
 *   side   nesting            text-decoration-line   colour              seen
 *   live   h3 > a             underline              rgba(0, 0, 0, 0)    nothing
 *   ours   a.article-teaser > h3   underline          rgb(255, 255, 255)  a line
 *
 * THE NESTING IS WHY #240'S RULE CANNOT REACH IT. That rule takes the line off
 * `:is(h1..h6) a`, a heading wrapping its link. Our teaser is the other way
 * round, an anchor wrapping the heading, so the prose-link rule at 0-3-3 wins
 * and underlines it. Live's own tile-title policy is the one #240 recorded, and
 * a title that is a link is not prose whichever way the two nest.
 *
 * These are COMPUTED values on a rendered element rather than declarations.
 * `article-cards.css` already declares `text-decoration: none` on the teaser and
 * it never arrives: at 0-2-1 it loses to the prose rule, and only a computed
 * read shows that. Issue #455.
 */

/** The /events news band: live's black two-column band, Social left, News right. */
const teaser = (title) => `<li><a class="article-teaser" href="/learn/${title.toLowerCase().replace(/\W+/g, '-')}">
  <h3>${title}</h3><p>A short excerpt, cut where live cuts it...</p></a></li>`;

const doc = () => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/article-cards/article-cards.css">
</head><body class="appear"><main>
  <div class="section black two-columns article-cards-container">
    <div class="article-cards-wrapper">
      <div class="article-cards columns block">
        <ul class="article-cards-list">
          ${teaser('Continental Tire Announces the New ExtremeContact')}
          ${teaser('Continental Tire Announces Launch of the CrossContact')}
        </ul>
        <p><em><a href="/learn/news-and-events">See all news</a></em></p>
      </div>
    </div>
  </div>
</main></body></html>`;

/**
 * Renders the band at one width.
 * @param {number} width the viewport width to render at
 * @returns {Promise<Document>} the settled document
 */
async function renderAt(width) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:900px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = doc();
  });
  const settled = frame.contentDocument;
  await settled.fonts.ready;
  return settled;
}

/** What a reader sees: a line only if there is one AND its colour is not clear. */
function painted(view, el) {
  const cs = view.getComputedStyle(el);
  const clear = /rgba\([^)]*,\s*0\)$/.test(cs.textDecorationColor);
  return cs.textDecorationLine !== 'none' && !clear;
}

describe('News teaser titles, the line live keeps clear (#455)', () => {
  [375, 900, 1440].forEach((width) => {
    describe(`at ${width}`, () => {
      let settled;
      let view;

      before(async () => {
        settled = await renderAt(width);
        view = settled.defaultView;
      });

      after(() => settled.defaultView.frameElement.remove());

      /* styles.css holds `body` at `display: none` until `.appear`, and an
         undisplayed box reads 0 everywhere, which would let a colour assertion
         pass on an element that was never laid out. */
      it('renders into a laid-out document at the width asked for', () => {
        expect(view.innerWidth, 'iframe viewport').to.equal(width);
        expect(settled.querySelector('.article-teaser').clientWidth).to.be.greaterThan(0);
      });

      it('paints no line under a teaser title, which is what live shows', () => {
        settled.querySelectorAll('.article-teaser').forEach((a) => {
          expect(painted(view, a), `${a.querySelector('h3').textContent.slice(0, 30)}`)
            .to.be.false;
        });
      });

      // the band is black and its links are white, so a line here is the most
      // visible one on the page; this pins the colour that made it show
      it('leaves the teaser white, so only the line changed', () => {
        const a = settled.querySelector('.article-teaser');
        expect(view.getComputedStyle(a).color).to.equal('rgb(255, 255, 255)');
      });

      // #240's other half: a link inside a sentence keeps live's underline, and
      // this rule must not reach it
      it('still underlines the prose link that closes the band', () => {
        const prose = settled.querySelector('p em a');
        expect(painted(view, prose), 'See all news').to.be.true;
      });
    });
  });
});
