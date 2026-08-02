# Parity evidence

Side-by-side comparison images referenced from pull requests. In every image the LEFT half is
continentaltire.com and the RIGHT half is this site, at the viewport width named in the label.

This branch holds no code and never merges into `main`.

## baseline/

A full sweep of 20 pages at 1440, 900, 768 and 375, taken 2026-08-02 against `main` at `a8667bd`.
These are the before state for the parity work that followed.

The footer and the promo bar are blanked to invisible on both sides. Those two are deliberate
divergences, so comparing them produces a delta on every page that somebody then has to explain.
Blanking keeps their boxes, so nothing below them shifts.

## after-2026-08-03/

The same 20 pages at 1440 and 375, re-captured after the twenty-one pull requests that merged on the
night of 2026-08-02 into 2026-08-03. Pair a file here with its `baseline/` twin to see what moved.

An earlier attempt at this sweep was discarded rather than published. Two capture processes drove the
same headless browser at once and the navigations crossed: `/tires` came back 15px tall and sixteen
captures shared one page height. The tell is in the log, and a healthy sweep has almost no repeated
heights. This one has one repeated pair out of eighty.
