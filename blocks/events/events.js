import { decorateIcons } from '../../scripts/aem.js';

// the pill's three lines, told apart by what they hold rather than by the
// order the author wrote them in
const YEAR = /^\d{4}$/;
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DATE_RANGE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d/i;

/**
 * Reads a cell's lines. The pipeline delivers a cell holding one paragraph as
 * bare text, so give that one an element to carry.
 * @param {Element} cell The authored cell
 * @returns {Element[]} The lines that hold something
 */
function lines(cell) {
  if (!cell) return [];
  if (!cell.firstElementChild && cell.textContent.trim()) {
    const line = document.createElement('p');
    line.append(...cell.childNodes);
    cell.append(line);
  }
  return [...cell.children].filter((el) => el.textContent.trim());
}

/**
 * Builds the orange band: live's date pill over the venue. The pin is chrome,
 * so the block draws it rather than the author.
 * @param {Element} cell The authored date cell
 * @returns {Element} The band
 */
function buildDate(cell) {
  const band = document.createElement('div');
  band.className = 'events-date';
  let day;
  let year;
  let range;
  const venues = [];
  lines(cell).forEach((line) => {
    const text = line.textContent.trim();
    if (!year && YEAR.test(text)) year = line;
    else if (!day && WEEKDAYS.includes(text.toLowerCase())) day = line;
    else if (!range && DATE_RANGE.test(text)) range = line;
    else venues.push(line);
  });

  if (day || year || range) {
    const pill = document.createElement('div');
    pill.className = 'events-pill';
    if (day || year) {
      const header = document.createElement('div');
      header.className = 'events-pill-header';
      if (day) {
        day.className = 'events-day';
        header.append(day);
      }
      if (year) {
        year.className = 'events-year';
        header.append(year);
      }
      pill.append(header);
    }
    if (range) {
      range.className = 'events-range';
      pill.append(range);
    }
    band.append(pill);
  }

  venues.forEach((venue) => {
    venue.className = 'events-location';
    const pin = document.createElement('span');
    pin.className = 'icon icon-pin-outline';
    venue.prepend(pin);
    band.append(venue);
  });
  return band;
}

/**
 * Builds the detail column: the name, the description, and a footer holding
 * the category and the details link.
 * @param {Element} cell The authored detail cell
 * @param {Element} categoryCell The authored category cell
 * @returns {Element} The column
 */
function buildDetail(cell, categoryCell) {
  const detail = document.createElement('div');
  detail.className = 'events-detail';
  const parts = lines(cell);
  const name = parts.find((el) => /^H[1-6]$/.test(el.tagName));
  // a link that is all its paragraph holds is the call to action; one inside a
  // sentence stays part of the description
  const cta = parts.find((el) => {
    const link = el.querySelector('a[href]');
    return link && el.textContent.trim() === link.textContent.trim();
  });
  if (name) {
    name.classList.add('events-name');
    detail.append(name);
  }
  const body = parts.filter((el) => el !== name && el !== cta);
  if (body.length) {
    const description = document.createElement('div');
    description.className = 'events-description';
    description.append(...body);
    detail.append(description);
  }

  const [category] = lines(categoryCell);
  if (category || cta) {
    const footer = document.createElement('div');
    footer.className = 'events-footer';
    if (category) {
      category.className = 'events-category';
      footer.append(category);
    }
    if (cta) {
      cta.className = 'events-cta';
      cta.querySelector('a').classList.add('button');
      footer.append(cta);
    }
    detail.append(footer);
  }
  return detail;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const card = document.createElement('li');
    card.append(buildDate(cells[0]), buildDetail(cells[1], cells[2]));
    list.append(card);
  });
  block.replaceChildren(list);
  decorateIcons(block);
}
