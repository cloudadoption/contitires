# The content model

This document covers the content side: how a document in [DA](https://da.live/) reaches a URL, and
how the structured data works. It is for an engineer new to
[AEM Edge Delivery Services](https://www.aem.live/) taking the implementation forward. The numbers
were measured against the published site on 2026-08-02, and the paths named are real.

## From a DA document to a URL

The content is in DA at <https://da.live/#/cloudadoption/contitires>, and the tree there is the
URL space. A document's path minus its `.html` extension is the path the site serves it at, so
`learn/2020-roush-mustang-action.html` answers `/learn/2020-roush-mustang-action`. `index.html` at
the top of the tree answers `/`.

A folder that also needs a page of its own gets a sibling document with the folder's name.
`learn.html` is next to the `learn/` folder and answers `/learn`; `tires.html` next to `tires/`
answers `/tires`. This site authors no `index` inside a folder. `/index` and `/learn/index` both
answer 404.

Each document is a `<body>` holding an empty `<header>`, a `<main>` of top-level section divs, and
an empty `<footer>`. The two empty elements are placeholders the chrome fills at load, and the
document itself has no nav and no footer. The DA source API returns that skeleton for `tires.html`,
four sections in it. The delivered page is the same markup once the pipeline has resolved images
and metadata.

The pipeline converts each document to plain semantic HTML and serves it on the content bus. Ask
any path for `.plain.html` to see the `<main>` as delivered, and for the bare path to see the
whole document:

```bash
curl https://main--contitires--cloudadoption.aem.live/tires.plain.html
```

That response contains no `section` or `block` class. Those come from
[`scripts/aem.js`](../scripts/aem.js) in the browser. The bytes on the CDN are the authored
structure, which is most of why `/tires` ships 3,886 bytes of HTML.
[Markup, sections, blocks](https://www.aem.live/developer/markup-sections-blocks) is the reference
for what the pipeline emits and [the markup reference](https://www.aem.live/developer/markup-reference)
for the element level.

Preview and live are two publish states of the same content. `main--contitires--cloudadoption.aem.page`
serves what has been previewed and `.aem.live` serves what has been published. Code and content
move independently. Pushing a branch changes the code that runs against the same content.
Publishing a document changes the content under the same code.

## Page metadata and the template

A document's last section is a Metadata block, a two-column table where each row is a name and a
value. The pipeline turns each row into a `<meta>` tag in the head. This is the whole of it for
`learn/2020-roush-mustang-action.html`:

| | |
| --- | --- |
| Title | The 2020 ROUSH Mustang in Action \| Continental Tire |
| Description | ROUSH Performance and Continental Tire came together at ... |
| Template | Article |
| Category | Technology |
| Weight | 3 |

`Title` and `Description` are the page's own. The other three do different jobs.

`Template` selects a body class and a stylesheet. `decorateTemplateAndTheme` in
[`scripts/aem.js`](../scripts/aem.js) reads `meta[name="template"]`, splits it on commas, passes
each value through `toClassName` and adds the result to `<body>`, so `Article` gives the class
`article`. `loadTemplateStyles` in [`scripts/scripts.js`](../scripts/scripts.js) then loads
`/styles/<template>.css` for one of `article`, `promo`, `crew`, `documents` and `finder`. Any other
value gets no stylesheet. The stylesheet is requested in the eager phase. The page is revealed once
it is in effect, so a template page does not paint at the default width and reflow.

The class also gates behaviour. `buildFinderTriggers` turns the finder call to action into a panel
trigger on `promo` pages. On the `finder` page it marks the three searches in the body instead.

`Category` and `Weight` are not read on the page. They are index columns, lifted out of the head by
the query index definition. They decide which listing an article appears in and where in it.
[docs/index-config.md](index-config.md) has the full column list and why `category` and
`subcategory` are two fields rather than one.

## Section metadata

A section is one top-level div inside `<main>`, and the sections are the page's vertical bands. A
band is styled by putting a Section Metadata block in it with a `Style` row, comma separated. On
`tires.html` the second section sets `Style: dark, full-width` and the third sets
`Style: full-width`.

The pipeline resolves that row into a class attribute on the section div, so `.plain.html` arrives
with `class="dark full-width"` on the div and the block gone. A class written straight onto the div
in the source is stripped instead, which is the trap: the style has to come from Section Metadata.
[`styles/styles.css`](../styles/styles.css) reads `black`, `cta`, `dark`, `full-width`,
`highlight`, `light` and `two-columns`, and a template stylesheet adds its own.

## The nav and footer documents

The header and the footer are ordinary documents. [`blocks/header/header.js`](../blocks/header/header.js)
reads `getMetadata('nav')` and falls back to `/nav`; [`blocks/footer/footer.js`](../blocks/footer/footer.js)
reads `getMetadata('footer')` and falls back to `/footer`. No page sets the metadata, so the site
runs on `nav.html` and `footer.html` at the top of the DA tree. A single page could point at a
different nav by adding the row.

Both are loaded through `loadFragment`, which fetches `${path}.plain.html` and runs `decorateMain`
over the result. A block authored inside the nav or the footer therefore decorates the way it
would on a page. The header loads a second fragment, `/fragments/promo-bar`, the ribbon above the
nav site-wide.

Some chrome is code rather than content, and one case is a DA constraint. The DA edit canvas drops
an empty `<span>` when an author saves, so an authored `:icon:` in the nav disappears the next time
the page is edited. `header.js` injects the three finder icons itself for that reason. The utility
row by the search trigger is code too, and so is the social icon data in `footer.js`. That data is
keyed by hostname, so an author pastes a normal link.

## The products workbook

The tire catalogue is one DA sheet published at
[`/products.json`](https://main--contitires--cloudadoption.aem.live/products.json), a workbook of
four sheets. A request naming no sheet answers `":type": "multi-sheet"`, `":version": 3` and
`":names": ["products", "specs", "catalog", "technology"]`, with one key per sheet.

| Sheet | Rows | Columns | Read by |
| --- | --- | --- | --- |
| `products` | 46 | `slug`, `name`, `category`, `season`, `vehicleTypes`, `tagline`, `description`, `features`, `warranty`, `image`, `sizes`, `bestFor`, `technology`, `sizeCount`, `sizesAreReal`, `nameHtml` | [perfect-fit](../blocks/perfect-fit/perfect-fit.js), the tire finder |
| `specs` | 1656 | `slug`, `size`, `Load Index`, `Speed Rating`, `Tread Wear`, `Traction`, `Temperature`, `Article Number`, `Approved Rim Width`, `Tire Diameter`, `Tire Weight`, `Max Load`, `Rim Protector`, `Max Inflation Pressure`, `Side Wall`, `Overall Section Width`, `Tread Depth`, `Tire Metric`, `Load Range`, `Revs Per Mile`, `UTQG` | [tire-specs](../blocks/tire-specs/tire-specs.js) and the finder |
| `catalog` | 46 | `slug`, `name`, `nameHtml`, `path`, `image`, `description`, `bestFor`, `facetWeights`, `rating`, `reviews`, `promo`, `promoPath`, `isNew`, `weight` | [tire-listing](../blocks/tire-listing/tire-listing.js), [tire-rating](../blocks/tire-rating/tire-rating.js) |
| `technology` | 14 | `name`, `description`, `logo`, `shape` | [columns](../blocks/columns/columns.js), the product hero |

The readers ask for one sheet by name, `/products.json?sheet=catalog`, and get its rows at the top
level of the response. No block fetches the whole workbook. The default limit is 1000 rows, so
`?sheet=specs` alone returns 1000 of the 1656 and under-reports without saying so. `tire-specs`
and `perfect-fit` pass `limit=10000`.
[Spreadsheets](https://www.aem.live/developer/spreadsheets) documents the response format.

`specs` is the one source of which sizes a product comes in, one row per size, and the `sizes`
cell on `products` is derived from it. The two write a size differently, `205/55 R 16` against
`205/55R16`, and `sizeKey` in [`scripts/products.js`](../scripts/products.js) is the single
function that decides the two are one size. That module states the workbook contract as exported
column lists, imported by the blocks and by
[`tools/authoring-check.mjs`](../tools/authoring-check.mjs), which reads the published site and
exits non-zero when a column a reader needs is missing from a sheet.

A facet page is the same block over the same sheet with one cell authored. `/tires/passenger` has a
`tire-listing` block with one cell in it, reading `Passenger`. `parseConfig` reads the cells by
shape rather than by position. A leading `/` makes the cell the source. A cell of digits is the
page size. A cell that is neither is a facet to pre-select. The eleven category pages differ from
`/tires` in that one cell.

## Query indexes

A query index is a spreadsheet the pipeline maintains from the pages themselves, and it is how a
listing block gets a list without a backend. There are two here.

[`/query-index.json`](https://main--contitires--cloudadoption.aem.live/query-index.json) has 328
rows and the columns `path`, `title`, `description`, `image`, `robots`, `body`. The `body` column
is the page's text, which is what makes the site search work.
[`blocks/search/search.js`](../blocks/search/search.js) fetches this index and
[`scripts/search.js`](../scripts/search.js) scores each row, a title hit worth six body hits and a
description hit worth two.

[`/learn/query-index.json`](https://main--contitires--cloudadoption.aem.live/learn/query-index.json)
has 219 rows and ten columns: `path`, `title`, `image`, `description`, `lastModified`, `robots`,
`category`, `weight`, `subcategory`, `excerpt`. It is read by
[`blocks/article-cards/article-cards.js`](../blocks/article-cards/article-cards.js), which filters
by `category` and `subcategory` and sorts by `weight` ascending. Of its 219 rows, 150 are `News`,
48 `Tire Tips`, 16 `Technology`, and 5 have no category.

**A query index contains published pages only.** Previewing a page puts it on `.aem.page`. No index changes. A preview-only page is in no listing and matches no search. It is reachable at
its own URL and not elsewhere. A block with an empty grid on preview and a full one on live is
this, not a bug. The same goes for a document deleted from DA and not unpublished.

Both index definitions are in the AEM Config Service, not in a file in this repo. A definition says
which paths the index selects and which head tag each column reads. `helix-query.yaml` was removed
from git so there is one source of truth rather than two. That makes an index change invisible to
git, which is why [docs/index-config.md](index-config.md) exists and has to be kept current.
[Indexing](https://www.aem.live/developer/indexing) is the platform reference.

The sitemap is a separate list. `/sitemap.xml` has 349 `<loc>` entries against the index's 328
rows, and the difference runs both ways. The 22 block library samples under
`/tools/sidekick/blocks/` are in the sitemap and outside the index's path selection. `/search` is
in the index and out of the sitemap, with `robots: noindex, nofollow` in its own row.

## Redirects

[`/redirects.json`](https://main--contitires--cloudadoption.aem.live/redirects.json) is a DA sheet
at the content root with two columns, `Source` and `Destination`, and 77 rows. The names are
fixed: the platform reads that sheet at that path with those headers.

The redirect resolves at the edge before any code runs. `GET /perfect-fit` answers 301 with
`location: /tires` and `x-error: moved`. The sheet is how Drupal's URL aliases came across, so an
old link still lands. 46 of the rows map live's per-product specs paths onto the product pages
here.

One limit shapes what you can promise. The sheet has no wildcards and a rule does not inherit down
a folder, so a redirect exists per source path or it does not exist. That is why the 2,229
drill-down paths live publishes under `/tire-search/by-vehicle/` answer 404 rather than folding
onto the finder. [Redirects](https://www.aem.live/docs/redirects) documents the sheet.

## The block library

An author inserts a block from a picker rather than typing its table from memory. The picker reads
an index of blocks, each row pointing at a sample document, and pastes that sample's markup into
the page being edited.

There are two indexes and one picker in each place that reads one.
[`tools/sidekick/library.json`](../tools/sidekick/library.json) has 22 rows of `name` and `path`
with site-relative paths, read by the Sidekick Library app that
[`tools/sidekick/library.html`](../tools/sidekick/library.html) loads.
[`tools/sidekick/library-da.json`](../tools/sidekick/library-da.json) is the same 22 rows with
absolute `https://content.da.live/cloudadoption/contitires/...` paths, and it is what DA serves at
`/library/blocks.json` in its own tree, where DA's Blocks picker looks. The two drifting apart is
the failure mode. [`test/tools/library.test.js`](../test/tools/library.test.js) compares the two
name by name, in order, and path by path, and fails on a mismatch. It also fails when a row names
a block this repo does not ship.

Each row points at a sample under `/tools/sidekick/blocks/<name>`, a DA page holding real authored
markup for the block plus a `library-metadata` block with `name`, `description` and `searchtags` in
it. That last one is what the picker shows and searches.
[`blocks/library-metadata/library-metadata.js`](../blocks/library-metadata/library-metadata.js) is
an empty decorator, there so the block loader does not 404 on the 22 sample pages.

The samples are content, so adding a block means authoring its sample page and adding a row to
both indexes. [What is the Sidekick Library?](https://www.aem.live/docs/sidekick-library) covers
the app and [Setup library](https://docs.da.live/administrators/guides/setup-library) covers the
DA side, including the `name` and `path` columns.

## The DA admin API

A script can drive the content operations above, which is how 349 pages got here. Two
APIs are involved, with different credentials. Content goes in and out of DA through
`admin.da.live` with an Adobe IMS access token. Preview and publish run against `admin.hlx.page`
with a site API key.

The source endpoint is `https://admin.da.live/source/{org}/{repo}/{path}` and it takes GET, POST
and DELETE. Keep the `.html` extension. A write is `multipart/form-data` with the document in a
`data` part, which is the shape the endpoint expects:

```bash
# read a document
curl -H "authorization: Bearer $DA_TOKEN" \
  https://admin.da.live/source/cloudadoption/contitires/tires.html

# write it back
curl -X POST -H "authorization: Bearer $DA_TOKEN" \
  --form 'data=@tires.html;type=text/html' \
  https://admin.da.live/source/cloudadoption/contitires/tires.html
```

A write to DA changes no page a visitor sees. Preview, then publish:

```bash
curl -X POST -H "authorization: token $ADMIN_KEY" \
  -H "x-content-source-authorization: Bearer $DA_TOKEN" \
  https://admin.hlx.page/preview/cloudadoption/contitires/main/tires

curl -X POST -H "authorization: token $ADMIN_KEY" \
  https://admin.hlx.page/live/cloudadoption/contitires/main/tires
```

The path is `/{endpoint}/{org}/{site}/{ref}/{path}` and `ref` is the branch, `main` here. Preview
reads the content source, so a DA-backed site sends the DA token on
`x-content-source-authorization`, which `admin.hlx.page` forwards to DA. Publish copies the
resource from the preview partition of the content bus to the live partition, and the order
follows from that. `GET /status/{org}/{site}/{ref}/{path}` reports the state of each partition and
answers 401 unauthenticated.

The same host serves the Config Service, where the index definitions are. See
[docs/index-config.md](index-config.md) for the two calls that read and write them. The
[Admin API documentation](https://www.aem.live/docs/admin.html) is the full surface, and
[docs.da.live](https://docs.da.live/) covers authoring and the rest of the DA API, including
[the source endpoint](https://docs.da.live/developers/api/source).
