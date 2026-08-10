/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * The air live leaves between the header and the tire image on a product page.
 *
 * Live pads its whole page wrapper: `.tire-page { padding-top: 20px }`, from 769
 * up, dropped under `max-width: 768`. Everything inside the page moves with it,
 * the title as well as the gallery.
 *
 * Measured on continentaltire.com and on the published host, header bottom to
 * the top of the tire image, on /tires/extremecontact-dws06-plus and
 * /tires/crosscontact-lx25:
 *
 *   width   live   ours
 *   1440      44     24
 *   1023      44     24
 *   1024      44     24
 *    769      44     24
 *    768      24     24
 *    375      24     24
 *
 * The 24 both sides share is inside the gallery: the tile that holds the image
 * carries `padding-top: 24px` on each side. So the missing part is live's 20 on
 * the page, and it is missing only from 769 up.
 *
 * It goes on the first section rather than on `main`, and as padding rather than
 * as margin, because `main > .section:first-of-type { margin-top: 0 }` is what
 * makes our page start flush against the header. A margin here would be a rule
 * fighting that one; padding cannot collapse and cannot be zeroed by it.
 *
 * The selector is the one this stylesheet already uses for a product page,
 * `main:has(.columns.product-hero, .tire-specs)`, which the h1 rule above it
 * reaches 46 pages with and no other page in the index.
 */
const CASES = [
  { vw: 1440, pad: 20 },
  { vw: 1024, pad: 20 },
  { vw: 769, pad: 20 },
  { vw: 768, pad: 0 },
  { vw: 375, pad: 0 },
];

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

/**
 * A product page's first section as the pipeline delivers it: the product hero
 * is a `columns` block whose first cell holds the gallery and whose second
 * holds the title and the copy.
 */
function buildProductPage() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <div class="columns product-hero">
        <div>
          <div>
            <div class="media-gallery product">
              <div><div><picture><img src="/icons/search.svg" alt="one"></picture></div></div>
            </div>
          </div>
          <div>
            <h1>ExtremeContact DWS06 Plus</h1>
            <p>The ultimate all-season performance tire.</p>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="tire-specs"><div><div>extremecontact-dws06-plus</div></div></div>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

describe("The gap live leaves above a product page's gallery", () => {
  let main;

  before(async () => {
    await adopt('/styles/styles.css');
    main = buildProductPage();
  });

  CASES.forEach(({ vw, pad }) => {
    it(`pads the first section ${pad} at ${vw}, which is live's own`, async () => {
      await setViewport({ width: vw, height: 900 });
      const section = main.querySelector(':scope > .section');
      expect(Math.round(parseFloat(getComputedStyle(section).paddingTop)), `at ${vw}`)
        .to.equal(pad);
    });
  });

  it('leaves the top margin at zero, so the padding is what moves the page', async () => {
    await setViewport({ width: 1440, height: 900 });
    const section = main.querySelector(':scope > .section');
    expect(Math.round(parseFloat(getComputedStyle(section).marginTop))).to.equal(0);
  });

  it('reaches a page carrying only the specs block, as the selector claims', async () => {
    await setViewport({ width: 1440, height: 900 });
    const bare = document.createElement('main');
    bare.innerHTML = '<div><div class="tire-specs"><div><div>slug</div></div></div></div>';
    document.body.append(bare);
    decorateMain(bare);
    bare.querySelectorAll('.section').forEach((s) => {
      s.dataset.sectionStatus = 'loaded';
      s.style.display = null;
    });
    const pt = Math.round(parseFloat(getComputedStyle(bare.querySelector(':scope > .section')).paddingTop));
    bare.remove();
    expect(pt).to.equal(20);
  });

  it('does not pad the first section of a page that is neither', async () => {
    await setViewport({ width: 1440, height: 900 });
    const other = document.createElement('main');
    other.innerHTML = '<div><h1>Offers</h1><p>Something else entirely.</p></div>';
    document.body.append(other);
    decorateMain(other);
    other.querySelectorAll('.section').forEach((s) => {
      s.dataset.sectionStatus = 'loaded';
      s.style.display = null;
    });
    const pt = Math.round(parseFloat(getComputedStyle(other.querySelector(':scope > .section')).paddingTop));
    other.remove();
    expect(pt).to.equal(0);
  });
});
