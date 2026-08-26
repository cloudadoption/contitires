# Completing the migration

This is what the rebuild could not do, and how to do it. Each gap here is blocked on a system the
public continentaltire.com does not hand out: an API, a vendor account, a licence, a database, an
index configuration. A team that has those can close them, and this document says what closing each
one looks like on Edge Delivery Services rather than in the abstract.

The reader it assumes is an engineer who has the access and has not built an Edge Delivery site
before. Where a platform mechanism carries the answer, the mechanism is named with the word
[aem.live](https://www.aem.live/) uses for it, so it can be looked up there.

[docs/parity-with-live.md](parity-with-live.md) is the register of what differs and why. This document
is the other half: what to build. The two are meant to be read together, and a gap closed here comes
out of that register.

Each section has the same four parts. What live does. What this build does instead. What access closes
it. The implementation shape.

## How much of this is data

The pattern repeats often enough to state once. In most gaps below the user interface is an ordinary
block and it already exists; what is missing is a source of truth behind it. The tire
finder's modal is built and accessible, and it answers from a hand-written table. The store locator
renders, with one hard-coded store. The sponsorship form has 26 inputs and a disabled submit.

That shape changes the estimate, so establish it before planning the work. Most of these
are an integration and a data contract, not a design and a build.

## Store and dealer lookup

**Live** queries a location service from `/Store-finder` and returns a map with a ranked list of
nearby dealers, each with an address, a phone number and a distance.

**This build** redirects `/store-finder` onto `/online-retailers` and ships
[`blocks/store-locator`](../blocks/store-locator/store-locator.js) as a static mock: a disabled input
and one example store. The homepage carries a panel saying store search is not part of the site.

**Access needed:** the dealer database, and a geocoding service.

**Shape.** Two forms, and which one is right depends on how many dealers there are and how often they
change.

For a set in the low thousands that changes weekly, a [sheet](https://www.aem.live/developer/spreadsheets)
is enough. Dealers go in a DA sheet, the block fetches it once, and the ranking is a distance
calculation in the browser over the rows. That is the same pattern
[`tire-listing`](../blocks/tire-listing/tire-listing.js) already uses over `/products.json?sheet=catalog`:
one fetch, then every interaction is a local array operation. The block would page the sheet the way
[`tire-specs`](../blocks/tire-specs/tire-specs.js) does, because the sheet API answers 1000 rows to a
request that names no limit.

Past that, a sheet stops being right: the payload becomes the page's weight and the browser sorts data
it will never show. Then the query belongs server-side, and the block posts a postcode to an endpoint
that answers the closest N. Edge Delivery does not host that endpoint. It is a function somewhere else
with CORS configured for the site's origin, or one behind the same domain through the CDN in front of
the site.

Geocoding is a third-party call either way. It goes in the delayed phase if it runs on page load, and
on demand if it runs on submit, which is the normal case here. The map library is the heaviest thing
on such a page and belongs in the [delayed phase](https://www.aem.live/developer/keeping-it-100), or
better, behind the first interaction: a static image of the area costs nothing and most visitors read
the list.

Live's own map provider is not visible in its delivered HTML. The choice is open rather than a thing
to match.

## Site search

**Live** searches the whole site from the header and ranks results with a Solr configuration.

**This build** has a working results page at `/search` over a site-wide
[query index](https://www.aem.live/developer/indexing) of 328 rows, each carrying `path`, `title`,
`description`, `image`, `robots` and `body`. [`blocks/search`](../blocks/search/search.js) filters and
ranks that index in the browser. Ranking was rebuilt by comparing against live's own result pages
rather than its index, and it agrees with live on 30 of 50 sampled queries.

**Access needed:** live's Solr configuration, to match the remaining 20 and to match which pages live
excludes.

**Shape.** The index is the part Edge Delivery gives you, and it is already right: an index is
configured through the AEM Config Service rather than a file in this repo, which
[docs/index-config.md](index-config.md) records for this site. A page enters an index when it is
**published**, not when it is previewed, which is the single most common surprise here.

What an index cannot do is what a search service is for: stemming, synonyms, typo tolerance, per-field
weighting that changes without a deploy, and faceting over a corpus too large to ship to the browser.
At this size, 328 rows, client-side ranking is the better trade, and the honest limit is that the
ranking is code rather than configuration. Above roughly a few thousand pages, or as soon as
merchandisers need to tune relevance themselves, the block should post the query to a search service
and render what comes back. The block's structure does not change; its data source does.

Two smaller things live does that a query index does not carry by default: excluding a page from
results while leaving it published, and boosting one. The first is the index's `robots` column, which
this site already indexes. The second wants a column of its own, which is a
[bulk metadata](https://www.aem.live/docs/bulk-metadata) row or a sheet column, and then a term in the
block's scoring.

## Vehicle and plate lookup in the tire finder

**Live** resolves a vehicle to the tires that fit it, walking year to make to model to trim, and
resolves a licence plate to a vehicle through a registration lookup it buys.

**This build** has the modal, its three tabs, its ARIA tab semantics and its focus trap, all in
[`blocks/perfect-fit`](../blocks/perfect-fit/perfect-fit.js). By Tire Size is real and searches the
published `specs` sheet. By Vehicle answers from a hand-written table of 6 makes and 17 models and
returns a coarse vehicle class rather than a fit. By Plate returns a canned recommendation and reads
neither the plate nor the state.

**Access needed:** a fitment database, and a registration lookup for the plate.

**Shape.** The UI is done, so this is wiring three tabs to a service. The obstacle is not the wiring,
it is that a browser cannot call a service that sends no `access-control-allow-origin` header for this
origin. Live's own fitment endpoint sends none. Two shapes solve it and they trade differently.

A **same-origin proxy** puts the call behind the site's own domain, through the CDN in front of Edge
Delivery. The browser sees one origin, the credential stays server-side, and the answer is always
current. The cost is a piece of infrastructure to run and a request on the critical path of the
interaction, so the modal needs a loading state and an error state it does not need today.

A **build-time export into a sheet** flattens the fitment data into a DA sheet, and the block reads it
the way it already reads `specs`. No new infrastructure, no per-interaction latency, and the whole
cascade works offline of the source. The cost is size and staleness: the full year-make-model-trim
tree for a tire catalogue is large enough that it wants splitting across sheets fetched per step, and
it is only as fresh as the last export.

The cascade already fetches per step, so the second shape fits the existing block better. Pick the
first when fitment changes often enough that a nightly export would be wrong.

The plate is different and has no second shape. A plate resolves to a vehicle through a paid
registration service, and there is no export of it. Wire the field to that service, or leave the tab
out: a tab that returns a canned answer reads as working and is worse than a tab that is absent.

## Reviews, ratings and questions

**Live** embeds Bazaarvoice on product pages: a star rating, a review count, review bodies, and a
question-and-answer section. It also emits the rating into its `Product` structured data.

**This build** renders the star rating and the review count on the listing and the product page from
the `catalog` sheet, and emits `Product` with `aggregateRating` from the same row. The review bodies,
the write-a-review control and the questions are absent. The ratings themselves were reconstructed
from live's rendered star widths, so they are exact to one decimal rather than to live's stored value.

**Access needed:** the Bazaarvoice account, and the per-product identifiers.

**Shape.** A vendor script, and the [delayed phase](https://www.aem.live/developer/keeping-it-100) is
where it goes. `scripts/delayed.js` already does exactly this for the one third party this site
carries, importing a block's loader only on pages that need it:

```js
if (document.querySelector('.widget[data-source]')) {
  import('../blocks/widget/widget.js').then(({ loadWidgetScripts }) => loadWidgetScripts());
}
```

The delayed phase is the right place because a review widget is heavy, is below the fold, and nothing
about the page's first paint depends on it. Loading it earlier moves the site's Largest Contentful
Paint for no reader benefit, which is the whole argument in
[keeping it 100](https://www.aem.live/developer/keeping-it-100).

The per-product identifier belongs in page metadata or in the `catalog` sheet beside the rating, so a
product page carries its own id and the script reads it from the DOM. The container markup is a block
of its own with an empty target element, which the vendor fills. Reserve its height, or the page
shifts when the widget arrives: the reservation costs a little empty space and buys a Cumulative
Layout Shift of zero, which is the trade this site already made on the search results band.

Once real reviews are in, the rating in the `catalog` sheet stops being the source and the sheet column
should go, so two numbers cannot disagree.

## Tag management, analytics and consent

**Live** loads Google Tag Manager on every page. Its container fires 229 tags, pushes ecommerce events
on product pages, and reports into ad and analytics accounts. Live also renders its own cookie-consent
popup.

**This build** has none of it. Edge Delivery's own
[operational telemetry](https://www.aem.live/docs/operational-telemetry) is on, which samples real
user monitoring data and is what the performance work here was measured against.

**Access needed:** live's GTM container, the accounts its tags report into, and a consent platform.

**Shape.** All of it goes in the delayed phase, and the ordering is the part that needs thought.

The container script itself is one import in `scripts/delayed.js`. The events are calls from the
blocks that own the behaviour: a product view from the product page, a finder search from
`perfect-fit`, a filter change from `tire-listing`. Keep the call at the edge of the block rather than
threading an analytics object through it, so the block is testable without a tag manager.

Consent inverts the order. A consent platform runs **before** the tags it gates, so it cannot be
delayed behind them, and its banner is visible so it affects layout. The usual
resolution is a small consent script in the delayed phase that runs first and resolves a promise the
tag loader awaits, with the banner's box reserved so its arrival shifts nothing. Getting this wrong is
visible in two directions: a banner that flashes in late, or tags that fire before consent.

Operational telemetry and a tag manager can both run. They measure different things and neither
replaces the other.

## The social wall

**Live** shows an EmbedSocial wall on the homepage under FROM TEST TRACKS TO STREET SCENES.

**This build** does not have it, and the section is absent rather than empty.

**Access needed:** the EmbedSocial account.

**Shape.** A small embed block with a container element and a delayed-phase script, the same pattern as
the reviews above. It is the least complicated item in this document, and it is only here because the
account is not ours.

## Forms with a receiver

**Live** posts the racer sponsorship form to a Drupal webform. Its other forms are outbound redirects,
to Zendesk for support, to Synchrony for the credit card, and to the rebate portal.

**This build** reproduces the outbound ones as outbound links, which is what live does too. The
sponsorship form is a design shell: 26 inputs and 2 textareas with submit disabled, because there is
nowhere for a submission to go. The newsletter and offer signups are real, embedded from HubSpot
through [`blocks/widget`](../blocks/widget/widget.js).

**Access needed:** a receiver for a submission.

**Shape.** Two forms, and the trade is about who owns the data.

A **block posting to an endpoint** keeps the markup, the validation and the styling in this repo, so
the form matches the site exactly and is testable. The endpoint is a function elsewhere that validates
again, stores, and notifies. Edge Delivery does not run it.

An **embedded external form** hands both the receiver and the form's own markup to a service, which is
how the newsletter works here. There is nothing to run, and the styling is only as close as the service's theming allows, which is why the newsletter form takes a few seconds to appear and cannot be styled to
match the rest of the page.

For a low-volume internal form, embed it. For one on a page whose design matters, build the block and
run the endpoint.

## Video articles

**Live** injects a video player client-side on 48 learn articles, so its delivered HTML carries the
thumbnail and no video URL.

**This build** shipped those 48 as title, thumbnail and blurb, with no player. One hero on
`/my-first-car-my-first-tires` now draws live's play control and opens a video in a dialog, which is
the block half of the answer.

**Access needed:** the video identifiers, or the system that resolves them.

**Shape.** Check first whether the identifiers need access at all. The thumbnail filenames on those articles read
like YouTube ids, so a scripted pass could recover most of them and a
browser-driven pass over live's rendered pages could recover the rest. Whichever way they come, they
go into page metadata as one row per article, and an embed block reads the id from there.

The block itself already exists in two places to copy from, the hero's dialog and
[`blocks/media-gallery`](../blocks/media-gallery/media-gallery.js). Both build a `dialog` holding an
iframe on demand rather than at decoration time, which keeps a third-party frame off a page nobody
clicks. Use the `youtube-nocookie.com` embed host, as those do.

## The product gallery's hidden set

**Live** draws at most six tiles in a product gallery and holds the rest for the modal, 32 assets
across the catalogue.

**This build** shows every authored item as a tile, so the grid runs longer than live's and the modal
pages a shorter set.

**Access needed:** none. This is the one item here that turns out not to be blocked.
Live's hidden assets are in its delivered HTML, on the `src` attribute of its modal element, so a
`curl` reaches all 32. One is a video, carrying its own id.

**Shape.** A content pass to author the assets, and a cap in the block so the grid draws six where the
authored list is longer. The discriminator is position rather than a per-item flag, which is what live
does and what keeps the authoring model simple: an author adds items in order and the block decides
how many the grid shows.

## Product data at request time

**Live** computes a product's data per request from its own systems.

**This build** publishes it: `/products.json` is a DA workbook of four sheets, and the blocks read the
one sheet each needs. An author edits it like a spreadsheet, and 46 products, 1656 size rows and 14
technologies come out of it.

**Access needed:** the product master data, if the catalogue has to track a source of truth
automatically.

**Shape.** This one is a choice rather than a shortfall, and the published sheet is often the better answer: it is fast, it is cacheable, an author can correct it without a deploy, and there is no
runtime dependency to fail. Keep it, and feed it from the source rather than replacing it. A scheduled
export writes the sheets through the [DA source API](https://docs.da.live/) and then previews and
publishes them, which is the same two-step every content change takes here.

Move to request time only for something that is per-request, such as stock or price. Then it
is a fetch from the block, and the page's cached HTML holds a placeholder the block fills.

### The `products` sheet is now self-sufficient for json2html's per-product data

The json2html mapping documented in [docs/json2html-config.md](json2html-config.md) originally
fetched `/products.json?sheet=catalog` as its only per-product data source, and the catalog sheet
did not carry `galleryImages`, `limitedWarrantyMiles`, `videoUrl`, `videoLabel`, `tagline`,
`technology`, or `features` — those live in the `products` sheet, which that mapping never read.

The fix: `products` now carries `path`, `rating`, `reviews`, `promo` and `promoPath` too, each
copied verbatim from the `catalog` sheet's matching column for the same `slug` (the two sheets'
slug sets are identical, confirmed before every write). With `path` in place, json2html's
`pathKey: "path"` lookup works the same way against `/products.json?sheet=products` as it did
against `catalog`. With `rating`/`reviews`/`promo`/`promoPath` copied over as well, every field
`/templates/tire-product.html` needs — the gallery, warranty, video, tagline, technology,
features, and bestFor fields already unique to `products`, plus the promo banner and JSON-LD
`aggregateRating` fields that previously existed only in `catalog` — now arrives from a single
`/products.json?sheet=products` fetch. json2html's `endpoint` can point at `products` exclusively;
no merge logic or second `catalog` read is required.

This is now fully resolved, with no remaining field gap between what the template expects and
what the `products` sheet provides.

## Editorial fields live does not publish

Three smaller gaps share a cause: live holds a field its public pages do not expose.

Card **teaser text** on live's listings comes from a summary field that is not in its delivered HTML,
so this build derives a teaser from the article body. The result reads close and is not the author's
wording. Closing it needs the field, and once it exists it is a column in the query index, which is an
index configuration change rather than code.

Live's **events, news and partner listings** sit behind a service that publishes no feed, so this
build authored a snapshot of each. A snapshot decays: `/events` needed a fix this week to stop listing
finished events. With a feed, these become a sheet an export refreshes, and the block reads it.

Live's **product labels** are a disclosure component, so a label expands to explain itself. This build
renders the same labels as static text. There is no data gap here at all, only an unbuilt component:
a small block with a button, an expandable panel and the explanatory copy, which needs the copy.

## Response headers

**Live** sends `x-content-type-options: nosniff` and `x-frame-options: SAMEORIGIN`.

**This build** sends neither. It does send `content-security-policy` and
`strict-transport-security`.

**Access needed:** the site configuration.

**Shape.** Not in this repo, and that is the finding rather than an omission. The delivery pipeline
allows a fixed set of headers from content: `content-security-policy`,
`content-security-policy-report-only`, the two `access-control` ones, and `link`. A
`<meta http-equiv>` in `head.html` is not a response header and a browser ignores both of these two in
meta form, so putting them there would look like a fix and be none. They belong to the `headers`
object in the site configuration held by the Config Service, which is where this site's index and
sidekick configuration already live. [Custom headers](https://www.aem.live/docs/custom-headers) is the
procedure.

## A production domain

Both `*.aem.page` and `*.aem.live` answer `x-robots-tag: noindex, nofollow` and serve a `robots.txt`
that disallows every user agent. That is right for a demo and it caps the SEO score any audit reports
on these hosts.

A production site puts its own domain and a CDN in front of the same delivery tier, and indexing is
enabled there. [BYO CDN setup](https://www.aem.live/docs/byo-cdn-setup) is the procedure, and
[push invalidation](https://www.aem.live/docs/setup-byo-cdn-push-invalidation) is the part that is easy
to miss: without it, a publish does not clear the CDN and an author's change takes the cache's lifetime
to appear.

The CDN is also where the response headers above are set, and where a same-origin proxy for the fitment
service would live, so these three arrive together.

## Web fonts

**Live** serves the licensed Stag Sans faces from its own theme directory, as four woff files with
`access-control-allow-origin: *` on them.

**This build** points `styles/fonts.css` at those same URLs. `head.html` preloads three of them and
links that stylesheet render-blocking, so the type is on the first paint. That combination took cold
CLS on the article pages to 0, and it is the wrong shape twice over. A render-blocking font stylesheet
and a preload are both what [keeping it 100](https://www.aem.live/developer/keeping-it-100) tells you
not to add. The faces come from an origin this project does not own, which puts a DNS lookup and a TLS
handshake before the Largest Contentful Paint. It also makes the type here depend on live being up.
[docs/architecture.md](architecture.md#the-webfont-on-the-critical-path) has the measurements, and why
the exception was taken.

**Access needed:** the Stag Sans licence and the font files. No other part of this is blocked.

**Shape.** Four steps, and the result is less code than there is today.

Convert the licensed faces to woff2 and commit them under [`fonts/`](../fonts). Repoint the four `src`
URLs in `fonts.css` at `../fonts/`, which is what the boilerplate's own `fonts.css` does with its
Roboto files. Subset each face with a `unicode-range`, again as the boilerplate does. That takes the
third-party origin off the critical path on its own.

Then generate the metric-matched fallback from the real face. The mechanism is already in
`styles/styles.css`, a `Stag Sans Fallback` family declared with `size-adjust`, `ascent-override` and
`descent-override` at each weight over `src: local('Arial')`. Today's ratios were measured with canvas
`measureText` over 70,041 characters of rendered text, because a font this repo cannot open leaves no
other route. A generator reading the file gets the advance widths and the vertical metrics from the
source. With those, `font-display: swap` costs no shift and the swap can land whenever it lands.

Then delete the four lines #570 added to `head.html`: the three preloads and the `fonts.css`
stylesheet link. `loadFonts()` already requests the file in the lazy phase and needs no change to
resume owning it. Confirm CLS is still 0 on the article pages afterwards, because that is the number
the current shape was bought with.

Do not repoint `fonts.css` at a font service instead. That trades one third-party origin for another,
and the guidance above names the second connection rather than the host as the cost.

## Media still on the old host

Images across the content are hotlinked from continentaltire.com rather than stored in DA. Media was
migrated for some pages and not for others, and the PDFs and press-kit archives are still on live's
host entirely.

Closing it is a content operation, not a code change: download each asset, upload it to DA under the
page that uses it, and rewrite the reference. The [DA source API](https://docs.da.live/) takes a binary
upload, and this site already holds media that way, referenced as `media_<hash>` paths. Do it before a
production launch rather than after, because every hotlink is a page that breaks when the old host goes
away.

## Production hardening beyond the gaps

Three things are not gaps against live and still belong on the list before a launch.

**Redirect coverage.** A migration inherits the source CMS's aliases, and an inbound link to one that
was not carried over 404s. This site has 77 rows in its
[redirects sheet](https://www.aem.live/docs/redirects), which covers what was found. A launch wants the
full alias table out of the source system, and a crawl of inbound links to prove it.

**Structured data beyond `Product`.** Product pages emit `Product` with `aggregateRating`. Article
pages emit none, and live emits none either, so it is not a parity gap. It is still the cheapest SEO
work available on a 219-article section.

**The heading levels an author chose.** Authored heading levels do not always follow live's, and a few
pages skip a level. That is an accessibility defect independent of live, and it is fixed in the
documents rather than in CSS.
