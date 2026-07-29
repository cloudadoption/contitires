/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/** The picker reads this index, and every row points at one sample document. */
const INDEX = '/tools/sidekick/library.json';
const SAMPLE_PATH = /^\/tools\/sidekick\/blocks\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/**
 * The site has two indexes and one picker in each place that reads one of
 * them. This file is what goes to DA at /library/blocks.json, so the pair can
 * be compared here rather than only by a person with a token. (#290)
 */
const DA_INDEX = '/tools/sidekick/library-da.json';
const DA_PREFIX = 'https://content.da.live/cloudadoption/contitires';

/** "Tire Specs" -> "tire-specs", the way the sample's own path spells it. */
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Every block with a sample document under /tools/sidekick/blocks/. */
const SAMPLED = [
  'Article Cards', 'Banner', 'Cards', 'Carousel', 'Category Tabs', 'Columns',
  'Crew', 'Events', 'Hero', 'Media Gallery', 'Perfect Fit', 'Promo Bar',
  'Related Articles', 'Retailers', 'Search', 'Share', 'Size List',
  'Store Locator', 'Tire Features', 'Tire Listing', 'Tire Specs', 'Video',
];

describe('the block library index', () => {
  let sheet;

  before(async () => {
    const res = await fetch(INDEX);
    expect(res.ok, `${INDEX} reads ${res.status}`).to.be.true;
    sheet = await res.json();
  });

  it('is a sheet the library app can read', () => {
    expect(sheet[':type']).to.equal('sheet');
    expect(sheet.columns).to.eql(['name', 'path']);
    expect(sheet.offset).to.equal(0);
    expect(sheet.total).to.equal(sheet.data.length);
    expect(sheet.limit).to.equal(sheet.data.length);
  });

  it('lists one row per sample document', () => {
    expect(sheet.data.map((row) => row.name).sort()).to.eql([...SAMPLED].sort());
  });

  it('points every row at its own sample', () => {
    sheet.data.forEach((row) => {
      const match = SAMPLE_PATH.exec(row.path);
      expect(match, `${row.name} has path ${row.path}`).to.not.be.null;
      expect(match[1], `${row.name} points at ${match[1]}`).to.equal(slug(row.name));
    });
  });

  it('names a block this site ships', async () => {
    await Promise.all(sheet.data.map(async (row) => {
      const name = slug(row.name);
      const res = await fetch(`/blocks/${name}/${name}.js`);
      expect(res.ok, `blocks/${name}/${name}.js reads ${res.status}`).to.be.true;
    }));
  });
});

describe('the two library indexes', () => {
  let repo;
  let da;

  before(async () => {
    const [a, b] = await Promise.all([fetch(INDEX), fetch(DA_INDEX)]);
    expect(a.ok, `${INDEX} reads ${a.status}`).to.be.true;
    expect(b.ok, `${DA_INDEX} reads ${b.status}`).to.be.true;
    [repo, da] = await Promise.all([a.json(), b.json()]);
  });

  it('is a sheet on the DA side too', () => {
    expect(da[':type']).to.equal('sheet');
    expect(da.offset).to.equal(0);
    expect(da.total).to.equal(da.data.length);
    expect(da.limit).to.equal(da.data.length);
  });

  it('counts the same blocks', () => {
    expect(da.data.length).to.equal(repo.data.length);
  });

  it('names the same blocks in the same order', () => {
    expect(da.data.map((row) => row.name)).to.eql(repo.data.map((row) => row.name));
  });

  it('points at the same samples', () => {
    expect(da.data.map((row) => row.path))
      .to.eql(repo.data.map((row) => DA_PREFIX + row.path));
  });
});

describe('the library-metadata block', () => {
  // it is authored on all 14 sample pages, so the block loader fetches both
  // files on each of them and logs two 404s and two errors when they are
  // missing. (#285)
  ['js', 'css'].forEach((ext) => {
    it(`ships library-metadata.${ext}`, async () => {
      const res = await fetch(`/blocks/library-metadata/library-metadata.${ext}`);
      expect(res.ok, `library-metadata.${ext} reads ${res.status}`).to.be.true;
    });
  });
});
