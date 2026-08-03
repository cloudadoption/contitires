# Parity with continentaltire.com

This is an AEM Edge Delivery Services rebuild of continentaltire.com, served at
<https://main--contitires--cloudadoption.aem.live/>. It is an Adobe engineering proof of concept
rather than Continental's site.

The document records where the rebuild stands against live. Readings are taken on the published
host against continentaltire.com at the widths each row names.

It comes in two parts. Part one is where the two sites differ. It gives what live does, what this
site does, the numbers with their widths, and for a gap what access would close it. Part two is
where they agree, and it gives the value both sides read, which is what a later reader checks
against when something drifts. A row belongs to one part or the other, and links to the section
holding its detail.

## Where this site differs from live

**differs** is a difference work could close. **diverges** is a difference this site chose, where
matching live would reproduce one of live's own defects or break a standard this project keeps.
**approximated** means a visible stand-in for something out of reach, and the section says what the
stand-in rests on. **absent** means live has it and this site does not. **not knowable from
outside** means live resolves it through a system its public pages do not expose.

The last column says whether the difference closes. ⏳ is work that could close it. ✅ is a
difference that is decided and staying. ⚙️ needs something from inside live that the public site
does not hand out, such as an API, a vendor account or an index configuration. It marks a gap this
side cannot close as against one it can.

| Bucket | Item | State | Will it be fixed |
|---|---|---|---|
| Navigation and routing | [Redirects come from a sheet](#redirects-come-from-a-sheet-not-from-server-rules) | differs | ✅ the difference in kind does not close. A row is one literal case-sensitive path, so 46 rows cover the specs paths one live rule covers, and one live path has a character the CDN refuses before routing runs |
|  | [Live's sports sub-nav points at two dead URLs](#lives-sports-sub-nav-points-at-two-dead-urls) | diverges | ✅ two of live's three tabs 404 where the three here answer 200 |
|  | [Year tabs land on our heading ids](#year-tabs-land-on-our-heading-ids-not-lives) | differs | ✅ live's document declares `id="year2021"` where ours declares the pipeline's generated id; the jump row aliases live's fragment onto the section for that year |
|  | [Absolute links back to live](#absolute-links-back-to-live) | differs | ⚙️ 85 links on 6 pages, and the residue is `/media`'s 74 press-kit zips plus live's 1.8 MB PDF, which need a host the content bus does not serve |
|  | [Duplicate addresses](#duplicate-addresses) | differs | ✅ live serves ten articles at two addresses and links the second from inside its own body. What is ours is which of the two each route picks, and 9 of the 10 pairs differ in length, 5,223 bytes against 4,754 on the rotation article |
|  | [Header, mega menu and footer](#the-header-mega-menu-and-footer) | differs | ⏳ the open TIRES panel stands 381.8 tall against live's 433 and starts its content at x=88 against x=42. From 769 to 899 the footer lays two columns where live lays three, 1,044 tall at 830 against 761 |
| Product pages | [Product data is a published workbook](#product-data-is-a-published-workbook-not-a-request-time-backend) | approximated | ⚙️ live computes per request, so rebates, a live store call to action and warranty state are out of reach |
|  | [One technology description differs on three pages](#one-technology-description-differs-on-three-pages-because-a-sheet-holds-one-row-per-technology) | diverges | ✅ the sheet has one row per technology, so the majority wording matches live on 11 product pages and differs from it on 3 |
|  | [Fit by size](#fit-by-size) | differs | ⏳ live's by-size URL form cannot be re-derived, and what would settle it is a live page that links a by-size result |
|  | [sContact's spare sizes and the size control](#scontacts-spare-sizes-and-the-size-control) | differs | ⏳ live writes three spare sizes with a leading `T` and a space. The sheet keeps one of the three and drops the `T` from the other two, so width 135 reaches no size control |
|  | [The finder's question heading is wider than live's](#the-finders-question-heading-is-64px-wider-than-lives) | diverges | ✅ 1,136 from x=152 against live's 1,072 from x=184 at 1440, and identical 728px boxes at 768. Both sides centre the text, so the ink lands from 615.64 to 824.36 on each |
|  | [Individual reviews and Q&A](#individual-reviews-and-qa) | absent | ⚙️ the review bodies, the Q&A and the moderation state are in Continental's Bazaarvoice account. The aggregate here reads live's own 4.6 over 1043 |
|  | [Live's specs pages redirect onto our product page](#lives-specs-pages-redirect-onto-our-product-page) | differs | ⏳ the URL resolves, 301 then 200 on the product page. Live's size search, print control and all-sizes accordion are not rebuilt, so four sizes cannot be read side by side here |
| Search | [Search ranking](#search-ranking-rebuilt-against-lives-results-rather-than-its-index) | approximated | ⚙️ needs live's Solr schema, field weights and exclusion list, which are configuration in an admin |
|  | [How many results a query returns](#how-many-results-a-query-returns) | differs | ⚙️ live's exclusions are Solr index configuration. `tire` returns 302 here against live's 215, and `ev` 9 against 0 |
|  | [No sort control on the results page](#no-sort-control-on-the-results-page) | absent | ✅ relevance is the order this site already renders, and no data here can honour Date: the 219 learn timestamps fall on three publish days |
|  | [The results band reserves height live does not](#the-results-band-reserves-height-live-does-not) | diverges | ✅ the floor keeps the band's bottom at the fold and buys CLS 0 in seven readings where live runs to 0.4047 |
|  | [Our class names are kebab-case where live's are BEM](#our-class-names-are-kebab-case-where-lives-are-bem) | diverges | ✅ `stylelint-config-standard` accepts kebab-case only, so no selector here is written BEM-style. A visitor sees the same elements styled to the same values |
|  | [Product JSON-LD is written in the browser](#product-json-ld-is-written-in-the-browser) | differs | ✅ the delivery model rather than the block. A curl of `/tires/4x4contact` reads 1 `ld+json` script on live and 0 here, and a crawler that executes JavaScript reads ours |
|  | [Store and dealer lookup](#store-and-dealer-lookup) | absent | ⚙️ needs a dealer database and a geocoder, and neither is published |
| Forms and third parties | [Tag management and analytics](#tag-management-and-analytics) | absent | ⚙️ needs live's GTM container id and the accounts its 149 tags report into |
|  | [What live's tags report into](#what-lives-tags-report-into) | not knowable from outside | ⚙️ needs the GA4, Bing and ad accounts behind the tag ids |
|  | [Cookie consent](#cookie-consent) | absent | ⏳ live's wording and its `/privacy` link read off its own pages, so a delayed-phase block draws the visible half |
|  | [Bazaarvoice](#bazaarvoice) | absent | ⚙️ review bodies need the account, not the script tag |
|  | [EmbedSocial](#embedsocial) | absent | ⏳ the loader, the container div and both hashtag refs read off live's source, so a delayed-phase block draws the frame. Live's band on `straight-pipes` is a 1440x694 iframe |
|  | [The newsletter form](#the-newsletter-form) | diverges | ✅ both sides embed the same HubSpot portal. Live requests the embed 54ms into the page and ours at 3.07s from the delayed phase, into a shell reserved at live's own 1,176px |
|  | [The sponsorship form](#the-sponsorship-form) | differs | ⚙️ 19 authored rows build live's field shape with the submit disabled and a note saying why. A submission needs a receiver, and live's is a Drupal endpoint on a host we do not own |
|  | [Vehicle and plate lookup](#vehicle-and-plate-lookup) | approximated | ⚙️ a plate resolves through a registration lookup live buys. Live's fitment tree answers an unauthenticated GET, and the ruling is that this site does not harvest a host it does not own, so the gap cannot close rather than waiting |
|  | [Finder results render in the panel](#vehicle-and-plate-lookup) | differs | ✅ live serves a page per make and per make-and-model, `/honda` and `/honda/civic` both 200 where both 404 here. The platform's own guidance puts a dynamic result in a panel, and the limit is ours |
|  | [The finder modal's own chrome](#the-finder-modals-chrome-sits-in-a-shadow-root) | not knowable from outside | ⚙️ live's modal is an empty custom element, so its padding and its close button are in a shadow root and in neither live's markup nor its stylesheet. Our step is at 900 where live's boundary is 768 |
|  | [Real user monitoring, ours only](#real-user-monitoring-ours-only) | diverges | ✅ a 1 percent sample goes to Adobe's collector; live measures through GTM instead |
| Media and assets | [Web fonts hotlinked from live](#web-fonts-are-hotlinked-from-live) | differs | ⚙️ five `@font-face` rules on the deployed host point at four woff files on continentaltire.com, so this needs a font licence and four files of its own |
|  | [PDFs and press-kit downloads](#pdfs-and-press-kit-downloads-are-on-lives-host) | differs | ⚙️ the content bus does not serve zips, so the 74 packs need zip support, a re-cut, or a third host |
|  | [Leftover originals in DA](#leftover-originals-in-da) | differs | ⏳ 182 files and 512.4MB are under a prefix that 39 products sheet rows also point into, and DA's unpublished documents do not read from outside |
|  | [The gallery caption takes a level live does not](#the-gallery-caption-takes-a-level-live-does-not) | diverges | ✅ one level per caption, which is live's on each card but the leading one, and it leaves no heading skip on the seven pages |
|  | [The tire-size help icon](#the-tire-size-help-icon-differs-by-two-file-defaults) | diverges | ✅ the path `d` is live's character for character. Two custom-property defaults are ours, because a property cannot cross into the `<img>` an icon renders as |
|  | [The chevron sprite](#the-chevron-sprite) | approximated | ✅ live uses a sprite reference; DA's edit canvas strips the empty span an authored icon needs, so the glyph is inlined as a data URI |
|  | [The default share image](#the-default-share-image-is-re-encoded) | diverges | ✅ live's artwork at live's 1200x630, re-encoded: a 17,058-byte PNG against live's 46,926-byte JPEG, because the pipeline hardcodes a `.png` path and the code bus types a file by its extension |
|  | [The media gallery](#the-media-gallery-keeps-two-details-of-its-own) | diverges | ✅ two details are ours: the arrows here are labelled where live's have no accessible name, and the count follows the scroll where live's follows its own slide index |
| Content and editorial | [Thirteen product page titles are not live's](#thirteen-product-page-titles-are-not-lives) | differs | ⏳ a `Title` value per page in `metadata.json`. `/tires/purecontact-ls` heads "Continental PureContact LS Tires \| Luxury All Season Tire" on live against "PureContact LS Tires \| Continental Tire" here, and 33 of the 46 read live's own |
|  | [The result range is cumulative from the second batch](#the-result-range-is-cumulative-from-the-second-batch) | diverges | ✅ after one press ours reads `1-20 of 150` where live reads `11-20 of 148`, on 20 cards either way, because live replaces its pager wholesale |
|  | [Live swaps its pill row for a jump menu](#live-swaps-its-pill-row-for-a-jump-menu-below-its-breakpoint) | diverges | ✅ live serves the select on its three news listings, and choosing an option moves the page without announcing it. The three pills fit at 375, 304.1 inside the 335 the container leaves |
|  | [The warranty group opens with words rather than live's logo](#the-warranty-group-opens-with-words-rather-than-lives-logo) | differs | ⏳ both sides list the same three items in live's order. Live labels the group with its `tcp-logo` where this one opens with the words |
|  | [Card teaser text](#card-teaser-text) | approximated | ⚙️ live's teaser is an unpublished field. A derived excerpt agrees with it on 141 of 145 articles |
|  | [Listings behind a service, authored as snapshots](#listings-behind-a-service-authored-as-snapshots) | approximated | ⚙️ live publishes no feed, so six lists are authored content and drift as live adds to them |
|  | [Three articles this site has and live does not](#three-articles-this-site-has-and-live-does-not) | differs | ✅ `/learn/news-and-events` reads 150 against live's 148 and `/learn/tips` 48 against 47. The surplus is ours, and no live article is missing here |
|  | [Commercial claims and operator identity](#commercial-claims-copyright-and-operator-identity) | diverges | ✅ this site may not make a commercial claim, assert Continental's copyright, or imply Continental operates it, so five places deliberately do not match live |
| Layout and type | [The heading scale](#the-heading-scale) | differs | ⏳ the global scale reads live's 30/30/24 below 1025 and 42/30/24 above. Block-prefixed headings set their own sizes, and the line boxes apart from live's are the row below |
|  | [Heading line boxes we are leaving different from live](#heading-line-boxes-we-are-leaving-different-from-live) | diverges | ✅ live steps a block title's box to 36 under 1024 where the global here is 38, on 28 of the 42 line-height declarations in its 1024 blocks. Two rules have a measured distance, 1.6px on `.related-articles-title` and 4.4px on the category tile below 900 |
|  | [Two heading margins we are leaving proportional](#two-heading-margins-we-are-leaving-proportional) | diverges | ✅ the bottom margin collapses, so it does not render. The top margin is 21px tight on `/legal` and 8px loose on `/vancontact-as-ultra`, so no single absolute fits both |
|  | [Live opens headings and paragraphs with a leading break](#live-opens-headings-and-paragraphs-with-a-leading-break) | diverges | ✅ 18 of live's 219 learn articles use the device and both of its heading uses are on one page, which makes it per-article authoring rather than live's type system |
|  | [The hero content cap, which changes no wrap](#the-hero-content-cap-which-changes-no-wrap) | diverges | ✅ 640px where live caps its marquee copy nowhere, over the 22 blocks on 20 paths the cap reaches, and no title in the set wraps to a different number of lines |
|  | [The marquee band on two pages](#the-marquee-band-on-two-pages-where-a-min-height-cannot-reach-lives-number) | diverges | ✅ live's band on `/all-new-securecontact-aw` follows its own width off a 3:1 video, 251, 426 and 480 across three widths against a two-value 220 and 440 here. On `/ev-compatible` live's section reads 360 and its container 440 |
|  | [The hero band below the step on three divided pages](#the-hero-band-below-the-step-on-three-divided-pages-where-lives-height-is-its-own-copy) | differs | ⏳ live's authored breaks in two titles. `/events` reads 352 against live's 370 at 375 and 316 against 370 at 900, `/experience/soccer` 366.39 against 384 and 308.8 against 332 |
|  | [The Learn tab row runs taller than live's](#the-learn-tab-row-runs-taller-than-lives) | differs | ⏳ 55.19 tall at 1440 against live's 41. The type on the row is live's to the value and the box around it is not |
|  | [The sports h1 box runs the content width](#the-sports-h1-box-runs-the-content-width) | differs | ✅ 1,400x48 at x=20 against live's 833.73x48 at x=303.13. Live's box is a flex item sized to its content, and the title's own rects land at the same x and y on both |
|  | [Breakpoints](#breakpoints-half-of-them-lives) | differs | ⏳ 24 block rules step at 900 and 6 at 600. Of live's 982 media queries, `min-width: 900px` appears once and 600px in zero |
|  | [The article body shift](#the-article-body-shifts-up-51px-after-first-paint) | differs | ⏳ a mobile audit reads a 51px jump at 142ms and CLS 0.146 where three unthrottled loads at the same 412x823 read CLS 0. The cause is not found |
|  | [Prose link underlines](#prose-links-carry-an-underline-live-paints-transparent) | diverges | ✅ live paints its underline transparent, and a link marked by colour alone fails WCAG 1.4.1 |
|  | [The hero copy inset above the step](#the-hero-copy-inset-above-the-step) | differs | ⏳ 32px each side at 1440 against live's 64, so a title begins 32px further left. Live's per-variant block padding is unread |
|  | [Superscripts](#superscripts) | diverges | ✅ same size, lift and line box as live, without live's `display: inline-block`, which keeps a product name one word to a screen reader |
| Performance and accessibility | [Lighthouse, both sides on one instrument](#lighthouse-both-sides-on-one-instrument) | differs | ✅ mobile performance reads 96 to 98 here against live's 58 to 74, and accessibility 100 against 84 to 93, both columns off one runner |
|  | [Product labels are static text where live's are a disclosure](#product-labels-are-static-text-where-lives-are-a-disclosure) | differs | ⏳ build the disclosure. Live wraps each label in a toggle a keyboard can open, and this is one where live is ahead |
|  | [Delivered HTML weight](#delivered-html-weight) | differs | ✅ the delivery model, and it buys the reader something. The homepage ships 23,266 bytes against live's 123,748, and `/tires` 4,411 against 122,032 |
|  | [Security headers](#security-headers) | differs | ⏳ the lever is the `headers` object in the site configuration. `head.html` reaches one node and `metadata.json` has a five-name allowlist, so neither missing header can be sent from this repo |
|  | [The block picker's load](#the-block-pickers-wait-belongs-to-a-hosted-component) | diverges | ✅ the wait is Adobe's hosted `sidekick-library` module, 121KB brotli and 952KB of JS parsed before it draws. This site's 24 sample fetches cost about 100ms of the 3,500 |
|  | [The annotated tire diagram](#the-annotated-tire-diagram) | diverges | ✅ live hides its eight ring labels below 1181 and its rings are divs with a click handler, out of keyboard reach. This site prints live's own words under the drawing |

## Where this site matches live

Each row gives the value both sides read. Where the two reach it from different declarations, the
section says how.

| Bucket | Item | The value both sides read |
|---|---|---|
| Search | [The result URL and its pager](#what-matches-in-search) | `?keywords=` with a zero-based `&page=`, ten results a page and a pager window of nine numbers. Relevance is the order each side opens in |
| Forms and third parties | [The newsletter receiver and the finder bar's step](#what-matches-in-forms-and-third-parties) | A submission reaches HubSpot portal 48908421 from either side, and the finder bar goes to a column at live's 768 boundary |
| Media and assets | [Gallery geometry and the assets behind it](#what-matches-in-media-and-assets) | `/tires/truecontact-tour54` draws a 746x1129 gallery at x=152 on 363px tiles at 1440, live's box to the pixel, with six more readings under it |
| Content and editorial | [Page titles and meta descriptions](#what-matches-in-content-and-editorial) | The homepage heads `Truck Tires, SUV Tires, Commercial Tires & More \| Continental Tire` on both, and its description matches byte for byte, live's own typo included |
|  | [og:title on 46 of 46 product pages](#what-matches-in-content-and-editorial) | The plain product name, `PureContact LS` on `/tires/purecontact-ls`, from a `metadata.json` row per product |
|  | [Listing counts and pagination](#what-matches-in-content-and-editorial) | `1-10 of N results` above a load-more, 10 rows to a batch, and `/learn/corporate` reads `1-10 of 11 results` over 11 cards on each side |
|  | [A card for each article, imageless rows included](#what-matches-in-content-and-editorial) | 17 of the 219 learn rows have no index image and each draws a card, so `/learn/corporate` renders 11 against 11 and `/learn/news` 129 against 129 |
|  | [The homepage carousel](#what-matches-in-content-and-editorial) | Seven slides a side, the same subjects in the same order, TerrainContact A/T 2 through to the closing customer review |
| Layout and type | [The article h2](#the-article-h2-reads-lives-value-at-every-width-measured) | 20px on a 38px box at 375, 30px on 38 at 900 and 1440, weight 400, on six of six authored subheads. The 20px below 769 is live's own pin and the 30 above is live dropping it |
|  | [The hero content inset below the step](#the-hero-content-inset-below-the-step-is-lives-on-every-variant) | 20px each side below 1025, on each marquee variant. Live declares it once as a margin on `.marquee__container`; this side reaches it from a base rule measured as `padding: 28px 20px` |
|  | [The content container](#the-content-container) | `max-width: 1168px` with `padding: 0 16px` on `border-box`, so 1,136 of content at x=152 at 1440. Live's is `73rem` with `1rem` padding on a 100 percent root |
| Performance and accessibility | [Authored heading levels](#what-matches-in-performance-and-accessibility) | Below the h1 the homepage takes h2 and no deeper level on either side, and the eight learn articles with an authored subhead read live's own level, h3 on five and h4 on three |
|  | [The font request at any width](#what-matches-in-performance-and-accessibility) | `styles/fonts.css` is a head stylesheet link with three woff preloads beside it, at any viewport, which is the render-blocking position live's five `@font-face` rules take |

## Navigation and routing

### Redirects come from a sheet, not from server rules

**differs.** Live matches a redirect by shape. We match a literal path.

Live serves its redirects as server rules, so one rule covers a family of paths. `/ev-ready` 301s
to `/ev-compatible`, `/node/3564` to `/experience/sports`, and nine `/taxonomy/term/<id>` paths
reach their real page the same way.

Ours is a spreadsheet of 76 source paths, one row each. 46 of those rows are a single
`/tires/<product>/specs` path where one live rule would cover the shape. Nine are a taxonomy id,
three a node id, three a `/news/` slug. The match is case-sensitive, so `/Store-finder` and
`/store-finder` take two rows. The sheet grows with the catalogue where live's cost is flat, and
that is the part no work closes.

Two of live's paths cannot be reached with a row at all. The first,
`/news/what-contact-patch-your-car’s-footprint`, has a right single quotation mark, U+2019, and
our CDN refuses it before site routing runs: 404 with `x-error: Unsupported characters in path`
and a 13-byte body. Live answers 200. It is a character class rather than one path, because an
invented path with the same character draws the identical refusal and the sheet is not consulted
either way. That link does not arrive.

The second, `/media/929/download`, is not a page. Live serves 1,840,182 bytes of PDF there. It needs
a host, not a redirect row.

The paths the sheet does hold resolve. An external link, a bookmark or a search result lands on the
right page, and `/store-finder` 301s to `/online-retailers` as authored.

### Live's sports sub-nav points at two dead URLs

**diverges.** Two of live's three tabs 404. Ours point at the pages they name.

On live's `/experience/sports` the tab strip links Partners to `/taxonomy/term/57` and Conti crew
to `/taxonomy/term/139`. Both 404 on live, 47,985 and 47,986 bytes, each titled "Page not found".
The middle tab reaches a page, and live marks it `aria-current="page"`.

Ours points the three tabs at `/experience/partners`, `/experience/sports` and
`/experience/conti-crew`, all 200, and `blocks/category-tabs/category-tabs.js` puts
`aria-current="page"` on the tab matching the path. The two taxonomy paths 404 here as well.

Reproducing live's two dead links would copy a defect, so this one should not close. A link diff
against live flags ours as the difference, and ours is the side that works. The row exists so the
tabs do not get re-pointed at `/taxonomy/term/*`.

### Year tabs land on our heading ids, not live's

**differs.** Live's section ids are authored. Ours come from the pipeline.

Live's `/cruisingthecontinentalus` tabs are `href="#year2021"` and `href="#year2020"`, and its
sections use those ids. Our delivered document has three generated heading ids,
`#the-2021-cruising-the-continental-us-road-trip`, its 2020 twin and the h1's, and the jump row
points at those. The tab row then adds `year2021` and `year2020` to the two sections for those
years. Live's fragment form resolves against our page, and the generated ids are untouched.

Neither side marks a year tab current. `category-tabs` compares an anchor's pathname to
`location.pathname`, and a fragment matches no pathname, which is where live lands too.

### Absolute links back to live

**differs.** Six pages link out to continentaltire.com, 85 links between them, and 84 of those
point at a file rather than a page.

`/media` has 75: 74 press-kit `.zip` downloads and live's 1.8 MB PDF.
`/customer-support/technical-documents` has 5 PDFs, `/warranty` 2, and `/promotion` and
`/promotionended` one each. The other 323 published pages are clean.

What those 84 need is a host, not a rewrite. Edge Delivery serves no `.zip` from the content bus,
so the press kit is on live's host until the archives live somewhere else. The nine PDFs are an
asset migration.

One of the 85 is a page. The campaign article points at live's `/my-first-car-my-first-tires`,
which answers 200 here, so a rewrite would fix that one.

### Duplicate addresses

**differs.** Ten articles have two addresses and nothing says which one is the article.

13 published paths end in `-0`, and 10 of them have their base twin published as well, with the
same title on 8. The duplication is live's own, because it serves the same article at both
addresses. On both sides the `<link rel="canonical">` names whichever address was requested, so
neither twin defers to the other.

What this site adds is which of the two a route picks. The redirect row for live's
`/news/how-tire-rotation-can-extend-life-your-tires` lands on the bare path, while 17 learn
articles link a `-0` twin from inside their bodies. The two bodies are different text: 5223 bytes
on the bare rotation article against 4754 on its `-0`, and 9 of the 10 pairs differ in length. A
reader arriving from outside and one arriving from a link inside the site read different articles.
Both are real.

### The header, mega menu and footer

**differs.** The open mega panel runs shorter than live's and insets its content further, and the
footer takes a different number of columns in two bands.

At 1440 the open TIRES panel paints `rgb(0, 0, 0)` on both sides, and both draw live's three line
glyphs, 25 by 25 in `#ffa500`, left of the finder entries. Ours stands 381.8 tall against live's
433, and starts its content at x=88 where live starts at x=42.

Our footer columns cap at 1264 with 32px padding and a 32px grid gap. Six 160px tracks therefore
need 1120px of content width and first fit at a 1184 viewport. Live fits six earlier: at 1120 it
lays six and stands 529 tall where ours lays three 200px tracks and stands 758.

From 769 to 899 ours lays two columns where live lays three, so at 830 our footer runs 1044 tall
against 761. The same shows where both sides collapse to disclosure rows: 790 against 704 at 768,
and 812 against 704 at 599. Matching live in the band above that means letting the footer overflow
the container its own columns are capped to. Live's footer does that. Ours does not.

## Product pages

### Product data is a published workbook, not a request-time backend

**approximated.** Live computes per request against a system the public site does not expose. We
publish a sheet, and what the sheet cannot do is visible.

Live's product pages read from a backend. What that backend has and what it computes per request is
not readable from outside, and the rendered page is the only evidence of either.

Our catalogue is one authored workbook at `/products.json`. The products sheet has 46 rows, catalog
46, technology 14, and specs 1656 rows covering 483 distinct sizes. The listing, its 11 category
pages and the product pages read from it. A query against it needs an explicit limit: the default
is 1000, so an unlimited fetch reads 1000 rows and under-reports the specs sheet in silence.

What it costs a visitor: whatever live resolves per request is out of reach. Rebates, a live store
call to action and warranty state are in that group. A sheet is published state, right as of its
last publish, and it cannot be current the way a request-time lookup is.

What would close it: no reading from outside, which is the point of the row. The workbook is the
honest substitute rather than a temporary one. What it buys is that an author edits the catalogue
and republishes with no deployment.

### One technology description differs on three pages, because a sheet holds one row per technology

**diverges.** Live's own text for `Self Supporting Runflat*` is inconsistent between its pages. 11
of its product pages end the description `when the tires are deflated.\` with a stray backslash,
and 3 end it without one. The other 32 do not name the technology.

Our `technology` sheet has one row per technology, which cannot hold both endings. The row keeps
the majority wording with live's backslash. That matches live on 11 pages and shows a character
live does not show on `/tires/4x4contact`, `/tires/crosscontact-rx` and `/tires/sportcontact-6`,
where our copy is in the technology tooltip on the product hero.

The content model forces a divergence and only its size is a choice. The other row differs from 11
pages instead of 3. Normalising to neither ending is not available, because one row is what the
sheet has.

What it costs a visitor: one backslash inside a tooltip on three product pages.

### Fit by size

**differs.** We answer by size out of the specs sheet. Live's by-size URL form cannot be
re-derived.

The specs sheet has 10 rows for `235/40 R 18` across 6 product slugs, and sizes are written with
spaces in that form. Live's own by-size entry point is not linked from its pages. `/tire-search`
links `/tire-search/by-vehicle` and no by-size counterpart, and `/tire-search/by-size/235-40-18`
404s. What would settle it is a live page that links a by-size result.

#### sContact's spare sizes and the size control

Live writes each of sContact's 25 sizes with a leading `T` for a temporary spare, three of them
with a space after it: `T 135/70 R 18`, `T 145/85 R 18`, `T 165/80 R 17`. Our sheet keeps
`T 135/70 R 18` as live writes it and drops the `T` from the other two.

`parseSize` in `blocks/perfect-fit/perfect-fit.js` accepts an optional `LT` or `P` and no other
prefix, so a `T` row reaches no size control, and `scripts/products.js` strips the space before it
runs. Our control offers 29 widths, 21 bare and 8 `LT`. Width 135 is absent, because its rows carry
a `T`. Width 145 is present from the de-prefixed sContact row alone, which is the one place a spare
size reaches a control meant for road sizes.

#### The finder's question heading is 64px wider than live's

At 1440 on the By Tire Size tab our question heading box measures 1136 from x=152 and live's 1072
from x=184. Both set the type at 24px. The rendered text occupies 615.64 to 824.36 on both sides,
because live insets its heading 32px inside a panel both sides run at 1136 wide. At 768 the two
boxes are identical, 728 from x=20, with the ink from 279.64 to 488.36.

So a visitor comparing the two pages sees the words in the same place. The delta is recorded rather
than fixed for that reason.

### Individual reviews and Q&A

**absent.** Live gives most of its product page to reviews. We render the aggregate by itself.

Live's `/tires/extremecontact-dws06-plus` stands 10982px tall at 1440, and its `.tire-reviews`
section is 6375 of that: "Why people love this tire", a Reviews tab and a Questions & Answers tab.
A Bazaarvoice embed 6106px tall fills it, keyed to `data-bv-product-id` 104. Live's structured data
reads `ratingValue` 4.60 and `reviewCount` 1043.

Ours is a 244px band on a 3455px page: "Customer rating 4.6", "1043 Reviews", and the same pair in
the page's JSON-LD `aggregateRating`. Those numbers come from the catalog sheet, which has a rating
and a count on 41 of its 46 rows. They are a snapshot, good until the next review lands on live.

What would close it: the account. The review text, the moderation state and the Bazaarvoice
property configuration belong to Continental, and no reading from outside reaches them.

### Live's specs pages redirect onto our product page

**differs.** Live gives each product a specs page of its own. We redirect those URLs onto the
product page, so the link resolves and the destination is a different kind of document.

Live's `/tires/extremecontact-dws06-plus/specs` stands 5905px at 1440 with its sizes open together:
2261 definition terms, which is 119 sizes by 19 fields, plus a print control. Ours is the product
page at 3455px. Its specs band shows one size at a time from a 120-option picker and prints
`Make a selection below to view tire specifications.` until a size is chosen.

46 rows hold the redirect, one per product in the sheet. Each answers 301 and then 200 on the
product page, and a nonsense specs path 404s, so the sheet is not a catch-all.

Two things are live's alone: the print control, and the view that opens the sizes together. A reader
comparing four sizes side by side can do that there and cannot here.

One product diverges deliberately, and the dead link is live's. `/vancontact-as-ultra` links its
own specs path on live and that path 404s on live. We ship the row anyway, so the reader reaches
the product page. It is also the one product page outside `/tires/`, and the row on
`/tires/vancontact-as-ultra/specs` lands on `/vancontact-as-ultra`.

Dropping the link is the other option. The specs are already on the page, so removing it loses no
information. It also removes something live shows, which is the regression this project exists to
avoid.

## Search

### Search ranking, rebuilt against live's results rather than its index

**approximated.** Live runs Drupal Search API over Solr. We run a weighted scan over the published
index, and the semantics differ on purpose.

Live's field weighting, its stemming and its index exclusions are configured in an admin the public
site does not expose. The index is not readable either. What is readable is the result list live
returns for a given query, and that list is what the scan is built against.

Ours is `scripts/search.js` over `/query-index.json`, 329 rows of six columns. The weights are
`title: 6`, `description: 2` and `body: 1`, with a 0.5 bonus for each query term the title covers,
and ten results a page.

Our rule scores a row 0 unless it holds each query term, so a second term narrows. Live matches its
terms separately rather than as a phrase, and its totals narrow
too: 47 for `all season` and 46 for `all season tires`, where ours returns 69 and 68. Our stemmer
folds plurals and stops there, so `tires` matches `tire` while live's Solr stems further. A query that
exercises the difference diverges even where the totals track.

What it costs a visitor: on the queries measured, close to nothing. Off them, a multi-word query
where live's stemmer would reach a partial row returns fewer results here.

⚙️ Needs live's Solr schema, its field weights and its exclusion list. Those are configuration in an
admin rather than something the public site emits. The ceiling here is matching live's totals on a
measured query set and saying so.

### How many results a query returns

**differs.** We return more than live on the same query, including pages live keeps out of its
index.

    query           live   ours
    tire             215    302
    dealer            48     89
    all season        47     69
    winter tires      35     46
    warranty          20     66
    ev                 0      9
    privacy            0      1

The exclusion rule is not readable. `/privacy` uses the word privacy 22 times in its own body text
and returns nothing on live's search. On `ev` live prints a "No results" page and we answer with 9,
`/ev-compatible` first. That is the one query of the seven where our answer is the more useful of the
two.

⚙️ Needs live's Solr index configuration. Live's `ev` behaviour reads like a minimum term length or
a stopword rule, and reproducing it would copy a defect on purpose.

### No sort control on the results page

**absent.** Live's select offers Relevance, `sort_by=search_api_relevance`, and Date,
`sort_by=created`, and it defaults to relevance.

Relevance is the state both sides open in. Live's no-sort order and its relevance order are the same
list, read on `keywords=all season tires` at 46 results, and ours opens in a relevance order of its
own. The two orderings are not the same list, which is the ranking row above.

Date is the option no data here can honour. The index has six columns and no date. `learn`'s
`lastModified` is our own publish timestamp, and its 219 values fall on three days, so newest-first
would order the articles by deploy sequence. Neither our pages nor live's publish an article date,
and a prose dateline reaches 29 of 220 pages. A select with one honourable option is worse than no
select, so this closes as a decision rather than as work.

Live renders its result list server-side. Our `/search` delivers 2,449 bytes with an empty `.search`
div and no result markup, where live's is 75,371 bytes holding ten result cards.

What it costs a visitor: a query better read newest-first has to be read in score order. A client
with JavaScript off sees results on live and an empty page here.

### The results band reserves height live does not

**diverges.** Live sizes its results band by its content. Ours keeps a floor under it, so a query
with few results leaves dark space below them where live's band stops.

Measured on live's `.site-search__results-wrapper` and our `.search-results-wrapper.search-band`,
same query on both sides:

    state                          live   ours
    tire, 10 shown   1440x1000     1709   1912
    vancontact       1440x1000      549    788
    no match         1440x1000      371    788
    tire, 10 shown    375x812      2982   3659
    no match          375x812       221    568

Live computes `min-height: 0` on that element and on the three wrappers inside it, in each state
read. Ours is `calc(100vh - 316px)`. That is a 684px content box at a 1000px viewport and 496 at 812,
so the band draws 788 and 568 once its padding is added. The floor shows in the short states and
nowhere else, because a full page of results is content-bound on both sides.

The reason is where the results come from. Live renders them server-side, so its first paint knows
how tall they are and it has no in-flight state to reserve for. Ours arrive from a published index
after the page paints. The band reserves a height before anything has arrived, which is the delivery
model rather than a styling miss.

The floor is load-bearing. Without it the empty state collapses to 253px at 375, which puts the
band's bottom at 497 against a fold of 812. The footer would come into view and then be pushed down
when results land. On mobile that reads CLS 0.687 without the floor against 0.000 with it. Dropping
the floor once the results arrive is the same move by another route. It shrinks the band in the short states and trades the empty space back for the shift.

What the reservation buys is a page that does not shift. Ours reads CLS 0 across seven states
measured. Live runs from 0.0041 to 0.4047, and its worst reading is four times the 0.1 a Core Web
Vitals pass allows.

### Our class names are kebab-case where live's are BEM

**diverges.** Live's search markup is BEM: `search-result__title`, `site-search__results-wrapper`,
88 distinct double-underscore classes on `/search?keywords=tire` and 90 on a no-match page. Ours is
kebab-case, 21 distinct `.search-` classes in `blocks/search/search.css`.

The linter decides it. `.stylelintrc.json` extends `stylelint-config-standard`, whose
`selector-class-pattern` accepts kebab-case only. A probe selector `.probe__element` fails with
"Expected class selector to be kebab-case" where `.probe-element` passes. Adopting live's names would
mean a lint error on each selector, or turning the rule off for the repo.

The `__` sequence does appear in our CSS, 106 times across 39 files, and each instance is inside a
comment quoting live's own class name. No selector uses one.

What it costs a visitor: nothing, since class names are not rendered. A reader comparing the two
stylesheets has to map the names by position.

### Product JSON-LD is written in the browser

**differs.** Live server-renders a `Product` block with an `AggregateRating`. Ours writes the same
block from the catalog row after the page arrives, so a crawler that runs no JavaScript sees none.

Live's `/tires/4x4contact` delivers one `application/ld+json` script with `"@type":"Product"`,
`ratingValue` 3.49 and `reviewCount` 53. A curl of ours returns zero. In a browser ours writes one
script into the head, `@type` `Product` with `ratingValue` 3.5 and `reviewCount` 53, off the same
catalog row the rating band reads. Five of the 46 catalog rows have no rating and get a `Product`
with no `aggregateRating` rather than a zero. Live's `brand`, `manufacturer` and canonical URL are
left out on purpose: this rebuild does not present itself as Continental's site.

What it costs a visitor: nothing on the page.

What would close it: emitting the block into the delivered HTML, which a block reading a workbook in
the browser cannot do.

### Store and dealer lookup

**absent.** Live has a store finder. We have a page explaining that we do not.

Live's `/Store-finder` is a real page, 200 at 52,132 bytes, and live's own lowercase `/store-finder`
301s onto it. The "Find a store" buttons on live point at the lowercase path. Ours redirects both
casings onto `/online-retailers`, two rows of the redirects sheet's 76. That page's Store Near You
tab reads "Store search is not part of this site" and gives the reason, a dealer database and a
location service that live does not publish. Its Online Retailers tab shows the retailer tiles.

What it costs a visitor: they cannot find a nearby dealer, and the "Find a store" button on 46
product pages leads to that explanation.

⚙️ Needs a dealer database and a geocoder. A plausible stand-in would be worse than the blank. An
invented store with a real street address and phone number, at a made-up distance, is a wrong answer
a visitor would act on.

### What matches in search

- **The result URL and its pager.** Both sides read `?keywords=`, page with a zero-based `&page=`,
  show ten results a page and draw a pager window of nine numbers. Live's `tire` page one offers
  `page=1` through `page=8` beside the current page. Ours is `PAGER_WINDOW = 9` in
  `blocks/search/search.js`.
- **Relevance is the order each side opens in.** Live's no-sort list and its
  `sort_by=search_api_relevance` list are the same order. Neither side opens in a date order.

## Forms and third parties

### Tag management and analytics

**absent.** Live loads Google Tag Manager on every page. We load no tag manager.

Live's head has an inline GTM bootstrap for container `GTM-NGJQFVS`, with a preconnect and a
dns-prefetch to `googletagmanager.com` above it and no `noscript` iframe fallback. It is on all seven
pages fetched: `/`, `/tires`, `/learn`, an article, `/newsletter-signup`, `/tires/4x4contact` and
`/racer-tire-program`. The container is 581,170 bytes.

Reading the container gives the tag list. Its tag array runs to 230 entries, and 81 of those are
click, link, timer and scroll listeners, leaving 149 tags. By GTM function type:

    39  Floodlight counters      6  custom templates
    33  GA4 event tags           5  image pixels
    28  Bing UET                 4  Google tag
    16  custom HTML              1  Crazy Egg
    12  Google Ads conversions   1  conversion linker

Four of those are paused. The GA4 measurement id is `G-EVDE8JJV6V`. The tag definitions name
Facebook, TikTok, Twitter, Reddit, Crazy Egg, Cluep, InMarket, Flowcode and Turn. One custom HTML tag
loads HubSpot's `js.hs-scripts.com/48908421.js`, on the same portal id as live's newsletter embed. The
container also declares dataLayer variables named `zipCode`, `vehicle`, `year`, `model`, `trim`,
`width` and `aspect`, which are the tire finder's inputs.

Our side loads none of it. Zero googletagmanager references on the same seven paths. Each of our
pages ships two script tags, both same-origin, `/scripts/aem.js` and `/scripts/scripts.js`.
`scripts/delayed.js` is eight lines and imports the widget block only where a page has a
`.widget[data-source]`, which is 3 pages of 329.

What it costs a visitor: nothing they see. What it costs the demo is that any claim of measurement
parity is false. Asked whether the rebuild tracks what live tracks, the answer is that it tracks none
of it.

⚙️ The container is public and the accounts behind it are not. Adding the bootstrap to
`scripts/delayed.js` under the same container id is a small change. The delayed phase is where Edge
Delivery puts it, so it would fire about three seconds after the page rather than in the head. That
changes the numbers GTM reports, because some sessions end before the tag fires. It also pulls the
whole 149-tag set along with it. Where those tags report is the next row.

### What live's tags report into

**not knowable from outside.** The container is readable. The accounts behind it are not.

The measurement id `G-EVDE8JJV6V` and the other tag ids are in the container. The rest is inside
Google's and Microsoft's consoles. That covers the GA4 property configuration, the audience
definitions, the conversion set, any server-side GTM endpoint, and whether consent mode gates any of
it.

⚙️ Needs the ad and analytics accounts. The tag list above reads from outside. What the tags report
into does not, at any amount of work here.

### Cookie consent

**absent.** Live renders a consent popup in the HTML of every page. We render none.

Live's is `<con-cookie-popup class="cookie-popup" role="region" aria-label="Accept Cookies">`,
server-rendered in the body of all seven pages fetched. It reads "Continental uses cookies (like most
sites) to continually improve your experience.", with an "I Agree" button, a "Learn More" link to
`/privacy` and a close button. It is Continental's own web component rather than a vendor platform:
OneTrust, Optanon, CookieLaw, TrustArc and Usercentrics return zero matches across live's pages. The
GTM bootstrap is in the head above it and the markup does not gate it.

Our delivered HTML uses the string "cookie" zero times on any of the seven paths.

What it costs a visitor: this one is visible. Live opens with a consent bar and the demo does not, so
the first screenshot of each side differs by that bar. It also means the demo says nothing about
consent, which a US automotive brand audience asks about.

What would close it: a block rendering the same text and buttons in the delayed phase. The wording
and the `/privacy` link both read from live. There are no tags here for it to gate, so this row needs
nothing from inside live.

### Bazaarvoice

**absent.** Live loads `bv.js` site-wide, including on pages with no reviews. We load it nowhere.

The script is `apps.bazaarvoice.com/deployments/continental_tire/main_site/production/en_US/bv.js`,
present once on all seven pages fetched. Two of those, `/learn` and `/newsletter-signup`, have no
review content to render.

We make no request to any Bazaarvoice host. `blocks/tire-rating` renders an aggregate score off our
own catalog row instead.

What it costs a visitor: nothing on the pages without reviews. On product pages what is missing is
the review bodies, which is the star-rating row. Live also pays for the loader site-wide and we do
not.

⚙️ Needs the Bazaarvoice account. The review corpus, the moderation state and the property
configuration are inside it, and the script tag reaches none of them.

### EmbedSocial

**absent.** Live draws a hashtag wall on the homepage and on `straight-pipes`. We draw neither.

An inline snippet appends `embedsocial.com/cdn/ht.js` under the id `EmbedSocialHashtagScript`. It is
on live's homepage and on none of the other five content pages fetched.
`/experience/conti-crew/straight-pipes` adds
`<div class="embedsocial-hashtag" data-ref="20bed16a9b1d19f5a7c0cb2dc6522b18e59e208f">` and the same
loader.

Live's band is not collapsed. On `straight-pipes` it renders one 1440x694 iframe pointing at
`embedsocial.com/api/pro_hashtag/<ref>/`, and on the homepage a 586px one on a different ref. What
the vendor draws inside that frame is cross-origin, so how much of the height is photographs cannot
be read from outside. A visitor sees a band on live and dark nothing here.

What would close it: a block holding the container div and the loader, in the delayed phase. The
script URL, the container markup and both hashtag refs read from live's source, so no account is
needed to render the frame. What no code changes is that the feed arrives on the vendor's terms, in
the vendor's frame, with the vendor's layout.

### The newsletter form

**diverges on the timing.** Both sides embed the same HubSpot form and reach the same portal.

Live's `/newsletter-signup` has no `<form>` of its own and loads
`js.hsforms.net/forms/embed/48908421.js`. Ours has no `<form>` either. It delivers one link,
`<a href="/widgets/hubspot/newsletter.html">Newsletter form</a>`, and the widget block turns that
into HubSpot's own `hs-form-frame` container on portal 48908421, form id
`3c44e055-0305-461a-9694-2793b94e410a`. A submission reaches the same portal from either site.

The timing is the difference, and it is a phase rather than a fault. Live requests the embed 54ms
into the page and has the form by about 0.4s. Ours runs in the delayed phase, so the request goes out
at 3.07s and the frame appears at 3.10s. Until then the reserved shell stands empty at 1176px, which
is the height live's form renders at, so nothing moves when the form lands. Live also runs HubSpot
tracking through `js.hs-scripts.com` from inside its GTM container. We have the form without the
tracking.

Three of our 329 published pages have the widget link: `/newsletter-signup`, `/promotion` and
`/offers`.

### The sponsorship form

**the UI is here and nothing sends.** Live posts a Drupal webform. We render the same shape with the
submit disabled.

Live's `/racer-tire-program` has a `webform-submission-sponsorships-form` posting back to
`/racer-tire-program` on live's own Drupal. It fields 26 `<input>` elements over name, contact,
address and a photo upload; 3 are hidden and 2 are submits. With those go 2 textareas, a state select
of 52 options, 4 social fieldsets and a terms checkbox.

Our `form` block reads its shape from 19 authored rows, one row per field. It builds 20 inputs, 2
textareas, the same 52-option state select and 4 fieldsets on live's grey band. Live's terms checkbox
has no counterpart here. The submit is a disabled `<button>` whose `aria-describedby` points at the
note beside it, "This form is part of a design rebuild of continentaltire.com. It does not submit,
and no sponsorship request is received.", so a screen reader reaches the reason. The form element has
no action and no method.

What it costs a visitor: a racer cannot apply. The form looks like live's and goes nowhere, and the
button cannot be pressed.

⚙️ A submission needs a receiver and live's is a Drupal endpoint on a host we do not own. A form that
accepted a submission and dropped it would be worse than a disabled one, because a racer would
believe they had applied.

### Vehicle and plate lookup

**approximated.** A stub over sample data, where live publishes a fitment answer this site does not
take.

Live's vehicle tree is public. `continentaltire.com/api/tire-search/by-vehicle` is an unauthenticated
JSON endpoint that walks one level at a time. It returns 48 model years, 2027 down to 1980;
`?year=2022` returns 45 makes; `&make=honda` returns 9 models; `&model=accord` returns 9 trims.

The walk does not stop at the trim. `&trim=ex-l` answers **225/50 R17**, the OE size, on a plain GET.
The answers are vehicle-specific rather than one constant. A 2022 Civic EX-L Hatchback reads
215/50 R17 and a 2022 Bronco Badlands reads 285/70 R17. Each of the nine 2022 Honda models answers on
its first trim. An empty option list is the reading that does not discriminate. A nonsense make
returns zero options, and so do real trims Continental has no row for. The 2022 Civic LX, the 2022
Camry LE and the 2019 330i are three. A nonsense path under `/api/tire-search/` 404s.

Ours is a hand-written table of 6 makes and 17 models in `blocks/perfect-fit/perfect-fit.js`. Each
model maps onto a coarse class matching the workbook's `vehicleTypes` column. The Year select is a
generated `range(2015, 2026)` with nothing behind it. By Plate collects a plate and one of 6 states
and reads neither. It returns the products whose season reads all-season or all-weather, 28 of the 46,
and the code says so in a comment beside the filter. The labels are honest about it, so nobody is told
the plate was read.

What it costs a visitor: a reader whose car is outside the 17 models cannot use the tab. A reader who
types a plate gets a season filter rather than a fit.

⚙️ Needs access, and the two halves get there differently. A plate resolves through a registration
lookup live buys, and no work here reproduces it. The fitment reads from outside and we do not take
it. This site does not depend on, or harvest, a host it does not own, and that rule applies whether or
not the data can be read. The harvest would have run to roughly 2,200 requests, one for the years,
48 for the makes and 48 by about 45 for the models. Our own workbook has no year dimension and no
trim dimension. It covers 46 products and their size-level specs, plus `vehicleTypes` as a coarse
class, with no vehicle-to-size mapping in any of its four sheets. So this is a gap that cannot close
rather than one waiting on something.

**Live's drill-down pages answer 200 and ours 404.** Live serves a page per make and per
make-and-model under `/tire-search/by-vehicle/`, and `/honda` and `/honda/civic` are both 200. Live's
sitemap lists neither, and its 319 paths cover none of that family. Ours 301s
`/tire-search/by-vehicle` onto `/tires` and returns 404 below it.

A wildcard redirect is not available, and the routing rule is why. Each 404 on this host names it in
a response header: `x-error: failed to load /tire-search/by-vehicle/honda/civic/2022.md from
content-bus: 404`. A request resolves to one document at one exact path. The redirects sheet has 0
wildcards across 76 rows, and it does not inherit downward either. `/store-finder` and
`/tire-search/by-vehicle` both answer 301 while the paths below them answer 404.

Edge Delivery does have a mechanism for a path family.
[Folder mapping](https://www.aem.live/developer/folder-mapping) serves each path below a folder from
one document. Adobe feature flags it "to prevent accidental misuse", and it is not configured on this
site. Its Anti-Patterns section names this use: "Mapping of excessively dynamic or infinite URLs like
`/search/<query>`, dynamic search results are better served via query parameters or URL hash
property". A finder answering in its own panel is where the platform's guidance puts a dynamic
result, so this limit is ours rather than something live withholds.

Enumerating the family as real documents would not deliver live's surface either. Live's page is the
finder filled from the fitment data set. Our table covers 6 makes and 17 models, so most of those
paths would resolve onto a page that answers nothing. Widening the table changes that, and access is
not what stands in its way.

Probing that tree needs one specific care. A bad model falls back to the make's own title, so
`/honda/zzznotamodel` answers 200 with the same `<title>` as `/honda`. A title check reads that
nonsense model as a real page. The field that moves at both levels is the string `no options
available`: 0 occurrences on `/honda` and `/honda/civic`, 1 on `/honda/zzznotamodel` and
`/zzznotamake`, with `continental` at 62 on all four as the control.

### The finder modal's chrome sits in a shadow root

**not knowable from outside.** Our finder dialog steps its padding and its close button at 900 where
live's boundary is 768. What live puts either side of that boundary cannot be read from the public
site.

`blocks/perfect-fit/perfect-fit.css` has one `@media (width >= 900px)` rule, a dialog
`padding-top: 80px` with a close button at `top: 24px; right: 24px`. Live's counterpart is
`<con-tire-finder-modal id="tire-finder-modal"></con-tire-finder-modal>`, an empty custom element
opened by `button.store-finder-nav-banner__item[data-modal-target]`. Its internals are in a shadow
root and appear in neither live's markup nor its 582,256-byte stylesheet. One rule for it is visible,
and it settles the boundary rather than the values:
`@media screen and (max-width: 768px) { .tire-finder-modal { --modal-x-padding: 0 } }`.

⚙️ Needs the modal's own styles, which the public site does not hand out. The boundary differs by one
step, and whether the chrome matches live at any width is unreadable.

### Real user monitoring, ours only

**diverges.** We sample real user data. Live has no equivalent and measures through GTM instead.

`scripts/aem.js` ships `sampleRUM` at a default weight of 100, so about 1 page view in 100 is
selected. A selected view posts to a collector under `https://ot.aem.live` and then pulls the
rum-enhancer module from the same host. The rate is overridable per request with `?rum=on`, and
nothing in `scripts.js` overrides the default.

What it costs a visitor: nothing. It matters as the honest answer to "so you have no analytics at
all". We have Core Web Vitals and checkpoint data off a 1% sample, not marketing analytics, and it
goes to Adobe's collector rather than to Continental's.

### What matches in forms and third parties

- **The newsletter receiver.** Both sides load `js.hsforms.net/forms/embed/48908421.js`, and a
  submission reaches HubSpot portal 48908421 from either.
- **The tire finder bar flips at live's step.** Live's `.store-finder-nav-banner__item` and `__items`
  go to `column` under `max-width: 768px`, and the bar takes 22px of padding there against 12px above
  it. Ours is the same boundary from the other side: `@media (width >= 769px)` for the row direction,
  the 32px column gap and `padding: 12px 32px`, pinned by
  `test/blocks/perfect-fit/perfect-fit-769-step.test.js`.

## Media and assets

### Web fonts are hotlinked from live

**differs.** ⚙️ needs a font licence. The typeface on each page depends on continentaltire.com.

Live serves Stag Sans from its own theme directory with `access-control-allow-origin: *`.

`styles/fonts.css` declares five `@font-face` rules over four woff files on
continentaltire.com: StagSans-Thin, StagSans-Light, StagSans-BookItalic and StagSans-Book, the
last of them twice. `head.html` preloads three of the four, so the faces are in hand at first
paint. Both files name the URL. An edit to one without the other fetches bytes nothing uses, and
`test/styles/fonts.test.js` asserts the pairing both ways.

What it costs a visitor: the site falls back to Arial if live goes away or tightens CORS. The
second cost is not technical. The fonts are licensed and this is a proof of concept rather than a
licence, which is what the file's own comment says.

What closes it: a licence and four files in the repo.

### PDFs and press-kit downloads are on live's host

**differs.** ⚙️ zips need a host. Nine PDFs and 75 download links point back to live.

Nine PDF links are absolute to continentaltire.com: five on
`/customer-support/technical-documents`, two on `/warranty`, one on `/promotion` and one on
`/promotionended`. Our host serves PDFs already, so those nine are an asset move rather than a
link rewrite. If the old site goes away, they break.

`/media` is the harder half. Live's page is 82,300 bytes and has 74 `.zip` targets. Ours takes
live's title and links out to live for all 74, plus `/media/929/download`, which delivers
`Continental-LogoGuidelines_2018.pdf` at 1,840,182 bytes. The page renders and the buttons work.
The reader leaves our host on click. The EDS content bus does not serve zips. Closing it means zip
support, a re-cut of each pack into a format the bus does serve, or a third host. None of the three
is a code change in this repo.

The brand-guidelines PDF has a second reason to be on live. Hosting the document that governs a
company's trademark use asserts an authority a proof of concept operated by Adobe does not have.
A reader who downloads brand guidelines from a site is being told, by the act of hosting, that
the site speaks for the brand. Measured with a control rather than asserted: a nonsense media id
returns 404 on our host too. So the missing copy here is a real absence rather than a broken
probe.

### Leftover originals in DA

**differs.** 512.4MB of originals are in DA that no page points at.

DA has 182 files under `/media/original/`, and the weight is all in the 160 under `media/image/`.
Seven run over 20MB and 23 over 10MB, the largest 38.9MB. The pipeline refused them: preview
answers 409 with `x-error-code: AEM_BACKEND_DOC_IMAGE_TOO_BIG` against a 20MB limit. Pages ship
live's `square_medium` rendition instead. No page renders slower for the originals and no visitor
pays for them.

Two things make a delete keyed on the path prefix unsafe. In `/products.json`, products sheet, 39
of the 46 rows put an absolute `/media/original/media/image/...` URL in `image`. Each answers 301
to a `media_` sibling that 200s, and `blocks/perfect-fit/perfect-fit.js:283` renders that column.
An id is also not recomputable from what the site serves.
`media_107f6d6eeed6b47ab39066330d62396a60468a245.png` delivers 426,759 bytes whose sha1 is
`67c38bd9b8cbe53c34855928ad66a181cdb7cebd`, so matching the files by hash is out. Reversing a
delete means fetching from live again, which is the expensive direction to be wrong in.

Two of the three surfaces that can name a media path read from outside, and both come back clean.
All 329 published pages fetched as `.plain.html` name `media/original` zero times and
`content.da.live` zero times, while 303 of them reference media as `media_<41 hex>` over 3,448
references. `rg media/original` over the repo hits this document alone. The third surface does not
read from outside, and it is the one that decides. Some DA documents are unpublished, only its
list API sees those, and one naming a deleted path fails on its next preview.

### The gallery caption takes a level live does not

**diverges on one card per page.** The block gives each card name one level. Live gives its
leading card a different one from the rest.

The caption is on the `cards` variant, which is seven published pages. Live's levels there:

| live page | live's card levels |
|---|---|
| `/forwhatyoudo`, `/lightscameratraction`, `/cruisingthecontinentalus`, `/experience/soccer` | leading card h3, every following card h2 |
| `/emilytalkstires` | leading card h3 directly under the h1, following cards h2 |
| `/my-first-car-my-first-tires` | every card h2 |
| `/learn/product-highlights` | no card heading at all |

What ships is h2 on a card that stands on its own, and a plain span on a card that ends on a call
to action. That lands on live's own level for each following card and on live's value on
`/my-first-car-my-first-tires`. It also lands on live's headingless footer on
`/learn/product-highlights`, where the name is the left half of a label row with `TIRE DETAILS`
on the right.

Type matches on both sides. Read at 1440 on `/forwhatyoudo`, the leading caption is 20px on a
30px box and the following 18 are 14px on 20px. Those are live's own values, pinned in the block,
so a promoted level does not take the global h2 box of 30 over 38.

**What it buys, and what it costs.** Two of the seven author no h2 of their own,
`/emilytalkstires` and `/learn/product-highlights`, so an h3 there would read straight off the
banner h1. Live has that same skip on `/emilytalkstires`, where its leading h3 also has the h1
directly above it. The cost is the four pages where live's leading h3 skips no level: there the
leading card is an h2 here against live's h3. One level per caption is what keeps a heading level
off a card's position, and it leaves no skip on any of the seven.

### The tire-size help icon differs by two file defaults

**diverges in the file, not on the screen.** The drawing is live's and the rendered glyph is
live's. Two defaults in our copy are not, and a byte-exact copy would have rendered the wrong
colours.

`icons/help-circle.svg` is traced from live's sprite symbol `id=help`, checked against the sprite
at sha1 `0969c953`. The path `d` is character-identical. Ours declares `--circle-fill` default
`#ffa500` where the sprite declares `#fff`, and `--question-stroke-width` default `2px` where the
sprite declares `1px`.

Those two are what live overrides at this spot and no more.
`.search-by-size__help .icon__help svg` sets `--circle-fill: var(--yellow)`,
`--circle-stroke: var(--yellow)` and `--question-stroke-width: 2px`, and `--yellow` is `#ffa500`.
So live paints a yellow disc with a 2px question mark. `decorateIcons` renders an icon as an
`<img>`, and a CSS custom property does not cross into an image's own document, so those
overrides cannot reach ours. The file that matches live's bytes renders the sprite's defaults
rather than live's pixels.

An inline copy matches the bytes at the cost of the authoring path DA's edit canvas supports, the
same trade the chevron sprite records.

### The chevron sprite

**approximated.** Live uses an SVG sprite reference and we inline the same glyph as a data URI.

Live's year tabs wrap an `svg` with a `use href` into its theme sprite, marked `aria-hidden`.
`blocks/category-tabs/category-tabs.css:83` draws it as `content: ''` with a
`data:image/svg+xml` background, viewBox `0 0 12 6`, stroked in live's own `#C27E00`. DA's edit
canvas strips an empty authored span. So an icon that depends on one does not survive an author
save, and this form needs no JavaScript to appear.

What it costs a visitor: nothing they see. The glyph cannot be recoloured per instance and does
not pick up icon theming. It takes live's colour rather than our contrast token, which the
block's comment justifies by the icon being decorative and `aria-hidden` on live too.

### The default share image is re-encoded

**diverges on the encoding.** Live's artwork at live's dimensions, in a different file format,
because the pipeline hardcodes the path.

26 of the 329 index rows name a fallback `og:image`. The path is not a choice: the pipeline
hardcodes `/default-meta-image.png`, and the file is the only part this repo supplies. Live's own
fallback is `Continental_Logo_Social.jpg`, 1200x630 and 46,926 bytes. It reads off `/legal`, a
page with no image of its own.

Ours answers 200 at 1200x630 in 17,058 bytes on a 16-colour palette. Live's file is a JPEG behind
a path ending `.png`, and the code bus types a static file by its extension. JPEG bytes under
that name would go out as `image/png`, and a card crawler handed a mismatched type can drop the
image. The background reads (255, 165, 0) here, the `--conti-yellow` token, against live's
(254, 165, 0), one step of red apart.

What ships is live's image at live's dimensions rather than a drawing of one. We do not choose
what the site claims when shared. We copy what live claims.

### The media gallery keeps two details of its own

**diverges on two details, both ours.**

Live's arrows have no accessible name and ours are labelled. On `/tires/truecontact-tour54` the
modal buttons read Close, Previous and Next, and each thumbnail takes the still's alt.

Live counts off its own slide index where this strip scroll-snaps, so the count reads the scroll
position and a swipe moves it. On a product page it counts the drawn tiles rather than the whole
set, because the strip below 769 shows what the grid drew. `/tires/truecontact-tour54` reads
`1 of 6` under six tiles where live's modal pages the whole set.

One measurement is 4px off. The soccer page's `leading-pair` section gives its two half-row cards
one height, 434.8 here against live's 430.8 at 1440. Live authors a description on each card and
paints it on the pair. Width, position, gap and the third card read live's numbers.

### What matches in media and assets

- **The product viewer's geometry.** Live's product grid shows 2 to 6 tiles and keeps the rest as
  `media--hidden-media-gallery-item` at height 0, and its modal pages up to 11.
  `blocks/media-gallery/media-gallery.js` draws the first 6 rows of a `product` gallery and pages
  the whole set. A seventh row onwards is modal only, and no new cell shape is needed.
  `/tires/truecontact-tour54` draws a 746x1129 gallery at x=152 on 363px tiles at 1440, which is
  live's box to the pixel. Our hero cells have 2 to 6 stills on the same 45 of live's 56 tire URLs.
  The distribution is live's too: 2 on 1 page, 3 on 25, 4 on 5, 5 on 4 and 6 on 10.
- **The 32 modal-only assets.** They are authored as rows 7 and up, one photograph per paragraph
  in the hero's image cell the way the six above them are. They read off live's delivered HTML as
  a `con-media-gallery-modal src` on the `modal` image style, so a curl reaches them without driving
  live's modal. Each takes the tire's name for its alt, which is what live's visible stills use. A
  hidden item has no `img` and so no alt of its own, and a file name is not a description. The one
  hidden video, `Zbn0xviN7A4` on `/tires/truecontact-tour54`, reads off the unstyled original at
  1920x1080. Live puts a video item on the 100x56 `thumbnail` style, and an `itok` is per style, so
  a bigger one cannot be asked for.
- **The article gallery width, on both of live's tracks.** 26 published article pages have a
  gallery. Live draws 13 through `news-article__partners` and 13 through `news-article__default`,
  and the 13 with `Style: partner` here are live's own 13. That class is the only signal
  separating them. `/learn/continental-science-guy` reads 750x1520 at x=152 on 365px tiles at 1440
  on both sides. The 13 inline pages read 558.7 at x=250 on 269.3 tiles, which is live's reading
  column. Below 769 the two tracks agree, 335 wide at 375 and 571 at 768.
- **The mobile counter and the expand badge.** Below 769 live draws a "1 of 6" counter with arrows
  and a `+` expand badge. Both come from live's own source rather than from a screenshot: the
  pager geometry and the two chevrons off the `con-column-slider` component, the badge off
  `.media-gallery con-column-slider .media--media-gallery-item:before`.
- **The `/events` Social row below 769.** Live runs it through the same `con-column-slider` as the
  rest of the block. Both sides measure 335x399 at x=20 at 375 over six items. At that width the
  square is 367 wide, bleeding to 4px of each edge. `1 of 6` reads under it, and the 21px `+` in
  the corner opens the still on the modal. The tile is the link out to the post, because live's
  item takes the anchor and the modal target both.
- **The soccer page's fourth card section.** `card-list--double_leading` gives the first two cards
  half the row each and the rest a third, six columns with a wide card spanning three. Read in
  live's 1136 container at 1440, both sides put 549-wide cards at x=152 and x=739 with a 38px gap.
  Below them each side draws a 353.3x270.7 card. The other three sections are
  `card-list--single_leading`, the full-width teaser.
- **Product viewer stills are same-origin.** They are authored in DA and served from our host. A
  sample of 12 product pages has 2 to 6 `<picture>` elements each, 53 in all, and none reaches out
  to live.

## Content and editorial

### Thirteen product page titles are not live's

**differs.** 13 of the 46 product pages head with a `<title>` live does not use.

Live writes a selling line into the tag where ours writes the product name and the brand.
`/tires/purecontact-ls` heads "Continental PureContact LS Tires | Luxury All Season Tire" on live
against "PureContact LS Tires | Continental Tire" here. 33 of the 46 read live's own title.

The 13 that do not: `crosscontact-lx25`, `extremecontact-dws06-plus`, `extremecontact-force`,
`extremecontact-sport-02`, `purecontact-ls`, `securecontact-aw`, `terraincontact-at`,
`terraincontact-at-2`, `terraincontact-ht`, `truecontact-tour`, `truecontact-tour54`,
`vikingcontact-7` and `vikingcontact-8`.

What closes it: a `Title` value per page, the shape `/metadata.json` already uses for `og:title`.
No change under `blocks/` or `scripts/` reaches the tag. A crawler reads the delivered HTML and
never runs our scripts.

### The result range is cumulative from the second batch

**diverges.** Ours counts from the first row where live counts the fetched page.

Both listings print `1-10 of N results` above a load-more and draw 10 rows to a batch. After one
press ours reads `1-20 of 150` on `/learn/news-and-events` where live reads `11-20 of 148`, on 20
cards either way. Live appends rows and replaces the pager wholesale, so its range describes the
page it fetched.

### Live swaps its pill row for a jump menu below its breakpoint

**diverges.** Live replaces the pill row with a select on its three news listings. We keep three
pills at 375.

Live's control is a `<form class="hidden-desktop">` around `<con-jump-menu><con-select>`. Inside
it, a `label.visually-hidden` reads "Select menu" and a `<select id="jumpmenu">` offers three
option values, `/learn/news-and-events`, `/learn/news` and `/learn/corporate`. The form has no
submit control, so choosing an option moves the page and the label does not say so. It appears on
those three pages and on neither `/learn/tips` nor `/learn/technology`, because neither taxonomy
has sub-terms.

Ours serves the same three links at 375. Measured there, the pills are 109.8, 64.7 and 105.6
wide. With two 12px gaps the row is 304.1 inside the 335px the container leaves, and
`overflow-x: auto` under `justify-content: safe center` means a label that grows scrolls rather
than clips. The row fits. Both sides reach the same three destinations, and matching live would
put navigation behind a control that does not announce itself.

### The warranty group opens with words rather than live's logo

**differs.** Both sides list the same three items and live labels the group with an image.

`/tires/4x4contact` has 60 Day Trial, 3 Year Roadside Assistance and 12 Month Road Hazard
Coverage in live's order, under an `<a href="/warranty">Total Confidence Plan</a>`. Live opens the
same group with its `tcp-logo` where this one opens with the words. `icons/tcp-badge.svg` is in
the repo and draws above the six coverage cards further down the page.

### Card teaser text

**approximated.** ⚙️ live's teaser field is unpublished. Our derived excerpt matches live on 141
of 145 articles.

Live stores a teaser as its own field. We derive an excerpt from the article body. On 145 articles
the two agree on 141 and read differently on 4, which is the measured cost. Nothing from outside
closes it, since the field is not published on the public site.

A neighbouring row is deliberate. Thirteen meta descriptions stop at a dateline abbreviation, so
those pages tell a search engine their content is "Fort Mill, S.C.". Live's are cut the same way,
so ours are left alone. Cards are unaffected, because a card renders the excerpt rather than the
description.

### Listings behind a service, authored as snapshots

**approximated.** ⚙️ live publishes no feed. We authored what live listed on one day.

Live builds `/events`, `/experience/soccer` and the four video-series pages `/forwhatyoudo`,
`/cruisingthecontinentalus`, `/lightscameratraction` and `/emilytalkstires` from a content
service, and pages the tail of each behind a Load more. `/events` puts a filter panel beside its
list.

There is no backend here, so the lists are authored content. Each row takes its title, its poster,
its link out and its place in the list from live. Counted on the published pages: 30 event rows, 43
soccer cards across four sections, and 49 episodes across the four series pages. A re-read walks
live's pager and writes the rows back, which is a script rather than a memory.

The interaction on top of the list is built rather than approximated, because it needs no backend.
`blocks/events` derives its filter from the authored rows: one Event type box per type present,
one Event Date box per month. Boxes inside a fieldset are OR and the two fieldsets are AND, which
is what live's own result counts show. An author adding an event adds its type and its month to
the panel. `blocks/media-gallery` renders the cards and opens each video on a modal. What live
pages behind a Load more is on the page here.

What it costs a visitor: nothing at the moment a list is re-read, and a widening drift after it.
Live adds an event or an episode and these pages do not, until an author adds it too.

What closes it: a feed. Live exposes these lists as data nowhere, so the choice is an editorial
routine that re-runs the scripts or a real source behind the block. The block reads authored rows
either way, so neither is a rewrite.

### Three articles this site has and live does not

**differs.** The listings have more rows than live's.

`/learn/news-and-events` reads 150 against live's 148 and `/learn/tips` 48 against live's 47. A
reader can reach three articles from the listings here that live does not offer, and the other
direction is empty.

### Commercial claims, copyright and operator identity

**diverges, deliberately.** This site may not make a commercial claim, assert Continental's
copyright, or imply Continental operates it. Where matching live would do any of those, it does
not match live. Reproducing live's wording in these places is the defect rather than the fix. So a
diff against live flags all five and none of them is a parity gap.

**The footer, on 329 pages.** Live's copyright line is gone and two paragraphs stand in its
place. One attributes Continental's content, images and trademarks to Continental and leaves the
`©` with them. The other states that this is an Adobe engineering proof of concept, not operated
by, affiliated with or endorsed by Continental, and that nothing on it is a real offer.

**The homepage hero.** The eyebrow reads `An Adobe engineering proof of concept` where live reads
`Welcome to`. The paragraph under the h1 is a disclaimer where live has a rebate offer. The h1
itself matches live. The band is taller than live's, and the disclosure copy is why. Live has no
counterpart for those paragraphs, so the box around them has nothing to match. Reaching live's
number while keeping the disclosure would mean shrinking the type or the padding until it fits.
That is styling a disclosure to a target rather than letting the copy set its own height.

**The promo bar, at the top of each page.** Live promises a rebate on a set of tires and ours has
its own copy. Two details of it are deliberate. The fragment's heading is one level below the
homepage's, because the bar is injected into pages with their own heading hierarchy. Its noindex
metadata is untouched.

**`/promotion`, the page the promo bar links to.** The bar promises a 50-point rebate on a
PageSpeed score for moving four templates to Edge Delivery Services, and its `See full details`
link points here.

**The three campaign pages that keep live's rebate copy.** `/promotion`, `/promotionended` and
`/offers` serve live's `$110` offer with its `$90` and `$200` tiers and its prepaid-card terms.
Site-level disclosure is what answers the single rule. The footer's proof-of-concept paragraph is
on each page and the promo bar is at the top of each page. With those in place, live's offer copy
inside a campaign page is reproduced surface rather than an offer this site makes. That is also
why the bar could not keep live's offer while those three pages can. The bar is the disclosure, so
it cannot advertise the thing it discloses.

**The values inside these zones are not quoted here on purpose**, and neither is the hero band's
height. The copy changes in wording, in figures and in link targets, and it derives from live
nowhere. A pixel pair recorded here reads as a delta somebody should chase. Check a zone against
the single rule and nothing else.

### What matches in content and editorial

- **Page titles.** The homepage heads
  "Truck Tires, SUV Tires, Commercial Tires & More | Continental Tire" on both sides. `/tires`,
  `/events`, `/learn`, `/dealers`, `/offers`, `/ev-compatible`, `/learn/tips`,
  `/learn/news-and-events`, `/media` and `/warranty` read live's own `<title>` too.
- **`og:title` on 46 of 46 product pages.** Live gives the product name where a page title
  repeats the brand, so `/tires/purecontact-ls` shares as "PureContact LS". `/metadata.json`
  answers 46 rows of `URL` and `og:title`, keyed on the catalog's `path` and valued from its
  `name`, and all 46 read live's value. The tag is not composed in this repo, so only content
  reaches it. The pipeline sets `og:title` from the page title in `src/steps/extract-metadata.js`,
  and the one thing that overrides it is an `og:title` in the page's own metadata. A wildcard row
  does not reach it either, because the value differs per page.
- **Meta descriptions, live's own defects included.** The homepage description matches byte for
  byte with live's typo, "For that past 100+ years". Live truncates some of its own and we
  reproduce that: `/learn/150-years-sustainability` ends "...and has since.." with the stray pair
  of dots on both sides. `/newsletter-signup` has zero description tags on either. The rule on
  this project is to reproduce live's copy rather than improve it.
- **The result count line and the batch.** Each side prints `1-10 of N results` above its pager,
  centred 20px above the control at live's 15 on 22. The count prints where there is a load-more,
  which is the coupling live's own markup enforces: both are one `.load-more-pager` its controller
  empties on the last page. `/learn/corporate` has 11 rows, and both sides read
  `1-10 of 11 results` over 11 cards.
- **Learn pagination.** Live's three category listings each deliver 10 `article.news-teaser` in
  the HTML, under a `Load More` anchor to `?page=1` in `.load-more-pager`, driven by
  `con-ajax-controller appendmode`. `BATCH = 10` at `blocks/article-cards/article-cards.js:9`
  renders 10 behind a `Load more` button and appends the next batch, which is live's reading.
- **A card for each article, including the ones with no image.** Live keeps a row whose index
  image is missing or is the site's own fallback. It draws `.news-teaser__image-stub`, a 171x128
  tile in `#000000` with a 1rem radius above 769 and nothing below it. 17 of the 219 rows in
  `/learn/query-index.json` are in that state, ten of them News and one Corporate, and each draws
  a card. `/learn/corporate` renders 11 against live's 11 and `/learn/news` 129 against 129.
  Search needs nothing: `thumbnail()` returns null and keeps the row, which is what live's search
  does too.
- **The homepage carousel.** Seven slides on each side, the same subjects in the same order, from
  TerrainContact A/T 2 through to the closing customer review.

## The scale of what shipped

Numbers a reader will want, each with where it came from. This table is the source for them, and
the README takes one, the page count, and links here for the rest.

| Thing | Count | Where the number comes from |
|---|---:|---|
| Pages published | 329 | `/query-index.json`, `total` |
| Learn articles | 219 | `/learn/query-index.json`, `total` |
| Products | 46 | `/products.json`, products sheet and catalog sheet agree |
| Size-level spec rows | 1656 | `/products.json`, specs sheet, over 483 distinct sizes |
| Redirect rows | 76 | `/redirects.json`, `total` and row count agree |
| Block library samples | 24 | `/tools/sidekick/library.json`, `total` |
| Block directories | 31 | `blocks/` |
| Test files | 168 | `git ls-files`, names ending `.test.js` |

The query-index total is lower than the DA page count because the index excludes the block
library and the authoring guide. A page has to be published to enter the index at all, so
preview-only pages are invisible to every list view on the site.

## Layout and type

### The heading scale

**differs.** The global scale is live's. Block-prefixed headings set their own sizes, and the line
boxes apart from live's are in the row below.

Live declares three sizes and moves one of them. h1 is 42px on 48 at weight 300, dropping to 30px on
36 under `max-width: 1024`. h2 is 30px on 38 and h3 is 24px on 32, neither with a media override. So
live reads 30/30/24 up to 1024 and 42/30/24 from 1025.

The deployed `styles/styles.css` sets xxl 30, xl 30 and l 24 at base, and xxl 42 from 1025. h1 maps to
xxl, h2 to xl, h3 to l. So this side reads the same two triples on live's own breakpoint. Read at 1440
on `/legal`, both sides give h1 42 on 48 and h2 30 on 38.

Live writes an absolute line box per level rather than deriving one from the size. Its boxes are 48,
38, 32, 24, 22 and 20 against sizes 42, 30, 24, 20, 16 and 14. That is six different ratios, and
`styles.css` spells out each of the six. The h4, h5 and h6 boxes are this side's own numbers. Live
sizes those levels at 20, 16 and 14 against 24, 20 and 18 here, so live's boxes belong to different
type.

The product title is sized by class rather than by level. Live's rule is
`h2, .as-h2, .tire-page__title { font-size: 30px; line-height: 38px }` under no media query, so a
product page heads at 30 with its specs band at 42 from a block prefix.
`main:has(.columns.product-hero, .tire-specs) h1` does the same here and reaches 46 pages and 46 h1.
On `/vancontact-as-ultra` at 1440 both sides read 30 on 38 for the title and 42 on 48 for the specs
heading.

The article template pins its own sizes and steps where live steps. `styles/article.css` sets a body
h2 to 20px at weight 400 and returns it to 30 inside the 769 block. That is live dropping its own
`max-width: 768` pin.

### Heading line boxes we are leaving different from live

**diverges.** Some block titles run a taller line box than live's and are left that way.

Two shapes. Live steps a block title's box to 36 under `max-width: 1024` while its global is 38. Of
the 42 line-height declarations inside live's 173 `max-width: 1024` blocks, 28 are that step. The
global here is 38 above and below, so those blocks read airier than live's at 900 and 375. Matching
it means a rule per block, written to reproduce a block treatment rather than to correct an error.

The other shape is a rule pinning a box of 1.2 times its own size. That ratio is this side's own,
with no live counterpart. Four of the rules apply to a heading:

| rule | box | size |
|---|---|---|
| `.cards .cards-card-body :is(h1..h6)` | 21.6px | 18px |
| `.cards.highlights .cards-card-body :is(h1..h6)` | 19.2px | 16px |
| `.cards.category .cards-card-body` below 900 | 33.6px | 28px |
| `h4`, `h5` and `h6` globally | 28.8 / 24 / 21.6px | 24 / 20 / 18px |

Two have a measured distance. `.related-articles-title` renders 12px on a 14.4px box against live's
`.panel__title` at 12 on 16, so 1.6px on one title. The category tile below 900 renders 28px on 33.6
against live's 24 on 38, read at 375 on the homepage. So the box is 4.4px tight and the size 4px
large, and closing the box alone would not reach live.

Above 900 that same tile reads 30px on 38 on both sides. The three homepage tiles measure 52, 52 and
90 tall on each, so the desktop half of the rule is live's number.

The global h5 and h6 pins have no authored heading to reach. Across the 329 published paths the
levels are 328 h1, 260 h2, 61 h3 and 13 h4. Two more rules are outside the comparison:
`.promo-bar-panel-content` is inside a commercial-claim zone, and `.search-no-results h2` has no live
counterpart to close toward.

### Two heading margins we are leaving proportional

**diverges.** Live resets heading margins to zero globally and sets an absolute value per context.
The shared heading rule here sets `margin-top: 0.8em` and `margin-bottom: 0.25em`, and this side
keeps both.

The bottom margin does not reach the page. Adjacent vertical margins collapse, so the gap under a
heading is the larger of the two touching margins rather than their sum. On `/legal` a 30px h2 asks
for 7.5px. The paragraph below it asks for 14.4px at an 18px body size, and the paragraph's number is
what renders.

The top margin is wrong in both directions at once. At 1440 live opens 45px above each body h2 on
`/legal` against 24px here, so this side is 21px tight. On `/vancontact-as-ultra` live opens 16px
above the product title against 24px here, so this side is 8px loose. No single absolute fits both,
and live's own `margin: 0` would take `/legal` from 21px out to 45px out.

The article template does set absolutes. `styles/article.css` opens 45px above an h3 or h4 that
follows content. Its `> * + *` rule resolves 1.4em against the child, so a 30px h2 opens 42px against
live's 45.

What it costs a visitor: 21px of missing space on `/legal`, 8px of extra on `/vancontact-as-ultra`
and 3px of missing space above an article subhead. The bottom margin does not render, so it costs a
reader no space.

### Live opens headings and paragraphs with a leading break

**diverges.** Live authors a literal `<br>` as the first child of a heading or a paragraph. It
renders an empty line box above the text and buys vertical space. This side does not use the device
in that position, so the article rhythm here is tighter on the pages where live does.

The census runs over the 219 learn articles on each host, counted inside `<main>`. Live has 2
leading-break headings, both on `/learn/how-do-i-check-my-tire-pressure`, and 35 leading-break
paragraphs on 18 pages. That is 37 of its 475 `<br>`, and 134 of the 219 pages carry zero. This side
has 358 `<br>`, and not one is in leading position. Both sides author breaks freely. The position is
the difference.

On the tire-pressure page live's two leading-break h2, Conclusion and FAQs, measure 76px against 38
here. The size is 30px and the line box 38 on each. The extra box is the empty first line.

18 pages of 219, with the heading form on one of them, reads as per-article authoring rather than as
live's type system.

What it costs a visitor: on 18 of live's 219 learn articles live's copy reads airier. The text is
unaffected and no heading is missing.

Breaks survive DA authoring, since 358 are in the published output. Whether the edit canvas keeps
one in leading position is unread.

### The hero content cap, which changes no wrap

**diverges.** `.hero-content` caps at 640px where live sets no cap on its marquee copy. This side
keeps the cap, because it changes what a reader sees on no page in the population it reaches.

That population is the 22 hero blocks carrying the `left` class token, on 20 published paths, each
with a heading. `.hero.stacked .hero-content` is `max-width: none` and the `.hero.stacked.left` cap
only applies from 1025, so the four blocks with both tokens are uncapped below the step.

The widest title in the set is `/learn`. At 1440 its h1 box is 576 inside the 640 cap, and the title
wraps to two lines of 484.44 and 367.38. Live's copy box is 736 and its title wraps to two lines as
well, 616.44 and 469.38. At 900 the two bands read 222 on each side and the copy boxes 92, so the
line count agrees there too.

Live's lines are wider because live tracks the title. `.marquee__texts .text-uppercase` takes
`letter-spacing: 6px`, stepping to 5px below its breakpoint, while the h1 itself computes `normal` on
both sides. At 900 on `/learn` live's title ink measures 814.86 against 614.86 here, at the same 30px
size. `hero.css` applies the tracking to `.hero.left:not(.stacked)`. The stacked marquees are the
ones it skips.

What it costs a visitor: no measurable difference at 900 or 1440. No title in the population is long
enough for the narrower box to force a different number of lines.

### The marquee band on two pages, where a min-height cannot reach live's number

**diverges on `/all-new-securecontact-aw`, and is an inherited oddity on `/ev-compatible`.** Live
groups its desktop marquee band by the breadcrumb, 400 where a trail is present and 345 where it is
not. `.hero.stacked.breadcrumb` and `.hero.stacked.short` set those two numbers inside the 1025
query, both at 0-3-0 against `.hero.stacked` at 0-2-0 and its 560. These two pages are outside them.

Read at 1440 on the published host against live:

    page                        live   ours
    /experience/soccer           400    400
    /learn                       345    345
    /events                      345    345
    /all-new-securecontact-aw    480    440
    /ev-compatible               360    400

Live's band on the securecontact page follows the viewport width rather than a number. Its background
is a video at a 3:1 aspect. The strip measures 125 at 375, 300 at 900 and 480 at 1440, with a fixed
126px copy box under it below the step. So live's band reads 251, 426 and 480 at the three widths,
against a two-value `min-height` here of 220 below the step and 440 above it. No `min-height`
reproduces a box whose height follows its own width. Reaching live's 480 at one width puts this side
further from it at the other two. The remedy is a different box model on that page.

`/ev-compatible` has no number to match. At 1440 live's `section.marquee` reads 360 while the
`.marquee__container` inside it reads 440, on a `min-height: 440px` and an `-80px` top margin.
Whichever of the two this side took, it would differ from the other.

What would close them: a width-driven box on the securecontact page, and on `/ev-compatible`, only
live resolving its own 360 against 440.

### The hero band below the step on three divided pages, where live's height is its own copy

**differs on `/events` and `/experience/soccer`, and `/learn` is exact.** Below 1025 this band has no
floor. `.hero.stacked` sets `min-height: 0` and stacks the photo strip over the copy box. The height
is the strip plus whatever the copy makes. The strip reads live's number on the three, 130 on `/learn`
and `/experience/soccer` and 224 on `/events`. The difference is inside the copy.

Read on the published host against live:

    page                width   live   ours
    /learn              375     294    294
    /learn              900     222    222
    /events             375     370    352
    /events             900     370    316
    /experience/soccer  375     384    366.39
    /experience/soccer  900     332    308.8

`/learn` reads live's number at both widths on the same arithmetic, 130 of strip plus a 164 copy box
at 375 and a 92 one at 900.

What is left on `/events` is live's authored break. Live's title is
`<span class="text-color-yellow">SEE US AT</span><br>Upcoming Events`, three lines of 36 at both
widths. Here it is `See Us At Upcoming Events` with no break, two lines at 375 and one at 900. Live's
copy padding is 8 top and 30 bottom against 28 and 28 here, so this side pads 18px more and still
runs short. Live's copy box is 146 at both widths, against 128 at 375 and 92 at 900. The band follows
the line count, and the line count is the words.

On `/experience/soccer` it is the same break plus the share bar's position. Live's h1 is
`For the Love of<br>Soccer`, 72 tall at 900 against 36 here. Live's copy box also opens on a
`marquee__sharebar`, 20px of buttons under a 20px margin. Here the share row is a 42px block below
the hero in the same section. So the hero block measures 266.8 at 900 and the section holding both
measures 308.8, against live's 332. At 1440 the hero block reads live's 400 and the share row adds
its 42 outside the band.

Why no rule closes it. A `min-height` per authored shape reaches the pages. Swept over the 329
published paths plus the homepage, `.hero.stacked.short` is `/events` and `/learn` alone, and
`.hero.stacked.slimmer` is `/learn` and `/experience/soccer` alone. The value would be live's line
count written down as a number. `/learn` already reads live's at both widths, so a floor on either
selector breaks a match to buy one.

What would close them: live's authored breaks in the two titles, which is content.

### The Learn tab row runs taller than live's

**differs.** The type on the row is live's to the value. The box around it is not.

Read at 1440 on `/learn/tips`, the row is 1136 wide and 55.19 tall here against live's 609.16 by 41.
The anchors take `padding: 16px 20px` where live's take `10px 0`, and the list draws a 1px rule live
draws nowhere. Live marks the current tab with a 61.22 by 5 bar in `rgb(255, 165, 0)` against the
label. Here a 3px bottom border spans the whole 101.22 anchor.

Both sides set the labels at 12px, weight 700, `letter-spacing: 1.25px` and uppercase, and the row
centres. The banner heading above it agrees too: at 1440 the h1 ink measures 1019.05 by 42 at
x=210.47 on each side.

### The sports h1 box runs the content width

**differs, and the ink is in the same place.** At 1440 the `/experience/sports` h1 box reads 1400 by
48 at x=20 against live's 833.73 by 48 at x=303.13. Live's box is a flex item sized to its content
where this one is a block running the content width.

The title's own client rects read 833.73 by 42 at x=303.13, y=193 on each. A reader comparing the two
pages sees the words in the same position. A `max-width` is the wrong remedy, because live's number is
what its content happens to measure rather than a cap it declares.

### Breakpoints, half of them live's

**differs.** Live pivots at 768 and 1024. This side uses those plus a 900 that live has once in 982
queries.

Live has 982 media queries. The two holding the site up are `max-width: 768px` 679 times and
`max-width: 1024px` 175 times, with `min-width: 769px` 31 more. `min-width: 900px` appears once in the
982, and 600px zero times. Live is a two-breakpoint site with a few one-off widths like 1170 and 1180.

There are 141 media queries across `styles/` and `blocks/`: 769px 62 times, 1025px 38, 900px 24, 600px
6, then one-offs at 380, 641, 1170, 1181, 1184 and 1200. The two that shape the page follow live. The
heading scale steps at 1025 and the section gutter at 769. `styles.css` keeps two of the 900s, for the
body-size step and the h4 and h5 boxes, where live has no counterpart at that width.

What it costs a visitor: the page gutter is live's at each width read. What is left is the blocks.
Between 769 and 900 a band whose own rule steps at 900 keeps its narrow layout where live has gone
wide.

What would close it: move the 24 rules at 900 to 769 or 1025, whichever live uses on that surface, and
take the 6 at 600 with them. Mechanical, and 30 rules across the tree. Each needs a measured pair
either side to prove the move.

### The article body shifts up 51px after first paint

**differs, and the two readings disagree.** Live's layout does not move. On
`/learn/extremecontact-sport-02-road-trip-challenge` an article body jumps up 51px at 142ms, CLS
0.146 and mobile performance 94 against a 95 merge gate. That pair comes off a mobile audit, which
throttles CPU and network.

Unthrottled at the same 412x823 it does not happen. Read on the published host over three hard
reloads, the layout-shift buffer is empty and CLS reads 0. `first-contentful-paint` reads 104 and
116ms, with two largest-contentful-paint entries beside it, so the buffer is live and the absence
is real. The page's two sections are at 82, 116 tall, and at 198, which leaves no gap between
title and body to collapse.

The cause is not found, and two candidates are eliminated from the code either way. It is not a late
template stylesheet: `body` is `display: none` until `revealPage()` and `decorateMain()` runs first.
It is not the `.share-wrapper` coupling either, because that class is present at first paint.

What would settle it: a throttled load at 412x823 with a buffered layout-shift observer, to see
whether the 51px is there when the CPU is slow.

### Prose links carry an underline live paints transparent

**diverges.** Live paints its underline transparent. This side paints ours, and keeps it.

Live declares `text-decoration: transparent underline solid` on two rules, one of them a bare `a`.
Reading the declaration alone says live underlines these links. The paint colour means a reader sees
no line until hover, where live brings in `var(--dark-yellow)`. The same trick runs on tile titles on
`/`, `/tires` and `/experience/partners`.

`styles.css` paints the underline on a prose link: in default content, and in a paragraph or list item
inside `.cards`, `.columns` or `.hero`. A link that is a title takes `text-decoration: none`, so
titles look like live's. Link colour is inherited on both sides.

What it costs a visitor: a visible underline under each prose link where live shows bare text. That is
the whole difference. A link marked by colour alone fails WCAG 1.4.1, and no colour clears both bars
here. 4.5:1 on white caps a link at 0.1833 luminance while 3:1 against `#333` body text needs 0.1993.
Matching live means reproducing a link indistinguishable from the text around it, which is the failure
the underline clears.

### The hero copy inset above the step

**differs.** Above 1025 `hero.css` takes the copy padding to `96px 32px` where live's
`.marquee__content` takes `margin: 0 64px`. At 1440 on `/learn` the copy starts at x=32 here and at
x=64 on live, so a title begins 32px further left than live's.

Live also varies its block padding per variant, 28/28 by default, 8/30 on `--events` and 38/38 on
`--blank`. Whether this side follows those three is unread, so the remedy is a reading per variant
before a rule is written.

### Superscripts

**diverges on one property.** Size and lift are live's, and so is the line box. This side drops live's
`inline-block`.

Live's `sup` takes `font-size: 0.6em`, `top: -0.5em`, `line-height: 0`, `position: relative`,
`vertical-align: baseline` and `display: inline-block`. One rule in `styles.css` sets the same five
values in em, so it covers each size the mark renders at, and `display` is left at `inline`. Ten of
the 46 product names end in a superscript, `ControlContact Tour A/S Plus` through
`TrueContact Tour54`.

What it costs a visitor: the render is the same on both. The gain is on the other side. An
`inline-block` child makes the accessible-name computation insert a space, so live's own screen reader
says "ExtremeContact Sport 02" as two words and this one says the name as one.

### What matches in layout and type

#### The article h2 reads live's value at every width measured

`/learn/how-do-i-check-my-tire-pressure` has six authored subheads. Six of six read the same values on
each host. At 375 that is 20px on a 38px box at weight 400. At 900 and 1440 it is 30px on 38 at the
same weight. The 20px below 769 is live's own pin and the 30 above is live dropping it.
`styles/article.css` reproduces the pair, 20px at base and 30px inside the 769 block. Live's box is 38
above and below the step, and so is this one.

#### The hero content inset below the step is live's on every variant

Below 1025 the marquee copy insets 20px each side on both. Live declares it once,
`.marquee__container { margin: 0 var(--space-20) }` inside `@media screen and (max-width: 1024px)`,
and `--space-20` is `1.25rem` on live's `font-size: 100%` root. No marquee variant overrides it.
`hero.css` reaches the same number from a base rule, measured as `padding: 28px 20px` on `/learn` and
`/events` at 375 and 900.

#### The content container

`main > .section > div` is `box-sizing: border-box; max-width: 1168px; margin: auto; padding: 0 20px`,
going to 16px from 769. That is live's `.container` translated: `max-width: 73rem` with
`padding: 0 1rem` under a global `* { box-sizing: border-box }`, going to 1.25rem under
`max-width: 768px`. Live's root is `html { font-size: 100% }`, so 73rem is 1168.

| width | content width | starts at |
|---|---:|---:|
| 375 | 335 | 20 |
| 768 | 728 | 20 |
| 769 | 737 | 16 |
| 900 | 868 | 16 |
| 1440 | 1136 | 152 |

Measured at both ends of that table. On `/learn/tips` at 375 the container box reads 375 at x=0, with
`max-width: 1168px` and `padding: 0 20px` on each host. At 1440 the row inside it measures 1136 at
x=152 on each.

Bands measured off this container follow it. The `/events` Social tiles read 177 at 1440 and 127 at
900, and the news column beside them 337 at 900. The `/experience/soccer` video cards read 353.33, 264
and 220.33 at 1440, 900 and 769. Each of those is live's own number.

Four other rules set live's 1136. This container is not one of them. One is the article grid in
`styles/article.css`, where an article page takes `max-width: none` on the wrapper. The other three
are in `blocks/crew/crew.css`, `blocks/hero/hero.css` and `blocks/perfect-fit/perfect-fit.css`, each
inside a section that runs edge to edge.

## Performance and accessibility

### Lighthouse, both sides on one instrument

**differs.** Mobile performance reads 96 to 98 here against live's 58 to 74, and accessibility
100 against live's 84 to 93.

Both columns come off Lighthouse 13.4.1 in one session, mobile form factor and simulated throttling.
They compare to each other rather than to a score from another runner. The homepage, three runs here
and two on live:

| metric | live | ours |
|---|---|---|
| performance | 58, 74 | 96, 98, 98 |
| First Contentful Paint | 2,376 and 2,379ms | 1,140 to 1,292ms |
| Largest Contentful Paint | 3,875 and 6,207ms | 2,247 to 2,640ms |
| Speed Index | 5,624 and 5,894ms | 1,140 to 2,547ms |
| Cumulative Layout Shift | 0.072 and 0.073 | 0 |
| Total Blocking Time | 258 and 434ms | 0ms |

Repeated runs are what the spread demands. A single score from either side is one draw out of a
range, and the ranges here do not overlap on any metric.

Accessibility, one run per page per side: the homepage 93 against 100, `/learn/tips` 92 against
100, `/tires/4x4contact` 84 against 100. `/learn/extremecontact-sport-02-road-trip-challenge`
reads 100 with performance 99 and CLS 0 on the same pass.

Live's failures are a handful repeating across pages. Its viewport meta ships
`maximum-scale=1, user-scalable=no` site-wide, which blocks pinch zoom and fails WCAG 1.4.4. Ours
declares `width=device-width, initial-scale=1` and stops there. On `/tires/4x4contact` live adds
two `role="tab"` buttons with no required parent, carousel `.prev` and `.next` buttons with no
accessible name, and a `/warranty` link whose content is an SVG. The unnamed link repeats on
`/learn/tips`. No audit failed on our side on the four pages read.

The scores do not capture the one control live has and this site does not, which is the
per-section disclosure on a product page.

### Product labels are static text where live's are a disclosure

**differs.** Live wraps each product label in a control a keyboard can open. Ours is text on the
page. Live is ahead here.

Live authors `Best for` and `Technology` as `h2.text-cta` inside
`<con-details mobileonly class="tire-page__column-section">`. The custom element takes the heading
over. On `/tires/4x4contact` the accessibility tree reports `button "BEST FOR"` and
`button "TECHNOLOGY"` with no heading node for either, at 1440 and at 375 alike. That tree does
report live's h1 and its specifications h2 on the same page, so headings reach it and these two do
not.

This site authors the same labels as `p > strong`: `Best for` on all 46 product pages,
`Technology` on 34, with 12 pages carrying no such section. The tree reads `StaticText` for both.

The visible surface matches. A 12px bold uppercase label looks the same whether it is a paragraph
or a heading. Live's extra is a focusable control per section. A keyboard or screen-reader user can
move between live's sections and open them.

Promoting our paragraphs to headings would not close this and would open something worse. It gives
this site's readers a navigable heading live's readers do not get, which is a difference from live
however much it reads like an improvement. The gap is the disclosure, not the heading level.

What it costs a visitor: a screen-reader user reads the sections as continuous text with no
per-section control. A sighted visitor sees the same thing on both sites.

What would close it: build the disclosure, which is a block change rather than an authoring one.

### Delivered HTML weight

**differs.** Live's homepage ships 123,748 bytes of HTML. Ours ships 23,266.

Four pages, `curl -sL <url> | wc -c`, live first.

| page | live | ours |
|---|---:|---:|
| homepage | 123,748 B | 23,266 B |
| `/tires` | 122,032 B | 4,411 B |
| `/events` | 131,716 B | 31,530 B |
| `/learn` | 69,921 B | 12,572 B |

The gap is architecture rather than a trick. Content arrives as semantic HTML and the blocks
decorate it in the browser, so a page ships markup close to its own content. `/tires` is the
extreme case at 28 times lighter, because its listing is built in the browser from
`/products.json`.

HTML weight is not page weight. It is silent on the images, the CSS and the JavaScript that follow.
It is the one number in this section that reads the same way on both sides without a browser.

### Security headers

**differs, and each side has something the other does not.**

Live sends `strict-transport-security: max-age=300`, `x-content-type-options: nosniff` and
`x-frame-options: SAMEORIGIN`, and no Content Security Policy.

We send a CSP with `script-src 'nonce-…' 'strict-dynamic'`, `base-uri 'self'`,
`object-src 'none'`, `frame-src 'self' https:` and `require-trusted-types-for 'script'`. It comes
from the single `meta http-equiv` in `head.html` carrying `move-to-http-header="true"`. Our HSTS
is `max-age=31557600` against live's 300. We send neither `x-content-type-options` nor
`x-frame-options`.

What it costs a visitor: they see no difference. It moves the Lighthouse best-practices CSP audit,
which is the one place it shows up in a score.

Neither missing header can come from this repo. `head.html` reads like the lever because our CSP
arrives that way, and it is narrower than that. The pipeline promotes one node to a header, the
`meta[http-equiv="content-security-policy"]` whose policy contains a `'nonce-aem'`. A second
`meta http-equiv` beside it emits a tag in the body and no header, and browsers ignore these two
headers in meta form anyway.

What would close it: the `headers` object in the site configuration, which is the config service
rather than git. It is documented at <https://www.aem.live/docs/custom-headers>, and there
`x-content-type-options: nosniff` is unconditional and closes half of it.
`x-frame-options: SAMEORIGIN` needs a decision first. Config headers apply to preview as well as
live, and the DA block library is served in a frame from the preview host. SAMEORIGIN there breaks
the authoring surface this rebuild demonstrates. A CSP
`frame-ancestors 'self' https://da.live https://*.da.live` buys the same clickjacking protection
from `head.html` without that cost, at the price of not being a literal superset of live's header
set.

### The annotated tire diagram

**diverges.** Live hides its ring labels below 1181 and reaches none of them by keyboard. We print
the pair belonging to the drawing on screen.

Live's `/all-new-securecontact-aw` draws the tire under the four claims it makes for the
SecureContact AW, with a ring on each part a claim rests on. The markup is
`paragraph--type--tire-features-slider`: four cards, four drawings and eight rings, each ring a
title and a line of explanation. At 375 the sixteen words behind those rings are hidden and a tap
brings one pair back. The ring markers are `span.tire-features-slider__callout-marker-dot` with no
`tabindex` and no focusable behaviour, so a keyboard reaches none of them. Live runs the four cards
as a carousel at those widths, which puts each card in the tab order three times.

`blocks/tire-features` builds the same component from one authored row per feature: the drawing,
the card, and a ring for each part the card claims. Two percentages of the picture place a ring, so
one pair of numbers works at any width and no code measures the image at runtime. At 375 the panel
on screen prints its ring title and explanation under the drawing with no tap, and the panels off
screen keep theirs at `display: none`. The cards scroll and snap where live loops them. The four
drawings are live's own, byte for byte, and the four card icons came out of live's markup.

What it costs a visitor: on a small screen something gained, because live's eight explanations
cannot be read there. A visual diff against live flags the printed labels as text we added. They
are live's own words, moved to where a reader reaches them.

What would not close it: reproducing live's tap-only rings. That is a keyboard trap, and it hides
content at the width where the page is hardest to read.

One measured difference does stand. Live paints `tire-features-slider-bg.webp` behind the black
band, 460,842 bytes, and this site leaves the band at `var(--conti-black)` with no image.

### The block picker's wait belongs to a hosted component

**diverges.** The DA block library takes about 3.6 seconds to become usable. The code that spends
it is Adobe's hosted module rather than a file in this repository.

`tools/sidekick/library.html` is 30 lines. It loads
`https://www.aem.live/tools/sidekick/library/index.js` and instantiates `<sidekick-library>` with
a config naming `/tools/sidekick/library.json` and three viewport buttons. There is no vendored
copy of the component and no build step to patch one.

What the wait is made of, read off a mobile Lighthouse pass on the library page. It scores
performance 87 with LCP and time-to-interactive both at 3.6s over 35 requests:

- the 827-byte `library.html` from our host, done at 242ms
- `index.js` from `www.aem.live`, 121,856 bytes over the wire that expand to 952,210 bytes of
  JavaScript, 247ms to 337ms
- `library.json` from our host and a locale file from `www.hlx.live`, to 600ms
- four more hosted modules and a stylesheet from `www.hlx.live`, 600ms to 917ms
- the 24 sample documents from our host, requested together at 919ms and in by 1,339ms, 23,544
  bytes over the wire

Five hops across three hosts, and the last is the only one this repo controls. Those 24 documents
average 2,044 bytes, they are fetched in parallel, and they finish 2.3 seconds before the picker
draws. The chain is what the time goes on rather than the parse: main-thread work over the load is
0.3s and script evaluation 0.1s.

The obvious fix, drawing the list from the index and fetching a sample when its row opens, is a
change to the hosted module. Forking a platform tool into the site's code bus costs more than the
seconds it saves an author. The index covers the 24 blocks an author places. The seven block
directories without a sample are the header, the footer and infrastructure no author inserts by
hand.

The picker is author-facing, so the merge gate's floor does not apply to it, and live has no
counterpart to be behind.

### What matches in performance and accessibility

- **Authored heading levels.** Below the h1 the homepage takes h2 and no deeper level, on each side.
  Eight learn articles have an authored subhead on both hosts. Each reads live's own level: h3 on
  five of them, `/learn/congratulations-north-carolina-courage` through
  `/learn/new-bmw-5-series-and-i5-come-factory-sportcontact-7-and-other-continental-premium-tires`,
  and h4 on the other three.
- **The font request runs at any width.** `head.html` links `styles/fonts.css` as a stylesheet and
  preloads three of the four woff files, and the delivered HTML carries all four tags whatever the
  viewport. `loadCSS` resolves without appending when a `head > link` already names that href, so the
  width test at `scripts/scripts.js:517` guards a request the head has already made. Live's five
  `@font-face` rules are in its render-blocking sheet with no width gate either.

## What this document does not settle

Three things are open, and each one names what would close it. They are here rather than smoothed
over, because a parity document that reads as complete when it is not is worse than no document.

**Live's by-size tire URL.** `/tire-search/by-size/235-40-18` answers 404, and live's
`/tire-search` page links `/tire-search/by-vehicle` and no by-size path. The by-size entry point
cannot be reconstructed from the public site. What would close it: a live page that links a by-size
result.

**A single performance score does not travel.** Three consecutive local Lighthouse runs of our
homepage read Speed Index 1,140ms, 1,212ms and 2,547ms. Total Blocking Time reads 0ms in the three
and performance 96, 98 and 98. Live's two runs read 58 and 74, with LCP 6,207ms and 3,875ms. A range
is the honest form, and a single score is one draw out of that range. The repo's own PageSpeed gate
is the noisier of the two instruments. It reports rows with no score, where the badge reads the
single character `0` and the Audits column names the reason, `Timeout Exceeded` or
`Lighthouse returned error`. A `0` badge is a missing score rather than a scored zero, and counting
`PERFORMANCE-` badges against rows is what separates them. What would close it: read a metric off
several runs before quoting it, which is what the rows above do.

**How much of the site has a reading.** 329 paths are published, and the performance and
accessibility readings here cover a few dozen of them, the pages a change happened to touch. That
is the opposite of a sample. What would close it: a sweep that measures paths chosen for coverage
rather than for having been edited.

One limitation is structural and outlives any particular reading. A fixed set of sampled widths
cannot see a difference that shows up only between two of them. No number of readings at those
widths changes that. The widths sampled in this document are 375, 599, 600, 700, 768, 769, 900,
1181 and 1440. A difference living strictly between two neighbours in that list is invisible to the
readings taken here.
