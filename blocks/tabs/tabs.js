let instances = 0;

/** A cell's text, whichever shape the pipeline delivered the cell in. */
function label(cell) {
  return cell ? cell.textContent.trim() : '';
}

/**
 * Tabbed panels, one panel at a time, the way live's /media stands its logos
 * and its tire images behind two tabs.
 *
 * A row is a tab: the first cell names it, the second is its panel, and an
 * optional third stands beside the panel. A row that names nothing is skipped.
 *
 * Live leaves its own unselected tab at tabindex -1 with no arrow handling, so
 * a keyboard never reaches it. This one follows the tab pattern instead: one
 * stop in the tab order, and the arrows walk the bar.
 * @param {Element} block the tabs block
 */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => label(row.firstElementChild));
  if (!rows.length) return;
  instances += 1;

  const list = document.createElement('div');
  list.className = 'tabs-list';
  list.setAttribute('role', 'tablist');

  const panels = rows.map((row, i) => {
    const [name, body, aside] = [...row.children];
    const id = `tabs-${instances}-${i}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-tab';
    tab.id = `${id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel`);
    tab.textContent = label(name);
    list.append(tab);

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    if (body) {
      body.className = 'tabs-main';
      panel.append(body);
    }
    if (aside) {
      aside.className = 'tabs-aside';
      panel.append(aside);
    }
    return panel;
  });

  const tabs = [...list.children];

  /**
   * Opens one tab and closes the rest.
   * @param {number} index the tab to open
   * @param {boolean} [focus] whether to move focus to it, as the arrows do
   */
  const select = (index, focus) => {
    tabs.forEach((tab, i) => {
      const open = i === index;
      tab.setAttribute('aria-selected', open ? 'true' : 'false');
      tab.tabIndex = open ? 0 : -1;
      panels[i].hidden = !open;
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      let next;
      if (step) next = (i + step + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });

  block.replaceChildren(list, ...panels);
  select(0);
}
