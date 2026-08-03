/**
 * What the author wrote, at the level they wrote it. The pipeline nests authored
 * content in row and cell divs, so the walk descends through divs and stops at
 * the first element that is not one. It runs over the whole block rather than
 * per row, which is what lets one cell hold the whole run of questions and one
 * row hold a single question, without the two needing different code.
 * @param {Element} root the block, or a row or cell within it
 * @returns {Element[]} the authored elements, in document order
 */
function authoredContent(root) {
  return [...root.children].flatMap((el) => (el.tagName === 'DIV' ? authoredContent(el) : [el]));
}

/**
 * Live's FAQ control, which is a native details and summary:
 *
 *   <details class="faq"><summary class="faq__question"><span>…</span></summary>
 *   <div class="faq__answer article-content">…</div></details>
 *
 * So the keyboard, the Enter and Space handling and the expanded state a screen
 * reader announces come from the platform, and nothing here listens for a click.
 *
 * The authored heading goes INSIDE the summary rather than being replaced by a
 * span. HTML allows one element of heading content there, and it keeps the
 * questions under the band's own heading in the document outline; live drops
 * that outline. Everything from one heading to the next is its answer, and copy
 * written above the first heading leads the block rather than being dropped.
 * @param {Element} block the accordion block
 */
export default function decorate(block) {
  const lead = [];
  const rows = [];
  authoredContent(block).forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) rows.push({ heading: el, answer: [] });
    else if (rows.length) rows[rows.length - 1].answer.push(el);
    else lead.push(el);
  });

  const built = rows.map(({ heading, answer }) => {
    const details = document.createElement('details');
    details.className = 'accordion-row';
    const summary = document.createElement('summary');
    summary.className = 'accordion-question';
    summary.append(heading);
    const body = document.createElement('div');
    body.className = 'accordion-answer';
    body.append(...answer);
    details.append(summary, body);
    return details;
  });

  block.replaceChildren(...lead, ...built);
}
