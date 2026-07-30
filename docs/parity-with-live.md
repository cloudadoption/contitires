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
