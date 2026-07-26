/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { buildFooterContent } from '../../../blocks/footer/footer.js';

/** Builds a footer fragment: a social group, a nav column, and legal copy. */
function buildFragment() {
  const fragment = document.createElement('div');
  fragment.innerHTML = `
    <h3>Follow Us</h3>
    <ul>
      <li><a href="https://facebook.com/contitire">Facebook</a></li>
      <li><a href="https://twitter.com/contitire">Twitter</a></li>
      <li><a href="https://instagram.com/contitire">Instagram</a></li>
      <li><a href="https://youtube.com/contitire">YouTube</a></li>
    </ul>
    <h3>Company</h3>
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/careers">Careers</a></li>
    </ul>
    <p>&copy; 2026 Continental Tire</p>
    <ul>
      <li><a href="/privacy">Privacy</a></li>
    </ul>`;
  return fragment;
}

describe('Footer content structure', () => {
  it('hoists the social bar to a direct child of .footer-content', () => {
    const content = buildFooterContent(buildFragment());
    const social = content.querySelector('.footer-social');
    expect(social, 'a social bar exists').to.exist;
    expect(social.parentElement, 'social bar is a direct child of .footer-content')
      .to.equal(content);
    expect(social.closest('.footer-links'), 'social bar is not nested in .footer-links')
      .to.be.null;
  });

  it('renders the social bar above the link columns', () => {
    const content = buildFooterContent(buildFragment());
    const kids = [...content.children];
    const socialIdx = kids.findIndex((c) => c.classList.contains('footer-social'));
    const linksIdx = kids.findIndex((c) => c.classList.contains('footer-links'));
    expect(socialIdx, 'social bar present').to.be.greaterThan(-1);
    expect(linksIdx, 'link columns present').to.be.greaterThan(-1);
    expect(socialIdx, 'social bar comes before the columns').to.be.lessThan(linksIdx);
  });
});

describe('Footer column layout', () => {
  // Live lays the groups on a fixed column grid: six tracks on wide desktop,
  // three below that. Reflowing with flex-wrap left one orphan group on a
  // second row between 900 and 1183.
  let sheet;

  before(async () => {
    const res = await fetch('/blocks/footer/footer.css');
    sheet = new CSSStyleSheet();
    await sheet.replace(await res.text());
  });

  /** The .footer-links rule inside the breakpoint that starts at `width`. */
  function linksRuleAt(width) {
    const media = [...sheet.cssRules]
      .filter((rule) => rule instanceof CSSMediaRule)
      .find((rule) => rule.conditionText.includes(`${width}px`));
    expect(media, `a ${width}px breakpoint exists`).to.exist;
    const rule = [...media.cssRules]
      .find((r) => r.selectorText === 'footer .footer-links');
    expect(rule, `.footer-links is laid out at ${width}`).to.exist;
    return rule;
  }

  /** Track count of a rule's grid-template-columns, repeat() included. */
  function trackCount(rule) {
    const value = rule.style.getPropertyValue('grid-template-columns');
    const repeat = value.match(/^repeat\(\s*(\d+)\s*,/);
    if (repeat) return Number(repeat[1]);
    return value.split(/\s+(?![^(]*\))/).filter(Boolean).length;
  }

  it('gives the six groups a row of six tracks on wide desktop', () => {
    expect(trackCount(linksRuleAt(1200)), 'six columns').to.equal(6);
  });

  it('drops to three tracks below that instead of reflowing', () => {
    const rule = linksRuleAt(900);
    expect(rule.style.display, 'a grid, so the track count is fixed').to.equal('grid');
    expect(trackCount(rule), 'three columns').to.equal(3);
  });
});
