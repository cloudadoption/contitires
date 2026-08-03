# Documentation

How this site is built on AEM Edge Delivery Services, where it differs from continentaltire.com, and
how the rest of it would be built. The reader these are written for is an engineer taking the
implementation forward who has not worked on an Edge Delivery site before. Terms are the ones
[aem.live](https://www.aem.live/) uses, so each one can be looked up there.

Start with the architecture. Then read whichever of the next four your work touches. The parity record
and the completion plan are the two that answer "what is left".

## The set

[**architecture.md**](architecture.md) is the place to start. Content comes from one place and code
from another, and they do not wait for each other. It covers the two buses, what a DA document turns
into, how a block decorates it, the eager, lazy and delayed phases, which blocks this site builds
without an author asking, and where the data lives. It also says why the webfont is on the critical
path against the platform's own advice. Read it before changing anything.

[**blocks.md**](blocks.md) is the reference for the 29 directories under `blocks/`. One entry each:
what the block is for, what an author writes in DA, what the decorator builds from it, which variant
classes it takes, and its data source. Open it when you are about to change a block, because the
authored shape is a contract with existing pages.

[**content-model.md**](content-model.md) is the content side. How a path in DA becomes a path on the
site, page and section metadata, the `nav` and `footer` documents behind the chrome, the four-sheet
products workbook, the query indexes, the redirects sheet, the block library, and the DA admin API.
Open it when the change is authored rather than coded.

[**design-system.md**](design-system.md) is the CSS layer: where the tokens are, the type scale, the
fonts and what ships in their place, which stylesheet loads in which phase, and how a block's CSS is
scoped. It also says why this project steps at 769px and 1025px rather than at the boilerplate widths,
which is the rule most likely to trip someone up.

[**operations.md**](operations.md) is how work gets done. The dev server, the linters, the test runner
and what the tests assert, the branch preview hosts, and the pull request gate: a PR needs a
`Test URLs:` line before Lighthouse runs at all, and the thresholds are 95 on performance and 90 on
accessibility. Read the gate section before opening your first PR.

[**parity-with-live.md**](parity-with-live.md) is the comparison against continentaltire.com, row by
row: what differs, what this build diverges on by choice, what is approximated, what is absent, and
what no work here reaches. A parity finding belongs there and nowhere else. It is also where the four
places this site deliberately does not match live are recorded as decisions.

[**completing-the-migration.md**](completing-the-migration.md) is for a team that has the APIs, the
accounts and the licences this proof of concept did not. Each remaining gap gets four parts: what live
does, what this build does instead, what access closes it, and what closing it looks like on Edge
Delivery. Store search, site search, vehicle fitment, reviews, analytics and consent, forms with a
receiver, video articles, response headers, a production domain and the fonts.

[**index-config.md**](index-config.md) is the query index configuration for this site, which is held by
the AEM Config Service rather than by a file in this repo. Short, and needed the first time an index
has to change.

## Two things that catch people

A branch preview serves that branch's **code** against the **same content** as `main`, because content
belongs to the site rather than to a git ref. A branch tests code and not content.

A page enters a query index when it is **published**, not when it is previewed. So a previewed page is
invisible to every listing and to search, which reads as a broken block and is not one.
