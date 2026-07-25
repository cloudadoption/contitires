/**
 * Category tab bar: a horizontal, scrollable row of section links. The
 * authored list is reused as-is; this only tags it for styling.
 * @param {Element} block the category-tabs block
 */
export default function decorate(block) {
  const list = block.querySelector('ul');
  if (list) list.classList.add('category-tabs-list');
}
