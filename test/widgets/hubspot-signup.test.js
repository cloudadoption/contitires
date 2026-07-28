/* eslint-disable no-unused-expressions */
/* global describe it before afterEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../widgets/hubspot/signup.js';

/**
 * Live embeds its offer signup on /promotion and /offers with HubSpot's
 * developer embed, which renders the form into the page rather than into an
 * iframe. That is what lets the section carry live's grey band, its 900 measure
 * and its two by two field grid: an iframe takes none of our CSS.
 *
 * The newsletter widget beside this one uses the iframe embed and a different
 * form. Same portal, different form. Issue #86.
 */
const PORTAL = '48908421';
const SCRIPT = `script[src="https://js.hsforms.net/forms/embed/developer/${PORTAL}.js"]`;

describe('The offer signup widget', () => {
  afterEach(() => document.head.querySelectorAll(SCRIPT).forEach((s) => s.remove()));

  it('loads the embed that renders the form into the page', () => {
    decorate();
    expect(document.head.querySelector(SCRIPT), 'the developer embed').to.exist;
  });

  // both /promotion and /offers carry the form, and a visitor moving between
  // them should not collect a second copy of the script
  it('loads it once', () => {
    decorate();
    decorate();
    expect(document.head.querySelectorAll(SCRIPT)).to.have.length(1);
  });

  it('asks for the form live asks for', async () => {
    const html = await (await fetch('/widgets/hubspot/signup.html')).text();
    expect(html).to.contain('hs-form-html');
    expect(html).to.contain('15c5e3e7-95c4-4c5c-984a-0049acf48382');
    expect(html).to.contain(PORTAL);
  });
});

describe('The offer signup band', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/widgets/hubspot/signup.css')).text());
  });

  function value(selector, prop) {
    const rules = [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  // the block takes the widget's own name, so the stylesheet has to match it.
  // The newsletter widget beside this one styled `.hubspot`, a class nothing
  // carries, so its rule had no effect. That was issue #108.
  it('styles the class the widget block actually carries', () => {
    expect(value('main .signup', 'max-width')).to.equal('900px');
    expect(value('main .signup', 'margin-inline')).to.equal('auto');
  });

  // the developer embed ships no CSS of its own, so the page dresses the form.
  // Live does the same: these are its numbers, read off /promotion at 1440.
  it('lays a field row out as live lays it', () => {
    expect(value('main .signup .hsfc-Row', 'display')).to.equal('grid');
    expect(value('main .signup .hsfc-Row', 'gap')).to.equal('30px');
  });

  it('draws a field as live draws it', () => {
    expect(value('main .signup .hsfc-TextInput', 'height')).to.equal('43px');
    expect(value('main .signup .hsfc-TextInput', 'border-radius')).to.equal('6px');
    expect(value('main .signup .hsfc-FieldLabel', 'font-size')).to.equal('11px');
  });

  it('draws the submit as the pill the rest of the site draws', () => {
    expect(value('main .signup .hsfc-Button', 'background-color')).to.equal('var(--conti-yellow)');
    expect(value('main .signup .hsfc-Button', 'border-radius')).to.equal('26px');
    expect(value('main .signup .hsfc-Button', 'text-transform')).to.equal('uppercase');
  });

  it('sets the form heading at live\'s size', () => {
    expect(value('main .signup .hsfc-Heading', 'font-size')).to.equal('30px');
    expect(value('main .signup .hsfc-Heading', 'font-weight')).to.equal('400');
  });
});
