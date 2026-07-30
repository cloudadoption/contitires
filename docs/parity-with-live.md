# Parity with continentaltire.com

This is an AEM Edge Delivery Services rebuild of continentaltire.com, served at
<https://main--contitires--cloudadoption.aem.live/>. It is a proof of concept, not
Continental's site.

The document says what the rebuild does the same way as live, what it does differently, and
what it cannot do at all. The third group is the one that needs stating: some gaps come from
systems that are not visible from outside the live site, so no amount of work here closes
them. Nothing else in the repo separates those from work left undone.

Read on 2026-07-30. Numbers here were derived against the repo, `gh`, or the served page
rather than copied from an issue body, and the command is named where the number carries
weight. This project's own issues have recorded a wrong count on at least nine occasions in
seven days, so a count with no provenance is not evidence.


## Showing this site today

### Show these

**`/events`.** Live closes the page with one black band, Social on the left and News on the
right. We match it at 1440, 900 and 375: same background, 110px column gap, 80/60 padding,
titles at 42/48 weight 300 tracked 6 in capitals. Recorded 100 performance and 100
accessibility on 2026-07-29 in #340.
[PSI, ours](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fmain--contitires--cloudadoption.aem.live%2Fevents)
against [PSI, live](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fcontinentaltire.com%2Fevents).

**`/learn` and `/learn/news-and-events`.** 219 learn articles behind a query index
(`/learn/query-index.json`, `total: 219`), the hub, its four category pages, and live's
EVERYTHING / NEWS / CORPORATE pill row.
[PSI, ours](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fmain--contitires--cloudadoption.aem.live%2Flearn).

**`/tires` and one product page.** The listing and its 11 category pages run over a single
authored workbook, `/products.json`: 46 products in the products sheet, 46 in the catalog
sheet, 1656 rows of size-level specs. Open
[`/tires/extremecontact-dws06-plus`](https://main--contitires--cloudadoption.aem.live/tires/extremecontact-dws06-plus)
and pick a size to show the specs band reading from that sheet.
[PSI, ours](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fmain--contitires--cloudadoption.aem.live%2Ftires)
against [PSI, live](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fcontinentaltire.com%2Ftires).

**`/experience/conti-crew/straight-pipes`.** The page was rebuilt from live's markup:
breadcrumb, two-line hero, round logo badge, the black crew bar with both hosts, live's
black quote band with the orange mark, the dark facts panel, the badged tile row. Its h1 box
measures 600x160, which is live's to the pixel (#299).

**Delivered HTML weight, side by side.** Live's homepage ships 123,760 bytes of HTML, ours
22,430. Live's `/tires` ships 122,044, ours 3,898. Read with
`curl -sL <url> | wc -c` on 2026-07-30. The gap is the architecture, not a trick: content
arrives as semantic HTML and the blocks decorate it in the browser.
[PSI, our homepage](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fmain--contitires--cloudadoption.aem.live%2F)
against [PSI, live's homepage](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fcontinentaltire.com%2F).

**The authoring surface.** `/tools/authoring-guide` is five published pages authored in DA,
so the guide is an example of the thing it describes. The block library serves 22 samples
under `/tools/sidekick/blocks/`, listed in `/tools/sidekick/library.json` (`total: 22`).
For an audience watching the method rather than the pixels, this is the strongest part.

**DA itself**, <https://da.live/#/cloudadoption/contitires>. Needs access to the
`cloudadoption` org.

### Avoid these

- **Store search, anywhere.** Live queries a location service that is not visible from
  outside; `/store-finder` is a redirect row onto `/online-retailers` here (#264, #281).
- **By Vehicle in the tire finder.** A hand-written table of 6 makes and 17 models against
  live's 30 years and about 40 makes, answering with a vehicle class rather than a fit
  (#307, #308).
- **`/racer-tire-program`.** The sponsorship form UI is not built (#101).
- **`/my-first-car-my-first-tires`.** 404 here, a campaign page on live (#336).
- **`/ev-compatible`.** Card headings are invisible against the dark section (#87).
- **`/tires/contipremiumcontact-2` at 375.** The product name scrolls sideways (#320).
- **`/events` at 375.** Live runs the Social row as a carousel, we stack six squares (#341).
- **`/newsletter-signup`.** The reserved form shell stands empty for about four seconds
  (#230).
- **Heading sizes on `/learn/how-do-i-check-my-tire-pressure`.** Six headings render 20px
  against live's 30px. A fix was in flight when this was written (#185).
- **The DA block picker.** It fetches all 22 samples up front and takes about 3.5s to become
  usable (#297).

## The summary table

Five words carry the state, and the difference between them is the point of the document.

**matches** means our behaviour is live's behaviour. It includes the places where live's own
behaviour looks like a bug and we reproduced it anyway.

**differs** means a real difference a visitor could see, and work would close it.

**approximated** means we stand in for something we cannot reach, and the stand-in is visible.
Every one of these says what the approximation rests on.

**absent** means live has it and we do not have it at all. This is unbuilt work, not a wall.

**not knowable from outside** means live resolves it through a system that is not visible from
the public site, so no amount of work here reproduces it. It is the smallest group on purpose.
A row only earns it by naming the mechanism that is hidden.

### The table

| Bucket | Item | State |
|---|---|---|
| Navigation and routing | [Redirects come from a sheet](#redirects-come-from-a-sheet-not-from-server-rules) | approximated |
| Product pages | [Product data is a published workbook](#product-data-is-a-published-workbook-not-a-request-time-backend) | not knowable from outside |
| Product pages | [Fit by size](#fit-by-size) | differs |
| Search | [Search ranking](#search-ranking-rebuilt-against-lives-results-rather-than-its-index) | approximated |
| Content and editorial | [Page titles](#page-titles-match-live-with-one-exception) | matches |
| Content and editorial | [The scale of what shipped](#the-scale-of-what-shipped) | counts, with provenance |
| Layout and type | [The heading scale](#the-heading-scale) | differs |
| Layout and type | [The content container](#the-content-container-64px-wider-than-lives) | differs |
| Layout and type | [Breakpoints](#breakpoints-half-of-them-lives) | differs |
| Layout and type | [The webfont swap](#the-webfont-swap) | matches |
| Layout and type | [The article body shift](#the-article-body-shifts-up-51px-after-first-paint) | differs |
| Layout and type | [Prose link underlines](#prose-links-carry-an-underline-live-paints-transparent) | differs |
| Layout and type | [Superscripts](#superscripts) | matches |
| Performance and accessibility | [Delivered HTML weight](#delivered-html-weight) | differs, in our favour |
| Performance and accessibility | [Generated headings skip levels](#generated-headings-skip-levels) | differs |

## Navigation and routing

### Redirects come from a sheet, not from server rules

**approximated.** 14 rows in a spreadsheet stand in for live's server rules.

Live serves redirects as server configuration. Pattern rules, wildcards, query-string handling
and chains all resolve before anything renders, and the rule set is not visible from outside.

We serve a redirects sheet at the content root with 14 rows, read on 2026-07-30. It carries the
legacy tire-search paths onto `/tires`, the two `Store-finder` casings onto `/online-retailers`,
the partner and crew moves, two absolute redirects back out to continentaltire.com for the
warranty and TCP policy documents, and `/tires/vancontact-as-ultra` onto `/vancontact-as-ultra`.

What it costs a visitor: a path live redirects that has no row here 404s. A sheet holds exact
source paths only, so it cannot express a pattern, a wildcard, a query string or a chain. Each
one has to be enumerated by hand.

What would close it, partly. #337 records 63 live paths that still need a row, and adding them
is mechanical. What no sheet closes is the pattern case, because the shape of live's rules is
not derivable from the outside. You can only discover the paths, one at a time, by finding them.

Two things in this bucket read as bugs and are not. `/store-finder` resolving to Online
Retailers is one of the 14 rows working as authored, not a broken page. `/taxonomy/term/139`
and `/taxonomy/term/57` 404 on live as well as here.


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
under #241. A sheet is published state, so it is right as of its last publish and cannot be
current in the way a request-time lookup is.

What would close it: nothing from outside, and that is the point of the row. The workbook is
the honest substitute, not a temporary one. What it does buy is that an author edits the
catalogue directly and republishes, with no deployment.

### Fit by size

**differs.** We answer by size from the specs sheet. Live's own by-size URL form could not be
re-derived.

The specs sheet holds 10 rows for `235/40 R 18`, spread across 6 distinct product slugs. Sizes
are written with spaces in that form. `.mossy/research/live-fitment.md` reports "10 products"
for that size, and it is counting rows, not products. Six is the product count. #243.

Live's by-size URL could not be reconstructed. `/tire-search/by-size/235-40-18` 404s, and live's
`/tire-search` page exposes only `/tire-search/by-vehicle` links, so the by-size entry point is
either behind a form post or a path shape the public pages do not link. That one is unresolved
rather than settled, and what would settle it is finding a live page that links a by-size
result.


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


## Content and editorial

### Page titles match live, with one exception

**matches**, on every page checked but the homepage.

`/tires`, `/events`, `/learn`, `/dealers`, `/offers` and `/ev-compatible` carry titles identical
to live's. The homepage does not. Live heads it "Truck Tires, SUV Tires, Commercial Tires & More
| Continental Tire" and ours reads "Continental Tire | The Smart Choice In Tires". It is the
only page found where the two differ, and it is filed post-release as #349.

The homepage meta description matches live byte for byte, including live's own typo, "For that
past 100+ years". That is deliberate. The rule on this project is to reproduce live's copy
rather than improve it.

Live truncates some of its own descriptions and we reproduce that too. Live's description on
`/learn/150-years-sustainability` ends "...and has since.." with the stray pair of dots.
`/newsletter-signup` carries zero meta description tags on live, and zero here.

### The scale of what shipped

Numbers a reader will want, each with where it came from. They are here because the README
disagrees with several of them and the README is the stale one. #235 is the pass that fixes it.

| Thing | Count | Where the number comes from |
|---|---:|---|
| Pages published | 327 | `/query-index.json`, `total` and row count agree |
| Learn articles | 219 | `/learn/query-index.json`, `total` |
| Products | 46 | `/products.json`, products sheet and catalog sheet agree |
| Size-level spec rows | 1656 | `/products.json`, specs sheet, 483 distinct sizes |
| Redirect rows | 14 | the redirects sheet |
| Block library samples | 22 | `/tools/sidekick/library.json`, `total` |
| Block directories | 29 | `blocks/` |
| Test files | 71 | `find -name '*.test.js'` |
| Commits | 122 | `git log`, 2026-07-24 to 2026-07-30 |
| Closed release issues | 27 | `gh issue list --label release --state closed` |
| Open release issues | 2 | #302, the sequence tracker, and #185 |
| Open post-release issues | 71 | `gh issue list --label post-release --state open` |

Three README figures are wrong as of today. It claims 19 blocks against 29 directories, 14 test
files against 71, and 352 pages published against a query-index total of 327. It also says the
build took three days. It took seven, 2026-07-24 to 2026-07-30, and #234's own brief says four,
which is also wrong.

The query-index total is lower than the DA page count because the index excludes the block
library and the authoring guide. A page has to be published to enter the index at all, so
preview-only pages are invisible to every list view on the site.

## Layout and type

### The heading scale

**differs.** h1, h2 and h3 all render larger than live, and our step is at 900 where live's
is at 1025.

Live declares three sizes and moves one of them. h1 is 42px on 48 at weight 300, with an
override to 30px on 36 under `max-width: 1024`. h2 is 30px on 38 with no media override. h3
is 24px on 32 with no override. Live reads 30/30/24 up to 1024 and 42/30/24 from 1025. The
product title is not an exception to that scale, it is sized by class: live's rule is
`h2, .as-h2, .tire-page__title { font-size: 30px }`, so `/tires/extremecontact-sport-02`
heads at 30px at 1440 while its specs band h2 reads 42px from a block prefix.

The deployed `styles/styles.css` sets xxl 42, xl 32, l 28 at base and xxl 42, xl 42, l 30
from 900. h1 maps to xxl, h2 to xl, h3 to l, so we read 42/32/28 below 900 and 42/42/30
above it. Above 1025 our h1 and h2 are both 42px, which loses the distinction live keeps.
Our product h1 carries no class, so it takes the 42.

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
`themes/custom/nextcontinental/dist/css/styles.css`. #185, #181, #184.

One correction to the record. #185 says two pages skip a heading level.
[`/vancontact-as-ultra`](https://main--contitires--cloudadoption.aem.live/vancontact-as-ultra)
gives h1 then `h3#warranty` and is a real skip. Live has no heading there at all, only a
plain link. `/events` gives h1 then 32 h2 and no h3, so it no longer skips. Its heading was
promoted in the DA write that shipped with PR #342.

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

#219, #340, #244, #99.

A number in the record does not reproduce and is not repeated here. #99's close comment
records live's events column at 789, and #340 and #244 restate it as fact. Live declares the
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
none of those three. #219 covers the padding half of it.

### The webfont swap

**matches.** A metric-matched fallback shipped, so line counts hold through the swap. Delivery
still differs.

Live self-hosts the five Stag Sans faces and declares them in the render-blocking stylesheet
it loads in the head, so its first paint already has the real typeface and nothing rewraps.

Four `@font-face` blocks named `Stag Sans Fallback` are declared at the top of our
`styles.css`, which `head.html` loads render-blocking. They are `src: local()` only against
Arial, Helvetica and Liberation Sans, so they cost no request, and they carry `size-adjust`
91.24% at weight 300, 94% at 400 normal and italic, and 90.36% at 700, with ascent and descent
overrides derived from those ratios. The family sits between `Stag Sans` and `arial` in both
font-family variables. All of it is on the deployed site.

What it costs a visitor: nothing on layout stability. `/accessibility-statement` went from CLS
0.3375 with a single 29px shift to 0.0017 at 1350 wide. Across 31 pages at 1350, 14 improved,
16 held, 1 got worse, and nothing sits above 0.25 any more. At 375, 16 improved, 14 held, none
got worse, nothing above 0.1. Those figures come from PR #329's body and were not re-measured
here, because CLS needs a browser.

What is left is delivery. `styles/fonts.css` still hotlinks all five real faces from
continentaltire.com, `loadFonts()` runs in the lazy phase and only runs eagerly on a repeat
visit via a sessionStorage flag, and `head.html` preloads nothing. So a cold first paint is in
the fallback face rather than in Stag Sans, at the same line count, and there is a connection
to a third origin before the real faces arrive. Self-hosting the five woff files and declaring
them in the render-blocking sheet closes it. #183, #227.

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
number here is #197's own measurement and none was re-derived. #197.

### Prose links carry an underline live paints transparent

**differs, and kept on purpose.**

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
luminance while 3:1 against `#333` body text needs 0.1993. Matching live means reproducing a
link that is indistinguishable from its surrounding text, which is the failure the underline
clears. It is recorded so nobody reads it as an oversight. #240.

### Superscripts

**matches.** Same size, lift and line box as live. We drop live's `inline-block` on purpose.

Live's `sup` takes `font-size: 0.6em`, `top: -0.5em`, `line-height: 0`, `position: relative`,
`vertical-align: baseline` and `display: inline-block`. Measured on live at all four sizes it
renders, the 14px nav link, the 30px h1, the 18px description and the 42px specs heading, the
ratio is 0.600 and the lift is -0.5em every time.

One rule in our `styles.css` carries the same five values in em, so it covers all four sizes.
`display` is left at `inline`. Ten of the 46 product names end in a superscript.

What it costs a visitor: nothing, the render is the same. The gain is on the other side. An
`inline-block` child makes the accessible-name computation insert a space, so live's own screen
reader says "ExtremeContact Sport 02" as two words and ours says the name as one. Copying
live's `display` would reintroduce the split announcement. #238.

## Performance and accessibility

### Delivered HTML weight

**differs, in our favour.** Live's homepage ships 123,760 bytes of HTML. Ours ships 22,430.

Four pages, read with `curl -sL <url> | wc -c` on 2026-07-30, live first.

| Page | Live | Ours |
|---|---:|---:|
| homepage | 123,760 B | 22,430 B |
| `/tires` | 122,044 B | 3,898 B |
| `/events` | 133,729 B | 30,998 B |
| `/learn` | 69,933 B | 12,037 B |

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
each serve one heading, an h1, so the extra headings are built client-side. Only a browser sees
the outline that results.

What it costs a visitor: `/learn/tips` reads accessibility 98 on both strategies with
heading-order as the single failure, recorded 2026-07-28 in #117. The same audit against main's
preview also returns 98, so it predates the slice that found it. A screen reader announces each
card title twice, once as the link and once as the image alt.

What would close it: give the generated headings a level that follows the page outline, and set
the card image alt to empty. The three learn category pages above carry no authored headings at
all, so they land here rather than in the type scale. #117.

## What this document does not settle

Four things are open, and each one names what would close it. They are here rather than
smoothed over, because a parity document that reads as complete when it is not is worse than
no document.

**Live's events column width.** #99's close comment records live at 789px and #340 and #244
restate it. Live declares the same grid track we do and its listing sits in a plain container,
so live computes 821. One number, three places, and it does not reproduce from the CSS. What
would close it: measure live's `.events-listing__columns` in a browser at 1440. The direction
and the cause are unaffected either way, because the whole delta is the container.

**Three claims that need a browser.** The CLS before and after in PR #329, the 51px article
collapse in #197, and the 98 accessibility score in #117 are all read from their own issues and
were not re-measured. Every pass in this document was curl only, because the run's capture tool
refuses to start alongside another automation browser. What would close them: a cold load at
412x823 with a buffered layout-shift observer, and a fresh audit.

**Live's own performance numbers.** None are quoted here. The PageSpeed Insights API quota ran
out at 13:02 today, and measuring live without a browser is not possible. The scores in this
document are ours, each with the date and the issue that recorded it. The web UI at
pagespeed.web.dev runs a separate quota and works, so the links in the presenter section are
live and can be run on the day.

**Live's by-size tire URL.** `/tire-search/by-size/235-40-18` 404s and live's `/tire-search`
page links only by-vehicle paths, so the by-size entry point could not be reconstructed. What
would close it: find a live page that links a by-size result.
