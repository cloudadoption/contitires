# Architecture

This document is about how the site is put together on Edge Delivery Services. It covers where
the HTML comes from, where the code comes from, what turns one into the other in the browser, and
the delivered weight. The reader it assumes is an engineer taking the implementation forward who
has not built an Edge Delivery site before. Terms here are the ones [aem.live](https://www.aem.live/)
uses, so each one can be looked up there; [anatomy of a project](https://www.aem.live/developer/anatomy-of-a-project)
is the platform's own tour of the same ground.

## The two buses

A page comes from two sources that do not wait for each other. Content is authored in
[DA](https://da.live/) and published to the **content bus**. Code is this git repo, and AEM Code
Sync puts it on the **code bus** after each push. An author publishes a page with no deploy. A
merged PR changes how pages published weeks earlier render.

| host | what it serves |
| --- | --- |
| `https://main--contitires--cloudadoption.aem.page/` | the preview state, what an author sees after pressing Preview in DA |
| `https://main--contitires--cloudadoption.aem.live/` | the live state, what a visitor sees, after Publish |

Preview and live are two publish states over one document. Previewing touches the `.aem.page`
host alone. Publishing copies that state to `.aem.live`.

The host pattern is `{ref}--{site}--{org}`. Push a branch and it gets a preview host of its own:
`https://conti-tire-listing--contitires--cloudadoption.aem.page/tires` answers 200 today. That
host serves the branch's code against the same content, because the content bus belongs to the
site rather than to a ref. A branch preview therefore tests code and not content. The
[PR template](../.github/pull_request_template.md) asks for a before and after URL pair on that
basis.

```
  DA (da.live)                      this git repo                     
  documents and sheets              blocks/ scripts/ styles/          
       |                                 |                            
       | preview, then publish           | push, then merge           
       v                                 v                            
+---------------------------+     +---------------------------+       
|       CONTENT BUS         |     |        CODE BUS           |       
|  <path>.plain.html        |     |  /scripts/aem.js          |       
|  /products.json           |     |  /scripts/scripts.js      |       
|  /query-index.json        |     |  /blocks/<name>/<name>.js |       
|  /redirects.json          |     |  /styles/*.css            |       
+-------------+-------------+     +-------------+-------------+       
              |                                 |                     
              +----------------+----------------+                     
                               |                                      
                               v                                      
        +----------------------------------------------+              
        |  aem.live delivery tier, Fastly in front     |              
        |  main--contitires--cloudadoption.aem.page    |              
        |  main--contitires--cloudadoption.aem.live    |              
        +----------------------+-----------------------+              
                               |                                      
                    GET /tires |  one HTML document                   
                               v                                      
        +----------------------------------------------+              
        |  browser                                     |              
        |  aem.js finds sections, then blocks          |              
        |  each block loads its own CSS and JS,        |              
        |  then fetches any sheet it reads             |              
        +----------------------------------------------+              
```

Both `*.aem.page` and `*.aem.live` answer `x-robots-tag: noindex, nofollow`. They also serve a
`/robots.txt` that disallows each user agent, so this site is not in search results. A production
site puts its own domain and CDN in front of the same delivery tier and turns indexing on there.
[BYO CDN setup](https://www.aem.live/docs/byo-cdn-setup) is the procedure. HTML on the live host
answers `cache-control: max-age=7200, must-revalidate`, arrives through Fastly, and negotiates
brotli.

## What DA delivers

A DA document is delivered twice. `<path>.plain.html` is the page body on its own.
`<path>` is that body wrapped into an HTML document.

`/tires.plain.html` is 1,658 bytes. Here it is whole, with the hero's `<source>` elements elided
and the nesting folded onto fewer lines:

```html
<div>
  <div class="hero left short">
    <div><div><picture>...</picture></div></div>
    <div><div><h1 id="our-engineeringyour-confidence">OUR ENGINEERING.<br>Your confidence.</h1></div></div>
  </div>
</div>
<div class="dark full-width">
  <div class="perfect-fit">
    <div><div></div></div>
    <div><div>Find your perfect fit</div></div>
  </div>
</div>
<div class="full-width">
  <div class="tire-listing">
    <div><div></div></div>
  </div>
</div>
<div class="black">
  <h2 id="store-search-is-not-part-of-this-site">Store search is not part of this site</h2>
  <p>This site is a rebuild of continentaltire.com on Adobe Edge Delivery Services. Store search
    needs a dealer database and a location service, and the rebuild has neither.</p>
  <p>The <a href="/online-retailers">online retailers</a> page lists retailers who sell
    Continental tires online.</p>
</div>
<div></div>
```

No framework markup is in there, and no component wrappers. Headings keep a generated `id`. An
image arrives as a `<picture>` with the pipeline's webp and jpeg variants already in it. The
trailing `<div></div>` is a final section with no delivered content.

**Sections** group content, and each one is a top-level `<div>`. An author separates two of them
with a horizontal rule in the document. This page has four with content.

**Default content** is what an author writes outside a block: the `<h2>` and the two `<p>` in the
last section above. The vocabulary is shared across authoring formats: headings, paragraphs, lists,
links, pictures, emphasis. It reads the same here whatever the document was written in.

**Blocks** are tables. The first cell names the block, and the delivered markup uses that name as
the class on the outer `<div>`: `perfect-fit`, `tire-listing`. Table rows become `<div>` children
and cells become `<div>` grandchildren, which is why `perfect-fit` above is two rows of one cell
each. A name written with something in parentheses gets a further class. `hero (left, short)` in
the document is `class="hero left short"` here. The platform calls those **block options**; this
repo says variants.

A **Section Metadata** block sets properties on its section instead of rendering. A `Style` row
turns into a class, which is where `dark full-width` and `black` above come from. A class typed
directly onto the section `<div>` is stripped. Other rows arrive as data attributes, and
`/online-retailers.plain.html` shows the pair:

```html
<div data-tab="Store Near You" data-tabs="nav">
```

Page metadata authored in a Metadata block turns into the `<head>` tags. The wrapped page at
`/tires` adds `<title>`, the canonical link, description, og and twitter tags, the contents of
[head.html](../head.html), an empty `<header>`, a `<main>` holding the plain HTML, an empty
`<footer>`. 3,886 bytes in total.

[Markup, sections, blocks](https://www.aem.live/developer/markup-sections-blocks) and the
[markup reference](https://www.aem.live/developer/markup-reference) define this contract.

## The decoration model

Two module scripts are in the head, and they are the only script tags on the page:

```html
<script nonce="aem" src="/scripts/aem.js" type="module"></script>
<script nonce="aem" src="/scripts/scripts.js" type="module"></script>
```

[scripts/aem.js](../scripts/aem.js) is the platform library, taken from the
[AEM boilerplate](https://github.com/adobe/aem-boilerplate) and not edited since.
`git log -- scripts/aem.js` returns one commit, the initial import. Treat it as a dependency: a
fix belongs upstream, not here.

[scripts/scripts.js](../scripts/scripts.js) is this project's entry point. It calls `loadPage()`
on its last line, and the rest follows from that call.

`decorateSections` finds `main > div`, adds `.section`, groups each run of default content into a
`.default-content-wrapper`, and hides the section with `display: none` until it has loaded.
`decorateBlocks` then matches `div.section > div > div`. For each match it reads the first class
as the block name, adds `.block` and `data-block-name`, names the wrapper `{name}-wrapper`, and
names the section `{name}-container`. The delivered bytes have no such classes. Grep the served
HTML for `class="section"` and the count is zero.

`loadBlock` does the rest. For a block named `tire-listing` it imports
`/blocks/tire-listing/tire-listing.js`, loads `/blocks/tire-listing/tire-listing.css`, and awaits
the module's default export with the block element:

```js
export default async function decorate(block) { ... }
```

A block is therefore a directory of two files, and there are 29 under [blocks/](../blocks). A page
pays for the CSS and the JS of the blocks on it and no others.
[banner.js](../blocks/banner/banner.js) is a small one to read first. It takes the first authored
row as the page title and later rows as the line under it, then builds a breadcrumb from the path.

The authored markup is the contract between the author and the developer. `banner` reads row
order. `perfect-fit` reads a cell for its question. `article-cards` reads cells for a category and
a limit. Change what a row or a cell means and pages published against the old meaning render
less, and no error is raised. [tools/authoring-check.mjs](../tools/authoring-check.mjs) reads the
published site against the two contracts most likely to break in silence: the products workbook
columns, and the learn category vocabulary. It exits non-zero naming what and where.

## The three phases

A page loads in three phases: eager up to first paint, lazy for the rest of the page, delayed for
what can wait. [Keeping it 100](https://www.aem.live/developer/keeping-it-100) is the reasoning.
What this project puts in each phase is below.

**Eager** sets `documentElement.lang`, runs `decorateTemplateAndTheme` so page metadata reaches
the body as classes, and starts the template stylesheet. Five templates name one of their own
under `styles/`: `article`, `promo`, `crew`, `documents`, `finder`. A product page does not pay
for the article layout. Then `decorateMain` runs over `<main>`, and `revealPage` adds
`body.appear` once the template stylesheet is in effect, so an article does not paint at the
default page width and reflow afterwards. Last, `loadSection` loads the blocks of the first
section and waits for its first image. The fonts are on their way before any of this runs, because
`head.html` links `styles/fonts.css` itself, so `loadsFontsEagerly` no longer decides whether they
are fetched. [The webfont on the critical path](#the-webfont-on-the-critical-path) is why.

**Lazy** loads the header block, which fetches `/nav` and `/fragments/promo-bar` as fragments.
Then the remaining sections in order, a scroll to the URL hash if there is one, the footer block
fetching `/footer`, `styles/lazy-styles.css`, and the finder triggers. `loadFonts()` runs here too.
It finds its stylesheet already in the head and resolves without a second request.

**Delayed** is a 3,000 ms timeout that imports [scripts/delayed.js](../scripts/delayed.js). That
file is eight lines. It queries for `.widget[data-source]` and imports the widget loader when one
is present:

```js
if (document.querySelector('.widget[data-source]')) {
  import('../blocks/widget/widget.js').then(({ loadWidgetScripts }) => loadWidgetScripts());
}
```

Three pages use a widget: `/newsletter-signup`, `/offers` and `/promotion`. On the other 325
indexed paths the delayed phase costs one DOM query. The widget block is where third-party code
goes, and the HubSpot newsletter form is the one in use, so its script is off the critical path.

There is no tag manager. Grep the delivered HTML of any page for `googletagmanager` and the count
is zero. The measurement in place is `sampleRUM` inside `aem.js`, at the default weight of 100:
roughly 1 view in 100 posts to `https://ot.aem.live/.rum/100`. A tag container belongs in the
delayed phase, and adding one is open work.

## The webfont on the critical path

Stag Sans is on the first paint, and putting it there is a deliberate exception to the platform's
font guidance. `head.html` preloads three of the faces and links `styles/fonts.css` as a stylesheet,
so the parser waits on the font stylesheet before it paints:

```html
<link rel="preload" href="https://continentaltire.com/.../StagSans-Thin.woff" as="font" type="font/woff" crossorigin/>
<link rel="preload" href="https://continentaltire.com/.../StagSans-Light.woff" as="font" type="font/woff" crossorigin/>
<link rel="preload" href="https://continentaltire.com/.../StagSans-Book.woff" as="font" type="font/woff" crossorigin/>
<link rel="stylesheet" href="/styles/fonts.css"/>
```

The three faces are 26,172, 28,508 and 29,080 bytes, 81.8KB together. `fonts.css` is 79 lines and
answers 1,292 bytes brotli. The italic face is one of the five and is not preloaded. Its bytes would
land on each page, while the italic copy that reads it was absent from the pages measured.

The reason is a shift the metric-matched fallback could not take. Arial sets wider than Stag Sans, so
a title wrapping to three lines in the fallback wraps to two in Stag Sans. The article body under it
then rises 51px when the swap lands. [The design system](design-system.md) covers the fallback that
removed most of it, 47 of the 55 article titles that changed line count. The remainder does not tune
away. The sweep went from 90% to 95% in 0.1 steps, over 220 real titles at four widths. The best
`size-adjust` leaves 31 line-count changes against the shipped value's 33. Two typefaces do not wrap
alike, and no advance-width ratio makes them.

So the swap had to stop landing after the paint, and it takes both halves to move it. Measured cold
on `/learn/how-do-smokey-burnout` at 412 wide:

| in the head | CLS |
| --- | --- |
| neither | 0.0552, the body moving 36px at 5336ms |
| the three preloads alone | 0.0515, the font in hand at 149ms and unused |
| `fonts.css` render-blocking alone | 0.0552, the woff requested at 2485ms |
| both | 0 |

A preload on its own does little, because a preload registers no face. The bytes land in the cache
and no rule asks for them until `fonts.css` arrives, which was the lazy phase below 769px. The
stylesheet on its own fails the other way. A woff is requested when layout first needs it, which is
the paint it was meant to precede. Across the article pages, cold CLS went from 0.055, 0.075 and
0.039 to 0, 0 and 0.0015. The pull request gate read 97 to 100, with LCP 2.1 to 2.3s on mobile.

### Why this is not the shape to keep

Two things about it run against [keeping it 100](https://www.aem.live/developer/keeping-it-100) and
[the font fallback article](https://www.aem.live/developer/font-fallback). Whoever takes this forward
should have both in view.

A render-blocking font stylesheet in `head.html` is what that guidance tells you not to add. It says
fonts are "loaded right after" the LCP, because getting them there before it is "largely impossible".
Of preloading, it says the technique "has a significant negative impact". The font fallback article
asks you to "defer the custom font loading or at least make it non-blocking in the loading sequence".
The boilerplate does that. Its `head.html` links `styles.css` and no font stylesheet, and
`loadFonts()` requests one from JavaScript after the first section has loaded. The page has painted
by then.

The faces are fetched from `continentaltire.com`, which `fonts.css` already did before the preloads
were added. The guidance is explicit here too. Connecting to a second origin before the LCP "is
strongly discouraged as establishing a second connection (TLS, DNS, etc.) adds a significant delay".
Connect plus TLS to that host measured 23ms from a machine with a warm resolver, and a visitor's own
first lookup costs more. The dependency is the heavier half of it. The type here renders while live
is up and answering `access-control-allow-origin: *`, and falls to Arial when it is not.

`font-display: swap` means the paint does not wait for a woff. What the two halves buy is the face
registered and its bytes in hand before layout runs, so no swap happens. When the third-party fetch
loses the race to the paint, the swap is back and the blocking stylesheet was paid for anyway.

### What access closes it

The licensed font files, and the rest follows from that.

With the files, the faces are woff2 under [`fonts/`](../fonts), served from this site's own origin off
the code bus, and `fonts.css` points at `../fonts/` the way the boilerplate's does. One origin, no
handshake, no host outside this project. woff2 also subsets, which the boilerplate does with a
`unicode-range` per face. This site cannot subset a file it does not have.

The fallback then comes off the real face instead of off measurements of rendered text. The mechanism
is the boilerplate's own, and this project already runs it. It is a fallback family declared with
`size-adjust` and `src: local('Arial')` in `styles/styles.css`, and this site adds `ascent-override`
and `descent-override` at each weight. Today's ratios were read with canvas `measureText` over 70,041
characters of the site's own running text. A font this repo cannot open leaves no other route. A
generator reading the file gets those numbers from the source, so they are exact and reproducible
rather than fitted, and `font-display: swap` costs no shift.

The end state is a smaller thing than what is there now. Self-hosted woff2 in `fonts/`, and
`fonts.css` back in the lazy phase. A fallback generated from the real face, no preload, and no
third-party origin on the critical path. CLS still 0. It deletes the four lines in `head.html` rather
than adding to them. [Completing the migration](completing-the-migration.md#web-fonts) lists it as a
gap with the access it needs.

## Autoblocking

Autoblocking builds a block no author asked for, from a pattern in the delivered content.
`buildAutoBlocks` in [scripts.js](../scripts/scripts.js) is the boilerplate's hook for it, and
`decorateMain` runs several more passes around it. What this project builds:

| built block | trigger | function |
| --- | --- | --- |
| `fragment` | `a[href*="/fragments/"]` in the content | `buildAutoBlocks` |
| `widget` | `a[href*="/widgets/"]` | `buildWidgetAutoBlocks` |
| `perfect-fit card` | `.columns.product-hero a[href="/perfect-fit"]` | `buildFinderCardAutoBlocks` |
| `tire-rating` | a page with `.columns.product-hero` or `.tire-specs` | `buildTireRating` |
| `share` | the `article` template | `buildArticleSidebar` |
| `media-gallery` | two or more `<picture>` in a product hero cell | `buildProductViewer` |
| `tabs` | sections with a `Tab` section metadata row | `buildTabs` |
| `header`, `footer` | the page | `loadHeader` and `loadFooter` in `aem.js` |

Three reasons drive the list. First, Edge Delivery puts no block inside a block cell. Author one
there and the pipeline hands back the paragraphs it was made of. So the product hero's image
viewer and its finder card are built rather than authored. Second, a block taking no authored
input is upkeep with no payoff. `tire-rating` reads a slug the URL already has, and authoring it
would put the same inert block on 46 product pages for someone to maintain. Third, some structure
belongs to the template rather than to the author: the sharebar is on each of the 200-odd articles
and needs no input.

Order matters, and `decorateMain` fixes it. `buildAutoBlocks` runs before `decorateSections`, so a
fragment replaces its link before sections exist. `buildArticleSidebar` runs after
`decorateSections` and before `decorateBlocks`, because it needs the wrappers and wants the
sharebar decorated like any other block. `buildTabs` and `buildProductViewer` run after
`decorateBlocks`: moving a decorated block is safe, and decorating one wraps loose cell text in a
paragraph. `decorateNestedBlocks` closes the sequence. `decorateBlocks` reads one level under a
section, so a block inside another block's cell is decorated by hand.

## Data

Three published sources feed the blocks, and a block reads one with `fetch`.

### The products workbook

`/products.json` is one multi-sheet workbook, 590,622 bytes whole. Its envelope reports
`":type": "multi-sheet"`, `":version": 3` and `":names": ["products","specs","catalog","technology"]`.

| sheet | rows | columns | read by |
| --- | --- | --- | --- |
| `products` | 46 | 16 | [perfect-fit](../blocks/perfect-fit/perfect-fit.js) |
| `specs` | 1,656 | 21 | [tire-specs](../blocks/tire-specs/tire-specs.js), perfect-fit |
| `catalog` | 46 | 14 | [tire-listing](../blocks/tire-listing/tire-listing.js), [tire-rating](../blocks/tire-rating/tire-rating.js) |
| `technology` | 14 | 4 | [columns](../blocks/columns/columns.js) |

A block asks for one sheet rather than the workbook. `?sheet=catalog` answers `":type": "sheet"`
and that sheet's rows on their own: 29,624 bytes against 590,622. The requests in the code are
`?sheet=catalog`, `?sheet=catalog&limit=10000`, `?sheet=products`, `?sheet=specs&limit=10000` and
`?sheet=technology&limit=100`.

The sheet API pages at 1,000 rows when a request names no limit. `specs` has 1,656 of them, so an
unlimited request answers with 1,000 rows and reports `"total": 1656` next to `"limit": 1000`.
Name a limit, or follow the total. `tire-specs` does both: it asks for 10,000 and loops on
`&offset=` until it has the reported total.

[scripts/products.js](../scripts/products.js) is where the workbook contract is written down. It
names the columns each reader needs, plus `sizeKey`, which settles that `205/55 R 16` on the specs
sheet and `205/55R16` on the products sheet are one size.
[Spreadsheets](https://www.aem.live/developer/spreadsheets) covers the JSON shapes and the query
parameters.

### The query indexes

A query index is a sheet the platform builds from the site's own pages, one row per page a
definition selects. It is how a listing block gets its rows
([indexing](https://www.aem.live/developer/indexing)).

`/query-index.json` is the default index: 328 rows, 673,320 bytes, six columns `path`, `title`,
`description`, `image`, `robots`, `body`. [blocks/search](../blocks/search/search.js) fetches it
once and ranks locally with [scripts/search.js](../scripts/search.js), which weights a title hit
at 6, a description hit at 2 and a body hit at 1.

`/learn/query-index.json` is a second definition scoped to `/learn/**`: 219 rows and ten columns,
adding `lastModified`, `category`, `weight`, `subcategory` and `excerpt`.
[blocks/article-cards](../blocks/article-cards/article-cards.js) reads it and filters by
`category` and `subcategory` in the browser.

An index is a definition, not a page inventory. The sitemap lists 349 paths and the default index
has 328 rows. The definition excludes the 22 block-library samples under
`/tools/sidekick/blocks/`, and it indexes `/search`, which has no sitemap entry.

That definition is not in this repo. It is held by the AEM Config Service, so a change to it
appears in no commit and no diff. [docs/index-config.md](index-config.md) records the learn
definition, the column sources, and the curl calls that read and write it.

### Redirects

`/redirects.json` is a two-column sheet, `Source` and `Destination`, 77 rows. No block reads it.
The delivery tier applies it: `GET /perfect-fit` answers `301` with `location: /tires` and
`x-error: moved`. This is how the Drupal path aliases came across, and
[redirects](https://www.aem.live/docs/redirects) documents the sheet. It has no wildcard rows, and
a row does not apply to the paths below it.

## Delivered weight

Measured on two paths, this site's HTML is 5.5x and 31.4x smaller uncompressed than the Drupal
original, and 9.9x and 16.8x smaller as transferred:

| path | this site | continentaltire.com | ratio |
| --- | --- | --- | --- |
| `/` | 22,660 | 123,748 | 5.5x |
| `/` transferred | 3,462 brotli | 34,351 gzip | 9.9x |
| `/tires` | 3,886 | 122,032 | 31.4x |
| `/tires` transferred | 942 brotli | 15,847 gzip | 16.8x |

Other paths here for scale, uncompressed: `/learn` 12,047 bytes,
`/tires/extremecontact-sport-02` 11,311, `/learn/tips` 2,710.

These numbers are a property of the model rather than a tuning result, and no minifier ran. The
HTML is the authored document. No server-side template emits wrappers, data attributes and hidden
panels for parts of a page a visitor may not reach. There is no framework runtime to hydrate
it either. Two same-origin module scripts serve the site. CSS and JS arrive per block, so a page
downloads code for the blocks on it. The pipeline writes the `<picture>` variants, so responsive
images cost no client-side JS.

`/tires` is the extreme end, and it shows where the weight went. Its `tire-listing` block is
delivered as one empty cell. The 46 catalog rows, the facet counts and the cards arrive from
`?sheet=catalog` after paint, so the document does not include them. The sheet is then cached
separately from the page reading it. The compressed ratio (16.8x) is smaller than the uncompressed
one (31.4x) for a related reason. Most of what Drupal sends on that path is repetitive markup, and
gzip handles that well.

Cacheability differs in the same direction. HTML here answers `cache-control: max-age=7200,
must-revalidate` and `vary: Accept-Encoding,X-Forwarded-Host`. The Drupal original answers
`max-age=900, public`, `vary: Accept-Encoding, Cookie, Cookie, Cookie`, and
`x-drupal-dynamic-cache: UNCACHEABLE (poor cacheability)` on the homepage.

## Where to look next

- [README.md](../README.md) maps each Drupal construct this site leaned on to its Edge Delivery
  equivalent, and covers the local dev loop.
- [docs/parity-with-live.md](parity-with-live.md) is the comparison against continentaltire.com,
  including the gaps that need access this implementation did not have.
- [docs/index-config.md](index-config.md) records the query index definition git does not.
- [The developer tutorial](https://www.aem.live/developer/tutorial) builds a site from scratch,
  and [David's model](https://www.aem.live/docs/davidsmodel) states the rules this project follows.
