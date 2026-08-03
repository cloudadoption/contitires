/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/form/form.js';
import styleSheet from '../../helpers/stylesheet.js';

/**
 * The band live puts the sponsorship form on, measured on
 * continentaltire.com/racer-tire-program at 1440x900 and read off live's own
 * stylesheet for the widths a browser was not pointed at. Issue #101.
 *
 *   .webform-page__webform-section { background: var(--lightest-grey) #f3f3f3;
 *     padding-top: 80px; padding-bottom: 80px }   38px under max-width 768
 *   .webform-page__webform-container { margin: 0 auto; max-width: 495px;
 *     width: 100% }
 *   .webform-page__webform form > * + * { margin-top: 24px }
 *   form * + #ajax-wrapper, form #ajax-wrapper + *, form * + .webform-type-fieldset,
 *   form .webform-type-fieldset + * { margin-top: 60px }   38px under 768
 *   form .field__name-tos-yesno { margin-top: 60px }        38px under 768
 *   min-width 769: form [type=select], form [type=tel] { max-width: 300px }
 *   max-width 768: form [type=submit] { width: 100% }
 *
 * The boxes those rules produced at 1440: band 1440 wide with the form column
 * 495 and centred, text inputs 43 tall with a 4px radius and a 1px #333 border,
 * the state select and the phone 300 wide, both textareas 152 tall with a 10px
 * radius, labels 10px uppercase, and the submit 44.8 tall in 12px capitals on
 * #ffa500 with a 26px radius.
 *
 * live's own step is `max-width: 768`, so ours is `min-width: 769`.
 */
const ROWS = [
  ['First Name', 'text required'],
  ['Select A State', 'select required', 'Alabama<br>Alaska'],
  ['Phone', 'tel required'],
  ['Events Scheduled', 'textarea required'],
  ['Twitter (optional)', 'group', '@<br># of followers'],
  ['Featured in Media (optional)', 'text'],
  ['I have read and agree to the <a href="/legal">Terms and Conditions*</a>', 'checkbox required',
    'Please read and accept the <a href="/legal">Terms and Conditions</a>.'],
  ['Submit', 'submit'],
];

/** The field box whose label reads `text`, the row a rhythm rule moves. */
function field(block, text) {
  const label = [...block.querySelectorAll('label, legend')]
    .find((l) => l.textContent.trim().replace(/\s*\*$/, '') === text);
  return label.closest('fieldset, .form-field');
}

const top = (el) => el.getBoundingClientRect().top;
const round = (n) => Math.round(n * 100) / 100;

describe("Form block, live's grey band", () => {
  let block;

  before(async () => {
    const sheets = await Promise.all([
      styleSheet('/styles/styles.css'),
      styleSheet('/blocks/form/form.css'),
    ]);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.innerHTML = `
      <main>
        <div class="section form-container">
          <div class="form-wrapper">
            <div class="form block" data-block-name="form">
              ${ROWS.map((cells) => `<div>${cells.map((c) => `<div><p>${c}</p></div>`).join('')}</div>`).join('')}
            </div>
          </div>
        </div>
      </main>`;
    document.body.classList.add('appear');
    block = document.querySelector('.form.block');
    decorate(block);
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it('runs the full width of the viewport in live grey', async () => {
    await setViewport({ width: 1440, height: 900 });
    const style = getComputedStyle(block);
    expect(style.backgroundColor).to.equal('rgb(243, 243, 243)');
    expect(style.paddingTop).to.equal('80px');
    expect(style.paddingBottom).to.equal('80px');
    expect(round(block.getBoundingClientRect().width)).to.equal(1440);
  });

  it('centres a 495 column of fields in it', async () => {
    await setViewport({ width: 1440, height: 900 });
    const fields = block.querySelector('form');
    const box = fields.getBoundingClientRect();
    expect(round(box.width)).to.equal(495);
    expect(round(box.left + box.width / 2)).to.equal(720);
  });

  it('closes the band up at 375, where live holds 38', async () => {
    await setViewport({ width: 375, height: 800 });
    const style = getComputedStyle(block);
    expect(style.paddingTop).to.equal('38px');
    expect(style.paddingBottom).to.equal('38px');
  });

  it("gives a text input live's height, radius and border", async () => {
    await setViewport({ width: 1440, height: 900 });
    const input = field(block, 'First Name').querySelector('input');
    const style = getComputedStyle(input);
    expect(round(input.getBoundingClientRect().height)).to.equal(43);
    expect(style.borderRadius).to.equal('4px');
    expect(style.borderTopWidth).to.equal('1px');
    expect(style.borderTopColor).to.equal('rgb(51, 51, 51)');
    expect(style.backgroundColor).to.equal('rgb(255, 255, 255)');
  });

  it('sets a label in 10px capitals above its control', async () => {
    await setViewport({ width: 1440, height: 900 });
    const box = field(block, 'First Name');
    const label = box.querySelector('label');
    const input = box.querySelector('input');
    const style = getComputedStyle(label);
    expect(style.fontSize).to.equal('10px');
    expect(style.textTransform).to.equal('uppercase');
    expect(top(label)).to.be.below(top(input));
  });

  it('rounds the select to a pill and the textarea to 10', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(field(block, 'Select A State').querySelector('select')).borderRadius)
      .to.equal('25px');
    const area = field(block, 'Events Scheduled').querySelector('textarea');
    expect(getComputedStyle(area).borderRadius).to.equal('10px');
    expect(round(area.getBoundingClientRect().height)).to.equal(152);
  });

  it('caps the state and the phone at 300 above the step', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(round(field(block, 'Select A State').getBoundingClientRect().width)).to.equal(300);
    expect(round(field(block, 'Phone').getBoundingClientRect().width)).to.equal(300);
    expect(round(field(block, 'First Name').getBoundingClientRect().width)).to.equal(495);
  });

  it('lets the two of them fill the column at 375', async () => {
    await setViewport({ width: 375, height: 800 });
    const wide = round(field(block, 'First Name').getBoundingClientRect().width);
    expect(round(field(block, 'Select A State').getBoundingClientRect().width)).to.equal(wide);
    expect(round(field(block, 'Phone').getBoundingClientRect().width)).to.equal(wide);
  });

  it('holds 24 between fields and 60 around a group', async () => {
    await setViewport({ width: 1440, height: 900 });
    const first = field(block, 'First Name');
    const state = field(block, 'Select A State');
    expect(round(top(state) - first.getBoundingClientRect().bottom)).to.equal(24);
    const area = field(block, 'Events Scheduled');
    const group = field(block, 'Twitter (optional)');
    expect(round(top(group) - area.getBoundingClientRect().bottom)).to.equal(60);
    const after = field(block, 'Featured in Media (optional)');
    expect(round(top(after) - group.getBoundingClientRect().bottom)).to.equal(60);
  });

  it('holds 60 before the consent row too, and 38 at 375', async () => {
    await setViewport({ width: 1440, height: 900 });
    const media = field(block, 'Featured in Media (optional)');
    const consent = block.querySelector('.form-field-checkbox');
    expect(round(top(consent) - media.getBoundingClientRect().bottom)).to.equal(60);
    await setViewport({ width: 375, height: 800 });
    expect(round(top(consent) - media.getBoundingClientRect().bottom)).to.equal(38);
  });

  it("takes the site's pill shape, in capitals like live's", async () => {
    await setViewport({ width: 1440, height: 900 });
    const button = block.querySelector('button[type="submit"]');
    const style = getComputedStyle(button);
    expect(style.borderRadius).to.equal('26px');
    expect(style.fontSize).to.equal('12px');
    expect(style.fontWeight).to.equal('700');
    expect(style.textTransform).to.equal('uppercase');
    expect(style.letterSpacing).to.equal('1.25px');
    expect(round(button.getBoundingClientRect().width)).to.be.below(200);
  });

  /*
   * Live's submit is #ffa500 and it posts. Ours cannot post, so it does not
   * borrow the look of a button that does: a yellow control that swallows a
   * click says a request went somewhere. The site's own disabled treatment is
   * #f3f3f3 on #f3f3f3, which is this band, so the fill goes white and the edge
   * grey and the control keeps a shape.
   */
  it('wears the disabled treatment rather than the yellow of a live submit', async () => {
    await setViewport({ width: 1440, height: 900 });
    const button = block.querySelector('button[type="submit"]');
    const style = getComputedStyle(button);
    expect(button.disabled).to.be.true;
    expect(style.backgroundColor).to.not.equal('rgb(255, 165, 0)');
    expect(style.backgroundColor).to.equal('rgb(255, 255, 255)');
    expect(style.borderTopColor).to.equal('rgb(205, 205, 205)');
    expect(style.color).to.equal('rgb(117, 117, 117)');
    expect(style.cursor).to.equal('not-allowed');
  });

  it('runs the submit the full column at 375, the way live does', async () => {
    await setViewport({ width: 375, height: 800 });
    const button = block.querySelector('button[type="submit"]');
    const column = block.querySelector('form').getBoundingClientRect().width;
    expect(round(button.getBoundingClientRect().width)).to.equal(round(column));
  });
});
