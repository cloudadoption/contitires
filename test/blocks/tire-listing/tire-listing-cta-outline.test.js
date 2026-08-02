/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/*
 * Live draws the SEE DETAILS pill with `btn--border-yellow`: a white box with a
 * 2px `--yellow` outline that fills yellow on hover. Both copies of the pill
 * carry it, the `hidden-mobile` one in the card header and the `hidden-desktop`
 * one at the foot of the card, so the outline is gold at every width. Read off
 * /tires with getComputedStyle: `rgb(255, 165, 0)` on a 287x45 box at 375 and on
 * a 136x45 box at 1440, over `rgb(255, 255, 255)`. Live's `--yellow` is #ffa500,
 * which is this site's `--conti-yellow` already.
 *
 * The block declared that yellow and LOST THE CASCADE. `a.button.secondary` in
 * styles.css scores 0-2-1 and sets `border-color: var(--conti-black)`, so a rule
 * written at `.tire-listing .tire-listing-cta`, 0-2-0, is out-scored and the pill
 * draws in #333. Measured on the published host before this test existed:
 * `rgb(51, 51, 51)` at both widths, and `rgba(0, 0, 0, 0)` for the background
 * where live is white, because the same rule loses that declaration too. Ten
 * pills on each of twelve pages.
 *
 * Every other block that recolours a variant NAMES it, which is why none of them
 * has this bug: `.hero .button.primary`, `main .columns.bar .button.secondary`,
 * `.store-locator .button.secondary`. Live raises its own the same way, by
 * writing the class twice: `.btn--border-yellow.btn--border-yellow`.
 *
 * THE TOGGLE IS NOT PART OF THIS. Live's mobile filter control is
 * `btn--sm btn--white btn--border-black`, drawn dark, which is what `secondary`
 * already gives it. So the yellow has to reach the pill and stop there, and the
 * last case below is what holds it there.
 */

/** Specificity of a compound selector as [ids, classes, types]. */
function specificity(sel) {
  const s = sel.replace(/::[\w-]+/g, ' T ').trim();
  const ids = (s.match(/#[\w-]+/g) || []).length;
  const classes = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g) || []).length;
  const types = (s.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length;
  return [ids, classes, types];
}

/** Compares two specificity tuples, negative when a is the weaker one. */
function compare(a, b) {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/** Splits a selector list on its own commas, not the ones inside `:is()`. */
function selectorList(text) {
  const out = [];
  let depth = 0;
  let start = 0;
  [...text].forEach((ch, i) => {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  });
  out.push(text.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Every selector in a sheet that declares `prop`, media queries flattened. */
function declarers(sheet, prop) {
  const out = [];
  const walk = (rules) => [...rules].forEach((rule) => {
    if (rule.cssRules) walk(rule.cssRules);
    if (rule.selectorText && rule.style?.getPropertyValue(prop)) {
      selectorList(rule.selectorText).forEach((sel) => {
        out.push({ sel, value: rule.style.getPropertyValue(prop) });
      });
    }
  });
  walk(sheet.cssRules);
  return out;
}

/* the pill as `buildCard` leaves it and the filter control as `decorate` leaves
   it, both carrying the variant classes the block puts on them, so styles.css
   competes here the way it competes on the page */
const FIXTURE = `
  <div class="tire-listing block">
    <aside class="tire-listing-side">
      <button type="button" class="tire-listing-toggle button secondary" aria-expanded="false">Show filter</button>
    </aside>
    <ul class="tire-listing-cards">
      <li class="tire-listing-card">
        <div class="tire-listing-card-body">
          <a class="tire-listing-cta button secondary" href="/tires/procontact-tx10">See Details</a>
        </div>
      </li>
    </ul>
  </div>`;

const DOC = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/tire-listing/tire-listing.css">
</head><body class="appear"><main><div class="section"><div>${FIXTURE}</div></div></main></body></html>`;

/**
 * Renders the fixture in an iframe of the given width, so the block's media
 * queries resolve against a viewport this test chooses rather than the runner's.
 * @param {number} width the viewport width to render at
 * @returns {Promise<Document>} the iframe's settled document
 */
async function renderAt(width) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:1200px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = DOC;
  });
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  return doc;
}

describe('tire listing, the pill takes live\'s gold outline', () => {
  // the pill is full-width below live's 769 step and auto above it, and live
  // draws it gold in both forms
  [375, 769, 1440].forEach((width) => {
    describe(`at ${width}`, () => {
      let doc;
      before(async () => { doc = await renderAt(width); });
      after(() => doc.defaultView.frameElement.remove());

      const style = (sel) => doc.defaultView.getComputedStyle(doc.querySelector(sel));

      it('renders into a laid-out document at the width asked for', () => {
        expect(doc.defaultView.innerWidth, 'iframe viewport').to.equal(width);
        expect(doc.querySelector('.tire-listing-cta').getBoundingClientRect().height, 'a laid-out pill has a height')
          .to.be.above(0);
      });

      it('outlines the pill in live\'s --yellow, 2px solid', () => {
        const cs = style('.tire-listing-cta');
        expect(cs.borderTopColor, 'border colour').to.equal('rgb(255, 165, 0)');
        expect(cs.borderTopWidth, 'border width').to.equal('2px');
        expect(cs.borderTopStyle, 'border style').to.equal('solid');
      });

      it('fills the pill white, as live\'s .btn does', () => {
        expect(style('.tire-listing-cta').backgroundColor).to.equal('rgb(255, 255, 255)');
      });
    });
  });

  describe('the cascade the pill has to win', () => {
    let host;
    let sheets;

    before(async () => {
      const paths = ['/styles/styles.css', '/blocks/tire-listing/tire-listing.css'];
      sheets = await Promise.all(paths.map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
      host = document.createElement('div');
      host.innerHTML = FIXTURE;
      document.body.append(host);
    });

    after(() => {
      host.remove();
    });

    /*
     * Neither :hover nor :focus-visible can be raised from a test, so what is
     * checked is the reach: the block's hover pair has to out-score every rule
     * in styles.css that fills this element on hover. `a.button.secondary:hover`
     * is 0-3-1 and fills it with `--conti-black`, which would flip the pill to
     * black where live flips it to yellow.
     */
    it('raises the hover fill over a.button.secondary:hover', () => {
      const [global, block] = sheets;
      const pill = host.querySelector('.tire-listing-cta');
      const hovers = (sheet) => declarers(sheet, 'background-color')
        .filter(({ sel }) => sel.includes(':hover'))
        .filter(({ sel }) => pill.matches(sel.replace(/:hover|:focus-visible/g, '')))
        .map(({ sel, value }) => ({ sel, value, score: specificity(sel) }));
      const ours = hovers(block);
      const theirs = hovers(global);
      expect(ours, 'the block fills the pill on hover').to.not.be.empty;
      expect(theirs, 'styles.css fills it too, which is the competition').to.not.be.empty;
      ours.forEach((rule) => {
        expect(rule.value, `${rule.sel} fills with the yellow token`).to.contain('--conti-yellow');
        theirs.forEach((other) => {
          expect(
            compare(rule.score, other.score),
            `${rule.sel} (${rule.score}) over ${other.sel} (${other.score})`,
          ).to.be.above(0);
        });
      });
    });

    /*
     * The scope guard. Live's filter control is `btn--border-black`, so the
     * yellow must not travel to it on the way past. It shares the block, the
     * `.button` class and the `secondary` variant with the pill, so a fix
     * written one class wider than it needs to be would repaint it.
     */
    it('leaves the filter toggle dark, as live draws it', async () => {
      const doc = await renderAt(375);
      const cs = doc.defaultView.getComputedStyle(doc.querySelector('.tire-listing-toggle'));
      expect(cs.borderTopColor, 'the toggle keeps the secondary outline').to.equal('rgb(51, 51, 51)');
      doc.defaultView.frameElement.remove();
    });
  });
});
