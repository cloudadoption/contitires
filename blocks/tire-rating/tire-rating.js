import { CATALOG_COLUMNS, missingColumns, sheetRows } from '../../scripts/products.js';

// the catalog sheet alone: the workbook also carries the products and specs
// sheets, and neither says anything about a rating. The sheet API serves 1000
// rows to a request naming no limit, so the limit is named.
const CATALOG_URL = '/products.json?sheet=catalog&limit=10000';

/**
 * One product's aggregate, read from the catalog sheet.
 *
 * A sheet that has rows and not the columns this reads is a broken contract,
 * not a product nobody has rated, so it comes back as an error the band shows
 * rather than a band that quietly leaves. Issue #122 is the same shape on the
 * specs sheet.
 *
 * A sheet that cannot be read at all is neither of those. It is an outage, and
 * it used to return an empty object, which fill read as a product with no
 * rating: the band took itself away and nothing anywhere said a fetch had
 * failed. It comes back as `unreadable` now, which is the error the band does
 * not show. Issue #434.
 * @param {string} slug the product slug
 * @returns {Promise<{row?: Object, error?: string, unreadable?: boolean}>} the
 * row, or what is wrong
 */
async function loadRating(slug) {
  const resp = await fetch(CATALOG_URL);
  if (!resp.ok) {
    return { error: `the catalog sheet could not be read (HTTP ${resp.status})`, unreadable: true };
  }
  const rows = sheetRows(await resp.json());
  const missing = missingColumns(rows, CATALOG_COLUMNS);
  if (missing.length) {
    return { error: `the catalog sheet has no ${missing.join(' and no ')} column` };
  }
  return { row: rows.find((r) => r.slug === slug) };
}

/**
 * A five-star widget filled to the rating. The stars are the same two SVGs the
 * tire listing draws its cards with, sized for this band.
 * @param {number} rating the rating, 0 to 5
 * @returns {HTMLSpanElement}
 */
function stars(rating) {
  const widget = document.createElement('span');
  widget.className = 'tire-rating-stars';
  widget.setAttribute('aria-hidden', 'true');
  const filled = document.createElement('span');
  filled.className = 'tire-rating-stars-fill';
  filled.style.width = `${(Math.min(Math.max(rating, 0), 5) / 5) * 100}%`;
  widget.append(filled);
  return widget;
}

/**
 * Fills the band with the aggregate, once the sheet has landed. A product the
 * sheet has no row for, or that nobody has rated, takes the band away: live
 * fills that case with a write-a-review control, which is the service and not
 * ours to offer.
 * @param {Element} block the tire-rating block
 * @param {{row?: Object, error?: string, unreadable?: boolean}} result what the
 * sheet answered
 */
function fill(block, result) {
  const heading = document.createElement('h2');
  heading.textContent = 'Customer rating';

  if (result.error) {
    // eslint-disable-next-line no-console
    console.error(`tire-rating: ${result.error}`);
    // an outage is the reader's business only in that a broken band is worse
    // than none, so it leaves what an unrated product leaves and the line above
    // is what separates the two
    if (result.unreadable) {
      (block.closest('.tire-rating-container') || block).remove();
      return;
    }
    const message = document.createElement('p');
    message.className = 'tire-rating-error';
    message.textContent = `Ratings are unavailable: ${result.error}.`;
    block.replaceChildren(heading, message);
    return;
  }

  const rating = Number(result.row && result.row.rating) || 0;
  const reviews = Number(result.row && result.row.reviews) || 0;
  if (!rating || !reviews) {
    (block.closest('.tire-rating-container') || block).remove();
    return;
  }

  const score = document.createElement('p');
  score.className = 'tire-rating-score';
  score.textContent = rating.toFixed(1);

  const count = document.createElement('p');
  count.className = 'tire-rating-count';
  count.textContent = `${reviews} ${reviews === 1 ? 'Review' : 'Reviews'}`;

  const said = document.createElement('p');
  said.className = 'sr-only';
  said.textContent = `Rated ${rating} out of 5 from ${reviews} reviews`;

  block.replaceChildren(heading, score, stars(rating), count, said);
}

/**
 * The rating band a product page ends with. Live ends it with a Bazaarvoice
 * section headed "Why people love this tire": a rating snapshot, the written
 * reviews, questions and answers, and a write-a-review control. The reviews
 * themselves are that service's and this site does not hold them, so the band
 * carries what the catalog sheet does hold, the aggregate rating and count,
 * and is headed for what it shows rather than for what live shows.
 *
 * The product is identified by a slug the band is built with, falling back to
 * the last path segment.
 * @param {Element} block the tire-rating block
 * @returns {Promise} settles when the sheet has landed and the band is filled
 */
export default function decorate(block) {
  const authored = block.textContent.trim();
  const slug = authored || window.location.pathname.replace(/\/$/, '').split('/').pop();

  return loadRating(slug)
    .catch((e) => ({ error: `the catalog sheet could not be read (${e.message})`, unreadable: true }))
    .then((result) => fill(block, result));
}
