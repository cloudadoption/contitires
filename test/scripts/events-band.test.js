/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';
import galleryDecorate from '../../blocks/media-gallery/media-gallery.js';

/**
 * The two-column band. Live closes /events with ONE black band holding the
 * Social gallery on the left and the News list on the right, under a
 * SEE ALL NEWS pill. We shipped a black News band and a separate white Social
 * section below it, which is why our tiles measured 237px at both widths where
 * live's are sized by its left column.
 *
 * Read off continentaltire.com/events at 1440, 900 and 375 on 2026-07-30:
 * `.p-two-columns__grid` is `5fr 4fr` 110px apart, padded 80 above and 60
 * below, dropping to one column and 38/20 at 768. The right column is capped at
 * 350 and takes a 45px margin above it once stacked. Both titles are 42/48 at
 * weight 300, tracked 6 and in capitals, falling to 30/36 at 1024 and centring
 * at 768. Issue #340.
 */
/*
 * `tile` and `right` used to be OUR numbers, sitting beside live's own because
 * the gap was the site container rather than this band: live caps at 73rem
 * INCLUDING its padding, 1136 of content at 1440 and 868 at 900, where ours
 * capped 1200 of content and padded outside it, 1200 and 836. Five ninths of
 * that landed on the three tiles, so the tiles read 189 against live's 177 and
 * 121 against live's 127, and the news column 323 against live's 337.
 *
 * #219 put live's container on this site, and the two columns closed: one set of
 * numbers now, live's.
 */
const LIVE = [
  {
    vw: 1440,
    tile: 177,
    right: 350,
    fontSize: '42px',
    lineHeight: '48px',
  },
  {
    vw: 900,
    tile: 127,
    right: 337,
    fontSize: '30px',
    lineHeight: '36px',
  },
];

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

/** live's six Social tiles, in the order live paints them */
const POSTS = [
  ['Nothing like a new fresh set', 'https://www.instagram.com/p/CHOw2STBQYL/'],
  ['force contact tire IG photo', 'https://www.instagram.com/p/CUYqS3FMtlE/'],
  ['fall photo ig for homepage', 'https://www.instagram.com/p/CUISJsDA3Mw/'],
  ['carrera on conti', 'https://www.instagram.com/p/CRu2kmlh1u8/'],
  ['uhp lineup in front of mustang', 'https://www.instagram.com/p/CQd8lHsgP7S/'],
  ['stadium super trucks', 'https://www.instagram.com/p/CUVD7zFr9le/'],
];

/** the three News teasers live shows, at the length live shows them */
const NEWS = [
  ['Continental Tire Announces the New TerrainContact A/T2: The Perfect Balance of Adventure, Comfort, and All-Season Confidence', 'Fort Mill, SC; July 1, 2026 - Continental Tire introduces the TerrainContact A/T 2, a premium...'],
  ['Continental Tire Announces Launch of New SecureContact AW: The Smart Choice, All Year Long', 'Fort Mill, SC; January 15, 2026 - Continental Tire is proud to announce the launch of its...'],
  ['Continental Tires Americas Helps Habitat for Humanity, Lancaster County (SC) Sign Studs of New Home', 'Continental and Habitat met with the Massey family to write encouraging words on the studs of...'],
];

/**
 * The band as the pipeline delivers it: one section carrying the authored
 * `Style: black, two-columns`, the Social heading and gallery, then the News
 * heading, the article-cards block and its link.
 */
function buildBand() {
  const main = document.createElement('main');
  const tiles = POSTS.map(([alt, href]) => `
    <div>
      <div><picture><img src="/icons/search.svg" alt="${alt}"></picture></div>
      <div><a href="${href}">${href}</a></div>
    </div>`).join('');
  main.innerHTML = `
    <div class="black two-columns">
      <h2 id="social">Social</h2>
      <div class="media-gallery social">${tiles}</div>
      <h2 id="news">News</h2>
      <div class="article-cards columns">
        <div><div>Category</div><div>News</div></div>
        <div><div>Limit</div><div>3</div></div>
      </div>
      <p><em><a href="/learn/news-and-events">See all news</a></em></p>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);

  // both blocks are decorated but never loaded in a unit test, so they stand
  // in the shape their own decorate builds. The gallery's is the real one; the
  // teaser list is what article-cards renders once the index answers.
  galleryDecorate(main.querySelector('.media-gallery.social'));
  const cards = main.querySelector('.article-cards.columns');
  const list = document.createElement('ul');
  list.className = 'article-cards-list';
  NEWS.forEach(([title, desc]) => {
    const li = document.createElement('li');
    li.innerHTML = `<a class="article-teaser" href="/learn/x"><h3>${title}</h3><p>${desc}</p></a>`;
    list.append(li);
  });
  cards.replaceChildren(list);

  // decorateSections hides each section inline and loadSection reveals it. A
  // hidden grid reports its declared tracks rather than its used ones.
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

const round = (n) => Math.round(n);

async function measure(vw) {
  await setViewport({ width: vw, height: 1400 });
  const section = document.querySelector('main .section.two-columns');
  const grid = section.querySelector(':scope > .section-columns');
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: round(r.top),
      bottom: round(r.bottom),
      left: round(r.left),
      width: round(r.width),
      height: round(r.height),
    };
  };
  const columns = grid ? [...grid.children] : [];
  const tiles = [...section.querySelectorAll('.media-gallery-list > li')];
  const teasers = [...section.querySelectorAll('.article-teaser')];
  const heading = (id) => section.querySelector(`h2#${id}`);
  const tops = tiles.map((t) => box(t).top);
  const gcs = grid ? getComputedStyle(grid) : null;
  const scs = getComputedStyle(section);

  return {
    vw: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    section: box(section),
    sectionPadding: [scs.paddingTop, scs.paddingBottom],
    background: scs.backgroundColor,
    grid: box(grid),
    tracks: gcs ? gcs.gridTemplateColumns.split(' ').map((t) => parseFloat(t)) : [],
    columnGap: gcs ? gcs.columnGap : null,
    rowGap: gcs ? gcs.rowGap : null,
    columnCount: columns.length,
    left: box(columns[0]),
    right: box(columns[1]),
    social: box(heading('social')),
    news: box(heading('news')),
    socialType: getComputedStyle(heading('social')),
    newsType: getComputedStyle(heading('news')),
    tiles: tiles.length,
    tile: box(tiles[0]),
    perRow: tops.filter((t) => t === tops[0]).length,
    tileGap: tiles.length > 1 && tops[1] === tops[0]
      ? box(tiles[1]).left - box(tiles[0]).left - box(tiles[0]).width : null,
    headingToTiles: box(tiles[0]).top - box(heading('social')).bottom,
    headingToNews: box(teasers[0]).top - box(heading('news')).bottom,
    teasers: teasers.map((t) => box(t)),
    teaserRule: getComputedStyle(teasers[0]).borderBottomColor,
    teaserPadTop: teasers.map((t) => getComputedStyle(t).paddingTop),
    newsList: getComputedStyle(section.querySelector('.article-cards-list')),
    button: box(section.querySelector('a.button')),
    buttonStyle: getComputedStyle(section.querySelector('a.button')),
    buttonWrapper: getComputedStyle(section.querySelector('.button-wrapper')),
    lastTeaser: box(teasers[teasers.length - 1]),
  };
}

describe('The /events two-column band', () => {
  before(async () => {
    await adopt(
      '/styles/styles.css',
      '/blocks/media-gallery/media-gallery.css',
      '/blocks/article-cards/article-cards.css',
    );
    document.body.classList.add('appear');
    buildBand();
  });

  after(async () => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  // the whole finding in one assertion: live has one band, we had two sections
  it('holds the gallery and the news list in one black band', async () => {
    const m = await measure(1440);
    expect(m.columnCount, 'two columns').to.equal(2);
    expect(m.background, 'live paints this band #000').to.equal('rgb(0, 0, 0)');
    expect(m.tiles, 'six tiles').to.equal(6);
    expect(m.teasers.length, 'three teasers').to.equal(3);
  });

  it('stands each column in one element, so the grid holds it to one row', async () => {
    const m = await measure(1440);
    expect(m.left, 'a left column').to.not.be.null;
    expect(m.right, 'a right column').to.not.be.null;
    expect(m.left.top, 'both columns start level').to.equal(m.right.top);
  });

  LIVE.forEach(({
    vw, tile, right, fontSize, lineHeight,
  }) => {
    it(`runs live's 5fr 4fr columns 110px apart at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.tracks, `two tracks at ${vw}`).to.have.length(2);
      expect(m.tracks[0] / m.tracks[1], `5:4 at ${vw}`).to.be.closeTo(1.25, 0.01);
      expect(m.columnGap, `column gap at ${vw}`).to.equal('110px');
    });

    it(`puts Social left of News at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.social.top, 'the two titles sit level').to.equal(m.news.top);
      expect(m.social.left, 'Social first').to.be.below(m.news.left);
    });

    it(`caps the news column at live's ${right}px at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.right.width).to.equal(right);
    });

    it(`sizes the tiles from the column, live's ${tile}px at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.tile.width, `tile width at ${vw}`).to.equal(tile);
      expect(m.tile.height, 'square').to.equal(m.tile.width);
      expect(m.perRow, 'three across').to.equal(3);
      expect(m.tileGap, 'live sets 20 between them').to.equal(20);
    });

    it(`sets both band titles ${fontSize}/${lineHeight} in tracked capitals at ${vw}`, async () => {
      const m = await measure(vw);
      [m.socialType, m.newsType].forEach((t, i) => {
        const which = i ? 'News' : 'Social';
        expect(t.fontSize, `${which} size`).to.equal(fontSize);
        expect(t.lineHeight, `${which} line height`).to.equal(lineHeight);
        expect(t.fontWeight, `${which} weight`).to.equal('300');
        expect(t.letterSpacing, `${which} tracking`).to.equal('6px');
        expect(t.textTransform, `${which} capitals`).to.equal('uppercase');
        expect(t.color, `${which} on black`).to.equal('rgb(255, 255, 255)');
        expect(t.textAlign, `${which} aligned left`).to.equal('start');
      });
    });

    it(`leaves live's 22px under each title at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.headingToTiles, 'title to tiles').to.equal(22);
      expect(m.headingToNews, 'title to teasers').to.equal(22);
    });

    it(`pads the band 80 above and 60 below at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.sectionPadding).to.deep.equal(['80px', '60px']);
    });

    it(`fits the viewport at ${vw}`, async () => {
      const m = await measure(vw);
      expect(m.scrollWidth).to.be.at.most(m.vw);
    });
  });

  // the tiles were 237 at both widths in a fixed 750px grid, which is the
  // symptom the band fixes rather than a size to tune on its own
  it('sizes the tiles differently at the two widths, as the column does', async () => {
    const wide = await measure(1440);
    const narrow = await measure(900);
    expect(wide.tile.width).to.be.above(narrow.tile.width);
  });

  it('stacks the news teasers in the narrow column', async () => {
    const m = await measure(1440);
    expect(m.newsList.gridTemplateColumns.split(' '), 'one column').to.have.length(1);
    expect(m.teasers[1].top, 'the second teaser sits below the first')
      .to.be.at.least(m.teasers[0].bottom);
    expect(m.teaserPadTop.slice(1), "live's 20 above each following teaser")
      .to.deep.equal(['20px', '20px']);
  });

  // live rules them in #cdcdcd here, which is the site's own --conti-grey
  it("rules the teasers in live's grey", async () => {
    const m = await measure(1440);
    expect(m.teaserRule).to.equal('rgb(205, 205, 205)');
  });

  // live closes the column with an outlined pill; ours was a plain text link
  it('closes the news column with live\'s outlined pill', async () => {
    const m = await measure(1440);
    expect(m.buttonStyle.borderWidth, '2px rule').to.equal('2px');
    expect(m.buttonStyle.borderTopColor, 'white on black').to.equal('rgb(255, 255, 255)');
    expect(m.buttonStyle.borderRadius, 'live rounds it 26').to.equal('26px');
    expect(m.buttonStyle.backgroundColor, 'outlined, not filled').to.equal('rgba(0, 0, 0, 0)');
    expect(m.buttonStyle.textTransform, 'capitals').to.equal('uppercase');
    expect(m.buttonStyle.padding, "live's box").to.equal('12px 26px');
    expect(m.button.top - m.lastTeaser.bottom, 'live leaves 20 above it').to.equal(20);
    expect(m.button.left, 'live sets it flush left in the column').to.equal(m.news.left);
  });

  describe('below 769, where live stacks the two columns', () => {
    it('runs one column, Social above News', async () => {
      const m = await measure(375);
      expect(m.tracks, 'one track').to.have.length(1);
      expect(m.social.top, 'Social first').to.be.below(m.news.top);
      expect(m.right.top - m.left.bottom, "live's 45 between them").to.equal(45);
    });

    it('centres both titles, at 30/36', async () => {
      const m = await measure(375);
      [m.socialType, m.newsType].forEach((t) => {
        expect(t.textAlign).to.equal('center');
        expect(t.fontSize).to.equal('30px');
        expect(t.lineHeight).to.equal('36px');
      });
    });

    it('pads the band 38 above and 20 below', async () => {
      const m = await measure(375);
      expect(m.sectionPadding).to.deep.equal(['38px', '20px']);
    });

    it('runs the pill the width of the column, centred', async () => {
      const m = await measure(375);
      expect(m.buttonStyle.justifyContent).to.equal('center');
      expect(m.button.width).to.equal(m.right.width);
    });

    it('fits the viewport', async () => {
      const m = await measure(375);
      expect(m.scrollWidth).to.be.at.most(m.vw);
    });
  });
});
