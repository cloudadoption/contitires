/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/form/form.js';

/**
 * The sponsorship request form on /racer-tire-program, read off
 * continentaltire.com/racer-tire-program on 2026-08-03. Live's own markup is a
 * Drupal webform: 19 authored controls in a single column, in this order and
 * with these labels, of which nine text fields, one state select, one tel, one
 * email, one file, two textareas, four two-field fieldsets and one consent
 * checkbox. Issue #101.
 *
 * A ROW IS A FIELD. The first cell is the label, verbatim, because that is what
 * an author edits. The second names the control and marks it required. The third
 * carries the values the control needs and nothing else: the options of a
 * select, the member labels of a group, the help line under a checkbox, the note
 * beside the submit.
 *
 * THE SUBMIT NEVER SUBMITS. There is no receiver for this form (#488, closed as
 * unresolvable), so the button is disabled and says why, in a note a screen
 * reader reaches through aria-describedby.
 */
const ROWS = [
  ['First Name', 'text required'],
  ['Last Name', 'text required'],
  ['Address', 'text required'],
  ['Select A State', 'select required', 'Alabama<br>Alaska<br>Arizona'],
  ['City', 'text required'],
  ['Phone', 'tel required'],
  ['Email', 'email required'],
  ['Type of Vehicle', 'text required'],
  ['Current Tires', 'text required'],
  ['Other Sponsors (optional)', 'text'],
  ['Photo Upload (optional)', 'file'],
  ['Events Scheduled', 'textarea required'],
  ['Sponsorship Expectations', 'textarea required'],
  ['Twitter (optional)', 'group', '@<br># of followers'],
  ['Featured in Media (optional)', 'text'],
  ['I have read and agree to the <a href="/legal">Terms and Conditions*</a>', 'checkbox required',
    'Please read and accept the <a href="/legal">Terms and Conditions</a>.'],
  ['Submit', 'submit'],
];

function buildForm(rows = ROWS, variant = '') {
  document.body.innerHTML = `
    <main>
      <div class="section form-container">
        <div class="form-wrapper">
          <div class="form ${variant} block" data-block-name="form">
            ${rows.map((cells) => `<div>${cells.map((c) => `<div><p>${c}</p></div>`).join('')}</div>`).join('')}
          </div>
        </div>
      </div>
    </main>`;
  return document.querySelector('.form.block');
}

/**
 * The words of a label, without the asterisk element. The consent label ends in
 * an asterisk an author wrote and the rest end in one the block appends, so a
 * trailing `*` alone does not tell the two apart.
 */
function labelText(label) {
  const clone = label.cloneNode(true);
  clone.querySelectorAll('[aria-hidden="true"]').forEach((el) => el.remove());
  return clone.textContent.trim();
}

/** The control of the field whose label reads `text`. */
function control(block, text) {
  const label = [...block.querySelectorAll('label')].find((l) => labelText(l) === text);
  return label && block.querySelector(`#${label.getAttribute('for')}`);
}

describe('Form block, the controls', () => {
  let block;
  beforeEach(() => { block = buildForm(); });

  it('stands the fields in a form element', () => {
    decorate(block);
    const form = block.querySelector('form');
    expect(form, 'a form').to.exist;
    expect(form.querySelectorAll('label').length).to.be.greaterThan(0);
  });

  it("takes live's control type from the second cell", () => {
    decorate(block);
    expect(control(block, 'First Name').type).to.equal('text');
    expect(control(block, 'Phone').type).to.equal('tel');
    expect(control(block, 'Email').type).to.equal('email');
    expect(control(block, 'Photo Upload (optional)').type).to.equal('file');
    expect(control(block, 'Events Scheduled').tagName).to.equal('TEXTAREA');
    expect(control(block, 'Select A State').tagName).to.equal('SELECT');
  });

  it('ties every label to its own control', () => {
    decorate(block);
    const labels = [...block.querySelectorAll('label')];
    // 14 rows that build a field, the two members of the group, and the consent
    expect(labels.length).to.equal(17);
    labels.forEach((label) => {
      const id = label.getAttribute('for');
      expect(id, `${label.textContent.trim()} names a control`).to.be.a('string');
      const ctl = block.querySelector(`#${id}`);
      expect(ctl, `${id} exists`).to.exist;
      expect(['INPUT', 'SELECT', 'TEXTAREA']).to.include(ctl.tagName);
    });
    const ids = labels.map((l) => l.getAttribute('for'));
    expect(new Set(ids).size, 'one control per label').to.equal(ids.length);
  });

  it('marks a required control required, and its asterisk aria-hidden', () => {
    decorate(block);
    const first = control(block, 'First Name');
    expect(first.required).to.be.true;
    const label = block.querySelector(`label[for="${first.id}"]`);
    expect(label.textContent.trim()).to.equal('First Name*');
    const star = label.querySelector('[aria-hidden="true"]');
    expect(star, 'the asterisk is hidden from a reader').to.exist;
    expect(star.textContent.trim()).to.equal('*');
  });

  it('leaves an optional control unmarked', () => {
    decorate(block);
    const ctl = control(block, 'Other Sponsors (optional)');
    expect(ctl.required).to.be.false;
    const label = block.querySelector(`label[for="${ctl.id}"]`);
    expect(!!label.querySelector('[aria-hidden="true"]'), 'no asterisk').to.be.false;
    expect(label.textContent.trim()).to.equal('Other Sponsors (optional)');
  });

  it("fills the select with live's placeholder and the authored options", () => {
    decorate(block);
    const select = control(block, 'Select A State');
    expect([...select.options].map((o) => o.textContent))
      .to.eql(['- Select -', 'Alabama', 'Alaska', 'Arizona']);
    expect(select.options[0].value).to.equal('');
    expect(select.value).to.equal('');
  });

  it('keeps the label markup an author wrote', () => {
    decorate(block);
    const box = block.querySelector('input[type="checkbox"]');
    const label = block.querySelector(`label[for="${box.id}"]`);
    const link = label.querySelector('a[href="/legal"]');
    expect(link, 'the terms link').to.exist;
    expect(link.textContent).to.equal('Terms and Conditions*');
  });

  it('adds no second asterisk to a label that ends in one', () => {
    decorate(block);
    const box = block.querySelector('input[type="checkbox"]');
    const label = block.querySelector(`label[for="${box.id}"]`);
    expect(label.textContent.trim()).to.equal('I have read and agree to the Terms and Conditions*');
    expect(box.required).to.be.true;
  });

  it('puts the checkbox before its label and ties the help line to it', () => {
    decorate(block);
    const box = block.querySelector('input[type="checkbox"]');
    const label = block.querySelector(`label[for="${box.id}"]`);
    expect(box.nextElementSibling, 'the label follows the box').to.equal(label);
    const help = block.querySelector(`#${box.getAttribute('aria-describedby')}`);
    expect(help, 'the help line').to.exist;
    expect(help.textContent.trim()).to.equal('Please read and accept the Terms and Conditions.');
    expect(help.querySelector('a[href="/legal"]'), 'its own link').to.exist;
  });

  it("makes a fieldset of a group row, legend and members from the author's cells", () => {
    decorate(block);
    const set = block.querySelector('fieldset');
    expect(set, 'a fieldset').to.exist;
    expect(set.querySelector('legend').textContent.trim()).to.equal('Twitter (optional)');
    const labels = [...set.querySelectorAll('label')].map((l) => l.textContent.trim());
    expect(labels).to.eql(['@', '# of followers']);
    [...set.querySelectorAll('input')].forEach((input) => {
      expect(input.type).to.equal('text');
      expect(input.required).to.be.false;
    });
  });

  it('keeps a field after a group out of it', () => {
    decorate(block);
    const ctl = control(block, 'Featured in Media (optional)');
    expect(!!ctl.closest('fieldset'), 'it is in no fieldset').to.be.false;
  });

  it('holds the fields in the order they were authored', () => {
    decorate(block);
    const labels = [...block.querySelectorAll('label, legend')].map(labelText);
    expect(labels).to.eql([
      'First Name', 'Last Name', 'Address', 'Select A State', 'City', 'Phone',
      'Email', 'Type of Vehicle', 'Current Tires', 'Other Sponsors (optional)',
      'Photo Upload (optional)', 'Events Scheduled', 'Sponsorship Expectations',
      'Twitter (optional)', '@', '# of followers', 'Featured in Media (optional)',
      'I have read and agree to the Terms and Conditions*',
    ]);
  });

  it('names each control, so a field is told from its neighbour', () => {
    decorate(block);
    const names = [...block.querySelectorAll('input, select, textarea')].map((c) => c.name);
    expect(names).to.include('first-name');
    expect(names).to.include('select-a-state');
    expect(new Set(names).size).to.equal(names.length);
  });

  it('carries the file input through with live\'s image filter', () => {
    decorate(block);
    expect(control(block, 'Photo Upload (optional)').accept).to.equal('image/*');
  });
});

describe('Form block, the submit that cannot submit', () => {
  let block;
  beforeEach(() => { block = buildForm(); });

  it('disables the button and keeps the authored word on it', () => {
    decorate(block);
    const button = block.querySelector('button[type="submit"]');
    expect(button, 'a submit button').to.exist;
    expect(button.disabled).to.be.true;
    expect(button.textContent.trim()).to.equal('Submit');
  });

  it('says why, in a note the button points at', () => {
    decorate(block);
    const button = block.querySelector('button[type="submit"]');
    const note = block.querySelector(`#${button.getAttribute('aria-describedby')}`);
    expect(note, 'the note').to.exist;
    expect(note.textContent.trim()).to.have.length.greaterThan(20);
    expect(note.textContent).to.match(/design/i);
    expect(note.nextElementSibling, 'the note comes first').to.equal(button);
  });

  it('takes the note an author wrote over its own', () => {
    block = buildForm([...ROWS.slice(0, -1), ['Submit', 'submit', 'Nothing is sent from this design shell.']]);
    decorate(block);
    const button = block.querySelector('button[type="submit"]');
    const note = block.querySelector(`#${button.getAttribute('aria-describedby')}`);
    expect(note.textContent.trim()).to.equal('Nothing is sent from this design shell.');
  });

  it('refuses a submit event, so Enter in a field reloads nothing', () => {
    decorate(block);
    const form = block.querySelector('form');
    const went = form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    expect(went, 'the submit was prevented').to.be.false;
  });

  it('carries no action, so there is nothing to post to', () => {
    decorate(block);
    expect(block.querySelector('form').getAttribute('action')).to.be.null;
  });
});

describe('Form block, an author who leaves something out', () => {
  it('reads a row with no type as a text field', () => {
    const block = buildForm([['Nickname', ''], ['Submit', 'submit']]);
    decorate(block);
    expect(control(block, 'Nickname').type).to.equal('text');
  });

  it('skips a row with no label', () => {
    const block = buildForm([['', 'text'], ['City', 'text'], ['Submit', 'submit']]);
    decorate(block);
    expect(block.querySelectorAll('label')).to.have.length(1);
  });

  it('reads an unknown type as a text field', () => {
    const block = buildForm([['Nickname', 'colour'], ['Submit', 'submit']]);
    decorate(block);
    expect(control(block, 'Nickname').type).to.equal('text');
  });

  it('leaves a select with no options empty but for the placeholder', () => {
    const block = buildForm([['Select A State', 'select required'], ['Submit', 'submit']]);
    decorate(block);
    expect(control(block, 'Select A State').options).to.have.length(1);
  });

  it('still disables a submit an author never authored', () => {
    const block = buildForm([['City', 'text']]);
    decorate(block);
    const button = block.querySelector('button[type="submit"]');
    expect(button, 'a submit button').to.exist;
    expect(button.disabled).to.be.true;
  });

  it('reads a group with no members as a fieldset holding none', () => {
    const block = buildForm([['Twitter (optional)', 'group'], ['Submit', 'submit']]);
    decorate(block);
    const set = block.querySelector('fieldset');
    expect(set.querySelector('legend').textContent.trim()).to.equal('Twitter (optional)');
    expect(set.querySelectorAll('input')).to.have.length(0);
  });

  it('reads options an author wrote as a list', () => {
    document.body.innerHTML = `
      <main><div class="section form-container"><div class="form-wrapper">
        <div class="form block" data-block-name="form">
          <div><div><p>Select A State</p></div><div><p>select required</p></div>
            <div><ul><li>Alabama</li><li>Alaska</li></ul></div></div>
        </div>
      </div></div></main>`;
    const block = document.querySelector('.form.block');
    decorate(block);
    expect([...control(block, 'Select A State').options].map((o) => o.textContent))
      .to.eql(['- Select -', 'Alabama', 'Alaska']);
  });
});
