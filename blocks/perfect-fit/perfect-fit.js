/**
 * "Find your perfect fit:" bar: a label followed by a row of icon+label
 * shortcut links. The first authored row is the label, the second row's
 * cells are the items.
 * @param {Element} block the perfect-fit block
 */
export default function decorate(block) {
  const [labelRow, itemsRow] = [...block.children];

  const label = labelRow ? labelRow.querySelector('p') : null;
  if (label) label.className = 'perfect-fit-label';

  const list = document.createElement('ul');
  list.className = 'perfect-fit-items';
  const cells = itemsRow ? [...itemsRow.children] : [];
  cells.forEach((cell) => {
    const li = document.createElement('li');
    while (cell.firstElementChild) li.append(cell.firstElementChild);
    list.append(li);
  });

  const children = label ? [label, list] : [list];
  block.replaceChildren(...children);
}
