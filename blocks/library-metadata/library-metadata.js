/**
 * The block library picker reads this block from the sample document's own
 * markup, which it fetches as .plain.html, so the block has nothing to do on
 * the rendered page and its stylesheet keeps it out of view. This file exists
 * because the block loader imports one for every block it decorates, and logs
 * a 404 and a failed import on every sample page when it is missing. (#285)
 */
export default function decorate() {}
