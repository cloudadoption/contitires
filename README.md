# Continental Tire on AEM Edge Delivery Services

A proof-of-concept migration of [continentaltire.com](https://continentaltire.com/) (Drupal 11) onto [AEM Edge Delivery Services](https://www.aem.live/) with [DA](https://da.live/) as the content source. Built in three days (2026-07-24/26) to show how the existing Drupal implementation carries over: what maps cleanly, what needs real backends, and what authoring looks like afterwards.

This is a technical demo, not Continental's site. All content, images, product data, and trademarks belong to Continental and were taken from the public site for migration purposes only.

- POC site: <https://main--contitires--cloudadoption.aem.live/>
- Preview: <https://main--contitires--cloudadoption.aem.page/>
- Authoring: <https://da.live/#/cloudadoption/contitires> (needs DA access)

## Contents

- [The short version](#the-short-version)
- [How the site is put together](#how-the-site-is-put-together)
- [What carried over](#what-carried-over)
  - [Design system](#design-system)
  - [Header and mega-menu](#header-and-mega-menu)
  - [Site search](#site-search)
  - [Footer](#footer)
  - [Homepage](#homepage)
  - [Tire finder](#tire-finder)
  - [Tire listing and category pages](#tire-listing-and-category-pages)
  - [Product pages and the products workbook](#product-pages-and-the-products-workbook)
  - [Learn hub and articles](#learn-hub-and-articles)
  - [Video articles](#video-articles)
  - [Experience section](#experience-section)
  - [Simple content pages](#simple-content-pages)
  - [URL aliases](#url-aliases)
  - [Images](#images)
  - [Author tooling](#author-tooling)
- [What did not carry over, and how it would](#what-did-not-carry-over-and-how-it-would)
  - [Store finder](#store-finder)
  - [Vehicle and plate lookup in the tire finder](#vehicle-and-plate-lookup-in-the-tire-finder)
  - [Bazaarvoice reviews](#bazaarvoice-reviews)
  - [PDP media gallery and fitment checker](#pdp-media-gallery-and-fitment-checker)
  - [Martech and third-party embeds](#martech-and-third-party-embeds)
  - [Forms with a backend](#forms-with-a-backend)
- [Global caveats](#global-caveats)
- [Working on this repo](#working-on-this-repo)
- [Documentation](#documentation)

## The short version

The live site's sitemap lists 319 URLs. The POC publishes 329 pages: 214 learn articles plus their 4 category pages, 16 experience pages, 46 tire product pages, the tire listing and its 11 category pages, 28 standalone pages, and 9 block-library pages. The remaining live URLs are the data-driven part: the store finder and the standalone tire-search tools.

The build started with three deliberately simple pages (newsletter signup, online retailers, customer support), then grew into a full 1:1 migration. Day 1: extract the live theme CSS and rebuild the design system, build header, footer, hero, cards, and the article template, rebuild the homepage, then bulk-migrate all 214 learn articles with a scripted extractor (curl + BeautifulSoup against the server-rendered Drupal pages, pushed through the DA admin API, zero failures). Day 2: unit-test harness and CI, a query index for the learn section, the learn hub and category pages, a 13-product catalog with generated product pages, an author-facing block library, and two rounds of visual-fidelity fixes driven by screenshot and computed-style comparison against live (34 issues, 40 merged PRs total). Day 3: the tire listing behind `/tires`, its 11 category pages, and the 33 product pages they link to.

Lighthouse on the homepage: performance 99-100, accessibility 94-96, best practices 100. The repo has 19 blocks (12 built for this site) and 14 unit-test files.

## How the site is put together

Edge Delivery serves pages from two sources. Content lives in DA as documents and sheets, gets converted to plain semantic HTML, and is delivered through the content bus. Code lives in this repo: each block under `blocks/` is a CSS file plus a JS decorator that upgrades the authored markup in the browser. Publishing content and merging code are independent; preview (`.aem.page`) and live (`.aem.live`) are separate publish states.

The Drupal concepts map like this:

| Drupal | Edge Delivery | Example here |
|---|---|---|
| Paragraph bundle | Block + authored document | Hero and promo bar on [the homepage](https://main--contitires--cloudadoption.aem.live/) |
| Views listing | Query index + block | [article-cards](blocks/article-cards/article-cards.js) over `/learn/query-index.json` |
| Faceted view + taxonomy term pages | Sheet + one block, one facet per page | [tire-listing](blocks/tire-listing/tire-listing.js) over `/products.json?sheet=catalog` |
| `con-*` custom element | Block decorator JS | [perfect-fit](blocks/perfect-fit/perfect-fit.js), [tire-specs](blocks/tire-specs/tire-specs.js) |
| Structured entity data | DA sheet (workbook) | [/products.json](https://main--contitires--cloudadoption.aem.live/products.json) |
| Webform / embedded form | Widget embed or external link | [HubSpot newsletter widget](widgets/hubspot/newsletter.html) |
| Theme CSS | Design tokens in `styles/` | [styles/styles.css](styles/styles.css) |

## What carried over

Each item links the live original, the POC page, the code, and the DA authoring view. DA links need access to the `cloudadoption` org.

### Design system

[styles/styles.css](styles/styles.css) ports the design tokens out of the live site's 582 KB theme CSS: the `#ffa500` yellow, pill buttons, dark sections, and the Stag Sans type system. The type scale was measured element by element against live with `getComputedStyle`; headings are Stag Sans weight 300, capped at 42px. [styles/fonts.css](styles/fonts.css) loads the fonts from the live site's own URLs, which works because live serves them with an open CORS header. A production build must license and self-host them; the file says so.

Differs from live: a full audit on 2026-07-26 (27 pages, three widths, screenshot plus DOM comparison) found the remaining gaps and filed them as issues #75 to #127. The systemic ones: the desktop nav overflows the viewport at tablet widths (#75), the rebate ribbon exists only on the homepage (#78), the mobile footer lacks live's accordions (#79), the social band lacks its network labels (#81), and standalone pages miss live's dark title bands (#82). Content substance matches on almost every page; treatment gaps dominate.

### Header and mega-menu

[blocks/header](blocks/header/header.js) renders the yellow bar, seven top items, utility nav (Chat now to Zendesk, Customer support), and an expandable search field. Every dropdown opens as a full-width dark mega-menu, matching live's `header--dark`; the Tires panel has seven columns of real product links. The menu tree is content: edit the nav document in DA and the menu changes without a deploy.

- Live: [continentaltire.com](https://continentaltire.com/) (any page)
- POC: [/nav.plain.html](https://main--contitires--cloudadoption.aem.live/nav.plain.html) rendered on [every page](https://main--contitires--cloudadoption.aem.live/)
- Code: [blocks/header/header.js](blocks/header/header.js), [blocks/header/header.css](blocks/header/header.css)
- Author: [nav in DA](https://da.live/edit#/cloudadoption/contitires/nav)

Differs from live: a few menu targets point at pages the POC does not have, `/Store-finder`, `/tires/fleet` and `/experience/bmw-cca` among them, and the [redirects sheet](#url-aliases) answers each one. The desktop nav overflows the viewport between 900px and about 1120px (#75), the open mega panel is wider than the viewport (#76), and dropdown keyboard state is broken (#106).

### Site search

Live runs Drupal Search API over Solr. The POC searches in the browser, over a site-wide query index. The index holds each page's title, description and body text, capped at 500 words a page: 172.5 KB gzip for 320 pages. [blocks/search](blocks/search/search.js) reads `?keywords=` and `&page=`, scores the rows with [scripts/search.js](scripts/search.js), and renders ten results a page with live's markup, paging and copy. Scoring weights a title hit above a description hit above a body hit, folds plurals, and requires every query term. The block builds each excerpt from the body around the matches, and fetches the index on the load event, after the page has painted.

- Live: [/search?keywords=warranty](https://continentaltire.com/search?keywords=warranty)
- POC: [/search?keywords=warranty](https://main--contitires--cloudadoption.aem.live/search?keywords=warranty)
- Code: [blocks/search/search.js](blocks/search/search.js), [scripts/search.js](scripts/search.js)
- Author: [search in DA](https://da.live/edit#/cloudadoption/contitires/search)

Differs from live: the ranking is ours. Solr's relevance scores and index exclusions cannot be read from outside, so the scorer was tuned against live's own page-1 results for six queries. 30 of live's 50 page-1 results sit in our top ten, and totals differ (live returns 35 for "winter tires", we return 44). Live keeps `/warranty` and `/legal` out of its results and we rank them first for "warranty". Live returns nothing for a two-letter query and we return results. There is no sort-by-date control, because the index has no date. Results need JavaScript; live renders them on the server.

### Footer

[blocks/footer](blocks/footer/footer.js) regroups a flat authored document: heading-plus-list pairs become link columns, lone button paragraphs collect into the CTA row, and a link group whose entries are all social hosts turns into the full-width icon bar at the top.

- Live: [continentaltire.com](https://continentaltire.com/) (any page)
- POC: [/footer.plain.html](https://main--contitires--cloudadoption.aem.live/footer.plain.html)
- Code: [blocks/footer/footer.js](blocks/footer/footer.js), [blocks/footer/footer.css](blocks/footer/footer.css)
- Author: [footer in DA](https://da.live/edit#/cloudadoption/contitires/footer)

Differs from live: live collapses the columns into accordions on mobile; the POC keeps static columns. Several links target pages the POC does not have.

### Homepage

One DA document, authored block by block in the live page's order: hero, promo bar (expandable rebate disclosure), tire-finder bar, category tiles, the dark Total Confidence Plan band with its six coverage icons, the stores module, a 7-slide feature carousel, the news strip, and a closing hero. Every section was aligned to live through measured computed-style comparison.

- Live: [continentaltire.com](https://continentaltire.com/)
- POC: [main--contitires--cloudadoption.aem.live](https://main--contitires--cloudadoption.aem.live/)
- Code: [blocks/hero](blocks/hero/hero.js), [blocks/promo-bar](blocks/promo-bar/promo-bar.js), [blocks/carousel](blocks/carousel/carousel.js), [blocks/cards/cards.css](blocks/cards/cards.css)
- Author: [index in DA](https://da.live/edit#/cloudadoption/contitires/index)

Differs from live: the carousel slides use substituted product images, because live renders its slides inside a shadow-DOM component whose images are not reachable statically. The news band shows one static customer quote where live pulls Bazaarvoice data. The EmbedSocial wall and the rebate popup modal are not reproduced.

### Tire finder

The live site's core tool, rebuilt as the [perfect-fit](blocks/perfect-fit/perfect-fit.js) block: the "Find your perfect fit" bar opens an accessible modal (ARIA tabs, focus trap) with the same three modes as live. By Tire Size is real: cascading width, aspect, and rim selects built from the product data, with exact matching. Results link to the POC's own product pages. Verified end to end on production: 155/70R19 resolves to the VikingContact 7.

- Live: [/tire-finder](https://continentaltire.com/tire-finder)
- POC: [homepage](https://main--contitires--cloudadoption.aem.live/), "Find your perfect fit" bar
- Code: [blocks/perfect-fit/perfect-fit.js](blocks/perfect-fit/perfect-fit.js)
- Author: [products sheet](https://da.live/sheet#/cloudadoption/contitires/products) (the data), [index in DA](https://da.live/edit#/cloudadoption/contitires/index) (the bar)

Differs from live: By Vehicle runs on a small curated make/model set, By Plate returns a canned recommendation. Both need data the public site does not expose; see [the gap entry](#vehicle-and-plate-lookup-in-the-tire-finder). 5 of 13 products carry representative rather than scraped size lists.

### Tire listing and category pages

Live's tire catalog, rebuilt as the [tire-listing](blocks/tire-listing/tire-listing.js) block: 46 tires, three filter groups, three sorts and ten results per page, over one fetch of the catalog sheet. Every interaction after that is a local array operation, so nothing costs a request.

The filter semantics follow live, including its asymmetry: checked Vehicle Type boxes are intersected, Driving Condition and Weather Condition are unioned, and the three groups are intersected with each other. The unit tests assert the result total live itself reports for each of the twelve facets, and the slug order each of the eleven category pages renders.

The 11 category pages are the same block with one facet authored into it. Each taxonomy term on live has its own editorial order, and it is not the all-tires order, so the catalog sheet records a tire's position per facet as well as its position in the full list.

- Live: [/tires](https://continentaltire.com/tires), [/tires/ultra-high-performance](https://continentaltire.com/tires/ultra-high-performance)
- POC: [/tires](https://main--contitires--cloudadoption.aem.live/tires), [/tires/ultra-high-performance](https://main--contitires--cloudadoption.aem.live/tires/ultra-high-performance), data at [/products.json?sheet=catalog](https://main--contitires--cloudadoption.aem.live/products.json?sheet=catalog)
- Code: [blocks/tire-listing](blocks/tire-listing/tire-listing.js)
- Author: [catalog sheet](https://da.live/sheet#/cloudadoption/contitires/products), [tires in DA](https://da.live/edit#/cloudadoption/contitires/tires)

Differs from live on purpose. Filtering, sorting and paging happen in the browser rather than as a page load. An out-of-range page number clamps instead of rendering an empty list. Every sort has a full tiebreak, so a tire cannot move between pages. The result count is announced to a screen reader. Filter state goes into the URL as readable parameters (`?vehicle=passenger&weather=summer`), and the Drupal term-id parameters live deep-links with are still read, so an inbound link keeps working. Ratings are reconstructed from live's star widths, so they are exact to one decimal rather than to live's stored value. Live's own listing links VanContact A/S Ultra at a path that 404s; the POC links the page.

Measured against live at 375, 900 and 1440: the card width, tire image, badge rows, description line count and desktop title match. The mobile card is about 10% shorter, a difference in vertical rhythm rather than in content. Mobile page height runs longer than live because of the footer (#79), not the listing.

### Product pages and the products workbook

46 tire product pages, generated from scraped live data and pushed to DA as normal editable documents: product hero (image, name, description, Highlights, Best for and Technology lists) plus a [tire-specs](blocks/tire-specs/tire-specs.js) block with a size selector and per-size spec grid (UTQG, load index, tread depth, 19 fields). The data behind the finder, the listing and the spec tables is a single multi-sheet DA workbook, `/products.json`: a `products` sheet (46 rows), a `specs` sheet (1315 size rows) and a `catalog` sheet (46 rows, what the listing renders). Authors edit it like a spreadsheet; no deploy involved. Live builds its spec table client-side from JSON too, so the mechanism matches. Each block asks for the one sheet it needs, so no page pays for the whole workbook.

- Live: [/tires/extremecontact-sport-02](https://continentaltire.com/tires/extremecontact-sport-02)
- POC: [/tires/extremecontact-sport-02](https://main--contitires--cloudadoption.aem.live/tires/extremecontact-sport-02), data at [/products.json](https://main--contitires--cloudadoption.aem.live/products.json)
- Code: [blocks/tire-specs](blocks/tire-specs/tire-specs.js), [blocks/size-list](blocks/size-list/size-list.js)
- Author: [products sheet](https://da.live/sheet#/cloudadoption/contitires/products), [a PDP in DA](https://da.live/edit#/cloudadoption/contitires/tires/extremecontact-sport-02)

Differs from live: six products have no spec rows (contipremiumcontact-2, contitrac, controlcontact-tour-as-plus, purecontact-ls, truecontact-tour, 4x4sportcontact); live shows empty spec selectors for those as well. purecontact-ls also renders only its hero, with the page body missing (#93). No reviews, media gallery, or fitment checker (see the gaps), and no Product JSON-LD.

### Learn hub and articles

The largest content type, migrated completely: 214 articles as plain documents with `Template: Article`, `Category`, and `Weight` metadata. A query index over `/learn/` (configured through the AEM Config Service, no code involved) feeds the [article-cards](blocks/article-cards/article-cards.js) block, which filters by category and sorts by editorial weight. The hub combines a hero, a [category-tabs](blocks/category-tabs/category-tabs.js) sub-nav, and per-category card sections; the category pages add a [banner](blocks/banner/banner.js) with breadcrumb. Live exposes no publish dates, so the live listing order was scraped from its server-side pagination and written back as weight metadata on 211 articles. The category pages match live's order.

- Live: [/learn](https://continentaltire.com/learn), [/learn/tips](https://continentaltire.com/learn/tips), [an article](https://continentaltire.com/learn/seven-tips-storing-tires)
- POC: [/learn](https://main--contitires--cloudadoption.aem.live/learn), [/learn/tips](https://main--contitires--cloudadoption.aem.live/learn/tips), [the same article](https://main--contitires--cloudadoption.aem.live/learn/seven-tips-storing-tires), index at [/learn/query-index.json](https://main--contitires--cloudadoption.aem.live/learn/query-index.json)
- Code: [blocks/article-cards](blocks/article-cards/article-cards.js), [blocks/category-tabs](blocks/category-tabs/category-tabs.js), [blocks/banner](blocks/banner/banner.js), [styles/article.css](styles/article.css)
- Author: [learn hub in DA](https://da.live/edit#/cloudadoption/contitires/learn), [an article in DA](https://da.live/edit#/cloudadoption/contitires/learn/seven-tips-storing-tires)

Differs from live: live paginates 10 per page server-side, the POC batches 12 behind a load-more button. The article share sidebar was left out; articles use a centered reading column instead. 3 articles have no category and appear only in unfiltered lists.

### Video articles

63 learn articles carry a video, 75 videos in all. Live builds the player in the browser, so the migration took the page without it and they read as a title, a picture and a blurb. The id live builds from is in its server HTML, on the element that opens the player. Every one was read from there rather than guessed from a thumbnail filename. Thumbnail names carry the id on 39 of the 75.

The id is authored into the page as a link, so it is content: with JavaScript off the block is a picture and a link to the video. The [video](blocks/video/video.js) block turns that into a poster with a play control and builds the iframe when it is clicked. Nothing is requested from YouTube until then, which is what live does. The player comes from the no-cookie host.

60 posters were images DA already held. 15 were taken from live, the derivative each page names. Two of those replaced references the image migration had to leave on continentaltire.com, because live answers the social-image derivative with 404 but serves the poster.

- Live: [an article](https://continentaltire.com/learn/art-racing-rain), [one that opens with the video](https://continentaltire.com/learn/tony-stewart-talks-tire-size)
- POC: [the same article](https://main--contitires--cloudadoption.aem.live/learn/art-racing-rain), [the same one](https://main--contitires--cloudadoption.aem.live/learn/tony-stewart-talks-tire-size)
- Code: [blocks/video](blocks/video/video.js), [styles/article.css](styles/article.css)
- Author: [an article in DA](https://da.live/edit#/cloudadoption/contitires/learn/art-racing-rain)

Differs from live: live opens the video in a modal over the page, ours plays in place. Live renders the player and the article stills at 747 wide against a 559 reading column; both sit at the reading measure here. One page, [/learn/continental-science-guy](https://main--contitires--cloudadoption.aem.live/learn/continental-science-guy), shows its five videos in a media gallery on live and is still a stub here (see [PDP media gallery](#pdp-media-gallery-and-fitment-checker)).

### Experience section

The partnership and sponsorship section: hub plus 15 subpages (AMG Driving Academy, BMW CCA, GR Cup, MLS, ROUSH, USF Pro and the rest), migrated on the article template. Six pages use the [share](blocks/share/share.js) block, which builds Facebook, X, LinkedIn, and mail share links from the page URL.

- Live: [/experience](https://continentaltire.com/experience)
- POC: [/experience](https://main--contitires--cloudadoption.aem.live/experience), for example [/experience/amg-driving-academy](https://main--contitires--cloudadoption.aem.live/experience/amg-driving-academy)
- Code: [blocks/share/share.js](blocks/share/share.js), [styles/article.css](styles/article.css)
- Author: [experience in DA](https://da.live/edit#/cloudadoption/contitires/experience)

Differs from live: live's Sports subpage renders most of its items client-side, so only the server-rendered part could be migrated. The Conti Crew member pages carry live's own template, and they leave out the EmbedSocial feed live runs between the quote and the fact scroller.

### Simple content pages

The long tail, all migrated as authored documents over existing blocks: the three original POC targets ([online retailers](https://main--contitires--cloudadoption.aem.live/online-retailers), [customer support](https://main--contitires--cloudadoption.aem.live/customer-support), [newsletter signup](https://main--contitires--cloudadoption.aem.live/newsletter-signup) with the same public HubSpot form as live, embedded through the [widget block](blocks/widget/widget.js)), the [warranty page](https://main--contitires--cloudadoption.aem.live/warranty) with live's shield marquee, its six benefits on a dark band with the marks taken from the live markup, and its two closing bands, the [brand assets page](https://main--contitires--cloudadoption.aem.live/media) with its logos and its tire images behind live's two tabs, the [online retailers page](https://main--contitires--cloudadoption.aem.live/online-retailers) with live's black band, its store finder and its retailers behind one bar, and a financing link in each tile, [offers](https://main--contitires--cloudadoption.aem.live/offers) and the rebate [promotion](https://main--contitires--cloudadoption.aem.live/promotion) pages, campaign landings like [all-new-securecontact-aw](https://main--contitires--cloudadoption.aem.live/all-new-securecontact-aw) and [ev-compatible](https://main--contitires--cloudadoption.aem.live/ev-compatible), and the [legal](https://main--contitires--cloudadoption.aem.live/legal) and privacy pages.

- Live: [/online-retailers](https://continentaltire.com/online-retailers), [/customer-support](https://continentaltire.com/customer-support), [/newsletter-signup](https://continentaltire.com/newsletter-signup), [/warranty](https://continentaltire.com/warranty), [/promotion](https://continentaltire.com/promotion)
- Code: mostly [blocks/cards](blocks/cards/cards.js) and default content; [widgets/hubspot](widgets/hubspot/newsletter.html) for the form, [blocks/events](blocks/events/events.js) for the events page, [blocks/tabs](blocks/tabs/tabs.js) for the brand assets and online retailers pages, [blocks/retailers](blocks/retailers/retailers.js) for the retailer tiles, [blocks/hero](blocks/hero/hero.js) for the warranty marquee
- Author: for example [online-retailers in DA](https://da.live/edit#/cloudadoption/contitires/online-retailers), [warranty in DA](https://da.live/edit#/cloudadoption/contitires/warranty)

Differs from live: rebate submission, credit-card application, tire registration, and support chat are outbound links here, but they are outbound links on live too. The [events page](https://main--contitires--cloudadoption.aem.live/events) carries a seven-entry sample instead of the full calendar, on live's own two-part card. Live's filter reads a calendar with no public source, so the entries are authored. On the brand assets page live's tires tab also filters by category; all four groups stand on the page here, unfiltered. Live's store finder and its online retailers are two pages behind one bar; both land on /online-retailers here, so the bar holds two panels on one page and opens the retailers, as the URL says. What stands behind its first tab is the [store finder mock](#store-finder). On the warranty page a benefit title carries its disclosure marker as text where live sets a superscript link, so the longest of the six wraps a line early at 1440. Live sets a band heading at 30px and this site's scale takes an h2 to 42, which is what the two closing bands read. The marquee holds the line count the fallback face needs below 420, so the band under it stays put when Stag Sans lands; with the fonts in place that leaves 36 of empty space at 375 and 64 from 400 to 418. Live loads the newsletter form's HubSpot embed with the page; here it loads in the delayed phase, and the widget holds open the height the form settles at, so the footer stays put: 2051 below 480, 1340 from there, 1176 from 768. Live's own form leaves the lower third of that height empty and the reserved box keeps that empty space, so the form appears later here and in a box a little taller than itself.

### URL aliases

Drupal answers a set of old paths with a 301. The migration copied the links that use them, but not the aliases behind them. A [redirects sheet](https://da.live/sheet#/cloudadoption/contitires/redirects) holds them now: 13 rows of `Source` and `Destination`, read by the pipeline before any page is served. It covers live's own aliases (`/partners`, `/conti-crew`, `/experience/bmw-cca`, `/store-finder`), the paths whose pages the POC does not have (`/tire-search`, `/perfect-fit`, `/tires/fleet`), the Conti Crew show whose page sits under a different slug (`/experience/conti-crew/straight-pipes`), and two documents that stayed on live. The sheet is content, so an author adds a redirect without a deploy, and it applies to every branch preview at once.

- Sheet: [redirects in DA](https://da.live/sheet#/cloudadoption/contitires/redirects), served at [/redirects.json](https://main--contitires--cloudadoption.aem.live/redirects.json)
- Docs: [aem.live redirects](https://www.aem.live/docs/redirects)

Differs from live: where a page was not migrated, the redirect lands on the nearest page that exists. `/tire-search` is a fitment results page on live and the tire listing here; the four Conti Crew shows land on the Conti Crew hub.

### Images

The migration copied the pages and left their images on continentaltire.com, so the site depended on the Drupal host staying up and licensable. The corpus is in DA now: 480 files under [/media](https://da.live/#/cloudadoption/contitires/media), each downloaded as live serves it and uploaded unchanged. Nothing was resized or re-encoded. The folders name the Drupal image style each reference used: `og_image`, `marquee`, `original` and the rest.

The pipeline pulls a DA image into the media bus when it previews the page, so pages deliver `./media_<hash>.<ext>` from this host as before. The hashes are unchanged, so the delivered bytes are the same.

The products workbook holds a tire image on every row, and a sheet cell is fetched by the browser rather than by the pipeline. Those rows name the file's own path on this site, and the file is published like any other resource so the path resolves. Filenames carry no underscore, because the publish API turns one into a dash when it looks a file up in the content source.

Page metadata no longer names a social image. The pipeline derives `og:image` from the page's first image instead. That keeps it on this host, so the query index records a path that resolves here. Search thumbnails hotlinked live for that reason (#161).

- Author: [media in DA](https://da.live/#/cloudadoption/contitires/media)
- Code: [blocks/search/search.js](blocks/search/search.js) reads the index image

Differs from live: one reference stayed on continentaltire.com, on an unpublished block sample, because live answers it with 404. Two others were on article pages and went when those pages got their players.

### Author tooling

Authors get a block library: 9 sample documents under [/tools/sidekick/blocks/](https://main--contitires--cloudadoption.aem.live/tools/sidekick/blocks/perfect-fit), wired into the DA editor through a `library` sheet in the DA site config, so blocks are inserted from a picker instead of being typed from memory. DA's Experience Workspace is switched on for the site. The [library app](tools/sidekick/library.html) and its [config](tools/sidekick/library.json) live in the repo; the sample content is authored in DA like everything else.

## What did not carry over, and how it would

The pattern in every entry: the UI part is an ordinary block, the hard part is data the public site does not expose.

### Store finder

Live: [/Store-finder](https://continentaltire.com/Store-finder), store search with map and list. The POC's [store-locator block](blocks/store-locator/store-locator.js) is a static mock by design: disabled input, one hardcoded example store. It stands behind the first tab of [online retailers](https://main--contitires--cloudadoption.aem.live/online-retailers), where /Store-finder redirects. Live centres its search over a results list and a map; the mock keeps the block's own two columns. There is no public store database to scrape. A real version needs the dealer list (a DA sheet works for a static set), a geocoding service, and a lazily loaded map library; the block then queries the data client-side. Live's own map provider is not visible in its static HTML.

### Vehicle and plate lookup in the tire finder

Live resolves vehicles and license plates against a fitment database. Its finder API sends no CORS header, so a browser cannot call it, and there is no public alternative. The modal UI is done; wiring By Vehicle to a licensed fitment API (or a small same-origin proxy in front of one) and By Plate to a registration lookup replaces the curated demo data without touching the block's structure.

### Bazaarvoice reviews

Live PDPs embed Bazaarvoice reviews and Q&A. Deliberately excluded here. The EDS pattern for any such vendor script: load `bv.js` in the delayed phase ([scripts/delayed.js](scripts/delayed.js), which loads the widget embeds the same way), keep the per-product ID in page metadata, and add the container markup to the PDP. Third-party scripts stay out of the critical path by construction.

### PDP media gallery and fitment checker

Live PDPs have an image and video gallery with a modal viewer and a "does it fit my car" checker. One learn article, [/learn/continental-science-guy](https://main--contitires--cloudadoption.aem.live/learn/continental-science-guy), uses the same gallery for five videos and waits on the same block. The gallery is buildable as a plain block over authored images; the assets beyond the primary product shot were not statically reachable. The fitment checker has the same data problem as the finder's vehicle mode.

### Martech and third-party embeds

Live loads Google Tag Manager on every page, pushes ecommerce events on PDPs, shows an EmbedSocial wall on the homepage, and runs its own cookie-consent popup and rebate modal. None of that is in the demo; Edge Delivery ships its own RUM instead. All of it goes into the delayed phase: GTM and the consent script from `delayed.js`, the EmbedSocial container as a small embed block. See [keeping it 100](https://www.aem.live/developer/keeping-it-100) for why the phase matters.

### Forms with a backend

The racer tire program page is a Drupal webform on live and a design shell here, because there is no backend to receive submissions. Options in EDS: a forms block posting to a sheet or endpoint, or an external form service embedded like the [HubSpot newsletter widget](widgets/hubspot/newsletter.html). Every other live form is an outbound redirect (Zendesk, Synchrony, the rebate portal) and is reproduced as an outbound link.

## Global caveats

- Fonts are hotlinked from the live site. A production build licenses and self-hosts them.
- Links into unbuilt territory land on the nearest page that exists, through the [redirects sheet](#url-aliases). Two dead links remain, both on `/customer-support/technical-documents`, and live answers both targets with "Access denied".
- Images live in DA and are served from this host. One reference stayed on continentaltire.com because live answers it with 404 (see [Images](#images)).
- Both `.aem.page` and `.aem.live` send `x-robots-tag: noindex` until a production domain exists. Right for a demo, and it caps Lighthouse SEO crawlability scores on these hosts.
- The remaining parity, code, and authoring findings from the 2026-07-26 audit are tracked as issues #75 to #127.
- Article ordering rests on scraped editorial order, not real publish dates; live does not expose any. The same holds for the tire listing, where the order is scraped per category.
- The learn index has 217 rows for the 218 pages under `/learn/`; 3 articles have no category.

## Working on this repo

```sh
npm i
npx -y @adobe/aem-cli up   # dev server at http://localhost:3000
```

The dev server proxies content from preview and serves code from your working copy, so a block edit shows up on reload with real content behind it. Content changes happen in [DA](https://da.live/#/cloudadoption/contitires): documents for pages, the [products sheet](https://da.live/sheet#/cloudadoption/contitires/products) for tire data, preview and publish from the editor.

Code flow: push a branch and AEM Code Sync serves it at `https://{branch}--contitires--cloudadoption.aem.page/` with the same content. Branches test code, not content. Open a PR with a `Test URLs:` line pointing at a branch-preview page; the `aem-psi-check` bot runs Lighthouse against it and rejects the PR without that line. Repo convention on top: reference the issue (`Fix #n`), give Before/After URLs, keep the branch after merge so the After link survives.

Before pushing:

```sh
npm run lint
npm test        # @web/test-runner; 11 test suites cover the blocks with JS logic
```

## Documentation

- [Developer tutorial](https://www.aem.live/developer/tutorial) and [anatomy of a project](https://www.aem.live/developer/anatomy-of-a-project)
- [Markup, sections, blocks](https://www.aem.live/developer/markup-sections-blocks) and the [block collection](https://www.aem.live/developer/block-collection)
- [Indexing](https://www.aem.live/developer/indexing) (query indexes like `/learn/query-index.json`)
- [Keeping it 100](https://www.aem.live/developer/keeping-it-100) (the three-phase loading model)
- [DA documentation](https://docs.da.live/) for authoring and the admin API
- [David's model](https://www.aem.live/docs/davidsmodel) for the rules this project follows
