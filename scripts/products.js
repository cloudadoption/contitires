/*
 * The products workbook contract.
 *
 * /products.json holds three sheets. `specs` carries one row per product size
 * and is the ONE source of which sizes a product comes in: the tire-specs band
 * lists them on the product page, and the tire finder searches them. The
 * `products` sheet also carries a `sizes` cell, comma joined; it is derived
 * from `specs` and nothing reads it while the specs sheet is whole.
 *
 * The two sheets write a size differently, `205/55 R 16` against `205/55R16`,
 * so sizeKey settles which of the two is one size.
 *
 * This module is imported by the blocks and by tools/authoring-check.mjs, so
 * the contract is stated once. Keep it free of DOM and of Node.
 */

/** The columns the specs sheet is read by. Renaming either breaks both readers. */
export const SPECS_COLUMNS = ['slug', 'size'];

/** The columns the products sheet is read by. */
export const PRODUCTS_COLUMNS = ['slug', 'name'];

/**
 * The columns the rating band reads off the catalog sheet. They hold the
 * aggregate of live's Bazaarvoice reviews, which is the part of that service
 * this site holds; the review bodies are not here and are not ours to write.
 */
export const CATALOG_COLUMNS = ['slug', 'rating', 'reviews'];

/**
 * The columns the product hero reads off the technology sheet. One row per
 * technology rather than per product: the 14 names are a taxonomy the 34
 * product pages draw on, and the `technology` column of the products sheet
 * already names them per product.
 *
 * The description is live's own wording, carried verbatim. It is here rather
 * than in the block because an author edits copy in DA and cannot reach code.
 */
export const TECHNOLOGY_COLUMNS = ['name', 'description'];

/**
 * Which of the required columns no row of a sheet carries. A sheet with no
 * rows carries none of them.
 * @param {Array<Object>} rows the sheet's rows
 * @param {Array<string>} required the column names the reader needs
 * @returns {Array<string>} the missing names, in the order they were required
 */
export function missingColumns(rows, required) {
  if (!rows || !rows.length) return [...required];
  const present = new Set();
  rows.forEach((row) => Object.keys(row).forEach((key) => present.add(key)));
  return required.filter((name) => !present.has(name));
}

/**
 * One size, however it was written. The specs sheet spaces a size out and the
 * products sheet does not, and this is the form the finder parses.
 * @param {string} size a size from either sheet
 * @returns {string} the size without its spaces, upper case
 */
export function sizeKey(size) {
  return String(size).replace(/\s+/g, '').toUpperCase();
}

/**
 * Every product's sizes, read from the specs sheet. A size appears once per
 * load range, so the sheet repeats it and this does not.
 * @param {Array<Object>} rows the specs sheet's rows
 * @returns {Map<string, Array<string>>} slug to its sizes, in sheet order
 */
export function sizesBySlug(rows) {
  const bySlug = new Map();
  (rows || []).forEach((row) => {
    if (!row.slug || !row.size) return;
    if (!bySlug.has(row.slug)) bySlug.set(row.slug, []);
    const sizes = bySlug.get(row.slug);
    const key = sizeKey(row.size);
    if (!sizes.includes(key)) sizes.push(key);
  });
  return bySlug;
}

/**
 * The rows of a single-sheet response, the shape `?sheet=<name>` returns.
 *
 * It takes no sheet name, and that is the point rather than an omission. The
 * response carries nothing that says which sheet it is: measured on the
 * deployed workbook, `?sheet=catalog` and `?sheet=specs` both answer with
 * `:type data limit offset total` and no `:names`. So a name passed here could
 * only be ignored, which is what the two-argument version did on the path every
 * caller takes. There is no name to ignore now. Issue #435.
 * @param {Object} json a parsed single-sheet response
 * @returns {Array<Object>} the rows, or none for any other shape
 */
export function sheetRows(json) {
  if (!json || !Array.isArray(json.data)) return [];
  return json.data;
}

/**
 * One sheet's rows out of the whole workbook, the shape a request naming no
 * sheet returns. Here the name is honoured, because the response holds a key
 * per sheet and `:names` listing them. The legacy single-object file writes a
 * name straight to an array, and that is read too.
 * @param {Object} json a parsed multi-sheet response
 * @param {string} name the sheet name
 * @returns {Array<Object>} that sheet's rows, or none if the workbook has no
 * such sheet
 */
export function workbookSheet(json, name) {
  if (!json) return [];
  const sheet = json[name];
  if (sheet && Array.isArray(sheet.data)) return sheet.data;
  return Array.isArray(sheet) ? sheet : [];
}
