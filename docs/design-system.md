# The design system

This document is the CSS layer of this project. It covers the tokens, the type scale, the phase each stylesheet loads in, the breakpoints, and block scoping. It is for whoever takes the front end forward. Platform pieces are named the way [aem.live](https://www.aem.live/developer/anatomy-of-a-project) names them, so a term here matches a term there. It assumes you read CSS, and not that you have built an Edge Delivery Services project before.

There is no build step. What is in `styles/` and `blocks/` is what the browser gets. A value in a file is the value that renders.

## Where the tokens are

The tokens are custom properties on `:root` in [`styles/styles.css`](../styles/styles.css), and there is no second declaration site. Two media queries later in the same file redeclare a handful of them at 900px and 1025px. That is the whole mechanism: no preprocessor, no theme file, no generated output.

The palette came over from Continental's own theme. The table lists the ones the site uses, with the `var()` reference count for each across `blocks/**/*.css` and `styles/*.css`.

| Token | Value | Refs | Where it goes |
| --- | --- | --- | --- |
| `--conti-white` | `#fff` | 112 | text and surfaces on the dark bands |
| `--conti-black` | `#333` | 89 | body text, and the `.dark` section band |
| `--conti-yellow` | `#ffa500` | 62 | the brand mark: primary buttons, rules, stars |
| `--conti-grey` | `#cdcdcd` | 24 | hairlines and disabled chrome |
| `--conti-dark-yellow` | `#c27e00` | 16 | hover, and `--link-hover-color` |
| `--conti-dark-black` | `#1d1d1d` | 11 | the darkest band and the finder panel |
| `--conti-text-grey` | `#757575` | 8 | grey text |
| `--conti-light-grey` | `#e9e9e9` | 8 | borders |
| `--conti-yellow-contrast` | `#a36a00` | 6 | the yellow darkened until it clears 4.5:1 on white |
| `--conti-lightest-grey` | `#f3f3f3` | 6 | the `.light` band, `--light-color` |
| `--conti-darkest-grey` | `#7e7e7e` | 6 | grey surfaces and borders |
| `--conti-dark-grey` | `#949494` | 4 | placeholder text and inactive marks |
| `--conti-light-black` | `rgb(0 0 0 / 60%)` | 2 | the scrim over a marquee photograph |

The two mid greys are one decision rather than two values. `#7e7e7e` reads 4.06:1 on white, under the 4.5:1 WCAG AA asks of body copy. So `--conti-text-grey` at `#757575` exists for text, and surfaces and borders keep `#7e7e7e` to paint what the reference site paints. The comment on the declaration says so. `--conti-blue` `#009dd1`, `--conti-red` `#eb000c`, `--conti-green` `#26a022` and `--conti-light-yellow` `#fed185` are declared and referenced nowhere. They arrived with the palette.

A second group aliases the boilerplate's names onto that palette, so a block copied out of the [block collection](https://www.aem.live/developer/block-collection) lands on brand with no edit: `--background-color`, `--light-color`, `--dark-color`, `--text-color`, `--link-color`, `--link-hover-color`. One of the six has zero references. `a:any-link` takes `color: inherit`, so `--link-color` is unused and a link is the colour of the sentence around it. Only `:hover` changes, to `--link-hover-color`. Colouring the resting state cannot clear both contrast bars at once. 4.5:1 on white caps a link at 0.1833 luminance, and 3:1 against `#333` body text needs 0.1993. [The parity document](parity-with-live.md) records what that costs against the reference site, which paints an underline and keeps it transparent until hover.

Two tokens are layout rather than colour. `--nav-height` is 45px, and 72px from 1025px. `--promo-bar-height` is 37px. `header` takes `min-height: calc(var(--nav-height) + var(--promo-bar-height))`, so the header's space is reserved before the header block loads and the page does not shift when it arrives. It is a floor rather than a fixed height, because the ribbon panel opens inside the header and `main` moves down with it. Two selectors zero the ribbon: `body:has(main .promo-bar)` for a page that authors its own bar, and `body.block-preview` for the block-library samples under `/tools/sidekick/blocks/`, which load no header.

The container is not a token. `main > .section > div` takes `max-width: 1200px` and `padding: 0 24px`, stepping to `32px` at 900px. Three blocks bring a container of their own. Their section is authored full-width, so the section container is gone with it: `.tire-listing` at 1168px, `.footer` at 1264px, `.crew` at 1136px. The reference site's container is 1168 padded 16 against this one's 1200 padded 24. That difference is where a few horizontal pixels go on the pages that use it.

## The type scale

Body text is 18px on a 1.6 line box. The three body tokens are `--body-font-size-m` 18px, `--body-font-size-s` 16px and `--body-font-size-xs` 14px, and they do not move: the 900px block redeclares the same three values.

The six heading levels are weight 300. The scale is the reference site's own, read off its CSSOM on a rendered page and confirmed against computed sizes at 375, 900 and 1440. Only `h1` crosses a breakpoint in size.

| Level | Size | Line box | Steps at |
| --- | --- | --- | --- |
| `h1` | 30px, 42px from 1025px | 36px, 48px from 1025px | 1025px |
| `h2` | 30px | 38px | no step |
| `h3` | 24px | 32px | no step |
| `h4` | 24px, 26px from 900px | 28.8px, 31.2px from 900px | 900px |
| `h5` | 20px, 22px from 900px | 24px, 26.4px from 900px | 900px |
| `h6` | 18px | 21.6px | no step |

The sizes come from `--heading-font-size-xxl` down to `--heading-font-size-xs`. The line boxes are written on the element rules, not on the tokens.

The line boxes are absolute values rather than ratios, and that is the part to preserve. A shared `line-height: 1.2` reached any heading no other rule pinned. A block that resized a heading and declared no box then dragged its line box along with the size, so closing one block's heading opened another's. The boxes on `h1`, `h2` and `h3` are the reference site's own, and they transfer because the sizes match. `h4`, `h5` and `h6` are pinned at what this project rendered under the old ratio. Their sizes are 24/20/18 against the reference site's 20/16/14, so copying its 24/22/20 onto different type would be inventing a number. Those three pins move no heading today. No page in the index renders an `h5` or an `h6`. Each `h4` that renders is sized by its own block rule. They exist to stop a later change moving it.

One rule overrides the `h1` size by page type. `main:has(.columns.product-hero, .tire-specs) h1` sets 30px/38px under no media query. That is what the reference site does on a product page: it renders the product name as an `h1` and then sizes it with its `h2` rule. The `:has()` reaches the 46 product pages and no other indexed page.

Ten of the 46 product names end in a superscript, and one rule covers it. `sup` takes `font-size: 0.6em`, `top: -0.5em`, `line-height: 0`, `position: relative` and `vertical-align: baseline`. Written in `em`, that rule fits the four sizes a superscript renders at here, from a 14px nav link to a 42px specs heading. Measured on the reference site, the ratio is 0.600 and the lift -0.5em at each of the four. `display` is left `inline`. The reference site sets `inline-block` there, and an inline-block child makes the accessible-name computation insert a space. Its screen reader announces a product name as two words where this one says it as one.

## Stag Sans and the fallback that ships in its place

[`styles/fonts.css`](../styles/fonts.css) declares five `@font-face` rules over four files, and the `src` of each points at the reference site:

```
https://continentaltire.com/themes/custom/nextcontinental/fonts/StagSans-Thin.woff
https://continentaltire.com/themes/custom/nextcontinental/fonts/StagSans-Light.woff
https://continentaltire.com/themes/custom/nextcontinental/fonts/StagSans-BookItalic.woff
https://continentaltire.com/themes/custom/nextcontinental/fonts/StagSans-Book.woff
```

Thin is weight 300, Light is 400, BookItalic is italic 400. Book is 700 twice, once as `Stag Sans` and once as a separate `Stag Sans Bold` family. That host serves the files with `access-control-allow-origin: *`, which is the only reason a cross-origin `@font-face` resolves. Checked 2026-08-02: `StagSans-Book.woff` answers 200, `content-type: font/woff`, 29,080 bytes. No font binary is in this repo.

**A production build has to replace this.** Stag Sans is licensed, and a hotlink is a dependency on a host this project does not own. Tighten that CORS header or move the theme directory and the site falls through to Arial. License the four faces, convert them to woff2, commit them under `fonts/` and repoint four `src` URLs. Three preload tags in `head.html` name three of those URLs a second time and come out in the same change, which [the architecture document](architecture.md#the-webfont-on-the-critical-path) covers along with why they are there. `fonts/` today contains the boilerplate's four Roboto woff2 files, which no stylesheet references.

The metric-matched fallback is declared in `styles.css` rather than in `fonts.css`, and that split is what got it working. A fallback prevents a shift only if it exists at the first paint. Declared in `fonts.css`, which `loadFonts()` used to be the only thing fetching, it was an unknown family until that fetch landed. The first paint fell through to plain Arial and the page reflowed anyway. `/accessibility-statement` measured CLS 0.2761, with its paragraphs moving 29px at 81ms. `head.html` now links `fonts.css` render-blocking too, so that reason has gone. The fallback belongs in `styles.css` for a second one. It is what renders when a preload is slow or continentaltire.com is unreachable, and the page cannot paint without that sheet.

The family is `Stag Sans Fallback`, four faces of `src: local('Arial'), local('Helvetica'), local('Liberation Sans')`. `size-adjust` is 91.24%, 94% and 90.36% at weights 300, 400 and 700, with `ascent-override` and `descent-override` scaled by the same ratio. `src: local()` costs the critical path no request. The ratios were read over 70,041 characters of this site's own running text across ten pages. Weight 400 ships 94% rather than the 93.49% corpus mean, because 94% left the fewest paragraphs changing line count, 6 against 7 over 139 real paragraphs. Liberation Sans is named alongside Arial because `local()` resolves against faces installed on the machine, and a Linux CI runner has no Arial.

The stack orders the three: `--body-font-family: 'Stag Sans', 'Stag Sans Fallback', arial, helvetica, sans-serif`. `--heading-font-family` is the same list. Headings take `--body-font-family` and buttons take `--heading-font-family`, a difference in name only while the two lists agree.

A narrow viewport now paints in Stag Sans as a wide one does, because `head.html` links `fonts.css` itself. `loadsFontsEagerly()` in [`scripts/scripts.js`](../scripts/scripts.js) still returns `window.innerWidth >= 769`, and it still gates a `loadFonts()` call in the eager phase. That gate no longer decides a fetch. `loadCSS` in `aem.js` finds the link already in the head and resolves without a request. Width was a proxy for a fast connection, and the number is 769 for the reason the breakpoint section gives. Below it a page used to paint in the fallback and change into Stag Sans afterwards, which is the shift [the architecture document](architecture.md#the-webfont-on-the-critical-path) traces. A `sessionStorage` flag used to be a second term in that test. It made one URL at one width paint two ways, and the tab's history picked which. A fresh tab took the fonts lazily at FCP + 1155ms. A tab that had already shown a page took them eagerly at FCP - 2ms. `loadFonts()` still writes the flag, and no code reads it.

## What loads in which phase

[Keeping it 100](https://www.aem.live/developer/keeping-it-100) is the platform's account of the three phases. Here is what each stylesheet does.

[`styles/styles.css`](../styles/styles.css) is render-blocking, linked from `head.html`, 924 lines. It declares the tokens, the six heading rules, the button variants, the link policy, the section bands and the metric fallback. That is what the first paint needs. Because the blocks read the tokens, it is also what the rest needs.

[`styles/fonts.css`](../styles/fonts.css) is render-blocking as well, 79 lines and 1,292 bytes brotli. It is the one stylesheet here that the boilerplate keeps out of the head. That is a deliberate exception, and [the architecture document](architecture.md#the-webfont-on-the-critical-path) is where it is argued.

`styles/lazy-styles.css` is fetched in the lazy phase by `loadLazy()`. It declares the rise animation: two tokens, the `rise-up` keyframes, the `.rise` and `.rise-in` rules, plus a `prefers-reduced-motion` override. Above the fold no rule reads it, so it can wait past LCP. Other global rules that could have gone here went into a template stylesheet instead, where only the pages that use one pay for it.

Block CSS is per block, and not global in delivery. `loadSection()` in `scripts/aem.js` fetches `/blocks/{name}/{name}.css` as the section holding that block loads, so a page downloads the stylesheets of the blocks it authors and no others. There are 29 of them, 10,120 lines in total on 2026-08-03, against 1,964 lines in `styles/`.

## Template stylesheets, and how the article template gets one

A page can name a stylesheet of its own. `TEMPLATES` in `scripts/scripts.js` lists five: `article`, `promo`, `crew`, `documents`, `finder`. The path from authored content to loaded CSS has four steps. An author puts `Template: Article` in the page's metadata block. The pipeline emits `<meta name="template" content="Article">`. `decorateTemplateAndTheme()` in `scripts/aem.js` reads that meta and adds the value to `<body>` through `toClassName()`, which lowercases and hyphenates, turning `Article` into `article`. `loadTemplateStyles()` finds the first name in `TEMPLATES` on the body and loads `/styles/{template}.css`.

The request starts in the eager phase and the reveal waits on it. `loadEager()` calls `loadTemplateStyles()` before decoration so the download overlaps it, and `revealPage()` awaits that promise before adding `body.appear`. The body is `display: none` until then. Revealing first would paint the article at the default page width and then reflow it.

[`styles/article.css`](../styles/article.css) is the largest of the five at 417 lines. It is the news-article layout: a 940px title band, a 640px reading column under it, and a 300px sidebar holding the sharebar and any related-articles list. The sidebar is beside the body from 769px and follows it below. Each selector in the file starts `body.article`, which is the block scoping discipline one level up.

The other four are smaller, and each covers one page or a handful. `promo.css` (249 lines) styles `/promotion` and `/ccpromotion`, which are one template on the reference site too. `crew.css` (133) is the Conti Crew member pages, `documents.css` (76) is `/customer-support/technical-documents`, and `finder.css` (57) is `/tire-finder`.

## Why the steps are 769px and 1025px

The boilerplate steps at 600px, 900px and 1200px. This project steps at 769px and 1025px. The rule is written in [AGENTS.md](../AGENTS.md) under Code Style Guidelines: declare styles mobile first, and step at `min-width: 769px` and `min-width: 1025px`. The reference site pivots at `max-width: 768` and `max-width: 1024`, so both bounds meet at the same integer.

The reason is measurement. `max-width: 768` and `min-width: 769` partition the axis with no gap and no overlap, so at a given width the two sites are in the same layout state. Step at 900 against a site that steps at 769, and a 130px band opens up. From 769 to 899 the reference site is in its desktop arrangement and this one is still mobile. A comparison at 800px then reports a difference in the design. It is a difference in phase, and the findings from that band are unusable. The top boundary works the same way. 1025px is where `--nav-height` goes from 45px to 72px, where `h1` steps to 42px/48px, and where `DESKTOP_MEDIA_QUERY` in `blocks/header/header.js` switches the header's JavaScript.

The tally over `blocks/**/*.css` and `styles/*.css`: 44 queries at 769px, 32 at 1025px, 26 at 900px. Then 7 at 600px, 2 at 1200px, and one each at 380px, 641px, 1170px, 1181px and 1184px. Most of the file is on the two chosen boundaries, and the boilerplate's are not gone. 900px is doing real work in `styles.css`, where the section container's padding steps from 24px to 32px and `h4` and `h5` step both size and line box. The seven at 600px have no recorded measurement.

A comment beside three of the five odd widths names what was measured. 1170px is where the header gets a pill's label back. 1181px is where the annotated tire diagram stands its cards beside the drawing. 1184px is six 160px footer tracks plus five 32px gutters plus the container's padding, the width at which the six first fit.

Queries are mobile-first `min-width`, with eight exceptions written downward as `(width < Npx)` at the same boundaries. No rule in the repo uses `max-width`; the two occurrences are inside comments quoting the reference site's CSS. The form is `@media (width >= 769px)` rather than `@media (min-width: 769px)` because `stylelint-config-standard` sets `media-feature-range-notation` to `context`, and the older form fails the lint. JavaScript is not linted for it, which is why `header.js` writes `(min-width: 1025px)` for the same boundary.

## Scoping a block's CSS

A block's stylesheet is scoped to `.blockname`, the class the first cell of the authored table produces. `.tire-listing .sr-only` is the shape, and a bare `.sr-only` is not. No mechanism scopes block CSS for you. Each block's stylesheet is a global stylesheet that happens to be fetched per section. An unscoped selector reaches the whole page, and the collision surfaces somewhere else weeks later. [Markup, sections, blocks](https://www.aem.live/developer/markup-sections-blocks) is the platform reference for the class the pipeline gives you.

Two class names per block are the platform's and not yours. `decorateBlock()` in `scripts/aem.js` adds `{blockname}-wrapper` to the div wrapping the block, and `{blockname}-container` to the section holding it. `.cards-wrapper` and `.cards-container` therefore already exist. They mean "the wrapper around a cards block" and "the section that contains one", so naming an element inside your block either of those makes a selector that reads as one thing and matches another. AGENTS.md says to avoid both.

Targeting them from outside is the intended direction. `main .section.cards-container { margin: 0 }` zeroes the gap around a section whose only content is a cards block, so the block meets the band above it flush. `.cards-container` appears 40 times in `blocks/cards/cards.css` in that role.

Class names are kebab-case, and that is enforced rather than agreed. `stylelint-config-standard` sets `selector-class-pattern` to kebab-case, so a probe `.probe__element` fails with `Expected class selector ".probe__element" to be kebab-case` while `.probe-element` passes. The reference site's own names are BEM, with a double-underscore element separator. Adopting them would mean a lint error per selector, or the rule switched off. The parity document records the cost, which falls on a reader comparing the two stylesheets rather than on a visitor.

## The linters and the commands

```sh
npm run lint        # both, in order
npm run lint:js     # eslint . --ext .js,.mjs
npm run lint:css    # stylelint "blocks/**/*.css" "styles/*.css"
npm run lint:fix    # both, with --fix
```

CSS is stylelint 17.14.1 extending `stylelint-config-standard` 40.0.0. [`.stylelintrc.json`](../.stylelintrc.json) is three lines and overrides no rule. What bites is that config's defaults: kebab-case class selectors, range notation on media features, no duplicate selectors, and its shorthand and quoting conventions. JavaScript is eslint 8.57.1 on `airbnb-base`, configured in [`.eslintrc.js`](../.eslintrc.js). That file adds required `.js` extensions on imports, unix linebreaks, and three `no-restricted-syntax` entries about a chai assertion shape that hangs the test runner rather than failing.

[`.github/workflows/main.yaml`](../.github/workflows/main.yaml) runs `npm test` and then `npm run lint` on push, so a lint error fails the branch build before the pull request is read.
