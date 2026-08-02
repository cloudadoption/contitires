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
