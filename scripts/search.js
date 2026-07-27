/**
 * Scoring and ranking for the site search, over the rows of /query-index.json.
 *
 * The ranking is ours. Live runs Drupal Search API over Solr, whose relevance scores,
 * boosts and index exclusions cannot be read from outside, so this reproduces live's
 * observable behavior rather than its scores.
 */

/** results per page, as live pages them */
export const PER_PAGE = 10;

/** a title hit outranks a description hit, which outranks a body hit */
const WEIGHTS = { title: 6, description: 2, body: 1 };

/** a title covering more of the query outranks a title covering less of it */
const TITLE_COVERAGE = 0.5;

/** 309 of 320 titles end with the site name, so it is not a match */
const SITE_SUFFIX = /\s*\|\s*continental tire\s*$/i;

const WORD = /[a-z0-9]+/g;

/**
 * Folds a plural so tires matches tire. Porter step 1a, which leaves boxes as boxe.
 * @param {string} word a lowercased word
 * @returns {string} its stem
 */
export function stem(word) {
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ss')) return word;
  if (word.endsWith('s') && word.length > 2) return word.slice(0, -1);
  return word;
}

function words(text) {
  return (String(text || '').toLowerCase().match(WORD) || []).map(stem);
}

function tally(list) {
  const counts = new Map();
  list.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  return counts;
}

/**
 * The stemmed terms of a query, unique and in order.
 * @param {string} query the raw query
 * @returns {string[]} its terms
 */
export function queryTerms(query) {
  return [...new Set(words(query))];
}

const tallied = new WeakMap();

function rowTerms(row) {
  let counts = tallied.get(row);
  if (!counts) {
    counts = {
      title: tally(words(String(row.title || '').replace(SITE_SUFFIX, ''))),
      description: tally(words(row.description)),
      body: tally(words(row.body)),
    };
    tallied.set(row, counts);
  }
  return counts;
}

/**
 * Scores one row. A row that does not hold every term scores 0, so a two-word query
 * narrows rather than widens, the way live's result totals show it does.
 */
function score(row, terms) {
  const counts = rowTerms(row);
  const hits = terms.map((term) => ({
    title: counts.title.get(term) || 0,
    description: counts.description.get(term) || 0,
    body: counts.body.get(term) || 0,
  }));
  if (!hits.every((hit) => hit.title + hit.description + hit.body > 0)) return 0;
  const weighted = hits.reduce((sum, hit) => sum
    + hit.title * WEIGHTS.title
    + hit.description * WEIGHTS.description
    + hit.body * WEIGHTS.body, 0);
  const covered = hits.filter((hit) => hit.title > 0).length;
  return weighted * (1 + TITLE_COVERAGE * covered);
}

/**
 * Ranks index rows against a query, best first.
 * @param {object[]} rows the rows of a query index
 * @param {string} query the raw query
 * @returns {object[]} the matching rows, each with its score, best first
 */
export function rank(rows, query) {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  return rows
    .map((row) => ({ ...row, score: score(row, terms) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}

/**
 * One page of ranked results.
 * @param {object[]} rows the rows of a query index
 * @param {string} query the raw query
 * @param {number} page the page, zero based as live pages
 * @returns {{total: number, page: number, pages: number, results: object[]}} the page
 */
export function search(rows, query, page = 0) {
  const ranked = rank(rows, query);
  const current = Math.max(0, page);
  return {
    total: ranked.length,
    page: current,
    pages: Math.ceil(ranked.length / PER_PAGE),
    results: ranked.slice(current * PER_PAGE, (current + 1) * PER_PAGE),
  };
}
