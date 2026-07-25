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
