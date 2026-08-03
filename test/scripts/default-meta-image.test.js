/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * The fallback share image every page without an image of its own names. Issue #178.
 *
 * `og:image` is not ours to compose. The pipeline defaults it to the literal
 * `/default-meta-image.png` when a page carries no image, in
 * helix-html-pipeline `src/steps/extract-metadata.js`, so the path is fixed and
 * the file is the only part this repo supplies. Measured on the published host
 * 2026-08-02: 328 index rows, 26 of them naming it, and both the bare path and
 * the `?width=1200&format=pjpg&optimize=medium` form the rows store answer 404.
 * Those 26 pages share with no preview image where live shows a card.
 *
 * Live's own fallback is
 * `/themes/custom/nextcontinental/assets/images/Continental_Logo_Social.jpg`,
 * 1200x630 and 46,926 bytes, read off `/legal`, which carries no image either.
 * #178's ruling is to copy live rather than draw one, so this is live's file:
 * the wordmark and horse in black on the brand orange, at live's dimensions.
 *
 * It is re-encoded rather than renamed. The path the pipeline hardcodes ends
 * `.png` and the code bus types a static file by its extension, so JPEG bytes
 * behind that name would be served as `image/png` and a card crawler handed a
 * mismatched type can drop the image. A 16-colour palette holds a two-tone
 * image at 17,058 bytes, under live's 46,926, and its background reads
 * `#ffa500` exactly, which is `--conti-yellow` in `styles/styles.css`. Live's
 * JPEG decodes that same background to (254, 165, 0), one step of red off the
 * token, so the re-encode is not further from live's colour than live is.
 *
 * THE ASSERTION IS ON BYTES AND NOT ON STATUS. `web-test-runner.config.mjs`
 * answers any 404 with an image extension as 200, `image/png` and an empty
 * body, so a missing file passes a status check. A length, the PNG signature
 * and a decoded size are what a missing file cannot fake.
 */
describe('the default share image', () => {
  let bytes;
  let response;

  before(async () => {
    response = await fetch('/default-meta-image.png');
    bytes = new Uint8Array(await response.arrayBuffer());
  });

  it('is a file and not the runner answering an empty body', () => {
    expect(response.status, 'the status').to.equal(200);
    expect(bytes.length, 'the byte length').to.be.greaterThan(0);
  });

  it('carries PNG bytes, since the path the pipeline hardcodes ends .png', () => {
    expect([...bytes.slice(0, 8)], 'the file signature').to.eql([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  // The size comes out of the PNG header rather than out of a decode.
  // `image.decode()` never settled here: it exceeded mocha's 2000ms default on
  // five of the eight main runs after this file landed, and it still hung at
  // 15000ms, so it is starving rather than running slowly. 144 test files share
  // one browser and decoding is the browser's work, not this repo's.
  //
  // IHDR is the first chunk of every PNG and its width and height are two
  // big-endian 32-bit integers at byte 16 and byte 20. That is the same fact the
  // decode was asserting, read from the bytes the repo ships.
  it("is 1200 by 630, live's card size, by its IHDR chunk", () => {
    // arithmetic rather than shifts, because the lint config forbids bitwise
    const be32 = (at) => bytes[at] * 2 ** 24 + bytes[at + 1] * 2 ** 16
      + bytes[at + 2] * 256 + bytes[at + 3];
    expect(String.fromCharCode(...bytes.slice(12, 16)), 'the first chunk is IHDR').to.equal('IHDR');
    expect(be32(16), 'the intrinsic width').to.equal(1200);
    expect(be32(20), 'the intrinsic height').to.equal(630);
  });

  it("stays under live's 46,926 bytes", () => {
    expect(bytes.length, 'the byte length').to.be.below(46926);
  });
});
