# Continental Tire on AEM Edge Delivery Services

Can continentaltire.com run on [AEM Edge Delivery Services](https://www.aem.live/)? This repo is the answer, and the answer is a working site. It rebuilds the live Drupal 11 site with [DA](https://da.live/) as the content source, over seven days from 2026-07-24 to 2026-07-30.

This is a technical demo, not Continental's site. The content, images, product data and trademarks are Continental's, taken from the public site to answer that one question.

- The site: <https://main--contitires--cloudadoption.aem.live/>
- Preview: <https://main--contitires--cloudadoption.aem.page/>
- Authoring: <https://da.live/#/cloudadoption/contitires> (needs DA access)
- Where this site and live differ: [docs/parity-with-live.md](docs/parity-with-live.md)

## What it established

The page inventory came across. [327 pages are published here](docs/parity-with-live.md#the-scale-of-what-shipped) against the 319 URLs live's sitemap lists. The paths are live's own rather than new ones, and a [redirects sheet](https://da.live/sheet#/cloudadoption/contitires/redirects) answers what Drupal aliased.

Each Drupal construct the site leans on has an Edge Delivery equivalent, and this is the mapping the build used:

| Drupal | Edge Delivery | Example here |
|---|---|---|
| Paragraph bundle | Block plus authored document | Hero and promo bar on [the homepage](https://main--contitires--cloudadoption.aem.live/) |
| Views listing | Query index plus block | [article-cards](blocks/article-cards/article-cards.js) over `/learn/query-index.json` |
| Faceted view and taxonomy term pages | Sheet plus one block, one facet per page | [tire-listing](blocks/tire-listing/tire-listing.js) over `/products.json?sheet=catalog` |
| `con-*` custom element | Block decorator JS | [perfect-fit](blocks/perfect-fit/perfect-fit.js), [tire-specs](blocks/tire-specs/tire-specs.js) |
| Structured entity data | DA sheet, a workbook | [/products.json](https://main--contitires--cloudadoption.aem.live/products.json) |
| Webform or embedded form | Widget embed, or an outbound link | [HubSpot newsletter widget](widgets/hubspot/newsletter.html) |
| Theme CSS | Design tokens in `styles/` | [styles/styles.css](styles/styles.css) |

What did not come across is data rather than platform. Store search and vehicle fitment need a system the public site does not expose. So do the Bazaarvoice review corpus and live's tag accounts. The interactive pieces in front of them are ordinary blocks and they are built. [The parity document](docs/parity-with-live.md) takes each gap in turn, says what it costs a visitor, and separates the ones work closes from the ones it cannot.

Authoring is the third finding, and it is the one an audience watching the method asks about. Pages, the menu, the footer, the tire catalogue and the redirect table are documents and sheets in DA. An author edits one and publishes it without a deploy. The [authoring guide](https://main--contitires--cloudadoption.aem.live/tools/authoring-guide) is itself five DA pages, an example of the thing it describes.

Three places deliberately do not match live: the footer, the homepage hero's eyebrow and the paragraph under its h1, and the promo bar. A diff against live flags the three, and the flag is right. This site may not make a commercial claim, assert Continental's copyright, or imply Continental operates it. Matching live there would be the defect rather than the fix, and [the parity document records the three as decisions](docs/parity-with-live.md#commercial-claims-copyright-and-operator-identity).

## How the site is put together

Edge Delivery serves a page from two sources. Content is authored in DA as documents and sheets, converted to plain semantic HTML, and delivered on the content bus. Code is in this repo, where each directory under `blocks/` is a CSS file and a JS decorator that upgrades the authored markup in the browser. Publishing content and merging code are independent, and preview (`.aem.page`) and live (`.aem.live`) are separate publish states.

A page then loads in three phases. The eager phase gets to LCP. The lazy phase brings the rest of the page with the header and the footer. The delayed phase takes what can wait, which here is the newsletter form's HubSpot embed. [Keeping it 100](https://www.aem.live/developer/keeping-it-100) is why the split matters.

## Working on this repo

```sh
npm i
npx -y @adobe/aem-cli up   # dev server at http://localhost:3000
```

The dev server serves code from your working copy and proxies content from preview. A block edit shows up on reload, with real content behind it. Content edits happen in [DA](https://da.live/#/cloudadoption/contitires), with preview and publish from the editor.

Before pushing:

```sh
npm run lint
npm test
```

Push a branch and AEM Code Sync serves it at `https://{branch}--contitires--cloudadoption.aem.page/` against the same content, so a branch tests code and not content. Open a PR with a `Test URLs:` line pointing at a branch-preview page: the `aem-psi-check` bot runs Lighthouse against it and rejects a PR without one. [The PR template](.github/pull_request_template.md) sets the rest.

Authors insert a block from a picker in the DA editor rather than typing it from memory. [tools/sidekick/library.json](tools/sidekick/library.json) is what the picker app reads, `library-da.json` is the bytes DA serves, and a test fails when the two disagree. The samples behind them are DA pages under `/tools/sidekick/blocks/`.

### What the code assumes about authored content

Two things an author edits are read by code that expects a shape. Break the shape and the page does not complain, it renders less. `tools/authoring-check.mjs` reads the published site against both and exits non-zero with what and where:

```sh
node tools/authoring-check.mjs                 # defaults to the published site
node tools/authoring-check.mjs --host http://localhost:3000
```

[`/products.json`](https://main--contitires--cloudadoption.aem.live/products.json) is one workbook of three sheets, and the blocks read them by column name:

| Sheet | Read by | Columns it is read by |
|---|---|---|
| `products` | [perfect-fit](blocks/perfect-fit/perfect-fit.js), the tire finder | `slug`, `name`, `category`, `season`, `vehicleTypes`, `image` |
| `specs` | [tire-specs](blocks/tire-specs/tire-specs.js) and the finder | `slug`, `size`, plus the 19 spec fields, which render in column order |
| `catalog` | [tire-listing](blocks/tire-listing/tire-listing.js), [tire-rating](blocks/tire-rating/tire-rating.js) | `slug`, `name`, `path`, `image`, `bestFor`, `facetWeights`, `weight`, `rating`, `reviews` |

The `specs` sheet is the one source of which sizes a product comes in, one row per size. `sizes` on the `products` sheet is derived from it, and no block reads it while the specs sheet is whole. The two write a size differently, `205/55 R 16` against `205/55R16`, and [`scripts/products.js`](scripts/products.js) has the one function that settles which of the two is one size.

An article takes one `Category` value, and a listing filters the query index by the same string. Both ends are free text in DA, so a typo at either drops articles out of a page that still renders. [`scripts/categories.js`](scripts/categories.js) is where the vocabulary is written down: `Tire Tips`, `Technology` and `News`.

A section is banded by a Section Metadata block with a `Style` row, which the pipeline turns into a class on the section. A class written on the section div is stripped instead. The global stylesheet reads `black`, `cta`, `dark`, `full-width`, `highlight`, `light` and `two-columns`, and a template stylesheet adds its own.

## Where the detail is

- [docs/parity-with-live.md](docs/parity-with-live.md) is the comparison against continentaltire.com, bucket by bucket: what differs, what this site diverges on by choice, what is approximated, what is absent, and what no work here reaches. A parity finding belongs there and nowhere else.
- [The authoring guide](https://main--contitires--cloudadoption.aem.live/tools/authoring-guide) is written for whoever edits the content, in five pages.
- The [issue queue](https://github.com/cloudadoption/contitires/issues) has the open work, ordered in [#359](https://github.com/cloudadoption/contitires/issues/359).

## Documentation

- [Developer tutorial](https://www.aem.live/developer/tutorial) and [anatomy of a project](https://www.aem.live/developer/anatomy-of-a-project)
- [Markup, sections, blocks](https://www.aem.live/developer/markup-sections-blocks) and the [block collection](https://www.aem.live/developer/block-collection)
- [Indexing](https://www.aem.live/developer/indexing), for query indexes like `/learn/query-index.json`
- [Keeping it 100](https://www.aem.live/developer/keeping-it-100), the three-phase loading model
- [DA documentation](https://docs.da.live/) for authoring and the admin API
- [David's model](https://www.aem.live/docs/davidsmodel) for the rules this project follows
