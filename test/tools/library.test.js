/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/** The picker reads this index, and every row points at one sample document. */
const INDEX = '/tools/sidekick/library.json';
const SAMPLE_PATH = /^\/tools\/sidekick\/blocks\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** "Tire Specs" -> "tire-specs", the way the sample's own path spells it. */
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Every block with a sample document under /tools/sidekick/blocks/. */
const SAMPLED = [
  'Article Cards', 'Banner', 'Cards', 'Carousel', 'Category Tabs', 'Columns',
  'Hero', 'Perfect Fit', 'Promo Bar', 'Related Articles', 'Size List',
  'Tire Listing', 'Tire Specs', 'Video',
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
