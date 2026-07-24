/**
 * Promo bar: a slim disclosure. Row 1 is the toggle label, row 2 is the
 * detail panel revealed on click. The row/cell divs are reused as the
 * bar/panel wrappers rather than replaced, so only the button and its
 * label/chevron spans are newly created.
 * @param {Element} block the promo-bar block
 */
export default function decorate(block) {
  const [toggleRow, panelRow] = [...block.children];
  if (!toggleRow || !panelRow) return;

  const toggleCell = toggleRow.firstElementChild;
  const panelCell = panelRow.firstElementChild;
  if (!toggleCell || !panelCell) return;

  const panelId = `promo-bar-panel-${Math.random().toString(36).slice(2, 8)}`;

  // pull the authored text out of its <p> wrapper so it can live in a
  // <button> (a <p> is not valid content inside a button)
  const toggleContent = toggleCell.firstElementChild || toggleCell;
  const label = document.createElement('span');
  label.className = 'promo-bar-toggle-label';
  label.append(...toggleContent.childNodes);

  const chevron = document.createElement('span');
  chevron.className = 'promo-bar-chevron';
  chevron.setAttribute('aria-hidden', 'true');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'promo-bar-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panelId);
  toggle.append(label, chevron);

  toggleRow.className = 'promo-bar-bar';
  toggleCell.className = 'promo-bar-bar-inner';
  toggleCell.replaceChildren(toggle);

  panelRow.className = 'promo-bar-panel';
  panelRow.id = panelId;
  panelRow.setAttribute('inert', '');
  panelCell.className = 'promo-bar-panel-inner';
  panelCell.querySelectorAll('a[href]').forEach((a) => {
    a.classList.add('button', 'secondary');
    if (a.parentElement.tagName === 'P') a.parentElement.className = 'button-wrapper';
  });

  const setExpanded = (expanded) => {
    toggle.setAttribute('aria-expanded', String(expanded));
    panelRow.classList.toggle('promo-bar-panel-open', expanded);
    panelRow.toggleAttribute('inert', !expanded);
  };

  toggle.addEventListener('click', () => {
    setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
  });

  block.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setExpanded(false);
      toggle.focus();
    }
  });
}
