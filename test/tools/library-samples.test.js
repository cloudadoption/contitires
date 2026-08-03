/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';

import { libraryRows, sampleUrl } from '../../tools/library-index.js';

/*
 * The picker reads an index of rows and fetches one sample document per row.
 * A row whose sample it cannot read produces no entry and no error: the block
 * silently is not in the picker. So the shape of the URL it fetches, and which
 * rows it keeps, are the two things a check has to get right before it can name
 * what an author has lost. Both are read off adobe/da-live
 * blocks/edit/da-library/helpers/, which is the component doing the fetching.
 */

const HOST = 'https://main--contitires--cloudadoption.aem.live';
const DA = 'https://content.da.live/cloudadoption/contitires';

describe('the URL the picker fetches for a row', () => {
  it('appends .plain.html to a site-relative path', () => {
    expect(sampleUrl('/tools/sidekick/blocks/hero', HOST))
      .to.equal(`${HOST}/tools/sidekick/blocks/hero.plain.html`);
  });

  it('appends .plain.html to an AEM host, page and live alike', () => {
    expect(sampleUrl(`${HOST}/tools/sidekick/blocks/cards`, HOST))
      .to.equal(`${HOST}/tools/sidekick/blocks/cards.plain.html`);
    expect(sampleUrl('https://main--contitires--cloudadoption.aem.page/x', HOST))
      .to.equal('https://main--contitires--cloudadoption.aem.page/x.plain.html');
  });

  // isAemHosted() in da-live keys on the origin, so a DA source path is fetched
  // bare. Appending .plain.html there asks content.da.live for a document that
  // does not exist.
  it('leaves a DA source path bare', () => {
    expect(sampleUrl(`${DA}/tools/sidekick/blocks/hero`, HOST))
      .to.equal(`${DA}/tools/sidekick/blocks/hero`);
  });

  it('keeps a query string on the path it is given', () => {
    expect(sampleUrl('/tools/sidekick/blocks/hero?v=2', HOST))
      .to.equal(`${HOST}/tools/sidekick/blocks/hero.plain.html?v=2`);
  });
});

describe('the rows the picker keeps', () => {
  it('reads a single sheet', () => {
    const rows = libraryRows({
      ':type': 'sheet',
      data: [{ name: 'Hero', path: '/a' }, { name: 'Cards', path: '/b' }],
    });
    expect(rows.map((r) => r.name)).to.eql(['Hero', 'Cards']);
  });

  // getSheetByName(data, 'blocks') ?? getFirstSheet(data), in that order.
  it('prefers the blocks sheet of a multi-sheet', () => {
    const rows = libraryRows({
      ':type': 'multi-sheet',
      ':names': ['other', 'blocks'],
      other: { data: [{ name: 'Wrong', path: '/wrong' }] },
      blocks: { data: [{ name: 'Hero', path: '/a' }] },
    });
    expect(rows.map((r) => r.name)).to.eql(['Hero']);
  });

  it('falls back to the first sheet when there is no blocks sheet', () => {
    const rows = libraryRows({
      ':type': 'multi-sheet',
      ':names': ['first', 'second'],
      first: { data: [{ name: 'Hero', path: '/a' }] },
      second: { data: [{ name: 'Cards', path: '/b' }] },
    });
    expect(rows.map((r) => r.name)).to.eql(['Hero']);
  });

  // da-live keeps a row only when it has both, so a half-filled row is not a
  // block the picker offers and must not be reported as a broken sample.
  it('drops a row missing a name or a path', () => {
    const rows = libraryRows({
      data: [
        { name: 'Hero', path: '/a' },
        { name: 'No path' },
        { path: '/no-name' },
        {},
      ],
    });
    expect(rows.map((r) => r.name)).to.eql(['Hero']);
  });

  it('reads an empty sheet as no rows', () => {
    expect(libraryRows({ data: [] })).to.eql([]);
    expect(libraryRows({})).to.eql([]);
  });
});
