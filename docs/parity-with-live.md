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

In the last column, ⏳ is work yet to come: queued, in flight, or named and not started.
✅ is settled: done, deliberate, or decided and needing nothing. ⚙️ needs something from inside live that the public site does not hand out, such as an
API, a vendor account or an index configuration.

**⚙️ IS A VERDICT, NOT A WAITING STATE (ruled 2026-08-01, and first ruled in #234 on 2026-07-29).**
A geared row is a gap that cannot be closed here. Its reason is `needs access to the API / data
source`, and the issues that depend on it CLOSE on the row rather than sitting in the queue looking
like work somebody could pick up. **Reachable is not the same as ours to take**: where live's data
can be read from outside, the ruling is that we do not harvest it, so the row still reads `needs
access`. An issue may be cited on a geared row and still be open, but only where its own scope is
the part that IS doable; the row says which half is which.

| Bucket | Item | State | Will it be fixed | Issue |
|---|---|---|---|---|
| Navigation and routing | [Redirects come from a sheet](#redirects-come-from-a-sheet-not-from-server-rules) | differs | ✅ the census is answered; a sheet still cannot match by shape, and two paths cannot be reached at all | [#337](https://github.com/cloudadoption/contitires/issues/337), [#465](https://github.com/cloudadoption/contitires/issues/465) |
|  | [Live's sports sub-nav is dead on live](#lives-sports-sub-nav-points-at-two-dead-urls) | diverges | ✅ nothing to do | [#252](https://github.com/cloudadoption/contitires/issues/252), [#289](https://github.com/cloudadoption/contitires/issues/289) |
|  | [Year tabs land on our heading ids](#year-tabs-land-on-our-heading-ids-not-lives) | differs | ⏳ queued | [#491](https://github.com/cloudadoption/contitires/issues/491) |
|  | [86 absolute links back to live](#86-absolute-links-back-to-live-on-7-pages) | differs | ⏳ queued | [#213](https://github.com/cloudadoption/contitires/issues/213) |
|  | [Duplicate addresses, self-rewriting URLs](#duplicate-addresses-and-self-rewriting-category-urls) | differs | ⏳ queued | [#332](https://github.com/cloudadoption/contitires/issues/332), [#239](https://github.com/cloudadoption/contitires/issues/239) |
|  | [Header, mega menu and footer](#the-header-mega-menu-and-footer) | differs | ⏳ queued | [#167](https://github.com/cloudadoption/contitires/issues/167), [#237](https://github.com/cloudadoption/contitires/issues/237) |
| Product pages | [Product data is a published workbook](#product-data-is-a-published-workbook-not-a-request-time-backend) | approximated | ⚙️ live computes per request | [#241](https://github.com/cloudadoption/contitires/issues/241) |
|  | [One technology description differs on three pages](#one-technology-description-differs-on-three-pages-because-a-sheet-holds-one-row-per-technology) | diverges | ✅ decided, not outstanding: the sheet holds one row, so the alternative differs from 11 pages instead of 3 | [#380](https://github.com/cloudadoption/contitires/issues/380) |
|  | [Fit by size](#fit-by-size) | differs | ⏳ queued | [#243](https://github.com/cloudadoption/contitires/issues/243) |
|  | [Star rating and review count](#star-rating-and-review-count) | absent | ⚙️ the corpus needs the account | [#241](https://github.com/cloudadoption/contitires/issues/241) |
|  | [Live's specs pages redirect onto our product page](#lives-specs-pages-redirect-onto-our-product-page) | differs | ✅ 46 redirect rows shipped; live's size search, print control and all-sizes view are not rebuilt | [#357](https://github.com/cloudadoption/contitires/issues/357), [#463](https://github.com/cloudadoption/contitires/issues/463) |
| Search | [Search ranking](#search-ranking-rebuilt-against-lives-results-rather-than-its-index) | approximated | ⚙️ needs live's Solr config | -- |
|  | [How many results a query returns](#how-many-results-a-query-returns) | differs | ⚙️ live's exclusions are Solr config | -- |
|  | [No sort control on the results page](#no-sort-control-on-the-results-page) | absent | ✅ Relevance is our order, Date has no data | [#162](https://github.com/cloudadoption/contitires/issues/162) |
|  | [The results band reserves height live does not](#the-results-band-reserves-height-live-does-not) | diverges | ✅ decided: 116px recovered, and the reservation buys CLS 0 where live shifts | [#431](https://github.com/cloudadoption/contitires/issues/431) |
|  | [Our class names are kebab-case where live's are BEM](#our-class-names-are-kebab-case-where-lives-are-bem) | diverges | ✅ decided, not outstanding: the linter rejects BEM and nothing a visitor sees depends on it | [#107](https://github.com/cloudadoption/contitires/issues/107) |
| Markup | [Product pages carry no JSON-LD](#product-pages-carry-no-json-ld) | absent | ⏳ emit Product from the workbook | [#490](https://github.com/cloudadoption/contitires/issues/490) |
|  | [Store and dealer lookup](#store-and-dealer-lookup) | absent | ⚙️ needs a dealer database | [#264](https://github.com/cloudadoption/contitires/issues/264), [#281](https://github.com/cloudadoption/contitires/issues/281) |
| Forms and third parties | [Tag management and analytics](#tag-management-and-analytics) | absent | ⚙️ needs live's GTM container and the accounts its 229 tags report to | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [What live's tags report into](#what-lives-tags-report-into) | not knowable from outside | ⚙️ needs the ad accounts | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [Cookie consent](#cookie-consent) | absent | ⚙️ needs a consent platform and the tag inventory it gates | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [Bazaarvoice](#bazaarvoice) | absent | ⚙️ reviews need the account | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [EmbedSocial](#embedsocial) | absent | ⚙️ needs the EmbedSocial account | [#234](https://github.com/cloudadoption/contitires/issues/234) |
|  | [The newsletter form](#the-newsletter-form) | diverges | ✅ the delay is deliberate | [#230](https://github.com/cloudadoption/contitires/issues/230) |
|  | [The sponsorship form](#the-sponsorship-form) | absent | ⚙️ **needs access to the API / data source: there is no receiver for a submission**, and no work here makes one. **THAT VERDICT IS #488 AND ONLY #488.** The two halves were one issue until 2026-08-01 and were split so they could stop sharing a verdict: #488 is the submission and closes here, #101 is the form UI — 26 inputs and 2 textareas, submit disabled — and stays OPEN and pickable. Nothing about the missing receiver blocks the rebuild. **A GEARED ROW DOES NOT MAKE EVERY ISSUE ON IT UNRESOLVABLE**, and this row cited #101 alone until the split, which would have closed real work under a verdict about the other half | [#488](https://github.com/cloudadoption/contitires/issues/488), [#101](https://github.com/cloudadoption/contitires/issues/101) |
|  | [Vehicle and plate lookup](#vehicle-and-plate-lookup) | approximated | ⚙️ **needs access to the API / data source.** Neither half is ours to build. A plate resolves through a registration lookup live buys and #243 established we do not have it. The vehicle half is different and the difference is recorded rather than hidden: **live's fitment IS publicly readable** — the cascade walks year to make to model to trim on an unauthenticated GET and returns the OE size, measured 2026-08-01, detail in the section below. **We do not take it.** Ruled 2026-08-01, and before that in #234: this site does not depend on, or harvest, a host it does not own. So the gap is real and closed as unresolvable, not parked as pending | [#308](https://github.com/cloudadoption/contitires/issues/308), [#309](https://github.com/cloudadoption/contitires/issues/309), [#437](https://github.com/cloudadoption/contitires/issues/437) |
|  | [Finder results render in the panel](#vehicle-and-plate-lookup) | differs | ✅ decided: the panel is where the platform's own guidance puts a dynamic result, and **no gear because the limit is ours** | [#483](https://github.com/cloudadoption/contitires/issues/483) |
|  | [The finder's question heading is wider than live's](#vehicle-and-plate-lookup) | diverges | ✅ recorded: 64px wider above 769, equal below, and the ink lands in the same place | -- |
|  | [Real user monitoring, ours only](#real-user-monitoring-ours-only) | diverges | ✅ ours by choice | -- |
| Media and assets | [Web fonts hotlinked from live](#web-fonts-are-hotlinked-from-live) | differs | ⚙️ needs a font licence | -- |
|  | [PDFs and press-kit downloads](#pdfs-and-press-kit-downloads-still-on-the-old-host) | differs | ⚙️ zips need a host | [#213](https://github.com/cloudadoption/contitires/issues/213) |
|  | [The media gallery](#the-media-gallery) | differs | ⏳ queued | [#319](https://github.com/cloudadoption/contitires/issues/319), [#326](https://github.com/cloudadoption/contitires/issues/326), [#327](https://github.com/cloudadoption/contitires/issues/327) |
|  | [Leftover originals in DA](#leftover-originals-in-da) | differs | ✅ a delete nobody has proved safe | [#330](https://github.com/cloudadoption/contitires/issues/330) |
|  | [The chevron sprite](#the-chevron-sprite) | approximated | ✅ DA strips the authored span | [#277](https://github.com/cloudadoption/contitires/issues/277) |
|  | [The default share image 404s](#the-default-share-image-404s) | differs | ⏳ ship live's file | [#178](https://github.com/cloudadoption/contitires/issues/178) |
| Content and editorial | [The homepage title](#the-homepage-title) | differs | ⏳ queued | [#349](https://github.com/cloudadoption/contitires/issues/349) |
|  | [No result count above the pager](#no-result-count-above-the-pager) | absent | ⏳ queued | [#348](https://github.com/cloudadoption/contitires/issues/348) |
|  | [Card teaser text](#card-teaser-text) | approximated | ⚙️ live's teaser field is unpublished | -- |
|  | [Listings behind a service, authored as snapshots](#listings-behind-a-service-authored-as-snapshots) | approximated | ⚙️ live publishes no feed | [#256](https://github.com/cloudadoption/contitires/issues/256), [#257](https://github.com/cloudadoption/contitires/issues/257), [#258](https://github.com/cloudadoption/contitires/issues/258), [#259](https://github.com/cloudadoption/contitires/issues/259) |
|  | [The scale of what shipped](#the-scale-of-what-shipped) | counts | ✅ this table is the source | [#362](https://github.com/cloudadoption/contitires/issues/362) |
|  | [Commercial claims and operator identity](#commercial-claims-copyright-and-operator-identity) | diverges | ✅ deliberate | -- |
| Layout and type | [The heading scale](#the-heading-scale) | differs | ⏳ line boxes match live on the 63 headings measured; the article-template h2 SIZE is still 20px where live is 30 above 769 | [#381](https://github.com/cloudadoption/contitires/issues/381), [#382](https://github.com/cloudadoption/contitires/issues/382) |
|  | [Heading line boxes we are leaving different from live](#heading-line-boxes-we-are-leaving-different-from-live) | diverges | ✅ decided, not outstanding: nine inherited from live, two below the threshold a rule earns | [#382](https://github.com/cloudadoption/contitires/issues/382), [#381](https://github.com/cloudadoption/contitires/issues/381) |
|  | [Two heading margins we are leaving proportional](#two-heading-margins-we-are-leaving-proportional) | diverges | ✅ decided, not outstanding: one does not reach the page, the other has no single absolute that fits both directions | [#395](https://github.com/cloudadoption/contitires/issues/395) |
|  | [Live opens headings and paragraphs with a leading break](#live-opens-headings-and-paragraphs-with-a-leading-break) | differs | ⏳ author the same spacing device in DA, or accept the tighter rhythm | [#384](https://github.com/cloudadoption/contitires/issues/384) |
|  | [The content container](#the-content-container-64px-wider-than-lives) | differs | ⏳ queued, not a local fix | [#219](https://github.com/cloudadoption/contitires/issues/219) |
|  | [The hero content cap, which changes no wrap](#the-hero-content-cap-which-changes-no-wrap) | diverges | ✅ decided, not outstanding: measured over all 15 pages it reaches and it changes the wrap on none of them | [#409](https://github.com/cloudadoption/contitires/issues/409) |
|  | [Breakpoints](#breakpoints-half-of-them-lives) | differs | ⏳ queued | [#219](https://github.com/cloudadoption/contitires/issues/219) |
|  | [The article body shift](#the-article-body-shifts-up-51px-after-first-paint) | differs | ⏳ queued, cause not found | [#197](https://github.com/cloudadoption/contitires/issues/197) |
|  | [Prose link underlines](#prose-links-carry-an-underline-live-paints-transparent) | diverges | ✅ WCAG 1.4.1 | [#240](https://github.com/cloudadoption/contitires/issues/240) |
|  | [Superscripts](#superscripts) | diverges | ✅ deliberate | [#238](https://github.com/cloudadoption/contitires/issues/238) |
| Performance and accessibility | [Delivered HTML weight](#delivered-html-weight) | differs | ✅ nothing to do | -- |
|  | [Authored heading levels do not follow live's](#authored-heading-levels-do-not-follow-lives) | differs | ⏳ re-level the authored documents | [#371](https://github.com/cloudadoption/contitires/issues/371), [#372](https://github.com/cloudadoption/contitires/issues/372) |
|  | [Product labels are static text where live's are a disclosure](#product-labels-are-static-text-where-lives-are-a-disclosure) | differs | ⚙️ live's advantage, no counterpart built | -- |
|  | [Security headers](#security-headers) | differs | ⏳ queued | [#492](https://github.com/cloudadoption/contitires/issues/492) |
|  | [The test suite and repo hygiene](#the-test-suite-and-repo-hygiene) | differs | ⏳ the runner hang and the 404 noise are fixed; fixture shape is open | [#125](https://github.com/cloudadoption/contitires/issues/125) |
|  | [The annotated tire diagram](#the-annotated-tire-diagram) | diverges | ✅ live's version is the defect | [#255](https://github.com/cloudadoption/contitires/issues/255) |
|  | [Carousel autoplay and reduced motion](#carousel-autoplay-and-reduced-motion) | differs | ⏳ queued | [#116](https://github.com/cloudadoption/contitires/issues/116) |

## Navigation and routing

### Redirects come from a sheet, not from server rules

**differs.** A sheet matches an exact literal path. Live's server rules match by shape. The census is answered and the sheet
has grown from 14 rows to 78. The difference in kind is permanent, and two paths cannot be
reached at a row.

Live serves redirects as server rules, so it handles them by shape. Nine `/taxonomy/term/<id>`
paths and three `/node/<id>` paths 301 to their real page, and `/ev-ready` 301s to
`/ev-compatible`.

**The sheet went from 14 rows to 78 across two slices on 2026-08-01**, taking the 46 specs paths
and then the rest of the 63-path census.

**A row is one literal source path, so the count grows with the site where live's cost is flat.**
The 42 `/tires/<product>/specs` paths need 42 rows where one live rule covers them. The match is
case-sensitive, so `/Store-finder` and `/store-finder` are two rows. That is the difference between
a list and a rule, and it does not close.

**Two paths cannot be reached even with a row, and one is permanent.**

One news article's live path includes U+2019, a right single quotation mark. **Our CDN refuses it
before site routing runs**, with `Unsupported characters in path`. **It is a character class
rather than one path.** An invented path holding the same character draws the identical refusal,
and an ASCII control on the same shape reaches the pipeline. **No redirect row helps, because the
sheet is not consulted.** A reader following that link from outside does not arrive.

`/media/929/download` is a 1.8 MB PDF rather than a page. It is an asset to host rather than a path
to redirect, filed as [#465](https://github.com/cloudadoption/contitires/issues/465).

**The census was stale in the direction that causes a wrong write.** `/learn/corporate` and
`/learn/news` were recorded as 404 here. Both serve 200 today, with live's own titles, so two of the
63 needed no row. **A census that overstates what is missing produces rows for paths that already
work**, which is worse than a wrong number, because the write looks correct.

What it costs a visitor: the paths in the sheet resolve now. An external link, a bookmark or a
search result lands on the right page. The U+2019 article is still unreachable.

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

### One technology description differs on three pages, because a sheet holds one row per technology

**diverges.** Live's own text for `Self Supporting Runflat*` is inconsistent between its pages. On
11 product pages the description ends `when the tires are deflated.\`, carrying a stray backslash,
and on 3 it ends `when the tires are deflated.` without one. The backslash is live's, not ours.

Our `technology` sheet holds ONE ROW PER TECHNOLOGY, so it cannot carry both endings. The row takes
the majority wording, with the backslash, which matches live on 11 pages and differs from it on
`/tires/4x4contact`, `/tires/crosscontact-rx` and `/tires/sportcontact-6`. Those three now show a
character live does not show there.

**The content model forces a divergence and only its size was chosen.** The alternative row diverges
from 11 pages instead of 3. Normalising to neither ending is not available, because one row is what
the sheet has. Three is the smaller number and that is the whole reason it is three.

**The eleven pages are a different thing and are not recorded here.** There, live's backslash is
reproduced verbatim, which is an inherited oddity under the parity gate rather than something this
site introduced. It is only the three that this site's model creates, and a difference we make is
what this document exists to hold.

Verified 2026-07-31 on both sides: live's three named pages end without the backslash,
`/tires/contisportcontact-5` ends with it, and the sheet's `description` field ends
`tires are deflated.\` before its `*Select tire sizes` line. The page side is not curl-readable on
this site, because the description arrives from the sheet at runtime rather than in the delivered
document, so the sheet is where the value is read.

What it costs a visitor: one backslash on three product pages.

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

#### One sContact size keeps its misspelling on purpose

Three sContact rows in the specs sheet are spelled `T135/70R18`, `T145/85R18` and `T165/80R17`,
where live's own specs page spells them bare. Two of the three normalise, because live's width
control offers 145 and 165. [#496](https://github.com/cloudadoption/contitires/issues/496).

**`T135/70R18` is left as it is.** Live offers 29 widths and 135 is not among them, so
correcting that row would put a width on our control that live's does not have. The misspelling is
what makes `parseSize` reject the row. That rejection is the behaviour we want, so **leaving it is
the fix rather than the omission**, and our width list is a subset of live's.

Ruled 2026-08-02. `parseSize` in `blocks/perfect-fit/perfect-fit.js` already comments that `HL`
and `T` return null on purpose and asserts it in a test, so the parser side is protected. This is
the note for whoever next edits the sheet, who is not the same person.


#### The finder's question heading is 64px wider than live's, and the ink is in the same place

Our question heading measures 1136 where live's header measures 1072 above the 769 step, and 828
against live's 764 at 900. **At and below 768 they are equal.** Both sides centre their text, so a
visitor comparing the two pages sees the words in the same position and cannot find the difference.
It is recorded rather than fixed for that reason.

**THE CONTENT CAP IS NOT THE CAUSE, and this sentence exists so the next reader does not reopen
that question.** Live's panel is 1136 and its heading is 1072, so live insets the heading *inside*
a panel we now match. The 64px is a within-panel inset on that element, not our cap being wrong.
#499 capped the panel correctly and #501 moved the form bound to where live puts it; neither
touched this.

It is pre-existing and identical on the By Tire Size tab, where it has been visible since #484
released that tab from the form cap. Measured 2026-08-02 while proving #501, and deliberately not
folded in: different element, different rule, and #501 names neither.

**Written down because an invisible delta with no record is one the next measurement pass
re-measures and re-argues.** That cost was paid twice on 2026-08-01, on four dead paths a sweep
will find again and three pending rows that sat for days. One line closes it for the price of one
line.

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

### Live's specs pages redirect onto our product page

**differs.** Live gives each product its own specs page. We redirect those URLs onto the product
page, which shows the specs inline, so the link resolves and the destination is a different kind
of document.

Live serves a standalone specs page per product. On `extremecontact-dws06-plus` it is 5905px tall,
with a size search, a print control, and one accordion row per size. Ours is the product page at
3365px with a picker that shows one size at a time.

**The link is no longer dead.** 46 redirect rows shipped on 2026-08-01, taking the sheet from 14
rows to 60. All 46 targets our block emits answer 301 and then 200 on the product page, read on the
published host. A nonsense control still returns 404, so the sheet is not a catch-all. A bookmark or
a search result on a live specs URL now lands on the product page rather than on our 404.

**Dropping the link was the other option and it was refused.** The specs are already on the page,
so dropping the control loses no information, and it is the smaller change. But live shows that
control, and removing one live shows is the regression this project exists to avoid. A viewer
comparing the two sees a difference and concludes the platform could not do it. The rows keep the
surface and fix the destination.

**One page diverges deliberately, and the error is live's rather than ours.**
`/vancontact-as-ultra` links its own specs path on live, and that path answers 404 on live. We do
not reproduce a broken link, so the row ships and the reader reaches the product page. That page
is also the one product page outside `/tires/`, counted rather than assumed, while our block
prefixes the path anyway. Live's dead link and ours are not even the same string.

**What live still has that we do not.** The size search, the print control, and the accordion that
opens the sizes together. A reader comparing four sizes side by side can do it on live and cannot do
it here. Our picker also opens preselected on the first size where live's opens empty with a prompt,
which is [#463](https://github.com/cloudadoption/contitires/issues/463).

Filed as [#357](https://github.com/cloudadoption/contitires/issues/357), closed 2026-08-01 with no
proving commit, because a sheet change produces no commit;
[#242](https://github.com/cloudadoption/contitires/issues/242) covered the specs section and closed
without following the link.

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

### No sort control on the results page

**absent, and half of it is not a loss.** Live's control offers two options, `created=Date` and
`search_api_relevance=Relevance`, and it defaults to relevance.

**The Relevance half is already what we render.** Live's no-sort order and its
`sort_by=search_api_relevance` order read identically, taken twice on
`keywords=all season tires` at 46 results, and that is the order our results page already
produces. A visitor who never touches live's control sees the same ordering on both sides.

**What is lost is the Date option alone, and no data this site holds can honour it.** The default
index has six columns and no date. `learn`'s `lastModified` is our own publish timestamp, and its
219 values fall on three days, 2026-07-25, 2026-07-30 and 2026-07-31, which are the days this
migration published. So newest-first would order the articles by our deploy sequence. Neither our
pages nor live's publish an article date at all, and the prose dateline reaches 29 of 220 pages.

So the gap closes here rather than as work. **A select with one honourable option is worse than no
select.** [#162](https://github.com/cloudadoption/contitires/issues/162) closes on this line.

Our relevance order is not claimed equal to live's: that is the search-ranking row above, geared
for needing live's Solr config.

The ranking sections above are about which rows come back and in what order the scan puts them.
This is the control on top of that.

Live also renders its result list server-side, so a reader with JavaScript off sees results on
live and sees none here. `scripts/search.js` fetches `/query-index.json` and builds the list in
the browser, which is the same trade the rest of this site makes and is called out here because
search is the one page whose whole content is built that way.

What it costs a visitor: a query that would be better read newest-first has to be read in score
order, and a no-JS client gets an empty results page.

### The results band reserves height live does not

**Live sizes its results band by its content and we reserve height for content that has not
arrived yet.** Live's band computes `min-height: 0` at every state and width measured. Ours holds
a floor, so a query with few results leaves dark space below them where live's band stops.

**The measurement, at a 1000px-tall viewport and an 812px one:**

    state          live band   our band
    many  1440        1766       1855
    few   1440         713        904
    one   1440         197        904
    none  1440         371        904
    many   375        3409       3162
    one    375         221        684
    none   375         222        684

A full page of results is content-bound on both sides and the floor never shows. The short states
are where it does, and it runs to about 630px at 1440.

**The reason is where the results come from.** Live renders them server-side, so its first paint
already knows how tall they are and it has no in-flight state to reserve for. Ours are fetched
from a published index after the page paints, so the band has to hold a height before anything
has arrived. That is a property of the delivery model rather than a styling miss, and it is the
honest answer to what live sizes its band by.

**The floor is load-bearing, and the evidence is a measurement taken when it was introduced.**
The verification taken when it was introduced recorded **CLS 0.687 on mobile before this band
existed and 0.000 after**. Without the floor the empty state collapses to 253px at 375, putting the band's
bottom at 497 against a fold of 812, so the footer would sit in view and then be pushed down when
results land. The route that looks free, dropping the floor once the results arrive, is the same
move: it shrinks the band in exactly the short states and trades the empty space for the shift the
floor prevents.

**What was recovered: 116px at every height.** The floor has to hold the band's bottom at or below
the fold, and from the measured band top and padding that is 496 at 375 and 581 at 1440. The
narrow width binds, so `calc(100vh - 316px)` is the tightest expression that satisfies both, down
from `calc(100vh - 200px)`. The remainder is the reservation itself and is not recoverable by
styling.

**And this is a place where this site beats live.** Our page does not shift at all:

    state          ours    live
    many  1440       0     0.3864
    few   1440       0     0.4047
    one   1440       0     0.0594
    none  1440       0     0.0041
    many   375       0     0.1448
    one    375       0     0.0208
    none   375       0     0.0046

**Stated in both directions: we pay empty pixels and buy a stable page, and live pays a shifting
page and buys tight bands.** Live's worst reading is 0.4047, which is well past the 0.1 threshold
a Core Web Vitals pass allows, and ours is zero in all seven readings. A visitor comparing the two
sees more dark space on ours and never sees our page move under their cursor.

**What was not measured:** the in-flight state itself. `fillResults` is deferred to the load event
at `blocks/search/search.js:352` and any probe runs after it, so the browser cannot be caught
between decoration and the results landing without changing the code. Everything above is the
settled state plus the buffered layout-shift record, which is what CLS is computed from. The
counterfactual, what the shift would be with no floor, is arithmetic on measured offsets rather
than a reading.

### Our class names are kebab-case where live's are BEM

**diverges.** Live's search markup names its elements BEM-style, `search-result__title`,
`search-result__excerpt`, `site-search__container`, `site-search__form-wrapper`, 88 distinct
double-underscore classes on `/search?keywords=tire`. Ours are kebab-case throughout, 21 distinct
under `.search-` in `blocks/search/search.css`.

**The linter decides this and there is no room to match live.** `.stylelintrc.json` extends
`stylelint-config-standard`, whose `selector-class-pattern` accepts kebab-case only. A probe
selector `.probe__element` fails with "Expected class selector to be kebab-case"; the same rule
passes `.probe-element` silently. So adopting live's names would mean either a lint error on every
selector or turning the rule off for the repo.

The double underscores that do appear in our CSS are in comments quoting live's class names, in
`article-cards.css`, `cards.css` and `hero.css`. No selector uses one.

**What it costs a visitor:** nothing. Class names are not rendered, and the two sets style the same
elements to the same values wherever a parity row says they match. The cost is to a reader
comparing the two stylesheets, who has to map the names by position rather than by name.

### Product pages carry no JSON-LD

**absent.** Live's product pages emit a `Product` block with an `AggregateRating`. Ours emit no
structured data at all.

Checked on 2026-07-30 against the published hosts, both returning 200:
`continentaltire.com/tires/extremecontact-sport-02` carries one `application/ld+json` script
holding `"@type":"Product"` and `"@type":"AggregateRating"`.
`main--contitires--cloudadoption.aem.live/vancontact-as-ultra` carries zero `application/ld+json`
scripts.

The data is not the obstacle. The rating and the review count are already in the published
workbook and the listing already renders them, which is the same source a `Product` block would
read. What is missing is the block.

What it costs a visitor: nothing on the page. It costs the search engines the rich result live
gets, which is a rebuild fidelity gap rather than a reader-facing one.

What would close it: emit the block from the workbook row the product page already reads.

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

What would close it, and what would not. **The two halves were split on 2026-08-01 so a verdict
about one could not close the other.** The UI is buildable and
[#101](https://github.com/cloudadoption/contitires/issues/101) is open and pickable for it. The
submission is not buildable and is [#488](https://github.com/cloudadoption/contitires/issues/488),
closed on this row: a webform needs a receiver and live's is a Drupal endpoint on a host we do not
own. A form that accepted a submission and dropped it would be worse than no form, because a racer
would believe they had applied.

### Vehicle and plate lookup

**approximated.** A stub on sample data. **Live's answer IS readable from outside, and this
section said the opposite until 2026-08-01.**

The two halves of this split cleanly and it is worth keeping them apart. Live's vehicle *tree*
is public: `continentaltire.com/api/tire-search/by-vehicle` is an unauthenticated JSON endpoint
that walks level by level. Curled on 2026-07-30 it returns 48 model years, 2027 down to 1980.
`?year=2022` returns 45 makes. Adding `&make=honda` returns 9 models.

**IT ALSO RETURNS THE FITMENT ANSWER, WHICH THIS SECTION DENIED FOR AS LONG AS IT HAS EXISTED.**
The walk does not stop at model. `&model=accord` returns 9 trims, and `&trim=ex-l` returns
**225/50 R17** — the OE size for that vehicle, from an unauthenticated GET. Measured 2026-08-01
with the control that matters, because a constant would read identically: a 2022 Civic gives
215/50 R17 and a 2022 Bronco Badlands gives 285/70 R17, a bogus trim gives 0 options, and a bogus
path 404s. There is no licensed data set standing between us and the fit.

Ours is a hand-written table of 6 makes and 17 models standing in for the tree, and a season
filter standing in for the fit. By Plate collects a plate and a state and uses neither. It
returns every product whose season reads all-season or all-weather, 28 of the 46 in the
catalogue, and `blocks/perfect-fit/perfect-fit.js` says so in a comment.

What it costs a visitor: a reader whose car is outside the 17 models cannot use the tab. A
reader who types a plate gets a season filter rather than a fit.
[#307](https://github.com/cloudadoption/contitires/issues/307) already made the labels honest,
so nobody is told the plate was read.

Where this is left, and why. **The old reasoning here was that widening the tree would make the
dropdowns look right while the answer underneath stayed a stand-in, hiding the stub behind a
convincing front. That argument rested on the fit being unavailable, and it is not**, so widening
the tree can carry the real OE size with it rather than a season filter dressed up as one.

**THE DECISION IS MADE AND IT IS NO: WE DO NOT HARVEST.** Ruled 2026-08-01, and before that in
#234 on 2026-07-29. This site does not depend on, or harvest, a host it does not own, and that
holds whether or not the data can be read. For scale, the harvest would have been roughly 2,200
requests (one for the years, 48 for the makes, 48 x ~45 for the models), against guardrail 1's
*modest* volume.

**So this is a gap that cannot close, not a gap waiting on something.** The distinction matters
for what the record says: we could read live's fitment and chose not to take it, which is a
different sentence from being unable to see it, and this document said the second one until
2026-08-01. #308 and #309 close on this line, and #437 with them: our own workbook carries no year
and no trim dimension for any vehicle, not merely beyond the 17 models we cover. Its three sheets
hold `vehicleTypes` as a coarse class and no vehicle-to-size mapping at all, and the finder's Year
select is a generated `range(2015, 2026)` with nothing behind it.

**By Plate never had a route either**: a registration lookup is a service live buys, #243
established we do not have it, and no amount of work here reproduces it. [#308](https://github.com/cloudadoption/contitires/issues/308),
[#309](https://github.com/cloudadoption/contitires/issues/309).

**The 2229 drill-down URLs live serves and we answer 404 stay a documented gap. THE REASON IS NOT A
MISSING FITMENT SERVICE — that was this document's answer until 2026-08-01 and the fit is public —
it is the wildcard limit below, plus our own table's coverage, which is #308 and is a decision.**
Live publishes a page per make and per
make-and-model under `/tire-search/by-vehicle/`. Three forms of fix were measured and each is ruled
out rather than merely unattempted. **A wildcard redirect is not available, and the reason is the routing rule rather than a missing
CDN.** Every 404 on this host names it in a response header: `failed to load
/tire-search/by-vehicle/honda/civic/2022.md from content-bus: 404`. A request resolves to one
document at that exact path. The redirects sheet holds 0 wildcards across 77 rows, **and it does
not inherit downward either**: `/store-finder` and `/tire-search/by-vehicle` both answer 301 and
every path below them answers 404, four under the first and one under the second, which is the
property the sheet's own count cannot show. Edge Delivery does have a mechanism for a path family,
[folder mapping](https://www.aem.live/developer/folder-mapping), which serves every path below a
folder from one document. It is feature flagged by Adobe "to prevent accidental misuse", it is not
configured on this site, and **its own Anti-Patterns section names this exact use**: "Mapping of
excessively dynamic or infinite URLs like `/search/<query>`, dynamic search results are better
served via query parameters or URL hash property". So the finder answering in the panel is what the
platform's own guidance points at, and **the limit is ours rather than something live withholds**.
Read from the page body: `docpages-index.json` truncates that page to 1401 characters of 2452 and
drops the Anti-Patterns section, so an index entry is not the page. Enumerating the 2229 as real rows would
not deliver live's surface today, because live's page is the finder filled from the fitment data
set and our table covers 6 makes and 17 models, so 2213 of the 2229 would resolve to a page that
answers nothing. **That last clause is contingent rather than permanent**: it is our table's
coverage talking, and widening it is #308, which is gated on the #234 decision and not on access.
The wildcard finding above is the part that holds whatever is decided.

Probing that tree needs care, and the care is specific. `/tire-search/by-vehicle/honda/zzznotamodel`
returns 200 with the *identical* title to `/tire-search/by-vehicle/honda`, because a bad model falls
back to the make's own title. So a title check reads a nonsense model as a real page, one level
below where the same check works on makes. The field that changes at both levels is the string
`no options available`: 0 on `/honda` and `/honda/civic`, 1 on `/honda/zzznotamodel` and
`/zzznotamake`, with `continental` at 49 occurrences on all four as the control showing the reading
can answer at all. Measured 2026-08-01.
[#444](https://github.com/cloudadoption/contitires/issues/444).

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

**One download on that page is a divergence made ON PURPOSE rather than a gap we have not closed,
and it is the only one in this document of that kind.** Live serves
`Continental-LogoGuidelines_2018.pdf`, 1.8 MB, and we return 404 for it. We could fetch the file.
We are choosing not to serve it. Hosting the document that governs a company's trademark use
asserts an authority this project does not have: it is a proof of concept operated by Adobe, and a
reader who downloads brand guidelines from it is being told, by the act of hosting, that this site
speaks for the brand. A redirect onto `/media` was considered and refused for a different reason,
that it hands somebody who asked for a download an HTML page instead.

Measured with a control rather than asserted: a nonsense media id returns 404 on our host, so the
404 on the real path is a real absence rather than a broken probe, and our `/media` page emits 0
relative hrefs to that file against 25 links on the page. So nothing of ours points at it and no
reader reaches a dead link from our side. What a reader loses is the file, reached from live.
[#465](https://github.com/cloudadoption/contitires/issues/465).

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

### The tire-size help icon, a second divergence made on purpose

**differs by two default values, deliberately.** The drawing is live's. Two colour defaults are not,
and copying live's file byte-exact would have given live's markup and not live's pixels.

`icons/help-circle.svg` is traced from live's own sprite symbol `id=help`: **the path `d` is
character-identical and 12 of 15 attributes match**, checked against live's sprite refetched at sha1
`0969c953` so the source could not have moved under the comparison. The three that differ are two
colour defaults and the attribute carrying them.

**Why byte-exact would have been worse.** `decorateIcons` renders an icon as an `<img>`, and a CSS
custom property does not cross into an image's own document. Live paints this glyph with two CSS
overrides at that spot in its own stylesheet; an `<img>` here cannot receive them. So the file that
matches live's bytes renders the wrong colours, and the file that renders live's colours carries two
different defaults. **The two changed defaults are exactly and only the two live overrides**, which is
what keeps this a divergence in the file rather than in the rendered surface.

An inline alternative was proposed and refused: it would have matched the bytes at the cost of the
authoring path DA's edit canvas supports, which is the same trade recorded one section down for the
chevron sprite.

What a visitor sees: live's glyph in live's colours. What differs is the file, and only where the file
had to differ for that to be true.

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

Five places.

**The footer, on all 327 pages.** Live's copyright line is gone. Two paragraphs stand in its
place: one attributing Continental's content, images and trademarks to Continental, one
stating that this is an Adobe engineering proof of concept, not operated by, affiliated with
or endorsed by Continental.

**The homepage hero.** The eyebrow reads `An Adobe engineering proof of concept` where live
reads `Welcome to`, and the paragraph under the h1 is a disclaimer where live carries a
rebate offer. The h1 itself is unchanged and still matches live.

**The band is taller than live's, and that is this decision rather than a gap.** The height
follows from the disclosure copy: live has no counterpart for those paragraphs, so the box
that holds them has nothing to match. **No change removes the height and keeps the
paragraphs.** Reaching live's number while keeping the disclosure would mean shrinking the
type or the padding until it fits, which is styling a disclosure to a target rather than
letting the copy set its own height, and that is a worse outcome than the difference.
The measurement is deliberately not quoted here: a pixel pair in this document reads as a
delta somebody should chase.

**The promo bar, at the top of every page.** Live promises a rebate on a set of tires.
Ours carries its own copy instead, and that copy is deliberately not live's.

**Any place a commercial claim was removed.** Several pages still carry live's rebate copy,
and if they change, that change belongs here.

**`/promotion`, the page the promo bar links to.** The bar promises a 50-point rebate on a
PageSpeed score for moving four templates to Edge Delivery Services. Its `See full details`
link points here, so this page tells that story rather than live's tire rebate. Reproducing
live's rebate copy here is the defect rather than the fix.

Ruled 2026-08-02, superseding the 2026-07-30 decision to leave the page alone. That decision
predates the bar. Back then no link walked a reader out of a joke and into what reads as a real
offer. As of 2026-08-02 00:20 the page still served `Get a $110 Rebate` with $90 and $200 tiers
and prepaid-card terms, and the rewrite is in flight. This row is the rule, not the page's
current state.

#### The promo bar carries its own copy on every page

The shared fragment was rewritten and published on 2026-07-30, so the bar at the top of every
page now carries this site's own copy rather than live's offer. The homepage had already been
done inline and the fragment was brought into line with it. Checked against the single rule on
the published host: no commercial claim, no assertion of Continental's copyright, no implication
Continental operates the site.

Two details of that change are deliberate and are not defects. The fragment's heading stays one
level below the homepage's, because the bar is injected into pages that have their own heading
hierarchy. Its noindex metadata is untouched.

Three campaign pages keep live's rebate copy. That is a decision, not outstanding work: the human
ruled on 2026-07-30 to leave `/promotion`, `/promotionended` and `/offers` alone.

The single rule asks one thing. Does the site read as a real offer, assert Continental's
copyright, or imply Continental operates it? Site-level disclosure is what answers it. The
footer's proof-of-concept paragraph is on all 327 pages, and this bar is at the top of every
page. With those in place, live's offer copy inside a campaign page is reproduced surface. It
is not an offer this site makes.

That is also why the bar could not keep live's offer while those three pages can. The bar is
the disclosure, so it cannot advertise the thing it discloses.

**The values inside these zones are not quoted here on purpose.** The copy is the human's, it
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

Three block-level divergences closed on 2026-07-30 in
[#369](https://github.com/cloudadoption/contitires/pull/369). The product title reads 30px on
38 at every width the scale has. Its scope is `main:has(.columns.product-hero, .tire-specs) h1`,
which reaches 46 pages and 46 h1 and no others. The specs band switches at 769 and 1025 the way
live does, at 32 / 30 / 42. Article body subheads take live's 400 on h2 and live's 700 on h3 and
h4.

Both product rules were enumerated rather than sampled. 46 of 46 product pages read the new
values at 1440 and at 375, and 21 of 21 authored article h2 read 400 at both widths.

The h3 and h4 half of that fix is declared and cannot be photographed, because no page here
authors either level inside an article body. Its basis is live's own computed style, 700 on
`.news-article__body h3` and on body h4, which is public observation. It lacks a picture rather
than a source.

Three more closed on 2026-07-30. `/experience/partners` no longer prints a heading live does not
have (#354). Authored heading levels now have an owning issue rather than being assumed to fall
under #117, which covers generated DOM only (#355). The four `/media` panel titles are h2 like
live's, and they take live's 24 on 32 under 769 where our global h2 held 30 at every width (#356,
shipped in [#374](https://github.com/cloudadoption/contitires/pull/374)). That last rule is scoped
by `.tabs .tabs-main h2:has(+ .cards)`, which reaches the five panel titles live gives a
counterpart and leaves alone the two it does not.

The line-height was one cause rather than two symptoms. It closed on 2026-07-31 in
[#383](https://github.com/cloudadoption/contitires/pull/383).
[#373](https://github.com/cloudadoption/contitires/issues/373) was the global h2: live sets an
absolute 38 where we computed 1.2 times 30, so 36. That 2px sat behind both the article subhead
gap ([#368](https://github.com/cloudadoption/contitires/issues/368)) and the panel-title reading
above 769. The global now takes live's 38 rather than deriving it from the ratio. The seven rules
that resize an h2 pin their own line box, so the change cannot leak into them.

Counted on live's own stylesheet: line-height is an absolute length 360 times against 63 unitless.
39 of those unitless are a plain `1` on non-heading elements. Deriving one ratio for the whole
heading scale was the shape that did not match, not any single value.

**It stayed invisible because it had a wrong owner rather than no owner.** The 2px was measured
and written down during the `/media` work, then routed to #368, which is scoped to article body
subheads. A panel title is not one, so the delta was filed against an issue that does not cover it
and would have disappeared the moment #368 closed. The scoped line-height that shipped with the
product title is the same cause patched a third time in a third place. A reader should take those
scoped rules as symptoms of #373 rather than as a pattern to copy, because copying them puts the
next heading at 36 behind a fourth scoped rule and leaves the global wrong.

The article template runs the other way. `styles/article.css` pins the default-content h2
and h3 to 20px at every width with no override in its 769 block, so the six h2 on
`/learn/how-do-i-check-my-tire-pressure` read 20px where live's six read 30px above 769.
Live pins 20px only under `max-width: 768`.

What it costs a visitor: headings in default content are still the wrong size in places. At
1440 a reader gets 42px where live gives 30 on `/forwhatyoudo`'s intro sentence, and 20px
where live gives 30 on the six subheads of the tire-pressure article. The product page no
longer inverts live's hierarchy. It heads the page at 30px with the band below it at 42,
which is live's order.

[#368](https://github.com/cloudadoption/contitires/issues/368), the article subheads, closed as
stale on 2026-07-31 without a line of code. Those rules set font-size and font-weight and no
line-height, so the global 38 reached them. 63 of 63 readings across the 9 article-template pages
that author a subhead read 38px on the published host, at all three widths.

What is still open: the article-template SIZES above, a separate defect from the line box, and two
residues the global fix left behind. Both are recorded rather than silent. The pins were set to the value each rule already
rendered, not to live's. What was an accident of a ratio is now a decision in the stylesheet.

[#381](https://github.com/cloudadoption/contitires/issues/381) covers five deltas the fix freezes.
Three block titles keep a 50.4 line box where live gives 48. `.related-articles-title` reads 14.4
where live reads 16. The category tile reads 33.6 where live reads 38 at a size 4px larger.

[#382](https://github.com/cloudadoption/contitires/issues/382) covers nine block titles now
further from live than before, in two shapes. Live steps most block titles to 30 or 36 under
`max-width: 1024` while its global is 38. Our old 1.2 ratio therefore matched live's 36 by
accident at the lower widths. Six of the nine are that case. The other three are a different
shape. Live sizes them at 18px and 12px against our 30px, so the size is wrong at both ends and
the line box follows it.

What has to hold is that a heading can take the level its structure requires without taking a size
live does not use, in both contexts.

Read against the deployed `styles.css` lines 144-149, 168-173 and 260-265, and against live's
`themes/custom/nextcontinental/dist/css/styles.css`. [#185](https://github.com/cloudadoption/contitires/issues/185), [#181](https://github.com/cloudadoption/contitires/issues/181), [#184](https://github.com/cloudadoption/contitires/issues/184).

One correction to the record. [#185](https://github.com/cloudadoption/contitires/issues/185) says two pages skip a heading level.
[`/vancontact-as-ultra`](https://main--contitires--cloudadoption.aem.live/vancontact-as-ultra)
gives h1 then `h3#warranty` and is a real skip; live carries no heading at all there, just a
plain link. `/events` gives h1 then 32 h2 and no h3, so it no longer skips. Its heading was
promoted in the DA write that shipped with PR [#342](https://github.com/cloudadoption/contitires/issues/342).

### Heading line boxes we are leaving different from live

**diverges.** Eleven heading line boxes differ from live's and are left that way on purpose. They
are recorded here rather than left open. A difference nobody decided about looks identical to one
nobody noticed.

**Nine are live's own block treatment and we inherit it.** Live steps most block titles to 30/36
under `max-width: 1024` while its global is 38, across four classes on four pages. Our global 38
therefore reads further from live at 900 and 375 than the old 1.2 ratio did, which had matched
live's 36 by accident. Measured against guardrail 5's clear-error exemption on 2026-07-31: **live
wins on the nine.** The step is a deliberate block treatment and no external standard fails on
live's side. Reproducing it would mean writing nine block rules to match a choice rather than to
correct an error. #382 closed as documented on that reading, not as fixed.

**FOUR BLOCK RULES WERE FROZEN AT WHAT WE RENDERED RATHER THAN AT LIVE'S VALUE, on 2026-07-31 in
#401, and that is a decision rather than an oversight.** Removing `line-height: 1.2` from the shared
heading rule meant every block that pinned a font-size and declared no box would have inherited the
new per-level absolute. Four rules were given an explicit box equal to what the ratio had already
produced, so the reset could not reach them:

| rule | box | headings |
|---|---|---|
| `.cards .cards-card-body :is(h1..h6)` | 21.6px | 11 |
| `.cards.highlights .cards-card-body :is(h1..h6)` | 19.2px | 29, on four pages |
| `.cards.category` above 900 | 38px | 3, the homepage tiles |
| `h4`, `h5`, `h6` globally | 28.8 / 24 / 21.6px | h4 8, h5 and h6 zero instances |

**What is decided here is preservation over parity, and live was not measured for these.** The
values are ours, not live's. Each was chosen so the slice changed nothing it did not intend to
change, which is what let the proof state that 16 headings moved out of 516 at risk. Closing the
distance to live on any of them is open work rather than settled, and nobody has taken the
measurement that would say whether a distance exists.

**The `.cards.category` row is a fixed regression rather than a preserved value.** Its base pin took
those three tiles from live's 38 down to 21.6 above 900 mid-slice, and the 38 restores what both
live and this site already rendered. It is listed here because the rule is now explicit where it
used to be inherited, not because anything diverged.

**Two more are below the threshold at which a rule earns its own existence.**
`.related-articles-title` renders a 14.4px line box against live's 16, which is 1.6px tight on one
title.
`.cards.category` card body renders 4.4px tight under 900, **and its font size is four pixels
larger than live's.** That second one is left for a stated reason rather than an inferred one:
**the line box is not the only delta.** Matching the box alone would not match live, and closing it
needs a size decision that has not been measured.

**Three further rows in the same family were fixed rather than documented, and they are closed.**
`cards.coverage h2`, `article-cards.feature` intro h2 and `tire-rating h2` each took a 42px h2
through the old 1.2 ratio to 50.4 where live sets an absolute 48, the same 48 on each. #381 closed
them in PR #394, merged 2026-07-31, and the same change moved the `article-cards.feature` step off
our 900 onto live's own 1025, because live holds that title to 30/36 under `max-width: 1024`. That
artifact had already been closed twice at global level, h2 to 38px in #373 and h1 to 48px in
#388.

**Two rows are excluded from the comparison and are not gaps.** `.promo-bar-panel-content` is
inside a commercial-claim zone under guardrail 23, where a diff against live is not a finding.
`.search-no-results h2` has no reachable live counterpart, so there is no value to close toward.

What it costs a visitor: on the nine, headings run a 38px line box at 900 and 375 where live runs
30/36. Those blocks are slightly airier than live's. On the two, 1.6px and 4.4px on single titles.

### Two heading margins we are leaving proportional

**diverges.** Live resets heading margins to zero globally and then sets an absolute value per
context. Ours sets `margin-top: 0.8em` and `margin-bottom: 0.25em` on the shared heading rule, and
both are staying. Each was measured and each came back document rather than fix, for a different
reason. The third declaration in that same rule, the line box, was made absolute in #401 and is
covered above.

**The bottom margin does not reach the page.** Adjacent vertical margins collapse, so the gap under
a heading is the larger of the two touching margins rather than their sum. On the one instance
measured, the confidence band, the title's own `margin-bottom` is 7.5px at a 30px size and 10.5px
at 42px, while the paragraph below it asks for 14.4px and 19.2px. What rendered was 14px at 375 and
19px at 900 and 1440, which are the paragraph's numbers. Their sum, 21.9px, rendered at no width.
The band was closed in #401 by pinning live's 8px on the title and opening no box above the
paragraph. Changing the global declaration would not have moved that gap.

**The top margin is wrong in both directions at once.** It survives the cascade on 57 of the 171
headings read here, and on 27 of those it also follows content, which is the case the declaration
is about. Nine of those sit on two pages at three widths. On `/legal` live reads 45px against our
24px, so ours is 21px tight. On `/vancontact-as-ultra` live reads 16px against our 24px, so ours is
8px loose. No single absolute replaces the ratio while the error points both ways, and live's own
`margin: 0` would take `/legal` from 21px out to 45px out.

**What it costs a visitor:** on the bottom margin, nothing, because it does not render. On the top
margin, 21px of missing space on `/legal` and 8px of extra on `/vancontact-as-ultra`, and adopting
live's rule would make the first of those worse.

### Live opens headings and paragraphs with a leading break

**differs.** Live authors a literal `<br>` as the first child of a heading or paragraph. It
renders an empty line box above the text and buys vertical space. This site does not use the
device, so our article rhythm is tighter than live's.

On `/learn/how-do-i-check-my-tire-pressure` live uses it eleven times: two of its six body h2,
"Conclusion" and "FAQs", plus nine paragraph openings. The seventh h2 on that page is chrome
rather than a subhead. On a heading live's box is 76px against our 38, at the same 38px
line-height on both sides. The line-height matches; the extra box is the empty first line.

**This is not a live error, and that distinction is what guardrail 5's exemption turns on.** A
spacing device used eleven times on a single page is deliberate, or at minimum arguable, and live
wins where it is arguable. So it is recorded here rather than fixed against live's markup.

What it costs a visitor: our article reads denser than live's. The text is unaffected and no
heading is missing.

What would close it: author the same break in DA on the pages that want it. That is a content
change rather than a code one, under guardrail 6. Deciding against it is also a legitimate
answer, since the device is live's typography rather than its structure.

**Scope beyond that one page is UNMEASURED.** The count above is one article. Live's use of the
device on the other 223 article-template pages has not been checked. Do not read eleven on one
page as a site-wide figure.

### The hero content cap, which changes no wrap

**diverges.** Our `.hero-content` caps at 640px where live's marquee reaches 860px. The cap is
staying, because it was measured over the whole population it reaches and it changes what a reader
sees on no page.

**The population is 15 pages, established over the authored markup of all 327 indexed paths.** 36
hero blocks on 32 paths, 20 carrying the `left` class token, and 15 of those with a title. `.hero
.stacked` is `max-width: none` and the `.hero.stacked.left` cap only applies from 1025, so `/` and
`/experience` measure an 860 box at 900 and 576 at 1440. `hero breadcrumb title-left` is outside
the population, because the selector needs the token `left` and `title-left` is a different token,
which drops `/experience/conti-crew`.

Natural single-line width against the rendered `h1` box, on all 15:

| width | pages where the cap changes the wrap |
|---|---|
| 900 | **0 of 15**, widest natural is `/learn` at 486.6 in a 576 box |
| 1440 | **2 of 15**, `/learn` at 681.2 and `/` at 621.2 |

**Both of the two resolve to no fix.** `/` is a guardrail 23 zone: live's `h1` reads "Welcome to
The Smart Choice In Tires" and ours reads "THE SMARTEST CHOICE IN TIRES", so the two are not
comparable by design. `/learn` wraps to two lines on both sides at 1440, ours 681.2 natural in a
576 box against live 860.8 natural in a 736 box. **Live needs the wider box to reach the same two
lines because it tracks at 6px and we do not track at all**, which is #407 rather than this.

**What it costs a visitor:** no measurable difference at 900 or 1440. The cap is 220px narrower than
live's and no title in the population is long enough for that to force a different number of
lines.

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

### Authored heading levels do not follow live's

**differs.** The generated headings now follow the page outline. What is left is authored: pages
open at a level live does not use.

**The generated half closed on 2026-07-30 in [#376](https://github.com/cloudadoption/contitires/pull/376).**
`blocks/article-cards/article-cards.js` had built an h3 with nothing between it and the page h1,
and `blocks/perfect-fit/perfect-fit.js` had built an h4 two levels under the modal heading. The
card title now takes h2 under the banner h1 and the result title takes h3 under the dialog's
question. The same block had copied the article title into the card image alt where the title is
already the visible link text; that alt is now empty, enumerated across 52 of 52 instances.
Measured on the branch preview before the merge, `/learn/tips` read accessibility 100 on both
strategies against 98 before, with heading-order the single failure it had.

**The authored half is open.** Nine headings on the homepage are authored h3 where live uses h2
([#371](https://github.com/cloudadoption/contitires/issues/371)), and eight learn articles author
their subheads as h2 where live uses h3 or h4
([#372](https://github.com/cloudadoption/contitires/issues/372)). Both were found by the sweep
that #355 asked for, which paired all 327 pages against live with status and title gated on each
side.

None of the generated part was ever visible to curl. `/learn/tips`, `/learn/technology` and
`/learn/news-and-events` each serve exactly one heading in their markup, an h1, so the rest is
built client-side and only a browser sees the outline. The authored part is the opposite: it is
in the document and a curl reads it.

What it costs a visitor: a screen reader hears an outline that jumps a level on the pages in
#371 and #372. It no longer hears each card title twice.

What would close it: re-level the authored documents in DA. It is content rather than code, which
is guardrail 6's rule about where a content defect gets fixed.

### Product labels are static text where live's are a disclosure

**differs.** Live wraps each product label in a toggle a keyboard can open. Ours is text on the
page. This is one where live is ahead.

Live authors `Best for` and `Technology` as `h2.text-cta` inside a
`<con-details class="tire-page__column-section">`. That toggle swallows the heading: live's
accessibility tree exposes a **button**, not a heading. Read off `/tires/4x4contact`, line 128 is
`uid=7_125 button "BEST FOR"` and line 135 is `uid=7_132 button "TECHNOLOGY"`, with no heading
node for either. The control that gives that meaning is that live's tree does expose 18 heading
nodes on the same page, including the h1 and the specifications h2, so the tree reports headings
and these two are not among them.

This site authors the same labels as `p > strong` on 45 of its 46 product pages and as `h2` on
one, `/vancontact-as-ultra`. Counted on each product page rather than sampled: 45
paragraphs and 1 h2 for `Best for`, and 33 paragraphs, 1 h2 and 12 absent for `Technology`. Our
tree reads `StaticText` for both.

**The visible surface matches and the behaviour does not.** A 12px bold uppercase label looks the
same whether it is a paragraph or a heading, and the label styling now matches live on both
labels. What live has and this site does not is a focusable disclosure per section, so a keyboard
or screen-reader user can move between the sections and open them. Here they are static.

**Promoting our paragraphs to headings would not close this and would open something worse.** It
would give this site's readers a navigable heading that live's readers do not get,
which is a difference from live rather than a match, however much it reads like an improvement.
The gap is the disclosure, not the heading level.

What it costs a visitor: a screen-reader user gets no per-section control on a product page and
reads the sections as continuous text. A sighted visitor sees the same thing on both sites.

What would close it: build the disclosure, which is a block change rather than an authoring one,
and it has no issue because nobody has asked for it.

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

Two of the three things that made the suite prove less than it looks are fixed. #317 and #318
closed in PR #392 on 2026-07-31: an absence assertion whose actual value is a DOM element no
longer hangs the runner for 120 seconds, and the 25 test files that requested 67 distinct 404ing
URLs on every run no longer do, so a real 404 is no longer buried in yellow.

**The third is open and it is the one that can hide a production defect.** Fixtures are built in
the authored shape rather than the delivered shape, so a block can pass its suite and still drop
content in production.

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

Five things are open, and each one names what would close it. They are here rather than
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

**A band none of our readings sample, which is a fact about the measurements rather than about
any one page.** Every width in this document is 375, 900 or 1440. Live's tire card steps from
column to row at `max-width: 768` where ours steps to a grid at 600, so the two agree below 600
and above 768 and differ only between them. No sampled width falls in that band, so that
difference is invisible to every reading taken here, including the readings that closed issues.
It was found by measuring the stylesheets rather than by looking. The card itself is
[#423](https://github.com/cloudadoption/contitires/issues/423). The same band caught a second thing
within the hour: live's small heading pair includes 768, so a step at 768 renders our large size at
the one width live is still small. That is the `769` boundary in
[#405](https://github.com/cloudadoption/contitires/issues/405). What would close it: a reading at a
width between 600 and 768. **This is true after both are fixed, because it describes what three
sampled widths can and cannot see.**
