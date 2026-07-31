/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { sampleRUM } from '../../scripts/aem.js';

describe('RUM sampling under test', () => {
  it('is off, so no run sends a beacon', () => {
    delete window.hlx;
    sampleRUM('test');
    expect(window.hlx.rum.weight, 'the sampling weight').to.equal(0);
    expect(window.hlx.rum.isSelected, 'whether this run is sampled in').to.be.false;
  });
});
