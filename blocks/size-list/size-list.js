/**
 * Size list: renders authored tire sizes as a wrapped grid of chips. Sizes
 * are authored as a list, one size per item.
 * @param {Element} block the size-list block
 */
export default function decorate(block) {
  const items = [...block.querySelectorAll('li')];
  const sizes = items.length
    ? items.map((li) => li.textContent.trim())
    : block.textContent.split(',').map((s) => s.trim());
  const list = document.createElement('ul');
  list.className = 'size-list-chips';
  sizes.filter(Boolean).forEach((size) => {
    const chip = document.createElement('li');
    chip.className = 'size-chip';
    chip.textContent = size;
    list.append(chip);
  });
  block.replaceChildren(list);
}
