# The block inventory

A reference for the 29 directories under [`blocks/`](../blocks), for whoever has to change one. Each
entry says what the block is for, what an author writes in DA, what the decorator builds from it, which
classes an author can add, and where its data comes from. The authored shape is the contract between
the author and the developer, so changing it changes existing pages.

Read [docs/architecture.md](architecture.md) first if the decoration model is new to you. Several of
these started from the [block collection](https://www.aem.live/developer/block-collection) and then
diverged toward the reference site.

Line counts are the JS and the CSS on 2026-08-03. The test column counts files under
[`test/blocks/`](../test/blocks); the runner is `@web/test-runner`, driven by `npm test`.

| Block | What it is for | js/css | Tests |
|---|---|---|---|
| [header](#header) | the yellow bar, the mega menu, the search field | 408/820 | 6 |
| [footer](#footer) | link columns, the social band, the legal bar | 236/321 | 6 |
| [fragment](#fragment) | pulls another document into this page | 50/1 | 1 |
| [hero](#hero) | the marquee at the top of a page | 197/1205 | 15 |
| [perfect-fit](#perfect-fit) | the tire finder, its bar and its modal | 875/811 | 10 |
| [tire-listing](#tire-listing) | the filterable catalogue behind `/tires` | 712/791 | 6 |
| [tire-specs](#tire-specs) | a product's per-size specification band | 281/197 | 3 |
| [tire-rating](#tire-rating) | a product's aggregate rating, and its JSON-LD | 182/102 | 2 |
| [size-list](#size-list) | authored tire sizes as chips | 20/22 | 1 |
| [tire-features](#tire-features) | the annotated tire diagram | 160/332 | 1 |
| [columns](#columns) | two-column layouts, including the product hero | 358/481 | 6 |
| [cards](#cards) | the general card grid, in ten treatments | 75/1209 | 9 |
| [article-cards](#article-cards) | the learn listings over the query index | 346/413 | 3 |
| [related-articles](#related-articles) | the links an editor picked for one article | 26/1 | 1 |
| [media-gallery](#media-gallery) | a tile grid of stills and videos, with a modal | 376/719 | 7 |
| [carousel](#carousel) | one slide at a time, with a counter | 138/225 | 2 |
| [video](#video) | a poster that becomes a player on click | 70/74 | 2 |
| [tabs](#tabs) | one panel at a time behind a tab bar | 96/204 | 1 |
| [banner](#banner) | the dark title band a standalone page opens with | 142/183 | 2 |
| [category-tabs](#category-tabs) | a scrollable row of section links | 48/183 | 3 |
| [promo-bar](#promo-bar) | the slim disclosure under the header | 90/189 | 2 |
| [share](#share) | share links, derived from the page | 74/115 | 2 |
| [crew](#crew) | a Conti Crew member page's marquee and bar | 155/326 | 2 |
| [events](#events) | the events listing and its month filter | 443/408 | 3 |
| [retailers](#retailers) | a tile per online shop | 136/218 | 1 |
| [store-locator](#store-locator) | a static stand-in for store search | 44/139 | 1 |
| [search](#search) | the results page over the site index | 355/423 | 4 |
| [widget](#widget) | an embedded third-party form | 103/3 | 1 |
| [library-metadata](#library-metadata) | the picker's own metadata, never rendered | 8/5 | 1 |

Four of these are never inserted from the picker. `header` and `footer` decorate the `nav` and
`footer` documents. `fragment` is how one document reaches another. `library-metadata` belongs to the
picker itself. Three more are built without an author asking, and
[`scripts/scripts.js`](../scripts/scripts.js) is where that happens: `widget` from a link to a
`/widgets/` path, `tire-rating` on a product page, and `tabs` where the content calls for it. An
author who deletes what looks like a stray link to `/widgets/` deletes a form.

## Site chrome

### header

The yellow bar, seven top-level items, a utility row and an expandable search field. Every dropdown
opens as a full-width dark mega panel; the Tires panel runs seven columns of product links and a
finder row.

**Authored:** the `nav` document in DA, as nested lists. The tree is content, so the menu changes
without a deploy. **Built:** the bar, the panels, the mobile drawer, and the finder row's glyphs, which
are injected rather than authored because DA drops an empty span on save.

The desktop media query comes from a memoised accessor rather than being read at import, so importing
the module for its helpers does not touch the viewport.

### footer

**Authored:** the `footer` document, flat. Heading-plus-list pairs, lone button paragraphs, and one
link group whose entries are all social hosts. **Built:** the link columns, the call-to-action row, and
the full-width icon band at the top, which is that social group recognised by its hosts. A group
heading is re-ranked to `h2`, because the fragment cannot see what sits above it and every page puts
its `h1` first.

The columns and the legal bar step at 769, which is live's own boundary. The footer's attribution
paragraphs are one of the four places this site deliberately does not match live; see
[docs/parity-with-live.md](parity-with-live.md#commercial-claims-copyright-and-operator-identity).

### fragment

Includes another document at this point in the page. **Authored:** a link to the document's path.
It refuses a path that is not site-absolute, and it rebases a `./media_` reference against the
fragment's own path rather than the page's.

## The product experience

### hero

The marquee. **Authored:** up to two pictures for art direction, a heading, subcopy paragraphs and
call-to-action links, in the order the author wrote them, so an eyebrow line can precede the heading.
Anything else authored passes through unstyled rather than being dropped. **Built:** the picture layer,
a scrim, the copy column, and a call-to-action row collected at the end.

**Variants:** `left`, `stacked`, `short`, `slim`, `slimmer`, `tall`, `promo`, `logo`, `breadcrumb`,
`title-left`. They compose, and the combination decides the band height. `breadcrumb` draws a trail
from the path, positioned over the photograph the way live positions it. This is the block with the
most variants and the most tests, and the reason is that live's marquee is not one component: its band
runs 220 to 560 depending on the page, and each of those is a variant here.

### perfect-fit

The tire finder. **Authored:** a bar with a label cell and one cell per mode, or the same block with no
label cell, which is the strip the listing pages carry. **Built:** the bar, and on first click an
accessible modal with ARIA tabs and a focus trap.

**Variant:** `card`, which is the version in the product-page hero. It renders in the eager phase, so
it builds no modal and reads no catalogue; the shared trigger contract carries the click and the modal
is built on the first one.

**Data:** `/products.json?sheet=products` and `?sheet=specs`. By Tire Size cascades width, aspect and
rim from the specs sheet and matches exactly. By Vehicle and By Plate answer from a curated table,
which is the gap in [docs/completing-the-migration.md](completing-the-migration.md).

### tire-listing

The catalogue behind `/tires` and its eleven category pages. **Authored:** the block, optionally with
one facet, which is what makes a category page. **Built:** the filter sidebar, the sort control, the
result cards and the pager. **Data:** one fetch of `/products.json?sheet=catalog`, after which every
filter, sort and page change is a local array operation.

Filter state goes into the URL as readable parameters, so a filtered listing can be linked and the
Back button works. The Drupal term-id parameters live deep-links with are still read. The filter
semantics follow live including its asymmetry: checked Vehicle Type boxes intersect, Driving Condition
and Weather Condition union, and the three groups intersect with each other.

### tire-specs

Live's specification band, with a size picker. **Authored:** the block, with a slug, falling back to
the last path segment. **Built:** the band in full, then the picker filled from the sheet.

**Data:** `/products.json?sheet=specs`, 1656 rows over 46 products. The sheet API answers 1000 rows to
a request that names no limit, so the block pages until the reported total is in. The band is drawn
before the sheet arrives on purpose: a product page carries three more sections under this block, and
section loading only reaches them once this returns.

### tire-rating

The band a product page ends with: the aggregate rating and the review count. Autoblocked, so an author
does not insert it. **Data:** the `catalog` sheet's `rating` and `reviews` columns.

It also emits the page's `Product` JSON-LD, before it fills, off the same sheet read. A row with no
rating gets a `Product` with no `aggregateRating` rather than a zero. Live's band is Bazaarvoice's and
carries the written reviews; this one is headed for what it shows rather than for what live shows.

### size-list

**Authored:** tire sizes as a list, one per item. **Built:** a wrapped grid of chips.

### tire-features

Live's annotated tire: cards down one side, the tire beside them with a ring on each part a card
claims. **Authored:** one row per feature. The first cell is its drawing, the second its card, an
optional picture there being the card's icon, and every cell after that is a ring, as a heading, its
words and a last paragraph placing it. **Data:** the `technology` sheet, 14 rows.

Live's rings are divs with a click handler, so a keyboard reaches none of the eight, and below 1181 it
hides the words until one is tapped. This one prints the words at every width and leaves the rings to
the drawing.

### columns

Two-column layouts. **Variants:** `bar`, `feature`, and `product-hero`, which is the product page's
top: the photograph column and the copy column, taking live's own flex mechanism, the copy a constant
at 352px and the photographs the remainder.

It also carries the rebate flag on the 19 of 46 product pages live shows one. That is authored rather
than built, so an author takes an expired offer down by deleting two paragraphs. A link before the
title is the flag; a link after it opens the row.

## Content blocks

### cards

The general grid, and the block with the most CSS in the repo. **Authored:** one row per card, image
cell and text cell. **Variants:** `benefits`, `category`, `coverage`, `facts`, `highlights`, `logos`,
`marks`, `members`, `news`, `teaser`. Each is a live treatment rather than a design decision here,
which is why there are ten.

A tile in a `dark` section keeps its own ground: `highlights` on a dark band paints `rgb(29, 29, 29)`
with white text, because live's marks in that band are white strokes and a white tile erases them.

### article-cards

The learn listings. **Authored:** the block, with a category to filter by. **Built:** the card grid, a
result count and a load-more control. **Data:** `/learn/query-index.json`, 219 rows, sorted by an
editorial `weight` because live exposes no publish dates.

**Variants:** `feature`, `columns`. A row with no index image gets live's black stub tile rather than
being dropped. The batch is 12 where live pages 10.

### related-articles

**Authored:** the links an editor picked. The title is chrome, so only the links are authored.

### media-gallery

A grid of square tiles mixing stills and videos, opening a modal that pages the whole set. The player
is the video block's, so a page of videos asks nothing of YouTube until someone asks to watch one.

**Variants:** `cards`, the shape live gives a landing page, a wider still with the video's name under
it; `product`, the product-page gallery; `social`. **Built:** the tiles, the thumbnails, and a native
`dialog` shown modally, which is where the focus trap, Escape and the handoff back to the tile come
from. Live's dialog is a div with no close control and none of the three.

### carousel

One slide visible at a time, each pairing an image with a heading, body copy and a link. **Authored:**
one row per slide, image cell and text cell. **Built:** the track, prev and next, dot indicators and an
"N of X" counter, wrapping around. **Variant:** `autoplay`, which pauses on hover and focus, carries a
pause control, and honours `prefers-reduced-motion`.

### video

A poster that becomes a player on click. **Variant:** `video-no-poster`. The embed is
`youtube-nocookie.com` with `autoplay`, because the click asked for it. The play mark is live's own
ringed circle at 72px, the same one the gallery draws.

### tabs

One panel at a time. **Authored:** a row per tab, the first cell naming it, the second its panel, an
optional third standing beside the panel. A row that names nothing is skipped. The bar opens its first
tab, or the one `data-selected` names.

Live leaves its unselected tab at `tabindex="-1"` with no arrow handling, so a keyboard never reaches
it. This one follows the ARIA tabs pattern instead, which is a deliberate divergence.

### banner

The dark title band a standalone page opens with. **Authored:** the title in the first cell, an
optional line under it in a second. The trail comes from the path.

### category-tabs

A scrollable row of section links. **Authored:** the list, reused as-is; the block tags it and
highlights the current category. **Variants:** `compact`, `jump`, `pills`. The `jump` form aliases
live's own fragment onto the section holding that year, so an inbound link ending `#year2021` lands
where live lands.

### promo-bar

A slim disclosure. **Authored:** row 1 is the toggle label, row 2 the detail panel. The row and cell
divs are reused as the wrappers rather than replaced, so only the button and its spans are new. Its
copy is one of the four exempt zones.

### share

**Authored:** nothing. The block derives the URL and the title from the page and renders Facebook, X,
LinkedIn, mail and print.

### crew

A Conti Crew member marquee and the black bar under it. **Authored:** one row per part, the photo with
the title, the logo alone, a name and its preferences per person, the summary, and the social addresses
as a list.

### events

The events listing and its month filter. **Authored:** the events. **Built:** the list, the month
select and the result count. Finished events are filtered out, so the list does not decay on its own.
**Variant:** `events-open`.

### retailers

A tile per online shop, its logo linked to the shop over a financing link that opens the terms. Live
draws that as a popover. **Authored:** a row per retailer, the first cell the logo linked to the shop,
the second the copy behind its financing link. A row with no second cell shows no link, which is how
live shows the badge only where a shop offers it.

### store-locator

A static stand-in for live's store search: a heading, a disabled location input, a use-current-location
link, and one example result. There is no dealer database to query, and
[docs/completing-the-migration.md](completing-the-migration.md#store-and-dealer-lookup) says what a
real one takes. The example store is authored content rather than a hard-coded string.

### search

The results page at `/search`. **Authored:** the block. **Built:** the query field and the result list.
**Data:** the site-wide query index, 328 rows, each carrying a `body` column, filtered and ranked in
the browser. A page enters that index when it is published, not when it is previewed.

### widget

An embedded third-party form. **Authored:** a link to a path under `/widgets/`, which
`buildAutoBlocks` turns into this block where the link was. The shell, the markup and its stylesheet
load with the block, because those hold the room the content will take. The script that fills it
follows in the delayed phase, which is why the form appears a few seconds after the page.

Three published pages carry one. A link reading like a label is a form here, so deleting it deletes the
form.

### library-metadata

The picker reads this block out of a sample document's own `.plain.html`, so it has nothing to do on a
rendered page and its stylesheet keeps it out of view. The file exists because the block loader imports
one per block and logs a failed import when it is missing.
