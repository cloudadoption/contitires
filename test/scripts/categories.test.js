/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { CATEGORIES, categoryNames, isKnownCategory } from '../../scripts/categories.js';

describe('The learn categories', () => {
  it('names the three an article can carry, and the page each one lists on', () => {
    expect(CATEGORIES).to.deep.equal([
      { name: 'Tire Tips', path: '/learn/tips' },
      { name: 'Technology', path: '/learn/technology' },
      { name: 'News', path: '/learn/news-and-events' },
    ]);
  });

  it('reads the names off them', () => {
    expect(categoryNames()).to.deep.equal(['Tire Tips', 'Technology', 'News']);
  });
});

describe('A category an author has typed', () => {
  it('knows the three', () => {
    expect(isKnownCategory('Tire Tips')).to.be.true;
    expect(isKnownCategory('Technology')).to.be.true;
    expect(isKnownCategory('News')).to.be.true;
  });

  // the listing matches a category without regard to case, so this does too
  it('is not upset by case or by the spaces around it', () => {
    expect(isKnownCategory('tire tips')).to.be.true;
    expect(isKnownCategory('  News  ')).to.be.true;
  });

  it('does not know a typo', () => {
    expect(isKnownCategory('Tire Tps')).to.be.false;
    expect(isKnownCategory('Tires Tips')).to.be.false;
    expect(isKnownCategory('Events')).to.be.false;
  });

  // no category at all asks for every article, which the hub bands do
  it('treats no category as a listing that filters by none', () => {
    expect(isKnownCategory('')).to.be.true;
    expect(isKnownCategory(undefined)).to.be.true;
  });
});
