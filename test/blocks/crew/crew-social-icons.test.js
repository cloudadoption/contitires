/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * `/icons/` is a SHARED set. `crew.js` maps a social host to an icon NAME and
 * `decorateIcons` loads `/icons/<name>.svg` as an `<img>`, which `crew.css`
 * then inverts to white beside its siblings. So the file behind a network name
 * belongs to every block that asks for that network, and a block that wants a
 * different-looking mark needs its own file rather than this one.
 *
 * This is a regression guard with a cause. The #188 Social tile needed live's
 * Instagram BADGE, a 29x29 export with a hard-coded #1D1D1D fill, a baked drop
 * shadow and a 2px translate. Writing it to `/icons/instagram.svg` would have
 * put one shadowed, differently sized mark next to four flat ones on the Conti
 * Crew pages, from a change whose issue has nothing to do with crew.
 */
const NETWORKS = ['facebook', 'instagram', 'tiktok', 'x', 'youtube'];

describe('the shared social icons crew loads by network name', () => {
  const files = {};

  before(async () => {
    await Promise.all(NETWORKS.map(async (name) => {
      const res = await fetch(`/icons/${name}.svg`);
      files[name] = res.ok ? await res.text() : null;
    }));
  });

  it('serves one file per network crew maps', () => {
    NETWORKS.forEach((name) => {
      expect(files[name], `/icons/${name}.svg is served`).to.be.a('string');
    });
  });

  it('takes its colour from the page, so the invert in crew.css reaches it', () => {
    NETWORKS.forEach((name) => {
      expect(files[name], `${name} is drawn in currentColor`).to.match(/currentColor/);
    });
  });

  it('carries no baked filter, mask or shadow that would single one out', () => {
    NETWORKS.forEach((name) => {
      expect(files[name], `${name} has no <filter>`).to.not.match(/<filter/);
      expect(files[name], `${name} has no <mask>`).to.not.match(/<mask/);
    });
  });

  it('stays a flat mark, in the size band its siblings share', () => {
    NETWORKS.forEach((name) => {
      expect(files[name].length, `${name} is a small flat mark`).to.be.below(2500);
    });
  });
});
