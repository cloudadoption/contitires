/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import {
  SPECS_COLUMNS, missingColumns, sizeKey, sizesBySlug,
} from '../../scripts/products.js';
import { renderName } from '../../scripts/product-name.js';

// rows in the shape the sheet API delivers them: one flat object per row, every
// column a key. The specs sheet writes a size with spaces, the finder's sizes
// cell writes the same size without them.
const rows = [
  { slug: 'vikingcontact-7', size: '205/55 R 16', 'Load Index': '91' },
  { slug: 'vikingcontact-7', size: '225/45 ZR 17', 'Load Index': '94' },
  { slug: 'vikingcontact-7', size: '205/55 R 16', 'Load Index': '94' },
  { slug: 'sportcontact-7', size: '245/40 ZR 18', 'Load Index': '97' },
];

describe('The products workbook contract', () => {
  it('names the columns the specs sheet is read by', () => {
    expect(SPECS_COLUMNS).to.deep.equal(['slug', 'size']);
  });

  it('reports nothing missing when the sheet carries its columns', () => {
    expect(missingColumns(rows, SPECS_COLUMNS)).to.deep.equal([]);
  });

  it('names a renamed column rather than reading past it', () => {
    const renamed = rows.map(({ slug, ...rest }) => ({ product: slug, ...rest }));
    expect(missingColumns(renamed, SPECS_COLUMNS)).to.deep.equal(['slug']);
  });

  it('names every column a sheet is missing', () => {
    expect(missingColumns([{ a: 1 }], SPECS_COLUMNS)).to.deep.equal(['slug', 'size']);
  });

  it('treats a sheet with no rows as carrying none of them', () => {
    expect(missingColumns([], SPECS_COLUMNS)).to.deep.equal(['slug', 'size']);
    expect(missingColumns(null, SPECS_COLUMNS)).to.deep.equal(['slug', 'size']);
  });

  it('reads a column that only some rows carry a value for', () => {
    expect(missingColumns([{ slug: 'a' }, { size: '1' }], SPECS_COLUMNS)).to.deep.equal([]);
  });
});

describe('One size, written two ways', () => {
  it('reads the spaced and the unspaced form as one size', () => {
    expect(sizeKey('205/55 R 16')).to.equal(sizeKey('205/55R16'));
  });

  it('keeps the form the finder parses', () => {
    expect(sizeKey('225/45 ZR 17')).to.equal('225/45ZR17');
    expect(sizeKey('LT 265/70 R 17')).to.equal('LT265/70R17');
    expect(sizeKey('235/65 R 16 C')).to.equal('235/65R16C');
  });

  it('is not upset by case', () => {
    expect(sizeKey('205/55 r 16')).to.equal('205/55R16');
  });
});

describe('Sizes derived from the specs sheet', () => {
  it('groups them by slug', () => {
    const sizes = sizesBySlug(rows);
    expect([...sizes.keys()]).to.deep.equal(['vikingcontact-7', 'sportcontact-7']);
  });

  it('gives each slug its sizes in sheet order', () => {
    expect(sizesBySlug(rows).get('vikingcontact-7')).to.deep.equal(['205/55R16', '225/45ZR17']);
  });

  it('lists a size once however many spec rows carry it', () => {
    // a size appears once per load range, so the sheet repeats it
    expect(sizesBySlug(rows).get('vikingcontact-7')).to.have.lengthOf(2);
  });

  it('skips a row with no slug or no size', () => {
    const sizes = sizesBySlug([...rows, { size: '1' }, { slug: 'x' }]);
    expect(sizes.has('x')).to.be.false;
    expect(sizes.size).to.equal(2);
  });

  it('has no entry for a slug the sheet does not carry', () => {
    expect(sizesBySlug(rows).get('purecontact-ls')).to.be.undefined;
  });

  it('reads an empty sheet as no sizes', () => {
    expect(sizesBySlug([]).size).to.equal(0);
    expect(sizesBySlug(null).size).to.equal(0);
  });
});

/*
 * Live sets the tail of ten product names as a superscript: ExtremeContact
 * Sport<sup>02</sup>. The mark is authored markup in a sheet cell, so the
 * readers that print a name need one sanitiser between the cell and the DOM.
 * It lives here, with the rest of the workbook contract, because the listing,
 * the finder and the specs band all print a name and a block must not import
 * from another block. Issue #238.
 */
describe('renderName, the one sanitiser for an authored product name', () => {
  const html = (fragment) => {
    const host = document.createElement('span');
    host.append(fragment);
    return host.innerHTML;
  };

  it('keeps the superscript live sets on the name', () => {
    expect(html(renderName('ExtremeContact Sport<sup>02</sup>')))
      .to.equal('ExtremeContact Sport<sup>02</sup>');
  });

  it('keeps live\'s own space before the mark', () => {
    expect(html(renderName('ControlContact Tour <sup>A/S Plus</sup>')))
      .to.equal('ControlContact Tour <sup>A/S Plus</sup>');
  });

  it('keeps the text that follows the mark', () => {
    expect(html(renderName('ControlContact Tour<sup>M</sup> A/S')))
      .to.equal('ControlContact Tour<sup>M</sup> A/S');
  });

  it('drops every other tag, keeping its text', () => {
    expect(html(renderName('Pure<em>Contact</em> <script>x</script>LS')))
      .to.equal('PureContact LS');
  });

  it('reads a name with no markup as its own text', () => {
    expect(html(renderName('VikingContact 7'))).to.equal('VikingContact 7');
  });

  it('reads an empty cell as nothing', () => {
    expect(html(renderName(''))).to.equal('');
    expect(html(renderName(undefined))).to.equal('');
    expect(html(renderName(null))).to.equal('');
  });
});
