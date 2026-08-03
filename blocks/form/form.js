/**
 * A form, as far as the design goes. Live's sponsorship request form on
 * /racer-tire-program is the one this was built against, read off
 * continentaltire.com on 2026-08-03.
 *
 * NOTHING IS SENT. The receiver is #488 and it is closed as unresolvable, so
 * the button is disabled and a note beside it says the form is a design shell.
 * The note is what a screen reader gets through the button's aria-describedby,
 * so the disabled control is never a dead end.
 *
 * A ROW IS A FIELD, rather than a row of a sheet somewhere else. A form is the
 * block an author reaches into most, and the three things they reach for are the
 * label, the order and which fields are required. All three are the row itself
 * here: the first cell is the label, verbatim; the second names the control and
 * carries `required`; the third holds whatever that control needs, and nothing
 * else. A sheet would have moved the field list off the page, added a fetch to a
 * page that needs none, and bought reuse this site has one page for.
 */

// what the second cell may name. Anything else reads as a text field, because an
// author who mistypes a type should still get their field.
const TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'file', 'checkbox', 'group', 'submit'];

// live's own empty choice on the state select, `<option value="">- Select -`.
const PLACEHOLDER = '- Select -';

// live's accept on the one file field it has, `accept="image/*"`.
const FILE_ACCEPT = 'image/*';

// said when an author authored no note. The button is disabled either way, and
// this is the sentence that keeps it from being a dead control.
const SHELL_NOTE = 'This form is part of a design rebuild. It does not submit, and no request is received.';

/**
 * The lines of a cell: a paragraph, a list item or a `<br>` each start one.
 * An author writing 51 states writes 51 lines, and the pipeline may hand them
 * over as either shape.
 * @param {Element} cell one authored cell, or undefined
 * @returns {string[]} the lines, as HTML, without the empty ones
 */
function lines(cell) {
  if (!cell) return [];
  const blocks = [...cell.querySelectorAll('p, li')];
  const source = blocks.length ? blocks.map((el) => el.innerHTML) : [cell.innerHTML];
  return source
    .flatMap((html) => html.split(/<br\s*\/?>/i))
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** One cell as a single line of HTML, which is what a label and a type are. */
const oneLine = (cell) => lines(cell).join(' ');

/** The text of an HTML string, for a label that carries a link. */
function textOf(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent.trim();
}

/** "Select A State" -> "select-a-state", which names the control. */
const slug = (html) => textOf(html).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * What the second cell says: the control to build and whether it is required.
 * @param {Element} cell the type cell, or undefined
 * @returns {{type: string, required: boolean}} the control, `text` by default
 */
function spec(cell) {
  const words = textOf(oneLine(cell)).toLowerCase().split(/\s+/);
  return {
    type: words.find((word) => TYPES.includes(word)) || 'text',
    required: words.includes('required'),
  };
}

/**
 * The label, and the asterisk live puts on a required one. Live's own mark is
 * CSS, `label.form-required::after { content: "*" }`, so it reaches nobody who
 * cannot see it. This one is an element the label owns, hidden from a reader,
 * because `required` on the control is what a reader is told instead.
 * @param {string} html the authored label
 * @param {string} id the control it names
 * @param {boolean} required whether to mark it
 * @returns {Element} the label
 */
function buildLabel(html, id, required) {
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.innerHTML = html;
  // live's consent label ends in an asterisk of its own, inside the terms link,
  // and a second one would read "Terms and Conditions**"
  if (required && !label.textContent.trim().endsWith('*')) {
    const star = document.createElement('span');
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '*';
    label.append(star);
  }
  return label;
}

/**
 * The control of one field.
 * @param {string} type one of TYPES
 * @param {string} name the control's name and the stem of its id
 * @param {boolean} required whether a reader is told it is required
 * @param {string[]} options a select's options
 * @returns {Element} the input, select or textarea
 */
function buildControl(type, name, required, options) {
  let control;
  if (type === 'textarea') {
    control = document.createElement('textarea');
    control.rows = 5;
  } else if (type === 'select') {
    control = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = PLACEHOLDER;
    control.append(empty);
    options.forEach((option) => {
      const el = document.createElement('option');
      el.value = textOf(option);
      el.textContent = textOf(option);
      control.append(el);
    });
  } else {
    control = document.createElement('input');
    control.type = type;
    if (type === 'file') control.accept = FILE_ACCEPT;
  }
  control.id = `form-${name}`;
  control.name = name;
  if (required) control.required = true;
  return control;
}

/**
 * One field: a box holding its label and its control, in live's order, which is
 * label above control everywhere but the consent checkbox.
 * @param {string} labelHtml the authored label
 * @param {{type: string, required: boolean}} field what the second cell said
 * @param {Element} [detail] the third cell
 * @returns {Element} the field box
 */
function buildField(labelHtml, { type, required }, detail) {
  const box = document.createElement('div');
  box.className = 'form-field';
  box.dataset.type = type;
  const name = slug(labelHtml);
  const control = buildControl(type, name, required, lines(detail));
  const label = buildLabel(labelHtml, control.id, required);

  if (type === 'checkbox') {
    // live stands the help line on its own row above the box and the label
    // beside it: `.field__name-tos-yesno > div { flex: 1 0 100% }`
    box.classList.add('form-field-checkbox');
    const help = oneLine(detail);
    if (help) {
      const note = document.createElement('p');
      note.className = 'form-help';
      note.id = `${control.id}-help`;
      note.innerHTML = help;
      control.setAttribute('aria-describedby', note.id);
      box.append(note);
    }
    box.append(control, label);
    return box;
  }

  box.append(label, control);
  return box;
}

/**
 * A group: live's `<fieldset>` with a legend and the fields under it. Each line
 * of the third cell is one text field, which is what live's four social groups
 * hold, an `@` and a follower count.
 * @param {string} legendHtml the authored legend
 * @param {Element} [detail] the third cell
 * @returns {Element} the fieldset
 */
function buildGroup(legendHtml, detail) {
  const set = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.innerHTML = legendHtml;
  set.append(legend);
  const stem = slug(legendHtml);
  lines(detail).forEach((line) => {
    const field = buildField(line, { type: 'text', required: false });
    const control = field.querySelector('input');
    // the member labels repeat across the groups, `@` in all four of live's, so
    // the legend names the field and the two `@` inputs stay apart
    control.name = `${stem}-${slug(line)}`;
    control.id = `form-${control.name}`;
    field.querySelector('label').setAttribute('for', control.id);
    set.append(field);
  });
  return set;
}

/**
 * The submit, disabled, and the note that says why.
 * @param {string} labelHtml the word on the button
 * @param {Element} [detail] the third cell
 * @returns {Element} the actions row
 */
function buildActions(labelHtml, detail) {
  const row = document.createElement('div');
  row.className = 'form-actions';
  const note = document.createElement('p');
  note.className = 'form-note';
  note.id = 'form-submit-note';
  note.innerHTML = oneLine(detail) || SHELL_NOTE;
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary';
  button.disabled = true;
  button.setAttribute('aria-describedby', note.id);
  button.innerHTML = labelHtml || 'Submit';
  row.append(note, button);
  return row;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const form = document.createElement('form');
  // there is nowhere to post to, and a form with no action posts to the page it
  // is on. A disabled default button is what stops implicit submission in the
  // spec; this is what stops it in a browser that does it anyway.
  form.addEventListener('submit', (event) => event.preventDefault());
  let actions;

  [...block.children].forEach((row) => {
    const [labelCell, typeCell, detailCell] = row.children;
    const labelHtml = oneLine(labelCell);
    const field = spec(typeCell);
    if (field.type === 'submit') {
      actions = buildActions(labelHtml, detailCell);
      return;
    }
    if (!labelHtml) return;
    form.append(field.type === 'group'
      ? buildGroup(labelHtml, detailCell)
      : buildField(labelHtml, field, detailCell));
  });

  form.append(actions || buildActions('Submit'));
  block.replaceChildren(form);
}
