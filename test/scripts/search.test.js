/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';
import {
  PER_PAGE,
  stem,
  queryTerms,
  rank,
  search,
} from '../../scripts/search.js';

/**
 * test/fixtures/query-index.json is a verbatim snapshot of
 * https://main--contitires--cloudadoption.aem.live/query-index.json taken 2026-07-27,
 * 320 rows, bodies capped at 500 words. The scorer is tuned against it.
 */
let rows;

/** live's ranked page 1 per query, from .mossy/research/live-search-golden.json */
const GOLDEN_FIRST = {
  dealer: '/dealers',
  'winter tires': '/learn/faq-winter-tires',
};

before(async () => {
  const res = await fetch('/test/fixtures/query-index.json');
  rows = (await res.json()).data;
  expect(rows).to.have.length(320);
});

/** paths of a full ranked result list */
const paths = (results) => results.map((r) => r.path);

describe('stem', () => {
  it('folds a trailing s so tires matches tire', () => {
    expect(stem('tires')).to.equal(stem('tire'));
    expect(stem('dealers')).to.equal(stem('dealer'));
    expect(stem('seasons')).to.equal(stem('season'));
  });

  it('leaves a double s alone, and folds sses to ss', () => {
    expect(stem('class')).to.equal('class');
    expect(stem('classes')).to.equal('class');
  });

  it('leaves a short term intact', () => {
    expect(stem('ev')).to.equal('ev');
  });
});

describe('queryTerms', () => {
  it('splits a two-word query into separate stemmed terms', () => {
    expect(queryTerms('winter tires')).to.deep.equal(['winter', 'tire']);
  });

  it('lowercases, drops punctuation, and de-duplicates', () => {
    expect(queryTerms('All-Season')).to.deep.equal(['all', 'season']);
    expect(queryTerms('Tire tires')).to.deep.equal(['tire']);
  });

  it('returns nothing for a query with no word characters', () => {
    expect(queryTerms('   ')).to.deep.equal([]);
  });
});

describe('rank field weights', () => {
  const row = (path, title, description, body) => ({
    path, title, description, body,
  });

  it('puts a title match above a description match above a body match', () => {
    const docs = [
      row('/body', 'Nothing here', 'nothing here', 'a widget in the body'),
      row('/title', 'Widget guide', 'nothing here', 'nothing here'),
      row('/description', 'Nothing here', 'a widget in the description', 'nothing here'),
    ];
    expect(paths(rank(docs, 'widget'))).to.deep.equal(['/title', '/description', '/body']);
  });

  it('scores more hits in a field above fewer', () => {
    const docs = [
      row('/one', 'Guide', 'x', 'widget'),
      row('/three', 'Guide', 'x', 'widget widget widget'),
    ];
    expect(paths(rank(docs, 'widget'))).to.deep.equal(['/three', '/one']);
  });

  it('does not count the site suffix as a title match', () => {
    const docs = [
      row('/snow', 'Snow Guide | Continental Tire', '', ''),
      row('/tire', 'Tire Guide | Continental Tire', '', ''),
    ];
    expect(paths(rank(docs, 'tire'))).to.deep.equal(['/tire']);
  });

  it('puts a title covering both terms above a title covering one', () => {
    const docs = [
      row('/one', 'Winter guide', '', 'tire tire tire tire'),
      row('/both', 'Winter tires', '', ''),
    ];
    expect(paths(rank(docs, 'winter tires'))).to.deep.equal(['/both', '/one']);
  });

  it('drops rows that match no term', () => {
    const docs = [row('/a', 'Widget', '', ''), row('/b', 'Nothing', '', '')];
    expect(paths(rank(docs, 'widget'))).to.deep.equal(['/a']);
  });

  it('returns scores in descending order', () => {
    const scores = rank(rows, 'tire').map((r) => r.score);
    expect(scores).to.have.length.above(1);
    expect([...scores].sort((a, b) => b - a)).to.deep.equal(scores);
  });
});

describe('rank against the golden set', () => {
  it('puts /dealers first for the query dealer', () => {
    expect(rank(rows, 'dealer')[0].path).to.equal(GOLDEN_FIRST.dealer);
  });

  it('puts /learn/faq-winter-tires first for the query winter tires', () => {
    expect(rank(rows, 'winter tires')[0].path).to.equal(GOLDEN_FIRST['winter tires']);
  });

  it('fills the top five for the query tire with titles holding tire or tires', () => {
    const top = rank(rows, 'tire').slice(0, 5);
    expect(top).to.have.length(5);
    top.forEach((r) => expect(r.title.toLowerCase()).to.match(/tires?\b/));
  });

  it('matches the query warranty in the body, with no title match in the top five', () => {
    const top = rank(rows, 'warranty').slice(0, 5);
    expect(top).to.have.length(5);
    top.forEach((r) => {
      expect(r.title.toLowerCase()).to.not.include('warranty');
      expect(r.body.toLowerCase()).to.include('warranty');
    });
  });

  it('takes a two-word query as separate stemmed terms, not as a phrase', () => {
    const results = rank(rows, 'winter tires');
    const apart = results.filter((r) => !`${r.title} ${r.description} ${r.body}`
      .toLowerCase().includes('winter tire'));
    // a phrase matcher would return none of these
    expect(apart.length).to.be.above(0);
  });

  it('requires every term, so a two-word query narrows one of its terms', () => {
    const both = paths(rank(rows, 'winter tires'));
    const tires = new Set(paths(rank(rows, 'tires')));
    expect(both.length).to.be.below(tires.size);
    both.forEach((path) => expect(tires.has(path)).to.be.true);
    rank(rows, 'winter tires').forEach((r) => {
      const text = `${r.title} ${r.description} ${r.body}`.toLowerCase();
      expect(text).to.include('winter');
      expect(text).to.include('tire');
    });
  });

  it('returns nothing when one term of a query matches no row', () => {
    expect(rank(rows, 'tire zzzqqq')).to.deep.equal([]);
  });

  it('returns results for a two-letter query, unlike live', () => {
    const results = rank(rows, 'ev');
    expect(results.length).to.be.above(0);
    expect(paths(results).slice(0, 5)).to.include('/ev-compatible');
  });
});

describe('search paging', () => {
  it('pages ten at a time', () => {
    expect(PER_PAGE).to.equal(10);
    expect(search(rows, 'tire').results).to.have.length(10);
  });

  it('reports the full total and page count, and pages are zero based', () => {
    const all = rank(rows, 'tire');
    const first = search(rows, 'tire', 0);
    const second = search(rows, 'tire', 1);
    expect(first.total).to.equal(all.length);
    expect(first.pages).to.equal(Math.ceil(all.length / PER_PAGE));
    expect(paths(first.results)).to.deep.equal(paths(all.slice(0, 10)));
    expect(paths(second.results)).to.deep.equal(paths(all.slice(10, 20)));
  });

  it('returns an empty last page beyond the end, and never a negative page', () => {
    const { pages } = search(rows, 'tire');
    expect(search(rows, 'tire', pages).results).to.have.length(0);
    expect(paths(search(rows, 'tire', -1).results)).to.deep.equal(
      paths(search(rows, 'tire', 0).results),
    );
  });

  it('returns nothing for a query that matches no row', () => {
    const { total, results, pages } = search(rows, 'zzzqqq');
    expect(total).to.equal(0);
    expect(results).to.deep.equal([]);
    expect(pages).to.equal(0);
  });

  it('returns nothing for an empty query', () => {
    expect(search(rows, '').total).to.equal(0);
  });
});
