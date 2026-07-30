# Parity with continentaltire.com

This is an AEM Edge Delivery Services rebuild of continentaltire.com, served at
<https://main--contitires--cloudadoption.aem.live/>. It is a proof of concept, not
Continental's site.

The document says what the rebuild does the same way as live, what it does differently, and
what it cannot do at all. The third group is the one that needs stating. Some gaps come from
systems that are not visible from outside the live site, so no amount of work here closes them.
Nothing else in the repo separates those from work left undone.

Read on 2026-07-30. Numbers here were derived against the repo, `gh`, or the served page rather
than copied from an issue body, and the command is named where the number carries weight. This
project's own issues have recorded a wrong count on at least nine occasions in seven days, so a
count with no provenance is not evidence.

## What works

**[`/events`](https://main--contitires--cloudadoption.aem.live/events)** is the closest match on the site. Live closes the page with one black band, Social
on the left and News on the right, and the rebuild matches it at 1440, 900 and 375: same
background, 110px column gap, 80/60 padding, titles at 42/48 weight 300 tracked 6 in capitals.
It recorded 100 performance and 100 accessibility on 2026-07-29 in
[#340](https://github.com/cloudadoption/contitires/issues/340).

**[The learn section](https://main--contitires--cloudadoption.aem.live/learn)** runs 219 articles behind a query index, with the hub, its four category
pages and live's EVERYTHING / NEWS / CORPORATE pill row.

**[The tire listing](https://main--contitires--cloudadoption.aem.live/tires)** and its 11 category pages run over a single authored workbook,
`/products.json`: 46 products, 46 catalog rows, 1656 rows of size-level specs. A [product page](https://main--contitires--cloudadoption.aem.live/tires/extremecontact-dws06-plus)
reads its specs band straight out of that sheet.

**[`/experience/conti-crew/straight-pipes`](https://main--contitires--cloudadoption.aem.live/experience/conti-crew/straight-pipes)** was rebuilt from live's markup, down to the
breadcrumb, the two-line hero, the round logo badge, the black crew bar, the quote band with the
orange mark, the dark facts panel and the badged tile row. Its h1 box measures 600x160, which is
live's to the pixel ([#299](https://github.com/cloudadoption/contitires/issues/299)).

**Delivered HTML is five to thirty times lighter.** Live's homepage ships 123,748 bytes of HTML
against 22,418 here; [`/tires`](https://main--contitires--cloudadoption.aem.live/tires) ships 122,039 against 3,886. That is the architecture rather than
a trick: content arrives as semantic HTML and the blocks decorate it in the browser.

**The authoring surface** is the strongest part for an audience watching the method rather than
the pixels. [`/tools/authoring-guide`](https://main--contitires--cloudadoption.aem.live/tools/authoring-guide) is five published pages authored in DA, so the guide is an
example of the thing it describes, and the block library serves 22 samples under
[`/tools/sidekick/blocks/`](https://main--contitires--cloudadoption.aem.live/tools/sidekick/library.json).

## What does not work

**Store search** is not built. Live queries a location service, and [`/store-finder`](https://main--contitires--cloudadoption.aem.live/store-finder) is a
redirect onto `/online-retailers` here
([#264](https://github.com/cloudadoption/contitires/issues/264),
[#281](https://github.com/cloudadoption/contitires/issues/281)).

**[By Vehicle in the tire finder](https://main--contitires--cloudadoption.aem.live/tires)** answers with a vehicle class rather than a fit, from a
hand-written table of 6 makes and 17 models against live's 48 model years and 45 makes
([#307](https://github.com/cloudadoption/contitires/issues/307),
[#308](https://github.com/cloudadoption/contitires/issues/308)). By Plate reads neither the
plate nor the state.

**No analytics and no consent banner.** Live loads Google Tag Manager on every page and renders
its own cookie popup. Neither is here, so the two sites differ in the first screenshot and
nothing about the rebuild's traffic can be measured the way live's is.

**Two pages are missing outright.** [`/racer-tire-program`](https://main--contitires--cloudadoption.aem.live/racer-tire-program) has no form
([#101](https://github.com/cloudadoption/contitires/issues/101)) and
`/my-first-car-my-first-tires` 404s
([#336](https://github.com/cloudadoption/contitires/issues/336)).

**Known rough edges.** Card headings are invisible against the dark section on [`/ev-compatible`](https://main--contitires--cloudadoption.aem.live/ev-compatible)
([#87](https://github.com/cloudadoption/contitires/issues/87)). The product name scrolls sideways
at 375 on [`/tires/contipremiumcontact-2`](https://main--contitires--cloudadoption.aem.live/tires/contipremiumcontact-2)
([#320](https://github.com/cloudadoption/contitires/issues/320)). [`/events`](https://main--contitires--cloudadoption.aem.live/events) stacks six squares
at 375 where live runs a carousel
([#341](https://github.com/cloudadoption/contitires/issues/341)). The [newsletter form](https://main--contitires--cloudadoption.aem.live/newsletter-signup) shell
stands empty about four seconds
([#230](https://github.com/cloudadoption/contitires/issues/230)). Six headings rendered 20px
against live's 30px on the [tire-pressure article](https://main--contitires--cloudadoption.aem.live/learn/how-do-i-check-my-tire-pressure). Fixed by
[#350](https://github.com/cloudadoption/contitires/pull/350): all six now read 30px, measured at 900. The DA block picker fetches
all 22 samples up front and takes about 3.5s to become usable
([#297](https://github.com/cloudadoption/contitires/issues/297)).

## Where each thing stands

Rows where the rebuild simply matches live are not here. Most of the site matches, and listing a
handful of those would say more about what somebody happened to measure than about the site. What
follows is what is not a plain match.

**differs** is a real difference a visitor could see, and work would close it.

**diverges** is a difference we chose. Matching live on these would reproduce a defect live
carries, or fail a bar we are not willing to fail.

**approximated** means we stand in for something we cannot reach, and the stand-in is visible.
Each of these says what the approximation rests on.

**absent** means live has it and we do not have it at all. Unbuilt work, not a wall.

**not knowable from outside** means live resolves it through a system the public site does not
expose, so no amount of work here reproduces it. One row earns it.

In the last column, ✅ is ordinary work: queued, in flight, or already settled and needing
nothing. ⚙️ needs something from inside live that the public site does not hand out, such as an
API, a vendor account or an index configuration.

| Bucket | Item | State | Will it be fixed | Issue |
|---|---|---|---|---|
| Navigation and routing | [Redirects come from a sheet](#redirects-come-from-a-sheet-not-from-server-rules) | differs | ✅ 63 rows to add | [#337](https://github.com/cloudadoption/contitires/issues/337) |
|  | [Live's sports sub-nav is dead on live](#lives-sports-sub-nav-points-at-two-dead-urls) | diverges | ✅ nothing to do | [#252](https://github.com/cloudadoption/contitires/issues/252), [#289](https://github.com/cloudadoption/contitires/issues/289) |
|  | [Year tabs land on our heading ids](#year-tabs-land-on-our-heading-ids-not-lives) | differs | ✅ no owning issue | -- |
|  | [86 absolute links back to live](#86-absolute-links-back-to-live-on-7-pages) | differs | ✅ queued | [#213](https://github.com/cloudadoption/contitires/issues/213) |
|  | [Duplicate addresses, self-rewriting URLs](#duplicate-addresses-and-self-rewriting-category-urls) | differs | ✅ queued | [#332](https://github.com/cloudadoption/contitires/issues/332), [#239](https://github.com/cloudadoption/contitires/issues/239) |
|  | [Header, mega menu and footer](#the-header-mega-menu-and-footer) | differs | ✅ queued | [#167](https://github.com/cloudadoption/contitires/issues/167), [#237](https://github.com/cloudadoption/contitires/issues/237) |
| Product pages | [Product data is a published workbook](#product-data-is-a-published-workbook-not-a-request-time-backend) | approximated | ⚙️ live computes per request | [#241](https://github.com/cloudadoption/contitires/issues/241) |
|  | [Fit by size](#fit-by-size) | differs | ✅ queued | [#243](https://github.com/cloudadoption/contitires/issues/243) |
|  | [Star rating and review count](#star-rating-and-review-count) | absent | ⚙️ the corpus needs the account | [#241](https://github.com/cloudadoption/contitires/issues/241) |
|  | [The specs link points at a page we 404](#the-specs-link-points-at-a-page-we-404) | absent | ✅ drop the link | [#357](https://github.com/cloudadoption/contitires/issues/357) |
| Search | [Search ranking](#search-ranking-rebuilt-against-lives-results-rather-than-its-index) | approximated | ⚙️ needs live's Solr config | -- |
|  | [How many results a query returns](#how-many-results-a-query-returns) | differs | ⚙️ live's exclusions are Solr config | -- |
|  | [Store and dealer lookup](#store-and-dealer-lookup) | absent | ⚙️ needs a dealer database | [#264](https://github.com/cloudadoption/contitires/issues/264), [#281](https://github.com/cloudadoption/contitires/issues/281) |
| Forms and third parties | [Tag management and analytics](#tag-management-and-analytics) | absent | ✅ queued, and a decision | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [What live's tags report into](#what-lives-tags-report-into) | not knowable from outside | ⚙️ needs the ad accounts | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [Cookie consent](#cookie-consent) | absent | ✅ queued | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [Bazaarvoice](#bazaarvoice) | absent | ⚙️ reviews need the account | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [EmbedSocial](#embedsocial) | absent | ✅ queued | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [The newsletter form](#the-newsletter-form) | diverges | ✅ the delay is deliberate | [#230](https://github.com/cloudadoption/contitires/issues/230) |
|  | [The sponsorship form](#the-sponsorship-form) | absent | ⚙️ no receiver for a submission | [#101](https://github.com/cloudadoption/contitires/issues/101) |
|  | [Vehicle and plate lookup](#vehicle-and-plate-lookup) | approximated | ⚙️ waiting on a fitment API | [#308](https://github.com/cloudadoption/contitires/issues/308), [#309](https://github.com/cloudadoption/contitires/issues/309) |
|  | [Real user monitoring, ours only](#real-user-monitoring-ours-only) | diverges | ✅ ours by choice | -- |
| Media and assets | [Web fonts hotlinked from live](#web-fonts-are-hotlinked-from-live) | differs | ⚙️ needs a font licence | -- |
|  | [PDFs and press-kit downloads](#pdfs-and-press-kit-downloads-still-on-the-old-host) | differs | ⚙️ zips need a host | [#213](https://github.com/cloudadoption/contitires/issues/213) |
|  | [The media gallery](#the-media-gallery) | differs | ✅ queued | [#319](https://github.com/cloudadoption/contitires/issues/319), [#326](https://github.com/cloudadoption/contitires/issues/326), [#327](https://github.com/cloudadoption/contitires/issues/327) |
|  | [Leftover originals in DA](#leftover-originals-in-da) | differs | ✅ a delete nobody has proved safe | [#330](https://github.com/cloudadoption/contitires/issues/330) |
|  | [The chevron sprite](#the-chevron-sprite) | approximated | ✅ DA strips the authored span | [#277](https://github.com/cloudadoption/contitires/issues/277) |
|  | [The default share image 404s](#the-default-share-image-404s) | differs | ✅ ship live's file | [#178](https://github.com/cloudadoption/contitires/issues/178) |
| Content and editorial | [The homepage title](#the-homepage-title) | differs | ✅ queued | [#349](https://github.com/cloudadoption/contitires/issues/349) |
|  | [No result count above the pager](#no-result-count-above-the-pager) | absent | ✅ queued | [#348](https://github.com/cloudadoption/contitires/issues/348) |
|  | [Card teaser text](#card-teaser-text) | approximated | ⚙️ live's teaser field is unpublished | -- |
|  | [Listings behind a service, authored as snapshots](#listings-behind-a-service-authored-as-snapshots) | approximated | ⚙️ live publishes no feed | [#256](https://github.com/cloudadoption/contitires/issues/256), [#257](https://github.com/cloudadoption/contitires/issues/257), [#258](https://github.com/cloudadoption/contitires/issues/258), [#259](https://github.com/cloudadoption/contitires/issues/259) |
|  | [The scale of what shipped](#the-scale-of-what-shipped) | counts | ✅ this table is the source | [#362](https://github.com/cloudadoption/contitires/issues/362) |
|  | [Commercial claims and operator identity](#commercial-claims-copyright-and-operator-identity) | diverges | ✅ deliberate | -- |
| Layout and type | [The heading scale](#the-heading-scale) | differs | ✅ global scale shipped, block headings queued | [#351](https://github.com/cloudadoption/contitires/issues/351), [#352](https://github.com/cloudadoption/contitires/issues/352), [#353](https://github.com/cloudadoption/contitires/issues/353), [#354](https://github.com/cloudadoption/contitires/issues/354), [#355](https://github.com/cloudadoption/contitires/issues/355), [#356](https://github.com/cloudadoption/contitires/issues/356) |
|  | [The content container](#the-content-container-64px-wider-than-lives) | differs | ✅ queued, not a local fix | [#219](https://github.com/cloudadoption/contitires/issues/219) |
|  | [Breakpoints](#breakpoints-half-of-them-lives) | differs | ✅ queued | [#219](https://github.com/cloudadoption/contitires/issues/219) |
|  | [The article body shift](#the-article-body-shifts-up-51px-after-first-paint) | differs | ✅ queued, cause not found | [#197](https://github.com/cloudadoption/contitires/issues/197) |
|  | [Prose link underlines](#prose-links-carry-an-underline-live-paints-transparent) | diverges | ✅ WCAG 1.4.1 | [#240](https://github.com/cloudadoption/contitires/issues/240) |
|  | [Superscripts](#superscripts) | diverges | ✅ deliberate | [#238](https://github.com/cloudadoption/contitires/issues/238) |
| Performance and accessibility | [Delivered HTML weight](#delivered-html-weight) | differs | ✅ nothing to do | -- |
|  | [Generated headings skip levels](#generated-headings-skip-levels) | differs | ✅ queued | [#117](https://github.com/cloudadoption/contitires/issues/117) |
|  | [Security headers](#security-headers) | differs | ✅ queued | -- |
|  | [The test suite and repo hygiene](#the-test-suite-and-repo-hygiene) | differs | ✅ queued | [#125](https://github.com/cloudadoption/contitires/issues/125), [#317](https://github.com/cloudadoption/contitires/issues/317) |
|  | [The annotated tire diagram](#the-annotated-tire-diagram) | diverges | ✅ live's version is the defect | [#255](https://github.com/cloudadoption/contitires/issues/255) |
|  | [Carousel autoplay and reduced motion](#carousel-autoplay-and-reduced-motion) | differs | ✅ queued | [#116](https://github.com/cloudadoption/contitires/issues/116) |

## Navigation and routing

### Redirects come from a sheet, not from server rules

**differs.** 63 paths that live serves answer 404 here, and a sheet cannot express a pattern.

Live serves redirects as server rules, so it handles them by shape. Nine `/taxonomy/term/<id>`
paths and three `/node/<id>` paths 301 to their real page, and `/ev-ready` 301s to
`/ev-compatible`.

We serve a redirects sheet at the content root with 14 rows, and every row is an exact literal
source path. The set covers the legacy tire-search paths onto `/tires`, both `Store-finder`
casings onto `/online-retailers`, the partner and crew moves, two absolute redirects back out
to live for the warranty and TCP documents, and `/tires/vancontact-as-ultra` onto
`/vancontact-as-ultra`.

What it costs a visitor: 63 live paths that resolve to 200 on live answer 404 here. None is
reachable from inside our own site, so a reader browsing the site never meets one. They bite an
external link, a bookmark or a search result.

What would close it, and what it cannot. 63 more rows, from [#337](https://github.com/cloudadoption/contitires/issues/337)'s census. What a sheet cannot
do that a rule can is match by shape. It matches an exact path, so the 42 `/tires/<product>/specs`
paths need 42 rows where one pattern covers them, and it is case-sensitive, which is why
`/Store-finder` and `/store-finder` are two rows rather than one.

Two things here read as bugs and are not. `/store-finder` resolving to Online Retailers is a
row working as authored. `/taxonomy/term/139` and `/taxonomy/term/57` 404 on live as well as
here.

### Live's sports sub-nav points at two dead URLs

**diverges.** Two of live's three tabs 404. Ours point at the pages they name.

On live's `/experience/sports` the tab strip links Partners to `/taxonomy/term/57` and Conti
crew to `/taxonomy/term/139`. Both 404 on live: 47,985 and 47,986 bytes, each titled "Page not
found". Only the middle tab reaches a real page.

Ours points all three at `/experience/partners`, `/experience/sports` and
`/experience/conti-crew`, and all three are 200. `blocks/category-tabs/category-tabs.js` marks
the tab matching the current path with `aria-current="page"`, the same semantic live puts on
its working tab.

Nothing should close this. Reproducing live's two dead links would be copying a defect. The row
exists so nobody re-points our tabs at `/taxonomy/term/*`, which we do not serve either. A link
diff against live will flag ours as different, and ours is the one that works. [#252](https://github.com/cloudadoption/contitires/issues/252), [#289](https://github.com/cloudadoption/contitires/issues/289).

### Year tabs land on our heading ids, not live's

**differs.** A shared live URL ending `#year2021` lands at the top of our page.

Live's `/cruisingthecontinentalus` tabs are `href="#year2021"` and `href="#year2020"`, landing
on sections with those ids. Ours point at the pipeline's generated heading ids,
`#the-2021-cruising-the-continental-us-road-trip` and its 2020 twin. Neither `year2021` nor
`year2020` is among the three ids the page holds.

In-page navigation from our own tabs works. What breaks is an inbound link built against live.
Giving the two h2 elements explicit ids in DA and re-pointing the anchors closes it. [#277](https://github.com/cloudadoption/contitires/issues/277).

A related row is a trap rather than a defect. Neither of live's year tabs is marked current
either, and `category-tabs` deliberately marks nothing current in the jump variant, because it
compares an anchor's pathname to `location.pathname` and a fragment never matches one.

### 86 absolute links back to live, on 7 pages

**differs.** 80 pages carried them after the import. Seven still do.

Seven pages hold 86 absolute continentaltire.com links: `/media` 75, technical documents 5,
`/warranty` 2, and one each on `/racer-tire-program`, `/promotionended`, `/promotion` and the
campaign article. The other 320 pages are clean.

The zip and PDF rows under Media and assets cover 84 of the 86. The other two are missing pages
rather than missing links: the campaign hub and the sponsorship form. [#213](https://github.com/cloudadoption/contitires/issues/213).

Four retired tires are a deliberate exception in the same sweep. Live links them to product
pages for tires we no longer sell. We keep the anchor text and drop the `<a>`, so the words stay
and the link does not. The obvious redirect targets were successor products, DWS06 to DWS06 Plus
and TrueContact to TrueContact Tour, which are different tires. Sending a reader to a tire they
did not ask about is worse than a dead end.

### Duplicate addresses and self-rewriting category URLs

**differs.** Ten articles have two addresses and nothing says which is canonical.

13 published paths end in `-0`, and 10 of them have their base twin published as well, with the
same title in 8 of the 10 and identical body length in 6. `blocks/tire-listing/tire-listing.js`
derives facet state from the path and then rewrites the URL, so every category page has a second
address that live never hands out. Live's category URLs stay clean.

What would close it: unpublish or redirect the ten twins, and drop the `replaceState` call where
the path already implies the facet. [#332](https://github.com/cloudadoption/contitires/issues/332), [#239](https://github.com/cloudadoption/contitires/issues/239), [#337](https://github.com/cloudadoption/contitires/issues/337).

### The header, mega menu and footer

**differs.** The header reads smaller than live's and the mega panel reads washed out.

From 1025 up live's logo renders 186x34. Ours is 150px wide. Live's open TIRES panel paints
`#000000` and puts a line icon left of each of the three search entries, a car, a tire
cross-section and a plate. Ours paints `#1d1d1d` and the finder column has no icons, though all
three assets are in the repo.

The footer row gap is 50px on live and 32px here. Between 1080 and 1183 we show three columns
where live shows six, because our container caps at 1264 with 32px padding so six tracks first
fit at 1184. That band is a decision rather than a defect. Matching it means letting the footer
overflow its own container the way live's does, by up to 36px. [#167](https://github.com/cloudadoption/contitires/issues/167), [#237](https://github.com/cloudadoption/contitires/issues/237), [#138](https://github.com/cloudadoption/contitires/issues/138), [#202](https://github.com/cloudadoption/contitires/issues/202).

## Product pages

### Product data is a published workbook, not a request-time backend

**not knowable from outside.** Live computes per request against a system the public site does
not expose. We publish a sheet.

Live's product pages read from a backend. What that backend holds and what it computes at
request time is not visible from outside, and the only evidence of it is what the rendered page
shows.

Our whole catalogue is one authored workbook at `/products.json`. The products sheet holds 46
rows, the catalog sheet 46, and the specs sheet 1656 rows covering 483 distinct sizes. The
listing, its 11 category pages and every product page read from it. A note for anyone querying
it: the default fetch limit is 1000, so an unlimited fetch silently reads 1000 rows and
under-reports.

What it costs a visitor: anything live resolves per request is out of reach here. Rebates,
star ratings, a live store call to action and warranty state all fall in that group, recorded
under [#241](https://github.com/cloudadoption/contitires/issues/241). A sheet is published state, so it is right as of its last publish and cannot be
current in the way a request-time lookup is.

What would close it: nothing from outside, and that is the point of the row. The workbook is
the honest substitute, not a temporary one. What it does buy is that an author edits the
catalogue directly and republishes, with no deployment.

### Fit by size

**differs.** We answer by size from the specs sheet. Live's own by-size URL form could not be
re-derived.

The specs sheet holds 10 rows for `235/40 R 18`, spread across 6 distinct product slugs. Sizes
are written with spaces in that form. `.mossy/research/live-fitment.md` reports "10 products"
for that size, and it is counting rows, not products. Six is the product count. [#243](https://github.com/cloudadoption/contitires/issues/243).

Live's by-size URL could not be reconstructed. `/tire-search/by-size/235-40-18` 404s, and live's
`/tire-search` page exposes only `/tire-search/by-vehicle` links, so the by-size entry point is
either behind a form post or a path shape the public pages do not link. That one is unresolved
rather than settled, and what would settle it is finding a live page that links a by-size
result.

### Star rating and review count

**absent.** Live shows a rating on every product page. We show none, and we already hold a
number we do not render.

Live loads Bazaarvoice site-wide. Its product page carries `data-bv-product-id` and its
structured data reads `ratingValue` 4.60 with `reviewCount` 1043 on
`/tires/extremecontact-dws06-plus`. That aggregate is server-rendered, so it is readable from
outside.

Our catalog sheet carries a frozen rating and review count for all 46 rows, and
`blocks/tire-rating` exists to render one. The delivered HTML carries no rating markup, so
whether a visitor sees a band depends on what that block builds in the browser, and curl cannot
settle it. What is settled is that any number we print is a snapshot of the sheet. It was
already one review behind live on 2026-07-29.

What it costs a visitor: no rating and no review count on a product page, which is a real
signal on a tire.

What would close it, and what would not. Rendering the sheet's frozen number is a block change
and nothing stops it, but the number would be stale the day after it was written, because live's
moves as reviews arrive. The review corpus itself, the moderation state and the Bazaarvoice
property configuration are in Continental's account and no scrape reaches them. So the visible
number is unbuilt work and the living number behind it is not.

### The specs link points at a page we 404

**absent.** Live gives each product its own specs page. We render specs inline and still link
to the page.

Live serves 42 per-product specs pages. `/tires/extremecontact-dws06-plus/specs` answers 200 on
live and 404 here, checked on 2026-07-30.

Our product pages render the size specs inside the page, read from the workbook, which is a
reasonable choice on its own. The problem is the link. The specs band ends with a "View all
sizes and specs" control that `blocks/tire-specs` builds in the browser, pointing at the path we
do not serve.

What it costs a visitor: a dead link at the foot of the specs band on 45 product pages, and it
is the only dead link our own pages emit. A bookmark or a search result on a live specs URL
lands on our 404 too.

What would close it: either drop the link, since the specs are already on the page, or add 42
redirect rows onto the product pages. Dropping it is the smaller change and loses nothing,
because the content the link promises is already above it.
Filed as
[#357](https://github.com/cloudadoption/contitires/issues/357); [#242](https://github.com/cloudadoption/contitires/issues/242) covered the specs section and closed without following the link.

## Search

### Search ranking, rebuilt against live's results rather than its index

**approximated.** Live runs Solr with stemming and field weights. We run a weighted scan over
the published index, and the semantics differ on purpose.

Live runs Drupal Search API over Solr. Field weighting, stemming and index exclusions are
configured in an admin nobody outside the site can read, and the index itself is not exposed.
What is visible from outside is the result list live returns for a given query, which is what
the rebuild was measured against.

Our search is `scripts/search.js` over `/query-index.json`. The weights are `title: 6`,
`description: 2`, `body: 1`, with `TITLE_COVERAGE` at 0.5 and 10 results a page. `blocks/search`
mirrors live's URL shape: the same `?keywords=` parameter, the same zero-based `&page=`, ten
per page, and a nine-wide pager window.

One semantic difference is deliberate and it is the one to know about. A row that does not hold
every query term scores 0 here, which is AND. `.mossy/research/live-search-ranking.md` recorded
live as OR over stemmed terms. The build chose AND anyway, because AND reproduced live's own
result totals more closely than OR did on the golden queries. So the mechanism disagrees with
live while the output agrees with it, and a query that exercises the difference will diverge.

What it costs a visitor: on the recorded golden queries, close to nothing. Off them, a
multi-word query where live's stemmer would match a partial row returns fewer results here.
Neither stemming nor live's exclusion list is reproduced.

What would close it: nothing available from outside. Closing it needs live's Solr schema, its
field weights and its exclusion list, and those are configuration in an admin, not something
the public site emits. The honest ceiling is what it already does, which is match live's
totals on a measured query set and say so.

### How many results a query returns

**differs.** We return more than live on the same query, including pages live keeps out.

Six queries, live first: `tire` 215 against 300, `dealer` 48 against 89, `all season` 47 against
69, `winter tires` 35 against 46, `warranty` 20 against 66, and `ev` 0 against 9.

Live excludes pages from its index and the rule is not visible. `/privacy` holds the word
privacy 22 times and never appears in live's results. On `ev` live returns a "No results" page
and we answer with 9, `/ev-compatible` first, which is the one case where our answer is the more
useful of the two.

What would close it: nothing. The exclusion list is Solr index configuration on live's side.
Live's `ev` behaviour looks like a minimum term length or a stopword rule, and reproducing it
would mean copying a defect on purpose.

### Store and dealer lookup

**absent.** Live has a store finder. We have a page explaining that we do not.

Live's `/Store-finder` is a real page, 200 at 52,125 bytes. Every "Find a store" button on live
points at it. The lookup needs a dealer database and a location service, and neither is
published.

Ours redirects both casings onto `/online-retailers`, two of the 14 rows. That page's Store Near
You tab reads "Store search is not part of this site" and says why. The Online Retailers tab
carries the three retailer tiles, which is what live's own `/online-retailers` holds.

What it costs a visitor: they cannot find a nearby dealer, and 46 product pages carry a "Find a
store" button that leads to that explanation.

What would close it: nothing without a dealer database and a geocoder. The earlier stand-in was
worse than the gap. It printed a real third-party dealer, with a real street address and phone
number, as the store 3.29 miles from every reader. That has been removed, and it is the clearest
case on the site of a plausible stand-in being more harmful than an honest blank.

## Forms and third parties

### Tag management and analytics

**absent.** Live loads Google Tag Manager on every page. We load no tag manager at all.

Live ships an inline GTM bootstrap in the head, container `GTM-NGJQFVS`, plus the noscript
iframe fallback. It is on all six pages fetched on 2026-07-30: `/`, `/tires`, `/learn`, an
article, `/newsletter-signup` and `/tires/4x4contact`. The container itself is 580,737 bytes.

Reading the container gives the tag list. Version 125, 229 tag entries. By GTM function type
that is 39 Floodlight counters, 33 GA4 event tags, 28 Bing UET, 12 Google Ads conversions, 15
custom HTML, 4 Google tag and 1 Crazy Egg, with 4 paused. The GA4 measurement id is
`G-EVDE8JJV6V`. Hosts named in the tag definitions include Facebook, TikTok, Twitter, Reddit,
HubSpot, Crazy Egg, Cluep, InMarket, Flowcode and Turn. The container also declares dataLayer
variables named `zipCode`, `vehicle`, `year`, `model`, `trim`, `width` and `aspect`, which are
the tire finder inputs.

Our side loads none of it. Zero googletagmanager references on the same six paths. Each of our
pages ships two script tags, both same-origin, `/scripts/aem.js` and `/scripts/scripts.js`.
`scripts/delayed.js` is eight lines and imports the widget block only when a page carries a
`.widget[data-source]`, which is 3 pages of the 327.

What it costs a visitor: nothing they see. What it costs the demo is that any claim of
measurement parity is false. If someone asks whether the rebuild tracks what live tracks, the
answer is that it tracks none of it, and this row is where that is written down.

What would close it: add the GTM bootstrap to `scripts/delayed.js` with the same container id.
The delayed phase is the intended place for it in Edge Delivery, so it would fire about three
seconds after the page rather than in the head, and that changes the numbers GTM reports
because some sessions end before the tag fires. Loading the same container pulls the whole
229-tag set with it, which is a decision rather than a task.

### What live's tags report into

**not knowable from outside.** The container is readable. The accounts behind it are not.

The measurement id `G-EVDE8JJV6V` and the other tag ids are visible in the container. The GA4
property configuration, the audience definitions, the conversion set, any server-side GTM
endpoint and whether consent mode gates any of it are inside Google's and Microsoft's consoles.

This row exists to split the martech gap in half honestly. Everything up to and including the
tag list is knowable from outside, and it is covered by the row above as unbuilt work. What
sits behind the tag ids is the part no amount of work here reaches.

### Cookie consent

**absent.** Live renders a consent popup in the HTML of every page. We render none.

Live's is `<con-cookie-popup class="cookie-popup" role="region" aria-label="Accept Cookies">`,
server-rendered in the body of all six pages fetched. It holds the line "Continental uses
cookies (like most sites) to continually improve your experience", an "I Agree" button, a
"Learn More" link to `/privacy` and a close button. It is Continental's own web component
rather than a vendor CMP. OneTrust, Optanon, CookieLaw and TrustArc return zero matches across
live's pages. The GTM bootstrap is in the head above it and the markup does not gate it.

Our delivered HTML contains the string "cookie" zero times on any of the six paths.

What it costs a visitor: this one is visible. Live opens with a consent bar and the demo does
not, so the first screenshot of each side differs by that bar. It also means the demo takes no
position on consent, which a US automotive brand audience will ask about.

What would close it: a small block rendering the same text and buttons, loaded in the delayed
phase alongside whatever it is meant to gate. The wording and the `/privacy` link are both
readable from live.

### Bazaarvoice

**absent.** Live loads `bv.js` site-wide, including on pages with no reviews. We load it nowhere.

The script is `apps.bazaarvoice.com/deployments/continental_tire/main_site/production/en_US/bv.js`,
92,819 bytes, present once on all six pages fetched, including `/learn` and
`/newsletter-signup` where there is no review content to render.

We make no request to any Bazaarvoice host. The rating band in `blocks/tire-rating` renders an
aggregate score from our own products data instead.

What it costs a visitor: nothing on the pages with no reviews. On product pages the visible
consequence is the missing review bodies, which is its own gap. What this row adds is that live
pays for the loader site-wide and we do not. Getting review bodies out of Bazaarvoice needs the
account, not the script tag.

### EmbedSocial

**absent.** Live injects a hashtag wall on the homepage and on `straight-pipes`. We carry neither.

An inline snippet appends `embedsocial.com/cdn/ht.js` under the id `EmbedSocialHashtagScript`,
5,251 bytes. It is on live's homepage and on none of the other four content pages fetched.
`/experience/conti-crew/straight-pipes` carries
`<div class="embedsocial-hashtag" data-ref="20bed16a9b1d19f5a7c0cb2dc6522b18e59e208f">` and the
same loader.

What it costs a visitor: live shows a social wall where the demo shows nothing. There is a
caveat that cuts the other way. [#251](https://github.com/cloudadoption/contitires/issues/251) and [#299](https://github.com/cloudadoption/contitires/issues/299) record that live's own embed fails and leaves a
blank band, and if that still holds the cost is zero and we are the tighter of the two. That
could not be settled here, because deciding whether a band renders empty needs a browser and
this pass was curl only. Loading live's `straight-pipes` and measuring the height of
`.embedsocial-hashtag` settles it.

What would close it: an embed block holding the container div, loaded in the delayed phase. The
script URL and the loader pattern are both readable from live's source. What no code closes is
that the feed renders on the vendor's terms, in the vendor's phase, with the vendor's layout.

### The newsletter form

**diverges on the timing.** Both sides embed the same HubSpot form and the same portal.

[#234](https://github.com/cloudadoption/contitires/issues/234)'s seed list says forms here have no receiver. For this one the seed is wrong. Live's
`/newsletter-signup` carries no `<form>` of its own and loads
`js.hsforms.net/forms/embed/48908421.js`. Ours carries no `<form>` either, and
`widgets/hubspot/newsletter.js` appends a script with the identical `src` and the same portal
id, 48908421. A submission reaches the same HubSpot portal from either site.

Two differences sit underneath that. Live loads the embed inline in the body, so its form is
there on arrival. Ours is an authored link that the widget block turns into an embed in the
delayed phase, so the reserved shell stands empty for about four seconds against live's 1.3.
That was measured in [#230](https://github.com/cloudadoption/contitires/issues/230), and both the delayed load and the reserved shell were kept on
purpose after the eager alternative was tried and rejected. Live also runs HubSpot tracking via
`js.hs-scripts.com` from inside its GTM container. We have the form without the tracking.

Three of our 327 published pages carry a widget link: `/newsletter-signup`, `/promotion` and
`/offers`.

### The sponsorship form

**absent.** Live posts a 26-field Drupal webform. We serve the page with no form at all.

Live's `/racer-tire-program` is 71,785 bytes and carries a
`webform-submission-sponsorships-form` with 26 `<input>` elements covering name, contact,
address and the series and stage dropdowns. It posts back to live's own Drupal.

The same path here is 200 and 2,796 bytes with the same title. It carries zero forms and zero
inputs. The only `<form>` anywhere in our blocks is the header search, a GET to `/search`.

What it costs a visitor: a racer cannot apply. The page explains the programme and then stops.

What would close it, and what would not. The UI is buildable and [#101](https://github.com/cloudadoption/contitires/issues/101) is open for it. The
submission is not, because a webform needs a receiver and live's is a Drupal endpoint on a host
we do not own. A form that accepted a submission and dropped it would be worse than no form.

### Vehicle and plate lookup

**approximated.** A stub on sample data, waiting on an API. Live's answer is not readable from
outside.

The two halves of this split cleanly and it is worth keeping them apart. Live's vehicle *tree*
is public: `continentaltire.com/api/tire-search/by-vehicle` is an unauthenticated JSON endpoint
that walks level by level. Curled on 2026-07-30 it returns 48 model years, 2027 down to 1980.
`?year=2022` returns 45 makes. Adding `&make=honda` returns 9 models. What that endpoint does
not return is the *fitment answer*, which tires fit that vehicle, and that is the part live
resolves against a licensed data set we cannot see.

Ours is a hand-written table of 6 makes and 17 models standing in for the tree, and a season
filter standing in for the fit. By Plate collects a plate and a state and uses neither. It
returns every product whose season reads all-season or all-weather, 28 of the 46 in the
catalogue, and `blocks/perfect-fit/perfect-fit.js` says so in a comment.

What it costs a visitor: a reader whose car is outside the 17 models cannot use the tab. A
reader who types a plate gets a season filter rather than a fit.
[#307](https://github.com/cloudadoption/contitires/issues/307) already made the labels honest,
so nobody is told the plate was read.

Where this is left, and why. The tree could be widened from live's public endpoint, and that
would make the dropdowns look right while the answer underneath stayed a stand-in. That is a
worse position than the current one, because it hides the stub behind a convincing front. It
stays as it is until there is a real fitment API to hook up, and the registration lookup behind
By Plate needs one too. [#308](https://github.com/cloudadoption/contitires/issues/308),
[#309](https://github.com/cloudadoption/contitires/issues/309).

### Real user monitoring, ours only

**diverges.** We sample real user data. Live does not, and measures through GTM instead.

Live has no equivalent. Its measurement all runs through GTM.

`scripts/aem.js` ships `sampleRUM`. The default weight is 100, so roughly 1 page view in 100 is
selected, and a selected view POSTs to `https://ot.aem.live/.rum/100` and then pulls the
rum-enhancer module from the same host. The rate is overridable per request with `?rum=on`.
Nothing in our `scripts.js` overrides the defaults.

What it costs a visitor: nothing. It matters for the demo as the honest answer to "so you have
no analytics at all". We have Core Web Vitals and checkpoint data from a 1% sample, not
marketing analytics, and it goes to Adobe's collector rather than to Continental's.

## Media and assets

### Web fonts are hotlinked from live

**differs, and it is the one dependency on live that a production build has to remove.**

Live serves Stag Sans from its own theme directory with `access-control-allow-origin: *`.

Our `styles/fonts.css` declares five `@font-face` rules pointing at four woff files on
continentaltire.com: StagSans-Thin, StagSans-Light, StagSans-BookItalic and StagSans-Book, the
last used twice. That is verified on the deployed copy, not only in the repo, and it is the
only remaining hotlink of its kind.

What it costs a visitor: every page depends on continentaltire.com being up for its typeface.
If live goes away or tightens CORS, the site falls back to Arial. The second cost is not
technical. The fonts are licensed, and this is a proof of concept rather than a licence. The
file's own comment says a production build must license and self-host them.

What would close it: a font licence and four files in the repo. Nothing technical stands in the
way.

### PDFs and press-kit downloads still on the old host

**differs for the PDFs, approximated for the zips.**

Nine PDF links are absolute to continentaltire.com: five on
`/customer-support/technical-documents`, two on `/warranty`, one on `/promotion` and one on
`/promotionended`. Our own host serves PDFs already, so this is an asset move rather than a
link rewrite, which is why the [#213](https://github.com/cloudadoption/contitires/issues/213) sweep left them. If the old site goes away, those nine
break.

`/media` is a different problem. Live's page is 82,300 bytes and holds 74 `.zip` targets. Ours
carries the same title and 75 absolute links back to live, the 74 zips plus one download path.
The page renders and the buttons work, and the reader leaves our host on click. The EDS content
bus does not serve zips, so closing it means either zip support, or re-cutting each pack into a
format the bus does serve, or a third host. None of those is a code change in this repo. [#213](https://github.com/cloudadoption/contitires/issues/213).

### The media gallery

**differs.** Live keeps a hidden set the modal can reach. We have no third state.

Live's product grid shows 2 to 6 tiles and its modal pages up to 11, keeping the rest as
`media--hidden-media-gallery-item` at height 0. That happens on 10 of the 46 product pages, 32
items in all. Live's inline galleries sit inside the article reading column, 559 wide at x=250
at 1440. Below 769 live draws a "1 of 6" counter with arrows and a `+` expand badge.

`blocks/media-gallery/media-gallery.js` reads every authored row into one items array, so one
row is one tile and one slide. There is no hidden state. Our inline gallery is 750 wide at
x=155 at 1440, so it breaks out of the reading column and starts further left than the copy
above it. No counter and no expand badge below 769.

What it costs a visitor: on those 10 product pages our modal pages 2 to 6 slides where live
pages 4 to 11, so images live shows cannot be reached here.

What would close it: a modal-only row state in the block, a width tied to the reading column, a
counter and badge below 769, and a carousel for the `/events` Social row at 375. [#319](https://github.com/cloudadoption/contitires/issues/319), [#326](https://github.com/cloudadoption/contitires/issues/326),
[#327](https://github.com/cloudadoption/contitires/issues/327), [#341](https://github.com/cloudadoption/contitires/issues/341), [#199](https://github.com/cloudadoption/contitires/issues/199).

### Leftover originals in DA

**differs.** 509.5MB of originals sit in DA that no page points at.

Product viewer stills are in DA and served from our host. A sample of 12 product pages carries 2
to 6 `<picture>` elements each, 53 in total, all same-origin.

Separately, DA holds 98 original images under `/media/original/`, 509.5MB, that no page
references. They are there because the pipeline refused them. Six run 21 to 41MB and preview
answered `AEM_BACKEND_DOC_IMAGE_TOO_LARGE`. Nothing renders slower for them and no visitor pays
for them. [#330](https://github.com/cloudadoption/contitires/issues/330) keeps the delete open, on the grounds that it is not reversible except by
fetching them from live again, and that proving a media path is unreferenced across DA, the code
bus and the sheets has not been done.

### The chevron sprite

**approximated.** Live uses an SVG sprite reference. We inline the same glyph as a data URI.

Live's year tabs wrap an `svg` with a `use href` into its theme sprite, marked `aria-hidden`.

`blocks/category-tabs/category-tabs.css` draws it as `content: ''` with a
`data:image/svg+xml` background, viewBox `0 0 12 6`, stroked in live's own `#C27E00`. The CSS
comment records why: DA's edit canvas strips an empty authored span, so an icon that depends on
one does not survive an author save, and this approach needs no JavaScript to appear.

What it costs a visitor: nothing they see. The glyph cannot be recoloured per instance and does
not pick up icon theming. It carries live's colour rather than our contrast token, which the
comment justifies by the icon being decorative and `aria-hidden` on live too. [#277](https://github.com/cloudadoption/contitires/issues/277).

### The default share image 404s

**differs.** 26 pages name an `og:image` that does not exist.

Live serves `Continental_Logo_Social.jpg` as the fallback `og:image`, 200 at 46,926 bytes.

Every affected page here names
`https://main--contitires--cloudadoption.aem.live/default-meta-image.png?width=1200&format=pjpg&optimize=medium`.
Both the bare path and the query-string form answer 404, and the repo tracks no file by that
name.

What it costs a visitor: those 26 pages have no preview image when the link is shared on social
or pasted into a chat. Live shows the Continental logo card in the same place.

What would close it: ship live's file unchanged at `/default-meta-image.png`.
[#178](https://github.com/cloudadoption/contitires/issues/178) already ruled how to decide it:
we do not choose what the site claims when shared, we copy what live claims.

## Content and editorial

### The homepage title

**differs.** It is the only page found where our `<title>` is not live's.

`/tires`, `/events`, `/learn`, `/dealers`, `/offers` and `/ev-compatible` carry titles identical
to live's. The homepage does not. Live heads it "Truck Tires, SUV Tires, Commercial Tires & More
| Continental Tire" and ours reads "Continental Tire | The Smart Choice In Tires". It is the
only page found where the two differ, and it is filed post-release as [#349](https://github.com/cloudadoption/contitires/issues/349).

The homepage meta description matches live byte for byte, including live's own typo, "For that
past 100+ years". That is deliberate. The rule on this project is to reproduce live's copy
rather than improve it.

Live truncates some of its own descriptions and we reproduce that too. Live's description on
`/learn/150-years-sustainability` ends "...and has since.." with the stray pair of dots.
`/newsletter-signup` carries zero meta description tags on live, and zero here.

### No result count above the pager

**absent.** Live prints "1-10 of 148 results". We print nothing.

Live's learn listing prints a count line above its pager. Ours has no count at all, so a reader
cannot see how many articles exist or how far through the list they are.

A related surplus sits next to it. Our Everything view shows 150 articles against live's 148,
because our News listing holds two live does not list. Nothing is missing, there is surplus, and
a reader can reach two articles from the listing here that live does not offer.

Live also swaps its three filter pills for a select below its breakpoint. We keep three pills at
375. Both reach the same three destinations.

### Card teaser text

**approximated.** Live's teaser is a field we cannot read. Our derived excerpt matches it on 141
of 145 articles.

Live stores a teaser as its own field. We derive an excerpt from the article body. On 145
articles the two agree on 141 and read differently on 4.

What would close it: nothing from outside, since the field is not published anywhere the public
site exposes. Four cards reading differently out of 145 is the measured cost.

A neighbouring row is deliberate. Thirteen meta descriptions stop at a dateline abbreviation, so
those pages tell a search engine their content is "Fort Mill, S.C.". Live's are cut the same
way, so it stays. Cards are unaffected, because a card renders the excerpt rather than the
description.

### Listings behind a service, authored as snapshots

**approximated.** Live reads six of its lists from a content service. We authored what it listed
on one day.

Live builds `/events`, `/experience/soccer` and the four video-series pages `/forwhatyoudo`,
`/cruisingthecontinentalus`, `/lightscameratraction` and `/emilytalkstires` from a service, and
pages the tail of each behind a Load more. `/events` puts a filter panel beside its list.

There is no backend here, so the lists are authored content, read off live on 2026-07-29 in
live's order with live's own titles, links and posters. Counted on the published pages on
2026-07-30: 30 event rows, 43 soccer cards across four sections, and 49 episodes across the four
series pages. The re-read is scripted rather than remembered, in `.mossy/parity/258/author.py`,
`.mossy/parity/259-260/soccer.py` and `.mossy/parity/256-257/episodes.py`, each of which walks
live's pager and writes the rows back.

The interaction on top of the list needed no backend, so it is built rather than approximated.
`blocks/events` derives its filter from the authored rows: one Event type box per type present,
one Event Date box per month. Boxes inside a fieldset are OR and the two fieldsets are AND, which
is what live's own result counts show. An author adding an event adds its type and its month to
the panel. `blocks/media-gallery` renders the cards and opens each video on a modal. What live
pages behind a Load more stands on the page here.

What it costs a visitor: nothing on the day the snapshot was taken, and a widening drift after
it. Live adds an event or an episode and these pages do not, until an author adds it too.

What would close it: a feed. Nothing live publishes exposes these lists as data, so the choice is
an editorial routine that re-runs the scripts, or a real source behind the block. The block reads
authored rows either way, so neither is a rewrite. [#256](https://github.com/cloudadoption/contitires/issues/256), [#257](https://github.com/cloudadoption/contitires/issues/257),
[#258](https://github.com/cloudadoption/contitires/issues/258), [#259](https://github.com/cloudadoption/contitires/issues/259).

### The scale of what shipped

Numbers a reader will want, each with where it came from. This table is the source for
them. The README takes one, the page count, and links here for the rest.

| Thing | Count | Where the number comes from |
|---|---:|---|
| Pages published | 327 | `/query-index.json`, `total` and row count agree |
| Learn articles | 219 | `/learn/query-index.json`, `total` |
| Products | 46 | `/products.json`, products sheet and catalog sheet agree |
| Size-level spec rows | 1656 | `/products.json`, specs sheet, 483 distinct sizes |
| Redirect rows | 14 | the redirects sheet |
| Block library samples | 22 | `/tools/sidekick/library.json`, `total` |
| Block directories | 29 | `blocks/` |
| Test files | 72 | `find -name '*.test.js'` |
| Commits | 129 | `git log origin/main`, 2026-07-24 to 2026-07-30 |
| Issues closed | 161 | `gh issue list --state closed` |
| Issues open | 79 | `gh issue list --state open`, ordered in [#359](https://github.com/cloudadoption/contitires/issues/359) |
| Shipped for the 2026-07-30 checkpoint | 32 | [#302](https://github.com/cloudadoption/contitires/issues/302), closed, the record of what shipped |

The query-index total is lower than the DA page count because the index excludes the block
library and the authoring guide. A page has to be published to enter the index at all, so
preview-only pages are invisible to every list view on the site.

### Commercial claims, copyright and operator identity

**diverges, and deliberately.** This site may not make a commercial claim, assert
Continental's copyright, or imply Continental operates it. Where matching live would do any
of those, it does not match live. Reproducing live's wording in these places is the defect
rather than the fix, so a diff against live flags all of them correctly and none of them is
a parity gap.

Four places.

**The footer, on all 327 pages.** Live's copyright line is gone. Two paragraphs stand in its
place: one attributing Continental's content, images and trademarks to Continental, one
stating that this is an Adobe engineering proof of concept, not operated by, affiliated with
or endorsed by Continental.

**The homepage hero.** The eyebrow reads `An Adobe engineering proof of concept` where live
reads `Welcome to`, and the paragraph under the h1 is a disclaimer where live carries a
rebate offer. The h1 itself is unchanged and still matches live.

**The promo bar, at the top of every page.** Live promises a rebate on a set of tires.
Ours carries its own copy instead, and that copy is deliberately not live's.

**Any place a commercial claim was removed.** Several pages still carry live's rebate copy,
and if they change, that change belongs here.

#### The promo bar carries its own copy on every page

The shared fragment was rewritten and published on 2026-07-30, so the bar at the top of every
page now carries this site's own copy rather than live's offer. The homepage had already been
done inline and the fragment was brought into line with it. Checked against the single rule on
the published host: no commercial claim, no assertion of Continental's copyright, no implication
Continental operates the site.

Two details of that change are deliberate and are not defects. The fragment's heading stays one
level below the homepage's, because the bar is injected into pages that have their own heading
hierarchy. Its noindex metadata is untouched.

Three campaign pages keep live's rebate copy. That is a decision, not outstanding work: Ben
ruled on 2026-07-30 to leave `/promotion`, `/promotionended` and `/offers` alone.

The single rule asks one thing. Does the site read as a real offer, assert Continental's
copyright, or imply Continental operates it? Site-level disclosure is what answers it. The
footer's proof-of-concept paragraph is on all 327 pages, and this bar is at the top of every
page. With those in place, live's offer copy inside a campaign page is reproduced surface. It
is not an offer this site makes.

That is also why the bar could not keep live's offer while those three pages can. The bar is
the disclosure, so it cannot advertise the thing it discloses.

**The values inside these zones are not quoted here on purpose.** The copy is Ben's, it
changes in wording, figures and link targets, and none of it derives from live, so a figure
recorded here would be stale by the time it was read. Check a zone against the single rule
and nothing else.

## Layout and type

### The heading scale

**differs.** The global scale now matches live. What still differs is block-prefixed
headings, which carry their own sizes.

Live declares three sizes and moves one of them. h1 is 42px on 48 at weight 300, with an
override to 30px on 36 under `max-width: 1024`. h2 is 30px on 38 with no media override. h3
is 24px on 32 with no override. Live reads 30/30/24 up to 1024 and 42/30/24 from 1025. The
product title is not an exception to that scale, it is sized by class: live's rule is
`h2, .as-h2, .tire-page__title { font-size: 30px }`, so `/tires/extremecontact-sport-02`
heads at 30px at 1440 while its specs band h2 reads 42px from a block prefix.

The deployed `styles/styles.css` now sets xxl 30, xl 30, l 24 at base and xxl 42 from
1025, read off aem.live. h1 maps to xxl, h2 to xl, h3 to l, so we read 30/30/24 below 1025
and 42/30/24 from it, which is live's scale and live's breakpoint. Shipped by
[#350](https://github.com/cloudadoption/contitires/pull/350) on 2026-07-30.

Six block-level divergences remain and are the open work here: the product title takes 42px
above 1024 where live holds 30 ([#351](https://github.com/cloudadoption/contitires/issues/351)),
the specs band lacks live's 32 / 30 / 42 ([#352](https://github.com/cloudadoption/contitires/issues/352)),
article subheads render at weight 300 against live's 400 ([#353](https://github.com/cloudadoption/contitires/issues/353)),
`/experience/partners` prints a heading live does not have ([#354](https://github.com/cloudadoption/contitires/issues/354)),
four `/media` headings are authored h3 where live uses h2 ([#356](https://github.com/cloudadoption/contitires/issues/356)),
and authored heading levels have no owning issue since #117 covers generated DOM only
([#355](https://github.com/cloudadoption/contitires/issues/355)).

The article template runs the other way. `styles/article.css` pins the default-content h2
and h3 to 20px at every width with no override in its 769 block, so the six h2 on
`/learn/how-do-i-check-my-tire-pressure` read 20px where live's six read 30px above 769.
Live pins 20px only under `max-width: 768`.

What it costs a visitor: every heading in default content is the wrong size. At 1440 a
reader gets 42px where live gives 30 on the product title and on `/forwhatyoudo`'s intro
sentence, and 20px where live gives 30 on all six subheads of the tire-pressure article.
Live's page hierarchy inverts on the product page: live heads the page smaller than the band
below it, we do the reverse.

What would close it: a fix is in progress on a local branch, red test first, not pushed and
no PR, so nothing is deployed. There is no number for the fixed state. What has to hold is
that a heading can take the level its structure requires without taking a size live does not
use, in both contexts.

Read against the deployed `styles.css` lines 144-149, 168-173 and 260-265, and against live's
`themes/custom/nextcontinental/dist/css/styles.css`. [#185](https://github.com/cloudadoption/contitires/issues/185), [#181](https://github.com/cloudadoption/contitires/issues/181), [#184](https://github.com/cloudadoption/contitires/issues/184).

One correction to the record. [#185](https://github.com/cloudadoption/contitires/issues/185) says two pages skip a heading level.
[`/vancontact-as-ultra`](https://main--contitires--cloudadoption.aem.live/vancontact-as-ultra)
gives h1 then `h3#warranty` and is a real skip; live carries no heading at all there, just a
plain link. `/events` gives h1 then 32 h2 and no h3, so it no longer skips. Its heading was
promoted in the DA write that shipped with PR [#342](https://github.com/cloudadoption/contitires/issues/342).

### The content container, 64px wider than live's

**differs.** We give 1200 of content inside 32 gutters. Live gives 1136 inside 16. Every band
inherits it.

Live's `.container` is `margin: 0 auto; max-width: 73rem; width: 100%; padding: 0 1rem`, and
a global `* { box-sizing: border-box }` means the 73rem includes the padding. That is 1168
outer and 1136 of content. Below 769 the padding goes to 1.25rem. At a 1440 viewport live's
content starts at x=152.

Ours is `main > .section > div { max-width: 1200px; margin: auto; padding: 0 24px }`, going to
32px from 900. There is no global `box-sizing` rule here, so the 1200 is the content box and
the padding sits outside it: 1264 outer from 900. At 1440 our content starts at x=120.

What it costs a visitor: anything the container measures runs wide, and each surface has to be
corrected on its own. Four pairs, all re-derived from the CSS on both sides rather than read
from an issue. The `/events` Social tiles are 189 at 1440 and 121 at 900 against live's 177
and 127. The product-highlights video card is 387 against live's 365. The events results
column is 885 against live's 821. Side padding gives 24 and 32 where live gives 16 and 20, so
a page reads 4 to 16px narrower a side than live at every width.

What would close it, and the trap. This is not a local fix. Giving one band live's measure
moves its left edge to x=152 while the section above it still starts at x=120, so a
single-surface correction misaligns the page it means to fix. The container has to change
globally, and the five surfaces that already hard-code live's 1136 have to come out in the
same pass or they double up. Those five are `styles/article.css:212`,
`blocks/cards/cards.css:220` and `:766`, `blocks/crew/crew.css:139` and
`blocks/hero/hero.css:135`.

[#219](https://github.com/cloudadoption/contitires/issues/219), [#340](https://github.com/cloudadoption/contitires/issues/340), [#244](https://github.com/cloudadoption/contitires/issues/244), [#99](https://github.com/cloudadoption/contitires/issues/99).

A number in the record does not reproduce and is not repeated here. [#99](https://github.com/cloudadoption/contitires/issues/99)'s close comment
records live's events column at 789, and [#340](https://github.com/cloudadoption/contitires/issues/340) and [#244](https://github.com/cloudadoption/contitires/issues/244) restate it as fact. Live declares the
same track we do, `grid-template-columns: 265px 1fr` with a 50px gap, and its listing sits in
a plain `.container`, so live computes 1136 - 265 - 50 = 821. The 32px gap is twice live's own
container padding, which suggests 789 was read at a different viewport or through an extra
padded wrapper. The direction and the cause survive either way, because live's declared track
is identical to ours and the whole delta is the container. 789 wants a browser measurement
before anyone uses it.

### Breakpoints, half of them live's

**differs.** Live pivots at 768 and 1024. We use those plus a 900 that live has once in 982
queries.

Live carries 982 media queries. The two that hold the site up are `max-width: 768px` 679 times
and `max-width: 1024px` 175 times, with `min-width: 769px` 29 more. `min-width: 900px` appears
once in all 982. Nothing at 600px in either direction. Live is a two-breakpoint site with a
few one-off widths like 1170 and 1180.

We carry 98 media queries across `styles/` and `blocks/`. 769px runs 34 times, 900px 26, 1025px
21, 600px 8, then one-offs at 380, 641, 1170, 1181, 1184 and 1200. A quarter of our queries
pivot at a width live effectively does not use. The two that matter most are both in
`styles.css`. The section gutter steps at 900 where live's steps at 769, and the heading scale
steps at 900 where live's h1 steps at 1025.

What it costs a visitor: between 769 and 900 a visitor gets our mobile gutter and live's
desktop one. Between 900 and 1025 our headings have already stepped up while live's have not.
The layout is right at 375, 768 and 1440 and drifts in the two windows between.

What would close it: move the 26 rules at 900 to 769 or 1025, whichever live uses on that
surface, and take the 8 at 600 with them. Mechanical, but 34 rules across the tree, and each
needs a measured pair either side to prove the move. The boilerplate is what pulled us here.
`AGENTS.md` prescribes `min-width` media queries at 600px, 900px and 1200px, and live uses
none of those three. [#219](https://github.com/cloudadoption/contitires/issues/219) covers the padding half of it.

### The article body shifts up 51px after first paint

**differs.** An article's whole body jumps up 51px at 142ms. Live holds its layout. The cause
is not found.

On `/learn/extremecontact-sport-02-road-trip-challenge` at 412x823 the body section moves from
top 316 to top 265. The title section above it holds its 143px through the shift, so the gap
between title and body goes from 66px to 12px. The shift fires at 142ms, well before
`document.fonts.ready` at 419ms, so it is not the webfont swap. Two candidates are already
eliminated from the code. It is not a late template stylesheet, because `body` is
`display: none` until `revealPage()` and `decorateMain()` runs first. It is not the
`.share-wrapper` coupling either, because that class is present at first paint. What occupies
the 51px is not established.

What it costs a visitor: CLS 0.146 on that page and mobile performance 94, under the 95 merge
gate. A second article page reads 100 with CLS 0.035, so the amount of viewport pushed varies
and other long articles sit near the gate. A settled-state discrepancy sits in the same
thread: the sheet intends 20px under the title and the page measures 12px, which is the 8px
base padding the 20px rule means to override.

What would close it: identify what renders into the gap and then collapses. The remaining
suspect is the lazy phase, since the eager phase loads only the title section and the video
and share blocks in the body load inside the 142ms window. It needs a cold load at a mobile
viewport with a buffered layout-shift observer, which is a browser pass, not curl. Every
number here is [#197](https://github.com/cloudadoption/contitires/issues/197)'s own measurement and none was re-derived. [#197](https://github.com/cloudadoption/contitires/issues/197).

### Prose links carry an underline live paints transparent

**diverges.** Live paints its underline transparent. We paint ours, and keep it.

Live declares `text-decoration: transparent underline solid` four times. Reading the
declaration alone says live underlines these links. The paint colour means a reader sees
nothing until hover, where live brings in `var(--dark-yellow)`. The same trick runs on tile
titles on `/`, `/tires` and `/experience/partners`: line underline, colour transparent,
nothing shown.

Our `styles.css` paints the underline on a link inside default content and inside cards,
columns and hero paragraphs and list items. A link that is a title takes
`text-decoration: none`, so titles look the same as live's. Link colour is inherited on both
sides.

What it costs a visitor: a visible underline under every prose link where live shows bare
text. That is the whole difference, and nothing should close it. A link marked by colour alone
fails WCAG 1.4.1, and no colour clears both bars here: 4.5:1 on white caps a link at 0.1833
luminance while 3:1 against `[#333](https://github.com/cloudadoption/contitires/issues/333)` body text needs 0.1993. Matching live means reproducing a
link that is indistinguishable from its surrounding text, which is the failure the underline
clears. It is recorded so nobody reads it as an oversight. [#240](https://github.com/cloudadoption/contitires/issues/240).

### Superscripts

**diverges on one property.** Same size, lift and line box as live. We drop live's `inline-block`.

Live's `sup` takes `font-size: 0.6em`, `top: -0.5em`, `line-height: 0`, `position: relative`,
`vertical-align: baseline` and `display: inline-block`. Measured on live at all four sizes it
renders, the 14px nav link, the 30px h1, the 18px description and the 42px specs heading, the
ratio is 0.600 and the lift is -0.5em every time.

One rule in our `styles.css` carries the same five values in em, so it covers all four sizes.
`display` is left at `inline`. Ten of the 46 product names end in a superscript.

What it costs a visitor: nothing, the render is the same. The gain is on the other side. An
`inline-block` child makes the accessible-name computation insert a space, so live's own screen
reader says "ExtremeContact Sport 02" as two words and ours says the name as one. Copying
live's `display` would reintroduce the split announcement. [#238](https://github.com/cloudadoption/contitires/issues/238).

## Performance and accessibility

### Delivered HTML weight

**differs.** Live's homepage ships 123,748 bytes of HTML. Ours ships 22,418.

Four pages, read with `curl -sL <url> | wc -c` on 2026-07-30, live first.

| Page | Live | Ours |
|---|---:|---:|
| homepage | 123,748 B | 22,418 B |
| `/tires` | 122,039 B | 3,886 B |
| `/events` | 133,717 B | 30,986 B |
| `/learn` | 69,921 B | 12,025 B |

What it costs a visitor: nothing, it buys them something. The gap is architecture rather than a
trick. Content arrives as semantic HTML and the blocks decorate it in the browser, so the
markup a page ships is close to the content it holds. `/tires` is the extreme case at 31 times
lighter, because its whole listing is built client-side from `/products.json`.

The honest caveat is that HTML weight is not page weight. It says nothing about the images, the
CSS or the JavaScript that follow, and it is not a Lighthouse score. It is the one number in
this bucket that can be read the same way on both sides without a browser.

### Generated headings skip levels

**differs.** Blocks build an h3 and an h4 with no h2 above them, so the accessibility audit
caps at 98.

Live's learn category pages and its tire pages do not put an h3 straight under the page h1.

`blocks/article-cards/article-cards.js` creates an h3 in two places, at line 41 for a teaser and
106 for a card. The learn category pages serve only an h1 in their markup, so the h3 arrives
with nothing between it and the h1. `blocks/perfect-fit/perfect-fit.js` creates an h2 at line
182 and an h4 at 208, so a result card is two levels under the modal heading. `article-cards`
also copies the article title into the card image alt where the title is already the visible
link text.

None of this is visible to curl. `/learn/tips`, `/learn/technology` and `/learn/news-and-events`
each serve exactly one heading, an h1, so the extra headings are built client-side and only a
browser sees the outline that results.

What it costs a visitor: `/learn/tips` reads accessibility 98 on both strategies with
heading-order as the single failure, recorded 2026-07-28 in [#117](https://github.com/cloudadoption/contitires/issues/117). The same audit against main's
preview also returns 98, so it predates the slice that found it. A screen reader announces each
card title twice, once as the link and once as the image alt.

What would close it: give the generated headings a level that follows the page outline, and set
the card image alt to empty. The three learn category pages above carry no authored headings at
all, so they land here rather than in the type scale. [#117](https://github.com/cloudadoption/contitires/issues/117).

### Security headers

**differs, and each side has something the other does not.**

Live sends `strict-transport-security: max-age=300`, `x-content-type-options: nosniff` and
`x-frame-options: SAMEORIGIN`. It sends no Content Security Policy at all.

We send a CSP with `script-src 'nonce-…' 'strict-dynamic'`, `base-uri 'self'`,
`object-src 'none'`, `frame-src 'self' https:` and `require-trusted-types-for 'script'`. It
comes from `head.html` with `move-to-http-header=true`. Our HSTS is `max-age=31557600` against
live's 300. We send neither `x-content-type-options` nor `x-frame-options`.

What it costs a visitor: nothing they see. It moves the Lighthouse best-practices CSP audit,
which is the only place it shows up in a score.

What would close it: adding the two headers we lack would make our set a superset of live's.
Neither is set today.

### The test suite and repo hygiene

**differs.** None of this is visible from outside, and it is what the next person to change the
code inherits.

There are 29 block directories and 2 of them ship without a test directory, `fragment` and
`library-metadata`. `git ls-files` counts 72 tracked test files.

Three things make the suite prove less than it looks. Fixtures are built in the authored shape
rather than the delivered shape, so a block can pass its suite and still drop content in
production. An absence assertion whose actual value is a DOM element hangs the runner for 120
seconds and takes that file's passing results with it. And 25 test files request 67 distinct
URLs that 404 in every run, printing blocks of yellow that would hide a real 404.

What it costs a visitor: nothing. The cost is a green suite that proves less than it looks, and
two documents that describe a site which changed underneath them.

What would close it: tests for the two untested blocks with delivered-shape fixtures, a runner
fix or a lint rule for the hanging assertion, and real fixture files or stubbed requests. [#125](https://github.com/cloudadoption/contitires/issues/125),
[#222](https://github.com/cloudadoption/contitires/issues/222), [#317](https://github.com/cloudadoption/contitires/issues/317), [#318](https://github.com/cloudadoption/contitires/issues/318), [#126](https://github.com/cloudadoption/contitires/issues/126), [#304](https://github.com/cloudadoption/contitires/issues/304), [#316](https://github.com/cloudadoption/contitires/issues/316), [#345](https://github.com/cloudadoption/contitires/issues/345), [#322](https://github.com/cloudadoption/contitires/issues/322).

### The annotated tire diagram

**diverges.** Live hides its ring labels below 1181 and reaches none of them by keyboard. We
print them.

Live's `/all-new-securecontact-aw` draws the tire under the four claims it makes for the
SecureContact AW, with a ring on each part a claim rests on. The markup is
`paragraph--type--tire-features-slider`: four cards, four drawings and eight rings, each ring
with a title and a line of explanation. Below 1181 live hides the eight rings' words and brings
one back when a ring is tapped. Its rings are divs with a click handler, so a keyboard reaches
none of them, and on a phone the words behind them cannot be read. Live runs the four cards as a
carousel at those widths, which puts each card in the tab order three times.

`blocks/tire-features` builds the same component from one authored row per feature: the drawing,
the card, and a ring for each part the card claims. A ring is placed by two percentages of the
picture, so one pair of numbers holds at every width and no code measures the image at runtime.
Below 1181 this site prints the ring labels under the drawing and leaves the rings as decoration,
and it scrolls and snaps the cards where live loops them. The four drawings were already in DA,
byte for byte live's, and the four card icons came out of live's markup.

What it costs a visitor: nothing lost, and on a small screen something gained, because live's
eight explanations cannot be read there. A visual diff against live flags the printed labels as
text we added. They are live's own words, moved to where a reader reaches them.

What would not close it: reproducing live's tap-only rings, which is a keyboard trap and hides
content at the width where the page is hardest to read. One measured difference does stand. Live
sets a 460KB photograph behind the black band and this site leaves it black. [#255](https://github.com/cloudadoption/contitires/issues/255).

### Carousel autoplay and reduced motion

**differs.** The autoplay variant has no visible pause control and ignores `prefers-reduced-motion`.

This is not a live comparison. It is a WCAG defect in our own block.

The opt-in autoplay carousel advances with no visible pause or stop control and does not check
`prefers-reduced-motion`. Pausing on hover and focus alone fails WCAG 2.2.2 for touch users and
for anyone who has asked the system for less motion.

What would close it: a pause control and a `prefers-reduced-motion` check in
`blocks/carousel/carousel.js`. [#116](https://github.com/cloudadoption/contitires/issues/116).

## What this document does not settle

Four things are open, and each one names what would close it. They are here rather than
smoothed over, because a parity document that reads as complete when it is not is worse than
no document.

**Live's events column width.** [#99](https://github.com/cloudadoption/contitires/issues/99)'s close comment records live at 789px and [#340](https://github.com/cloudadoption/contitires/issues/340) and [#244](https://github.com/cloudadoption/contitires/issues/244)
restate it. Live declares the same grid track we do and its listing sits in a plain container,
so live computes 821. One number, three places, and it does not reproduce from the CSS. What
would close it: measure live's `.events-listing__columns` in a browser at 1440. The direction
and the cause are unaffected either way, because the whole delta is the container.

**Three claims that need a browser.** The CLS before and after in PR [#329](https://github.com/cloudadoption/contitires/issues/329), the 51px article
collapse in [#197](https://github.com/cloudadoption/contitires/issues/197), and the 98 accessibility score in [#117](https://github.com/cloudadoption/contitires/issues/117) are all read from their own issues and
were not re-measured. Every pass in this document was curl only, because the run's capture tool
refuses to start alongside another automation browser. What would close them: a cold load at
412x823 with a buffered layout-shift observer, and a fresh audit.

**Live's own performance numbers.** None are quoted here. The PageSpeed Insights API quota ran
out at 13:02 today, and measuring live without a browser is not possible. The scores in this
document are ours, each with the date and the issue that recorded it. The web UI at
pagespeed.web.dev runs a separate quota and works, so the links in the opening section are
live and can be run on the day.

**Live's by-size tire URL.** `/tire-search/by-size/235-40-18` 404s and live's `/tire-search`
page links only by-vehicle paths, so the by-size entry point could not be reconstructed. What
would close it: find a live page that links a by-size result.
