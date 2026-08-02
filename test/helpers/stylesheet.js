/*
 * The stylesheet a test measures against, read and parsed once per test page.
 *
 * test/blocks/header/ fetched /blocks/header/header.css ten times across four
 * files, seven of them in header.test.js, and each new CSS assertion added
 * another. (#125)
 *
 * web-test-runner gives each test file its own page, so this cache dedupes
 * within a file and cannot reach across them: four files still make four
 * requests, and one file now makes one.
 *
 * The sheet handed back is shared. Reading `cssRules` is safe and so is
 * adopting it, because `document.adoptedStyleSheets` takes one sheet in as many
 * documents as ask for it. A caller that means to CHANGE a sheet, the way
 * header-mega-panel.test.js layers an override on top of header.css, builds its
 * own with `new CSSStyleSheet()` and does not come here.
 */

const parsed = new Map();

/**
 * The parsed stylesheet at `path`.
 * @param {string} path a served path, e.g. `/blocks/header/header.css`
 * @returns {Promise<CSSStyleSheet>} the sheet, parsed once per page
 */
export default function styleSheet(path) {
  if (!parsed.has(path)) {
    parsed.set(path, (async () => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${path} reads ${res.status}, so nothing here was measured`);
      const sheet = new CSSStyleSheet();
      await sheet.replace(await res.text());
      return sheet;
    })());
  }
  return parsed.get(path);
}
