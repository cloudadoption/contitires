/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/*
 * `:is()` takes its specificity from its most specific branch, so a plain `a`
 * matched through `:is(a, button[data-tire-finder])` scores as though it carried
 * the attribute selector. That is what made the social band paint its links into
 * their own background in #198, and stylelint's no-descending-specificity did
 * not warn because it compares key selectors and `:is(...)` is not `a`.
 *
 * Three of them were left in footer.css: the icon sizing rule and the hover
 * pair. Written out, the icon rule scores 0-2-2 on its `a` branch rather than
 * 0-3-2, and the hover pair the same, so both have to still win against what
 * they compete with. The two rendered checks below are what proves that: the
 * 16px icon against the global `.icon` rule at 0-1-0, and the underline against
 * the base link rule at 0-1-2.
 */

/** Specificity of a compound selector as [ids, classes, types]. */
function specificity(sel) {
  const s = sel.replace(/::[\w-]+/g, ' T ').trim();
  const ids = (s.match(/#[\w-]+/g) || []).length;
  const classes = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g) || []).length;
  const types = (s.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length;
  return [ids, classes, types];
}

/** Every `:is()` argument list in a selector, split into its branches. */
function isBranches(sel) {
  return [...sel.matchAll(/:is\(([^)]*)\)/g)]
    .map((m) => m[1].split(',').map((b) => b.trim()));
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

/* the wrapper chain the page builds, so the sheet's `footer .footer ...` rules
   reach the fixture the way they reach the page */
const FIXTURE = `
  <footer class="footer-wrapper"><div class="footer block"><div class="footer-content"><div class="footer-links">
    <div class="footer-links-group">
      <h2>Search for Tire</h2>
      <ul>
        <li><a href="/tire-search/by-vehicle"><span class="icon icon-vehicle"></span>By Vehicle</a></li>
        <li><button type="button" data-tire-finder="tire-size"><span class="icon icon-tire-size"></span>By Tire</button></li>
      </ul>
    </div>
  </div></div></div></footer>`;

describe('Footer, the mixed-specificity :is() selectors are written out (#202)', () => {
  let sheets;
  let text;
  let host;

  before(async () => {
    text = await (await fetch('/blocks/footer/footer.css')).text();
    sheets = await Promise.all(['/styles/styles.css', '/blocks/footer/footer.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(path === '/blocks/footer/footer.css' ? text : await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
    host = document.createElement('div');
    host.innerHTML = FIXTURE;
    document.body.append(host);
    await setViewport({ width: 1440, height: 900 });
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    host.remove();
  });

  it('carries no :is() whose branches score differently', async () => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(text);
    const selectors = [];
    const walk = (rules) => [...rules].forEach((rule) => {
      if (rule.cssRules) walk(rule.cssRules);
      if (rule.selectorText) selectors.push(...selectorList(rule.selectorText));
    });
    walk(sheet.cssRules);
    const mixed = selectors
      .map((sel) => sel.trim())
      .filter((sel) => isBranches(sel)
        .some((branches) => new Set(branches.map((b) => specificity(b).join('-'))).size > 1));
    expect(mixed, 'selectors whose :is() inflates one branch').to.eql([]);
  });

  const icon = (sel) => host.querySelector(`${sel} .icon`).getBoundingClientRect();

  it('still sizes the link icon at 16, against the global .icon rule', () => {
    const r = icon('a');
    expect([Math.round(r.width), Math.round(r.height)]).to.eql([16, 16]);
  });

  it('still sizes the finder button icon at 16', () => {
    const r = icon('button[data-tire-finder]');
    expect([Math.round(r.width), Math.round(r.height)]).to.eql([16, 16]);
  });

  /*
   * The hover pair is the other half, and splitting a grouped selector is where
   * a branch gets dropped. Neither :hover nor :focus-visible can be raised from
   * a test, so the reach is what is checked: the rule that underlines a footer
   * link has to still name both a link and a finder button. `a:any-link` in
   * styles.css clears the UA underline, so this rule is the only one that puts
   * one back.
   */
  it('still reaches both the link and the finder button on hover and focus', async () => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(text);
    const link = host.querySelector('a');
    const button = host.querySelector('button[data-tire-finder]');
    expect(getComputedStyle(link).textDecorationLine, 'nothing underlines a footer link at rest').to.equal('none');
    const underliners = [...sheet.cssRules]
      .filter((rule) => rule.style?.textDecoration === 'underline' || rule.style?.textDecorationLine === 'underline')
      .flatMap((rule) => selectorList(rule.selectorText))
      .filter((sel) => sel.includes('.footer-links-group'));
    const reached = (el) => underliners
      .filter((sel) => el.matches(sel.replace(/:hover|:focus-visible/g, '')));
    expect(reached(link), 'a link the reader hovers').to.not.be.empty;
    expect(reached(button), 'a finder button the reader hovers').to.not.be.empty;
    ['hover', 'focus-visible'].forEach((state) => {
      expect(underliners.some((sel) => sel.includes(`:${state}`)), `${state} is covered`).to.be.true;
    });
  });
});
