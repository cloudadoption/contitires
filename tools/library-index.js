/*
 * The block picker's side of the index, as the component that reads it sees it.
 *
 * Two pickers read this site. The Sidekick one is tools/sidekick/library.html,
 * which loads Adobe's hosted sidekick-library and points it at
 * /tools/sidekick/library.json. The DA one is da-library inside da.live, which
 * the site's DA config points at library/blocks.json, a copy of
 * tools/sidekick/library-da.json living in DA rather than in git.
 *
 * Both fetch one sample document per row, and both drop a row whose sample they
 * cannot read without saying anything: `if (!resp.ok) return`. So an unpublished
 * or misnamed sample takes its block out of the picker while the index still
 * lists it, and nothing anywhere reports it.
 *
 * These two rules are read off adobe/da-live blocks/edit/da-library/helpers/,
 * and the hosted module agrees with both. Pure, so a test can hold them.
 */

/** hlx.page, hlx.live, aem.page, aem.live: the hosts that serve .plain.html. */
const AEM_ORIGIN = /(?:hlx|aem)\.(?:page|live)$/;

/**
 * The URL a picker fetches for one index row.
 *
 * An AEM host serves the rendered document at `.plain.html`; a DA source path is
 * fetched bare, because content.da.live has no such extension. isAemHosted() in
 * da-live keys on the origin, so a site-relative path counts as AEM once the
 * host is put back on it.
 *
 * @param {string} rowPath the row's `path` cell, site-relative or absolute
 * @param {string} host origin a site-relative path is resolved against
 * @returns {string} the URL to fetch
 */
export function sampleUrl(rowPath, host) {
  const url = new URL(rowPath, host);
  if (!AEM_ORIGIN.test(url.hostname)) return url.href;
  url.pathname = `${url.pathname}.plain.html`;
  return url.href;
}

/**
 * The rows a picker keeps out of an index.
 *
 * A multi-sheet is read by its `blocks` sheet when it has one and by its first
 * sheet otherwise, and a row needs both a name and a path to become an entry.
 *
 * @param {object} sheet the parsed index
 * @returns {Array<{name: string, path: string}>} rows the picker will act on
 */
export function libraryRows(sheet) {
  if (!sheet || typeof sheet !== 'object') return [];
  const named = sheet[':names'];
  const source = Array.isArray(sheet.data)
    ? sheet
    : sheet.blocks || (Array.isArray(named) ? sheet[named[0]] : null);
  if (!source || !Array.isArray(source.data)) return [];
  return source.data.filter((row) => row && row.name && row.path);
}
