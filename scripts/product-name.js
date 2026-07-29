/*
 * A product name as live prints it.
 *
 * Live sets the tail of ten of the 46 names as a superscript, so the name is
 * authored markup rather than text: `ExtremeContact Sport<sup>02</sup>`. Three
 * surfaces print a name from a sheet cell, the listing cards, the finder's
 * results and the specs band, so the cell needs one sanitiser between it and
 * the DOM. It lives here rather than in a block, because a block importing from
 * another block couples the two, and rather than in products.js, which states
 * the workbook contract and is imported by tools/authoring-check.mjs in Node.
 *
 * `<sup>` survives and every other tag is dropped, keeping its text, except for
 * the elements whose text a page never renders, which go whole. The mark
 * is styled at `display: inline` and never `inline-block`: an inline-block child
 * makes the accessible-name computation insert a space, which announces the name
 * as two words. That is live's own defect and copying it would break the
 * announcement. Issue #238.
 */

/** Elements whose text content a page never shows, so the name never shows it. */
const UNRENDERED = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);

/**
 * One product name, its superscript kept and every other tag dropped.
 * @param {string} html the name cell, with or without markup
 * @returns {DocumentFragment} the name, ready to append
 */
export function renderName(html) {
  const fragment = document.createDocumentFragment();
  const parsed = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
  const copy = (source, target) => {
    [...source.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        target.append(node.textContent);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (UNRENDERED.has(node.tagName)) {
          // nothing: its text is not the name
        } else if (node.tagName === 'SUP') {
          const sup = document.createElement('sup');
          copy(node, sup);
          target.append(sup);
        } else {
          copy(node, target);
        }
      }
    });
  };
  copy(parsed.body, fragment);
  return fragment;
}

export default renderName;
