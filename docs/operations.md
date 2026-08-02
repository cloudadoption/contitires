# Development and operations

This document is the working loop on this repo, for an engineer joining it who has not worked on
[AEM Edge Delivery Services](https://www.aem.live/) before. The dev server, the two linters and the
test suite come first. Then what a push deploys, what a pull request has to say before it is looked
at, and how content reaches a visitor.
[docs/architecture.md](architecture.md) covers how a page is put together,
[docs/content-model.md](content-model.md) the content side, and
[docs/design-system.md](design-system.md) the CSS. Numbers here were produced by running the
commands, on 2026-08-02.

## The local dev server

Two commands get you a running site:

```sh
npm i
npx -y @adobe/aem-cli up --no-open --forward-browser-logs
```

That is the invocation [AGENTS.md](../AGENTS.md) states, and 16.20.6 is the version it resolved to.
Install the CLI globally with `npm install -g @adobe/aem-cli` and `aem up` is the same thing.
The server answers on `http://localhost:3000`, `--port` moves it, and live reload is on unless you
pass `--no-livereload`.

The startup banner names the split:

```
info: Local AEM dev server up and running: http://localhost:3000/
info: Enabled reverse proxy to https://main--contitires--cloudadoption.aem.page
```

Code comes from your working copy and content comes from the preview host. Both halves are
observable. `GET /blocks/tire-listing/tire-listing.css` answers 20,808 bytes, the byte count of the
file on disk, uncommitted edits included. `GET /tires.plain.html` answers 1,658 bytes that are
byte-identical to the same path on `main--contitires--cloudadoption.aem.page`, and `/products.json`
proxies all 590,622 bytes of the workbook. So a block edit shows up on reload with real authored
content behind it.

The origin is the `main` preview host whatever branch you have checked out. `up.cmd.js` defaults it
to `https://main--{{repo}}--{{owner}}.aem.page` and substitutes the two from the git remote; the
current branch is used for a DNS length check and not for the origin. Pass `--url` to point
somewhere else. Since content belongs to the site rather than to a ref, the default is the right
one anyway.

### Testing a block with no authored content behind it

`--html-folder` serves static HTML from a folder in the working copy, which is how you exercise a
block before an author has made a page for it:

```sh
npx -y @adobe/aem-cli up --no-open --html-folder drafts
```

Files are resolved without their extension, `.html` first and then `.plain.html`, and
`--prefer-plain-html` flips that order. A `.plain.html` file is wrapped into a full document with
the metadata block lifted out and [head.html](../head.html) inserted, so it reaches the browser the
way the pipeline would deliver it. The mount point defaults to `/FOLDER`, so `drafts/hero.html`
answers at `/drafts/hero`; `--html-mount /` puts it at the root instead. The folder has to be inside
the project directory, and the server refuses to start when it does not exist. Follow the
[markup reference](https://www.aem.live/developer/markup-reference) when writing the file: what you
put there is what the content bus would have sent.

## Lint and test

Four npm scripts, and [package.json](../package.json) is the only place they are defined:

```sh
npm run lint        # lint:js then lint:css
npm run lint:js     # eslint . --ext .js,.mjs
npm run lint:css    # stylelint "blocks/**/*.css" "styles/*.css"
npm run lint:fix    # both, with --fix
npm test            # wtr "./test/**/*.test.js" --node-resolve --coverage
npm run test:watch  # the same, with --watch
```

JavaScript is eslint 8.57.1 on `airbnb-base`, configured in [.eslintrc.js](../.eslintrc.js) with
[.eslintignore](../.eslintignore) excluding two paths. CSS is stylelint 17.14.1 extending
`stylelint-config-standard` 40.0.0, and [.stylelintrc.json](../.stylelintrc.json) overrides no rule,
so what bites is that config's defaults. The design system document has
[the rule-level detail](design-system.md#the-linters-and-the-commands), including why a media query
in this repo is written `@media (width >= 769px)`.

The runner is [@web/test-runner](https://modern-web.dev/docs/test-runner/overview/) over one Chrome,
with no second launcher configured. Assertions come from `@esm-bundle/chai`, stubs from
[sinon](https://sinonjs.org/) in 22 files, and viewport control from
[@web/test-runner-commands](https://modern-web.dev/docs/test-runner/commands/) in 56.
[web-test-runner.config.mjs](../web-test-runner.config.mjs) does two things, and its own comment
says why at length. It answers a 404 on an image extension with 200, `image/png` and an empty body.
And it sets `window.SAMPLE_PAGEVIEWS_AT_RATE = 'off'` in the runner page, so no test posts to the
RUM endpoint.

A local run: 132 test files, 1,968 tests, about 18 seconds, coverage above 92%. Coverage is reported and
does not gate. @web/test-runner's default threshold is zero on each of its four counts, and the
config sets no `coverageConfig` to raise it.

### What a test measures

A test mounts markup in the authored shape, adopts the real project stylesheets, sets a width, and
reads the rendered result. It asserts geometry rather than declarations. 62 files call
`getBoundingClientRect` and 67 read `getComputedStyle`.

The stylesheets are the shipped files, fetched over the test server and pushed onto
`document.adoptedStyleSheets` in 66 of the 123 files, usually `/styles/styles.css` plus the block's
own CSS. `styles.css` hides the body until `.appear`, and an undisplayed element measures as a zero
box. So those tests add the class, and several throw outright when the fixture renders with no
height. [test/helpers/stylesheet.js](../test/helpers/stylesheet.js) parses a sheet once per test
page, because each file gets its own page and header tests were fetching `header.css` ten times.

Width is set two ways. 56 files call `setViewport({ width, height })`, which resizes the real
browser. 11 mount the fixture in an `iframe` with `srcdoc` at a fixed width, which lets one file
sweep several widths without disturbing the page around it;
[tire-listing-card-breakpoint.test.js](../test/blocks/tire-listing/tire-listing-card-breakpoint.test.js)
is that shape, checking six widths either side of the 769 step.

Reading the rendered box rather than the rule is the point.
[footer-row-gap.test.js](../test/blocks/footer/footer-row-gap.test.js) walks the footer's rendered
children, finds the first vertical space between two rows, and asserts 50. A media query either side
of that boundary decides which declaration wins. A test reading `row-gap` off `cssRules` would
report what is written instead of what a reader sees. The same file guards the 32px column gutter it
deliberately does not change.

One eslint rule in this repo exists because of the runner. `expect(el).to.not.exist`,
`expect(el).to.be.null` and `expect(el).to.equal(null)` hang web-test-runner for 120 seconds rather
than failing, when the actual value came from `querySelector` or `closest`, and the file then ends
with zero passed. `.eslintrc.js` blocks the three shapes by AST selector and tells you to write
`expect(!!x).to.be.false`.

### What the suite does not cover

Four things, and three of them have an instrument outside the suite.

**One browser.** Chrome, whichever one the machine has. Firefox and WebKit are not configured.

**No image comparison.** The live-versus-this-site pairs behind
[docs/parity-with-live.md](parity-with-live.md) are composed by hand with
[tools/parity/compose.py](../tools/parity/compose.py) and pushed to the `parity-evidence` branch by
[tools/parity/publish-evidence.sh](../tools/parity/publish-evidence.sh), which prints raw URLs for a
pull request body. Neither runs in CI.

**No accessibility audit.** Lighthouse's accessibility category on the pull request is the only one
that runs. `axe` appears in three comments in the suite and in no assertion. What the tests do
assert is the specific finding an audit produced: heading order, contrast tokens, link text.

**No published content.** No test in the suite fetches an absolute URL, so the suite does not see
the authored content. [tools/authoring-check.mjs](../tools/authoring-check.mjs) is the instrument
for that half. It reads the published site against the two contracts that fail in silence, then
exits non-zero naming what and where. The two are the products workbook columns and the learn
category vocabulary:

```sh
node tools/authoring-check.mjs                     # the published site
node tools/authoring-check.mjs --host http://localhost:3000
```

It exits 1 today with 17 problems, which are the product data gaps
[the parity document](parity-with-live.md) records rather than new breakage. The query index
definitions are outside git as well, and [docs/index-config.md](index-config.md) is the note that
stands in for the diff.

### The build workflow

[.github/workflows/main.yaml](../.github/workflows/main.yaml) is 18 lines and one job on
`ubuntu-latest`: checkout, `actions/setup-node`, `npm ci`, install xvfb, `xvfb-run -a npm test`,
then `npm run lint`. Chrome needs a display, which is what xvfb provides; the runner image already
has it. The step is named "Use Node.js 20" and asks for `node-version: 24`, and the log reads
`node: v24.18.0`, so the name is stale rather than the version. Tests run before lint, so a lint
error surfaces after a 30-second test run.

The workflow triggers `on: [push]`, so a branch build runs whether or not a pull request exists.

One test is flaky on the CI runner and green locally: `decodes at live's card size` in
[test/scripts/default-meta-image.test.js](../test/scripts/default-meta-image.test.js) exceeds
mocha's 2,000 ms default on `await image.decode()`. Of the eight `main` runs since that file landed
in `8fbf0f3`, five failed on it and three passed. The five failures fall inside a fifteen-minute
burst of eight merges. The rest pass in each of them.

## Deployment

AEM Code Sync, a GitHub app, puts each push on the **code bus**. No step in this repo builds or
deploys, and there is no bundler, transpiler or minifier: the files you edit are the files a browser
gets.

A ref gets a preview host of its own, under the pattern `{ref}--{site}--{org}`:

```
https://main--contitires--cloudadoption.aem.page/     the main preview
https://main--contitires--cloudadoption.aem.live/     live
https://conti-tire-listing--contitires--cloudadoption.aem.page/tires
```

That third one answers 200 today, and so does its `.aem.live` form. Merging to `main` is the deploy.

**A branch serves the same content as main.** This is the thing that catches people out. Content
belongs to the site rather than to a ref. `{branch}--contitires--cloudadoption.aem.page/tires` and
`main--contitires--cloudadoption.aem.page/tires` deliver the same 1,658 bytes, byte for byte. So a
branch preview is a test of code. A content change is tested by previewing the document, at which
point each branch sees it at once. There is no branch-scoped content to stage against, and no way to
withhold a content change while a code change is reviewed.

## The pull request gate

Two checks run on a pull request. `build` is the workflow above. `aem-psi-check` is the AEM Code Sync
app running [Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) at
both strategies against pages you name, which is
[the platform's own recommendation](https://www.aem.live/docs/dev-collab-and-good-practices).

### The Test URLs line

[.github/pull_request_template.md](../.github/pull_request_template.md) is five lines: a
`Fix #<gh-issue-id>` reference and a `Test URLs:` block with a `Before:` and an `After:` leg. The
`Test URLs:` line is not a convention. **Without it the check rejects the pull request, before a
Lighthouse run happens.** The check run's `output.title` then reads `Rejected: provide test url`,
against `Lighthouse Score: 97` on an accepted one. It gets there fast: on #543 the check started
three seconds after the pull request opened and finished thirteen seconds later. A missing line
costs the whole gate rather than one row of it.

Only the branch-preview URLs are audited. #543's table has four rows, two paths at mobile and
desktop, and each row's URL is on `conti-small-blocks--contitires--cloudadoption.aem.page`. The
`Before:` legs on the main host are absent from it. A `Before:` leg is therefore free at the gate,
and it is there for a human comparing the two sides. Merged pull requests here write `.aem.page` on
both legs, where the template's After example writes `.aem.live`.

The check is bound to the head commit. Editing the body afterwards does not re-run it, and a new
head commit does.

### The two thresholds

The bot's own bar and this project's floor are different numbers, and the gap between them matters.

The scoring guide the bot prints in its comment puts the pass band at `90-100`, warns from `50` to
`89`, and fails under `50`. Its conclusion follows that. #506 passed with mobile performance 91 and
#526 with 92. SEO reads 61 to 69 across this repo, a warning on each scored row, and it fails no
check.

This project's review floor is **performance 95 and accessibility 90, inclusive, on both the mobile
and the desktop row**. Between 90 and 94 the bot passes and the floor does not, and
`Re-run failed PSI checks` cannot reach a row the bot counted as passed. #506 records that band with
the measurement: ticked twice, the check run's id, both timestamps and its title were identical
either side. [Keeping it 100](https://www.aem.live/developer/keeping-it-100) is the platform's
account of why the floor is set where it is.

### An incomplete run is not a failure

A row that produced no number and a row that scored zero look alike at a glance and mean opposite
things. Tell them apart by the badge and the title:

| | incomplete | a real zero |
| --- | --- | --- |
| the row's badge | bare `0`, orange | `PERFORMANCE-0` |
| beside it | `Timeout Exceeded`, or `Lighthouse returned error: Something went wrong.` | audit values |
| `output.title` | `Lighthouse Score: n/a` | a number |

A run is complete when both strategy rows have a score on them. An incomplete one is re-triggered
rather than read as a result. The bot's dashboard comment offers three checkboxes for that:

```
- [ ] Re-run all PSI checks
- [ ] Re-run failed PSI checks
- [ ] Re-sync branch
```

`Re-run all PSI checks` re-runs the same head commit, which is what an incomplete run needs.
[#525](https://github.com/cloudadoption/contitires/issues/525) records three timeouts in ninety
minutes, and why a bare badge is not a score of zero.

[.renovaterc.json](../.renovaterc.json) labels devDependency bumps `ignore-psi-check` and automerges
them, a devDependency change touching no page a visitor loads. The label is not defined in the repo
and no pull request has carried one.

## Preview and publish

Content moves on its own track. An author edits a document in
[DA](https://da.live/#/cloudadoption/contitires), previews it, and publishes it, with no deploy and
no pull request. Preview writes to `main--contitires--cloudadoption.aem.page` and publish copies that
state to `.aem.live`. The [AEM Sidekick](https://www.aem.live/docs/sidekick) offers the same two
actions from a page.

**A query index contains published pages only.** Previewing changes no index, so a preview-only page
is reachable at its own URL and in no listing and no search result. A listing block with an empty
grid on preview and a full one on live is that, not a defect.
[docs/content-model.md](content-model.md#query-indexes) has the two indexes and their columns.

Scripted, it is two APIs with two credentials: `admin.da.live` for the document source with an Adobe
IMS token, `admin.hlx.page` for preview and publish with a site API key.
[docs/content-model.md](content-model.md#the-da-admin-api) has the four curl calls, the header that
forwards the DA token, and why publish follows preview. The
[Admin API documentation](https://www.aem.live/docs/admin.html) is the full surface.

## The block library

An author inserts a block from a picker rather than typing its table from memory, and the picker
reads an index of sample pages. [tools/sidekick/library.html](../tools/sidekick/library.html) loads
the platform's library app and configures three preview widths, 599px Mobile, 899px Tablet and 100%
Desktop. It reads [tools/sidekick/library.json](../tools/sidekick/library.json), 22 rows of `name`
and `path`. [tools/sidekick/library-da.json](../tools/sidekick/library-da.json) is the same 22 rows
with absolute `content.da.live` paths, and it is what DA's own Blocks picker looks at.

Adding a block means authoring its sample page under `/tools/sidekick/blocks/<name>` and adding a row
to both indexes. [test/tools/library.test.js](../test/tools/library.test.js) fails when the two
disagree by name, by order or by path, and when a row names a block this repo does not ship.
[docs/content-model.md](content-model.md#the-block-library) covers the samples and the
`library-metadata` block inside each one.

## Repo layout

```
contitires/
  blocks/                     29 block directories, one .js and one .css in each
  docs/                       this file and five siblings, read on GitHub and not served
  fonts/                      4 Roboto woff2 from the boilerplate, referenced by no stylesheet
  icons/                      63 SVG, fetched by name by decorateIcons in aem.js
  scripts/                    aem.js, 7 project modules, and a package.json setting type: module
  styles/                     styles.css, lazy-styles.css, fonts.css, 5 template stylesheets
  test/                       123 .test.js under blocks/ scripts/ styles/ tools/ widgets/,
                              plus fixtures/query-index.json and helpers/stylesheet.js
  tools/                      authoring-check.mjs, parity/ (2 scripts), sidekick/ (app + 2 indexes)
  widgets/hubspot/            the newsletter and signup embeds, 3 files each
  .github/                    main.yaml and pull_request_template.md
  404.html  head.html         the custom 404 page, and the shared <head> the pipeline inserts
  default-meta-image.png      the og:image fallback, at the path the pipeline hardcodes
  web-test-runner.config.mjs  the test server's middleware and runner page
  .eslintrc.js  .stylelintrc.json  .eslintignore    lint configuration
  .hlxignore                  what the code bus does not serve: dotfiles, *.md, test/, tools/parity/
  .renovaterc.json            dependency updates
  AGENTS.md  CLAUDE.md        the brief an agent reads, and a one-line include of it
  README.md                   the Drupal-to-Edge-Delivery mapping and the short dev loop
```

`.hlxignore` is why `docs/` and `test/` are absent from the code bus:
`https://main--contitires--cloudadoption.aem.live/docs/index-config.md` answers 404 while the file is
in git. `coverage/` and `node_modules/` are generated and gitignored.

## Where to look next

- [docs/architecture.md](architecture.md) for the two buses, the decoration model and the three
  loading phases.
- [docs/content-model.md](content-model.md) for path mapping, the two kinds of metadata, the
  products workbook and the DA admin API.
- [docs/design-system.md](design-system.md) for the tokens, the type scale and the breakpoint rule.
- [Development collaboration and good practices](https://www.aem.live/docs/dev-collab-and-good-practices)
  is the platform's own account of the linting, PageSpeed and merge conventions this repo follows.
- [The go-live checklist](https://www.aem.live/docs/go-live-checklist) is what a production cutover
  adds on top, starting with [BYO CDN setup](https://www.aem.live/docs/byo-cdn-setup).
