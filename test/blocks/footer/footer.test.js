/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';
import { buildFooterContent, setFooterDisclosures } from '../../../blocks/footer/footer.js';
import { loadFragment } from '../../../blocks/fragment/fragment.js';

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
    expect(!!social.closest('.footer-links'), 'social bar is not nested in .footer-links').to.be.false;
  });

  // A page carries one h1 and the footer follows it, so an h3 here skips a
  // level and Lighthouse fails heading-order on all 330 pages. The fragment
  // cannot know what sits above it, so the block sets the rank.
  it('gives each group an h2, so it follows the page h1 without a skip', () => {
    const content = buildFooterContent(buildFragment());
    const headings = [...content.querySelectorAll('.footer-links-group :is(h1,h2,h3,h4,h5,h6)')];
    expect(headings, 'every group is headed').to.have.length(2);
    headings.forEach((h) => expect(h.tagName).to.equal('H2'));
  });

  it('keeps the heading text and its id when it changes rank', () => {
    const fragment = buildFragment();
    fragment.querySelector('h3').id = 'follow-us';
    const content = buildFooterContent(fragment);
    const heading = content.querySelector('.footer-social :is(h1,h2,h3,h4,h5,h6)');
    expect(heading.id).to.equal('follow-us');
    expect(heading.textContent.trim()).to.equal('Follow Us');
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

describe('Footer tire search column', () => {
  // Live opens the finder from these three. Ours pointed at /tire-search, which
  // the POC does not have, so all three were dead on every page.
  function buildSearchColumn() {
    const fragment = document.createElement('div');
    fragment.innerHTML = `
      <h3>Search for Tire</h3>
      <ul>
        <li><a href="/tire-search/by-vehicle">By Vehicle</a></li>
        <li><a href="/tire-search">By Tire</a></li>
        <li><a href="/tire-search">By License Plate</a></li>
        <li><a href="/search">Search Site</a></li>
      </ul>`;
    return buildFooterContent(fragment);
  }

  it('opens the finder from the three tire searches', () => {
    const triggers = [...buildSearchColumn().querySelectorAll('[data-tire-finder]')];
    expect(triggers.map((t) => t.dataset.tireFinder)).to.eql(['vehicle', 'tire-size', 'plate']);
  });

  it('leaves the site search a link', () => {
    const siteSearch = buildSearchColumn().querySelector('a[href="/search"]');
    expect(siteSearch, 'site search is still a link').to.exist;
    expect(siteSearch.dataset.tireFinder).to.be.undefined;
  });

  // The "Find Tires" call to action navigates rather than opening the finder.
  // Its authored path is answered by the redirects sheet, so the footer leaves
  // it alone: a crawler and a visitor without JavaScript follow the same href.
  it('leaves the Find Tires call to action on its authored path', () => {
    // decorateButtons has already run on the fragment by this point, so the
    // authored single-link paragraphs arrive as buttons
    const fragment = document.createElement('div');
    fragment.innerHTML = `
      <p><a href="/store-finder" class="button">Find Stores</a></p>
      <p><a href="/tire-search" class="button">Find Tires</a></p>
      <h3>Search for Tire</h3>
      <ul>
        <li><a href="/tire-search/by-vehicle">By Vehicle</a></li>
        <li><a href="/tire-search">By Tire</a></li>
      </ul>`;
    const content = buildFooterContent(fragment);

    const cta = [...content.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Find Tires');
    expect(cta, 'the call to action survives grouping').to.exist;
    expect(cta.getAttribute('href'), 'call to action keeps its authored path').to.equal('/tire-search');
    expect(cta.dataset.tireFinder, 'it navigates, it does not open the finder').to.be.undefined;
  });
});

// loadFragment runs decorateMain over the fetched footer before footer.js
// marks anything. Fetching a real fragment is what exercises that order.
describe('Footer loaded the way the page loads it', () => {
  let content;

  before(async () => {
    const fragment = await loadFragment('/test/blocks/footer/mock-footer');
    expect(fragment, 'the fixture fragment loaded').to.exist;
    content = buildFooterContent(fragment);
  });

  const SEARCHES = ['By Vehicle', 'By Tire', 'By License Plate'];
  const linkNamed = (text) => [...content.querySelectorAll('a')]
    .find((a) => a.textContent.trim() === text);
  const triggerNamed = (text) => [...content.querySelectorAll('[data-tire-finder]')]
    .find((t) => t.textContent.trim() === text);

  it('leaves the Find Tires call to action on its authored path', () => {
    expect(linkNamed('Find Tires').getAttribute('href')).to.equal('/tire-search');
  });

  // the three searches open the finder where they stand, so each renders as a
  // button, as live's do
  it('turns the three finder triggers into buttons', () => {
    expect(SEARCHES.map((t) => triggerNamed(t).tagName))
      .to.eql(['BUTTON', 'BUTTON', 'BUTTON']);
  });

  it('still marks the three finder triggers', () => {
    expect(SEARCHES.map((t) => triggerNamed(t).dataset.tireFinder))
      .to.eql(['vehicle', 'tire-size', 'plate']);
  });

  // the button is what a visitor with JavaScript gets. The authored href is
  // what a crawler and a visitor without it follow, so the fragment keeps it.
  it('leaves the authored hrefs in the fragment the page fetches', async () => {
    const fragment = await loadFragment('/test/blocks/footer/mock-footer');
    const authored = [...fragment.querySelectorAll('a')]
      .filter((a) => SEARCHES.includes(a.textContent.trim()));
    expect(authored.map((a) => a.getAttribute('href')))
      .to.eql(['/tire-search/by-vehicle', '/tire-search', '/tire-search']);
  });

  it('leaves every other footer link where the author put it', () => {
    expect(linkNamed('Search Site').getAttribute('href')).to.equal('/search');
    expect(linkNamed('Find Stores').getAttribute('href')).to.equal('/store-finder');
    expect(linkNamed('Passenger').getAttribute('href')).to.equal('/tires/passenger');
  });
});

describe('Footer social band', () => {
  // Live shows each icon with its network name from 769 up, and hides the name
  // below that. The name has to be in the DOM for CSS to make that call.
  function buildSocial() {
    const fragment = document.createElement('div');
    fragment.innerHTML = `
      <h3>Follow Us</h3>
      <ul>
        <li><a href="https://www.facebook.com/continentaltire">Facebook</a></li>
        <li><a href="https://twitter.com/continentaltire">X</a></li>
        <li><a href="https://www.instagram.com/continental_tire/">Instagram</a></li>
        <li><a href="https://www.youtube.com/user/continentaltire">Youtube</a></li>
      </ul>`;
    return buildFooterContent(fragment).querySelector('.footer-social');
  }

  it('keeps the network name as a label beside each icon', () => {
    const links = [...buildSocial().querySelectorAll('a')];
    expect(links.length, 'four social links').to.equal(4);
    expect(
      links.map((a) => a.querySelector('.footer-social-label')?.textContent),
      'every link carries its network name',
    ).to.eql(['Facebook', 'X', 'Instagram', 'Youtube']);
    links.forEach((a) => {
      expect([...a.children].map((el) => el.tagName), 'the icon comes before the label')
        .to.eql(['svg', 'SPAN']);
    });
  });

  it('names each link with the text it shows', () => {
    [...buildSocial().querySelectorAll('a')].forEach((a) => {
      const label = a.querySelector('.footer-social-label');
      expect(label, 'the link shows a label').to.exist;
      // the label is hidden below 769, so the name cannot come from it alone
      expect(a.getAttribute('aria-label'), 'the name matches the label it shows')
        .to.equal(label.textContent);
    });
  });
});

describe('Footer disclosures', () => {
  // Live collapses the plain link columns into disclosure rows while they are a
  // single stack, and keeps the search column, whose links carry icons, open.
  function buildLinks() {
    const fragment = document.createElement('div');
    fragment.innerHTML = `
      <h3>Search for Tire</h3>
      <ul>
        <li><a href="/tire-search/by-vehicle"><span class="icon icon-vehicle"></span>By Vehicle</a></li>
        <li><a href="/search"><span class="icon icon-search"></span>Search Site</a></li>
      </ul>
      <h3>Our Tires</h3>
      <ul>
        <li><a href="/tires/passenger">Passenger</a></li>
        <li><a href="/tires/crossover">Crossover</a></li>
      </ul>
      <h3>Company Info</h3>
      <ul>
        <li><a href="/media">Brand Assets</a></li>
      </ul>`;
    return buildFooterContent(fragment).querySelector('.footer-links');
  }

  it('turns each plain link column into a collapsed disclosure', () => {
    const links = buildLinks();
    setFooterDisclosures(links, true);
    const [, tires, company] = links.querySelectorAll('.footer-links-group');
    [tires, company].forEach((group) => {
      const label = group.querySelector('h2').textContent.trim();
      const toggle = group.querySelector('h2 > button');
      expect(toggle, `${label} has a toggle`).to.exist;
      expect(toggle.tagName, `${label} toggles with a real button`).to.equal('BUTTON');
      expect(toggle.type, `${label} does not submit`).to.equal('button');
      expect(toggle.getAttribute('aria-expanded'), `${label} starts collapsed`).to.equal('false');
      const list = group.querySelector('ul');
      expect(toggle.getAttribute('aria-controls'), `${label} points at its list`)
        .to.equal(list.id);
      expect(list.hidden, `${label} list is hidden`).to.be.true;
    });
  });

  it('keeps the icon column open', () => {
    const links = buildLinks();
    setFooterDisclosures(links, true);
    const [search, tires] = links.querySelectorAll('.footer-links-group');
    expect(tires.querySelector('.footer-links-toggle'), 'the plain columns did collapse').to.exist;
    expect(!!search.querySelector('.footer-links-toggle'), 'the search column has no toggle').to.be.false;
    expect(search.querySelector('ul').hidden, 'the search column stays open').to.be.false;
  });

  it('shows and hides the list on click, with aria-expanded in step', () => {
    const links = buildLinks();
    setFooterDisclosures(links, true);
    const group = links.querySelectorAll('.footer-links-group')[1];
    const toggle = group.querySelector('button');
    const list = group.querySelector('ul');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded'), 'expanded after a click').to.equal('true');
    expect(list.hidden, 'list shown').to.be.false;

    toggle.click();
    expect(toggle.getAttribute('aria-expanded'), 'collapsed after a second click').to.equal('false');
    expect(list.hidden, 'list hidden again').to.be.true;
  });

  it('restores the plain heading and list when the columns come back', () => {
    const links = buildLinks();
    setFooterDisclosures(links, true);
    const group = links.querySelectorAll('.footer-links-group')[1];
    expect(group.querySelector('button'), 'collapsed first').to.exist;

    setFooterDisclosures(links, false);
    expect(!!group.querySelector('button'), 'no toggle left').to.be.false;
    expect(group.querySelector('h2').textContent.trim(), 'heading text kept').to.equal('Our Tires');
    expect(group.querySelector('ul').hidden, 'list shown').to.be.false;
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

  /** The .footer-links rule that wins at a viewport `width` wide. */
  function linksRuleAt(width) {
    const applicable = [...sheet.cssRules]
      .filter((rule) => rule instanceof CSSMediaRule)
      .map((media) => ({
        from: Number(media.conditionText.match(/(\d+)px/)?.[1]),
        rule: [...media.cssRules].find((r) => r.selectorText === 'footer .footer-links'),
      }))
      .filter((m) => m.rule && m.from <= width)
      .sort((a, b) => b.from - a.from);
    expect(applicable[0], `.footer-links is laid out at ${width}`).to.exist;
    return applicable[0].rule;
  }

  /** Track count of a rule's grid-template-columns, repeat() included. */
  function trackCount(rule) {
    const value = rule.style.getPropertyValue('grid-template-columns');
    const repeat = value.match(/^repeat\(\s*(\d+)\s*,/);
    if (repeat) return Number(repeat[1]);
    return value.split(/\s+(?![^(]*\))/).filter(Boolean).length;
  }

  it('gives the six groups a row of six tracks at 1440', () => {
    expect(trackCount(linksRuleAt(1440)), 'six columns').to.equal(6);
  });

  it('drops to three tracks at 1000 instead of reflowing', () => {
    const rule = linksRuleAt(1000);
    expect(trackCount(rule), 'three columns').to.equal(3);
    expect(linksRuleAt(900).style.display, 'a grid, so the track count is fixed')
      .to.equal('grid');
  });
});

/**
 * The grouping walk looked at headings, lists and paragraphs and nothing else,
 * so an ordered list, a table or a quote in the footer fragment never reached
 * the page. Content the block has no treatment for goes through unstyled
 * instead. Issue #118.
 */
describe('Footer content the block has no treatment for', () => {
  function fragmentWith(extra) {
    const fragment = document.createElement('div');
    fragment.innerHTML = `
      <h3>Company</h3>
      <ul><li><a href="/about">About</a></li></ul>
      ${extra}
      <p>&copy; 2026 Continental Tire</p>`;
    return fragment;
  }

  it('keeps an authored ordered list', () => {
    const content = buildFooterContent(fragmentWith('<ol><li>Read the warranty</li><li>Register</li></ol>'));
    const list = content.querySelector('ol');
    expect(list, 'the list is on the page').to.exist;
    expect(list.querySelectorAll('li')).to.have.length(2);
  });

  it('keeps an authored table and an authored quote', () => {
    const content = buildFooterContent(fragmentWith('<table><tr><td>Hours</td></tr></table><blockquote>Since 1871</blockquote>'));
    expect(content.querySelector('table'), 'the table').to.exist;
    expect(content.querySelector('blockquote'), 'the quote').to.exist;
  });

  it('leaves the legal copy where it was', () => {
    const content = buildFooterContent(fragmentWith('<ol><li>Read the warranty</li></ol>'));
    const bottom = content.querySelector('.footer-bottom');
    expect(bottom, 'the legal bar').to.exist;
    expect(bottom.textContent).to.contain('Continental Tire');
    expect(bottom.querySelector('ol') === null, 'the list is not in the legal bar').to.be.true;
  });
});
