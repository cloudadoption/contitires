let instances = 0;

/**
 * Reads the paragraph that places a ring on the drawing.
 *
 * Two numbers put it there, as percentages of the picture: how far across,
 * how far down. `down` after them hangs the line under the ring rather than
 * over it, and a third number widens the ring, 1 being the width live draws.
 * @param {Element} cell the callout cell
 * @returns {{x: string, y: string, down: boolean, ring: string}|null} the place
 */
function place(cell) {
  const last = [...cell.querySelectorAll('p')].pop();
  if (!last) return null;
  const parts = last.textContent.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const [x, y] = parts;
  if (!/^\d+(\.\d+)?%?$/.test(x || '') || !/^\d+(\.\d+)?%?$/.test(y || '')) return null;
  last.remove();
  const rest = parts.slice(2);
  return {
    x: x.endsWith('%') ? x : `${x}%`,
    y: y.endsWith('%') ? y : `${y}%`,
    down: rest.includes('down'),
    ring: rest.find((p) => /^\d/.test(p)) || '',
  };
}

/**
 * Builds one ring on the drawing and the words that go with it.
 * @param {Element} cell the callout cell
 * @returns {{mark: Element|null, line: Element|null, note: Element}} its parts
 */
function callout(cell) {
  const at = place(cell);
  const note = document.createElement('div');
  note.className = 'tire-features-note';
  while (cell.firstElementChild) note.append(cell.firstElementChild);
  if (!at) return { mark: null, line: null, note };

  const mark = document.createElement('span');
  mark.className = 'tire-features-mark';
  mark.setAttribute('aria-hidden', 'true');
  const line = document.createElement('span');
  line.className = 'tire-features-line';
  line.setAttribute('aria-hidden', 'true');
  [mark, line, note].forEach((el) => {
    el.style.setProperty('--x', at.x);
    el.style.setProperty('--y', at.y);
    if (at.down) el.classList.add('tire-features-down');
  });
  if (at.ring) mark.style.setProperty('--ring', at.ring);
  return { mark, line, note };
}

/**
 * Live's annotated tire: four cards down one side, and beside them the tire
 * itself with a ring on each part a card claims. A card opens its own drawing.
 *
 * A row is one feature. The first cell is its drawing, the second is its card,
 * an optional picture there being the card's icon, and every cell after that
 * is a ring: a heading, its words, and a last paragraph placing it.
 *
 * Live's rings are divs with a click handler on them, so a keyboard reaches
 * none of the eight, and under 1181 it hides the words until one is tapped.
 * This one prints the words at every width and leaves the rings to the
 * drawing, so the bar is the only thing in the tab order.
 * @param {Element} block the tire-features block
 */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length > 1);
  if (!rows.length) return;
  instances += 1;

  const list = document.createElement('div');
  list.className = 'tire-features-list';
  list.setAttribute('role', 'tablist');

  const panels = rows.map((row, i) => {
    const [art, text, ...notes] = [...row.children];
    const id = `tire-features-${instances}-${i}`;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'tire-features-card';
    card.id = `${id}-tab`;
    card.setAttribute('role', 'tab');
    card.setAttribute('aria-controls', `${id}-panel`);
    const picture = text.querySelector('picture');
    if (picture) {
      const icon = document.createElement('span');
      icon.className = 'tire-features-card-icon';
      // the pipeline stands a picture of its own in a paragraph, which is left
      // empty once the picture is taken out of it
      const held = picture.parentElement;
      icon.append(picture);
      if (held !== text && !held.textContent.trim() && !held.children.length) held.remove();
      card.append(icon);
    }
    const body = document.createElement('span');
    body.className = 'tire-features-card-text';
    while (text.firstElementChild) body.append(text.firstElementChild);
    card.append(body);
    list.append(card);

    const panel = document.createElement('div');
    panel.className = 'tire-features-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', card.id);

    const figure = document.createElement('div');
    figure.className = 'tire-features-figure';
    if (art.querySelector('picture')) figure.append(art.querySelector('picture'));
    const column = document.createElement('div');
    column.className = 'tire-features-notes';
    notes.forEach((cell) => {
      const { mark, line, note } = callout(cell);
      if (mark) figure.append(mark, line);
      column.append(note);
    });
    panel.append(figure, column);
    return panel;
  });

  const cards = [...list.children];

  /**
   * Opens one feature and closes the rest.
   * @param {number} index the feature to open
   * @param {boolean} [focus] whether to move focus to it, as the arrows do
   */
  const select = (index, focus) => {
    cards.forEach((card, i) => {
      const open = i === index;
      card.setAttribute('aria-selected', open ? 'true' : 'false');
      card.tabIndex = open ? 0 : -1;
      panels[i].hidden = !open;
    });
    if (focus) cards[index].focus();
  };

  cards.forEach((card, i) => {
    card.addEventListener('click', () => select(i));
    card.addEventListener('keydown', (event) => {
      const step = {
        ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1,
      }[event.key];
      let next;
      if (step) next = (i + step + cards.length) % cards.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = cards.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });

  block.replaceChildren(list, ...panels);
  select(0);
}
