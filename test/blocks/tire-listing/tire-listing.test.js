/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate, {
  FACET_GROUPS,
  parseConfig,
  parseRows,
  filterRows,
  sortRows,
  paginate,
  stateFromSearch,
  searchFromState,
  renderName,
} from '../../../blocks/tire-listing/tire-listing.js';
import { CATALOG, LIVE_COUNTS, LIVE_CATEGORY_ORDER } from './catalog.fixture.js';

/** A catalog sheet response, as /products.json?sheet=catalog serves it. */
function sheet(rows) {
  return {
    total: rows.length, offset: 0, limit: rows.length, data: rows,
  };
}

/** The full 46-row live catalog, as sheet rows. */
function liveSheet() {
  return sheet(CATALOG.map((t) => ({
    ...t,
    path: `/tires/${t.slug}`,
    image: `https://example.com/${t.slug}.png`,
    description: `About the ${t.name}.`,
  })));
}

function buildBlock(html = '') {
  document.body.innerHTML = `<div class="tire-listing block">${html}</div>`;
  return document.querySelector('.tire-listing.block');
}

/** Slugs of the rows a single facet label selects. */
function slugsFor(label) {
  const group = FACET_GROUPS.find((g) => g.labels.includes(label));
  return filterRows(parseRows(liveSheet()), { [group.key]: [label] }).map((r) => r.slug);
}

describe('FACET_GROUPS', () => {
  it('carries the three live groups with their within-group operators', () => {
    expect(FACET_GROUPS.map((g) => g.key)).to.deep.equal(['vehicle', 'condition', 'weather']);
    expect(FACET_GROUPS.map((g) => g.legend)).to.deep.equal([
      'Vehicle Type', 'Driving Condition', 'Weather Condition',
    ]);
    // live intersects checked vehicle types but unions the other two groups
    expect(FACET_GROUPS.map((g) => g.operator)).to.deep.equal(['and', 'or', 'or']);
  });

  it('holds the 12 facet labels, each unique across groups', () => {
    const labels = FACET_GROUPS.flatMap((g) => g.labels);
    expect(labels).to.have.length(12);
    expect(new Set(labels).size).to.equal(12);
    expect(FACET_GROUPS[0].labels).to.deep.equal([
      'Fleet', 'Passenger', 'Crossover', 'Light Truck/SUV', 'Original Equipment',
    ]);
  });
});

describe('parseRows', () => {
  it('splits bestFor into badges and into the facet group each label belongs to', () => {
    const [row] = parseRows(sheet([{
      slug: 'securecontact-aw',
      name: 'SecureContact AW',
      bestFor: 'Passenger, Crossover, Light Truck/SUV, Touring, All-Weather',
      weight: '1',
    }]));
    expect(row.badges).to.deep.equal([
      'Passenger', 'Crossover', 'Light Truck/SUV', 'Touring', 'All-Weather',
    ]);
    expect(row.facets.vehicle).to.deep.equal(['Passenger', 'Crossover', 'Light Truck/SUV']);
    expect(row.facets.condition).to.deep.equal(['Touring']);
    expect(row.facets.weather).to.deep.equal(['All-Weather']);
  });

  it('keeps a badge that is not a facet, without inventing a group for it', () => {
    const [row] = parseRows(sheet([{ bestFor: 'Passenger, Electric Vehicles, Summer' }]));
    // Electric Vehicles is a badge on 39 of 46 live tires but has no checkbox
    expect(row.badges).to.contain('Electric Vehicles');
    expect(row.facets.vehicle).to.deep.equal(['Passenger']);
    expect(row.facets.condition).to.deep.equal([]);
  });

  it('coerces the numeric and flag columns the sheet serves as strings', () => {
    const [row] = parseRows(sheet([{
      rating: '4.3', reviews: '36', weight: '2', isNew: 'true', promo: '$110 Rebate Offer', promoPath: '/promotion',
    }]));
    expect(row.rating).to.equal(4.3);
    expect(row.reviews).to.equal(36);
    expect(row.weight).to.equal(2);
    expect(row.isNew).to.be.true;
    expect(row.promo).to.deep.equal({ text: '$110 Rebate Offer', href: '/promotion' });
  });

  it('treats blank cells as absent rather than as zero or as a flag', () => {
    const [row] = parseRows(sheet([{
      rating: '', reviews: '', weight: '', isNew: '', promo: '', bestFor: '',
    }]));
    // an unweighted row must sort last, so '' is not weight 0
    expect(Number.isNaN(row.weight)).to.be.true;
    expect(row.rating).to.equal(0);
    expect(row.reviews).to.equal(0);
    expect(row.isNew).to.be.false;
    expect(row.promo).to.be.null;
    expect(row.badges).to.deep.equal([]);
  });

  it('tolerates a missing space after the separator and a trailing comma', () => {
    const [row] = parseRows(sheet([{ bestFor: 'Passenger,Summer,' }]));
    expect(row.badges).to.deep.equal(['Passenger', 'Summer']);
  });

  it('reads the per-facet editorial order a category page needs', () => {
    const [row] = parseRows(sheet([{ facetWeights: 'Winter:2, Passenger:14' }]));
    expect(row.facetWeights).to.deep.equal({ Winter: 2, Passenger: 14 });
  });

  it('falls back to the plain name when no display markup is authored', () => {
    const rows = parseRows(sheet([
      { name: 'TrueContact Tour54', nameHtml: 'TrueContact Tour<sup>54</sup>' },
      { name: 'PureContact LS' },
    ]));
    expect(rows[0].nameHtml).to.equal('TrueContact Tour<sup>54</sup>');
    expect(rows[1].nameHtml).to.equal('PureContact LS');
  });
});

describe('filterRows', () => {
  const rows = () => parseRows(liveSheet());

  it('returns everything when nothing is selected', () => {
    expect(filterRows(rows(), {})).to.have.length(46);
  });

  it('matches live result totals for every single facet', () => {
    Object.entries(LIVE_COUNTS).forEach(([label, count]) => {
      expect(slugsFor(label).length, label).to.equal(count);
    });
  });

  it('intersects within Vehicle Type, the way live does', () => {
    // live: Passenger 29, Crossover 34, both checked 23
    expect(filterRows(rows(), { vehicle: ['Passenger', 'Crossover'] })).to.have.length(23);
    expect(filterRows(rows(), {
      vehicle: ['Passenger', 'Crossover', 'Light Truck/SUV'],
    })).to.have.length(12);
  });

  it('unions within Driving Condition and Weather Condition, the way live does', () => {
    // live: Ultra-High Performance 15, Touring 28, both checked 43
    expect(filterRows(rows(), {
      condition: ['Ultra-High Performance', 'Touring'],
    })).to.have.length(43);
    // live: Summer 12, Winter 6, both checked 18
    expect(filterRows(rows(), { weather: ['Summer', 'Winter'] })).to.have.length(18);
  });

  it('intersects across groups', () => {
    // live: Passenger + Summer = 10
    expect(filterRows(rows(), { vehicle: ['Passenger'], weather: ['Summer'] })).to.have.length(10);
    // live: Fleet + Summer = 0
    expect(filterRows(rows(), { vehicle: ['Fleet'], weather: ['Summer'] })).to.have.length(0);
  });

  it('ignores a label that is not in the vocabulary', () => {
    expect(filterRows(rows(), { vehicle: ['Hovercraft'] })).to.have.length(46);
  });
});

describe('sortRows', () => {
  const rows = () => parseRows(liveSheet());

  it('orders Featured by editorial weight, unweighted last', () => {
    const out = sortRows(parseRows(sheet([
      { slug: 'c', name: 'C', weight: '3' },
      { slug: 'x', name: 'X', weight: '' },
      { slug: 'a', name: 'A', weight: '1' },
      { slug: 'b', name: 'B', weight: '2' },
    ])), 'featured');
    expect(out.map((r) => r.slug)).to.deep.equal(['a', 'b', 'c', 'x']);
  });

  it('orders Highest rated by rating, then review count', () => {
    const out = sortRows(parseRows(sheet([
      {
        slug: 'few', name: 'Few', rating: '5', reviews: '1',
      },
      {
        slug: 'low', name: 'Low', rating: '4.1', reviews: '900',
      },
      {
        slug: 'many', name: 'Many', rating: '5', reviews: '400',
      },
      {
        slug: 'none', name: 'None', rating: '0', reviews: '0',
      },
    ])), 'rating');
    expect(out.map((r) => r.slug)).to.deep.equal(['many', 'few', 'low', 'none']);
  });

  it('orders A-Z case-insensitively on the plain name', () => {
    const out = sortRows(parseRows(sheet([
      { slug: 'v', name: 'VikingContact 7' },
      { slug: 'c', name: 'contiTrac' },
      { slug: 'e', name: 'ExtremeContact Sport02' },
    ])), 'az');
    expect(out.map((r) => r.slug)).to.deep.equal(['c', 'e', 'v']);
  });

  it('never drops or duplicates a row, whichever sort is used', () => {
    ['featured', 'rating', 'az'].forEach((key) => {
      const out = sortRows(rows(), key);
      expect(out, key).to.have.length(46);
      expect(new Set(out.map((r) => r.slug)).size, key).to.equal(46);
    });
  });

  it('orders Featured by the facet\'s own weight on a category page', () => {
    // live's /tires/winter puts VikingContact 8 second; the same filter applied
    // to /tires puts it third, because each taxonomy term carries its own order
    const winter = filterRows(rows(), { weather: ['Winter'] });
    expect(sortRows(winter, 'featured', 'Winter').map((r) => r.slug))
      .to.deep.equal(LIVE_CATEGORY_ORDER.Winter);
    expect(sortRows(winter, 'featured').map((r) => r.slug))
      .to.not.deep.equal(LIVE_CATEGORY_ORDER.Winter);
  });

  it('reproduces every live category page order', () => {
    Object.entries(LIVE_CATEGORY_ORDER).forEach(([facet, slugs]) => {
      const group = FACET_GROUPS.find((g) => g.labels.includes(facet));
      const matched = filterRows(rows(), { [group.key]: [facet] });
      expect(sortRows(matched, 'featured', facet).map((r) => r.slug), facet)
        .to.deep.equal(slugs);
    });
  });

  it('falls back to the global weight for a tire the facet does not rank', () => {
    const out = sortRows(parseRows(sheet([
      { slug: 'a', name: 'A', weight: '1' },
      {
        slug: 'b', name: 'B', weight: '2', facetWeights: 'Winter:1',
      },
    ])), 'featured', 'Winter');
    expect(out.map((r) => r.slug)).to.deep.equal(['b', 'a']);
  });

  it('leaves the input array untouched', () => {
    const input = rows();
    const before = input.map((r) => r.slug);
    sortRows(input, 'az');
    expect(input.map((r) => r.slug)).to.deep.equal(before);
  });
});

describe('paginate', () => {
  const rows = Array.from({ length: 46 }, (unused, i) => ({ slug: `t${i}` }));

  it('cuts the list into pages of ten and reports the live summary numbers', () => {
    const page1 = paginate(rows, 1, 10);
    expect(page1.items).to.have.length(10);
    expect(page1.first).to.equal(1);
    expect(page1.last).to.equal(10);
    expect(page1.total).to.equal(46);
    expect(page1.pageCount).to.equal(5);

    const page5 = paginate(rows, 5, 10);
    expect(page5.items).to.have.length(6);
    expect(page5.first).to.equal(41);
    expect(page5.last).to.equal(46);
  });

  it('clamps a page number outside the range instead of rendering nothing', () => {
    expect(paginate(rows, 99, 10).page).to.equal(5);
    expect(paginate(rows, 0, 10).page).to.equal(1);
    expect(paginate(rows, -3, 10).items).to.have.length(10);
  });

  it('reports one empty page for an empty result set', () => {
    const empty = paginate([], 1, 10);
    expect(empty.items).to.have.length(0);
    expect(empty.pageCount).to.equal(1);
    expect(empty.total).to.equal(0);
  });
});

describe('stateFromSearch', () => {
  it('reads the clean params the block writes', () => {
    const state = stateFromSearch('?vehicle=passenger,crossover&weather=summer&sort=az&page=3');
    expect(state.selection.vehicle).to.deep.equal(['Passenger', 'Crossover']);
    expect(state.selection.weather).to.deep.equal(['Summer']);
    expect(state.sort).to.equal('az');
    expect(state.page).to.equal(3);
  });

  it('still honours the legacy Drupal deep links live hands out', () => {
    const state = stateFromSearch('?tire_%5B11%5D=11&tire_category_weather%5B135%5D=135&sort_by=title&page=1');
    expect(state.selection.vehicle).to.deep.equal(['Passenger']);
    expect(state.selection.weather).to.deep.equal(['Summer']);
    expect(state.sort).to.equal('az');
    // live's page param is zero-based, ours is one-based
    expect(state.page).to.equal(2);
  });

  it('defaults to no filters, Featured, page 1', () => {
    const state = stateFromSearch('');
    expect(state.selection).to.deep.equal({ vehicle: [], condition: [], weather: [] });
    expect(state.sort).to.equal('featured');
    expect(state.page).to.equal(1);
  });

  it('drops values that are not facet labels', () => {
    expect(stateFromSearch('?vehicle=hovercraft').selection.vehicle).to.deep.equal([]);
    expect(stateFromSearch('?sort=random').sort).to.equal('featured');
  });
});

describe('searchFromState', () => {
  it('omits every param that is at its default', () => {
    expect(searchFromState({
      selection: { vehicle: [], condition: [], weather: [] }, sort: 'featured', page: 1,
    })).to.equal('');
  });

  it('writes the readable form', () => {
    expect(searchFromState({
      selection: { vehicle: ['Passenger', 'Light Truck/SUV'], condition: [], weather: ['Summer'] },
      sort: 'rating',
      page: 2,
    })).to.equal('?vehicle=passenger,light-truck-suv&weather=summer&sort=rating&page=2');
  });

  it('round-trips through stateFromSearch', () => {
    const state = {
      selection: { vehicle: ['Crossover'], condition: ['All-Terrain'], weather: [] },
      sort: 'az',
      page: 4,
    };
    expect(stateFromSearch(searchFromState(state))).to.deep.equal(state);
  });
});

describe('renderName', () => {
  it('keeps the superscript live uses in ten of the product names', () => {
    const el = document.createElement('span');
    el.append(renderName('TrueContact Tour<sup>54</sup>'));
    expect(el.querySelector('sup')).to.exist;
    expect(el.querySelector('sup').textContent).to.equal('54');
    expect(el.textContent).to.equal('TrueContact Tour54');
  });

  it('keeps text that follows the superscript', () => {
    const el = document.createElement('span');
    el.append(renderName('ControlContact Tour<sup>M</sup> A/S'));
    expect(el.textContent).to.equal('ControlContact TourM A/S');
  });

  it('drops any other markup rather than trusting the sheet', () => {
    const el = document.createElement('span');
    el.append(renderName('<img src=x onerror=alert(1)>Bad<b>Tire</b>'));
    expect(!!el.querySelector('img')).to.be.false;
    expect(!!el.querySelector('b')).to.be.false;
    expect(el.textContent).to.equal('BadTire');
  });
});

describe('parseConfig', () => {
  it('defaults to the catalog sheet, ten per page, no pre-selected facet', () => {
    expect(parseConfig(buildBlock('<div><div></div></div>'))).to.deep.equal({
      source: '/products.json?sheet=catalog', pageSize: 10, facet: '',
    });
  });

  it('reads a facet label, a page size and a source in any cell order', () => {
    expect(parseConfig(buildBlock('<div><div>Ultra-High Performance</div></div>')).facet)
      .to.equal('Ultra-High Performance');
    expect(parseConfig(buildBlock('<div><div>20</div><div>Passenger</div></div>')))
      .to.deep.equal({ source: '/products.json?sheet=catalog', pageSize: 20, facet: 'Passenger' });
    expect(parseConfig(buildBlock('<div><div>/other.json</div></div>')).source).to.equal('/other.json');
  });

  it('reads cells stacked as rows the same as cells side by side', () => {
    expect(parseConfig(buildBlock('<div><div><p>Winter</p></div></div><div><div>5</div></div>')))
      .to.deep.equal({ source: '/products.json?sheet=catalog', pageSize: 5, facet: 'Winter' });
  });
});

describe('Tire listing block', () => {
  let fetchStub;
  afterEach(() => {
    fetchStub?.restore();
    window.history.replaceState({}, '', '/tires');
  });

  const stubCatalog = () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(liveSheet())));
  };

  it('renders the filter form, the results header and the first ten cards', async () => {
    stubCatalog();
    const block = buildBlock();
    await decorate(block);

    expect(block.querySelectorAll('.tire-listing-filters fieldset')).to.have.length(3);
    expect(block.querySelectorAll('.tire-listing-filters input[type="checkbox"]')).to.have.length(12);
    expect(block.querySelector('.tire-listing-count').textContent).to.equal('46 Results');
    expect(block.querySelectorAll('.tire-listing-card')).to.have.length(10);
    expect(block.querySelector('.tire-listing-summary').textContent).to.equal('1-10 of 46 results');
  });

  it('builds a card the way live does', async () => {
    stubCatalog();
    const block = buildBlock();
    await decorate(block);

    const card = block.querySelector('.tire-listing-card');
    expect(card.querySelector('.tire-listing-card-title').textContent).to.contain('SecureContact AW');
    expect(card.querySelector('a[href="/tires/securecontact-aw"]')).to.exist;
    expect(card.querySelector('.tire-listing-promo').textContent).to.contain('$110 Rebate Offer');
    expect(card.querySelector('.tire-listing-new')).to.exist;
    expect(card.querySelectorAll('.tire-listing-badge')).to.have.length(5);
    expect(card.querySelector('.tire-listing-cta').textContent).to.contain('See Details');
    // the rating is available to a screen reader, not only as stars
    expect(card.querySelector('.tire-listing-rating .sr-only').textContent)
      .to.equal('Rated 5 out of 5 from 7 reviews');
  });

  it('filters when a checkbox is ticked, and resets to the first page', async () => {
    stubCatalog();
    const block = buildBlock();
    await decorate(block);

    block.querySelector('.tire-listing-pages a[data-page="3"]').click();
    expect(block.querySelector('.tire-listing-summary').textContent).to.equal('21-30 of 46 results');

    const passenger = block.querySelector('input[value="Passenger"]');
    passenger.checked = true;
    passenger.dispatchEvent(new Event('change', { bubbles: true }));

    expect(block.querySelector('.tire-listing-count').textContent).to.equal('29 Results');
    expect(block.querySelector('.tire-listing-summary').textContent).to.equal('1-10 of 29 results');
    expect(window.location.search).to.equal('?vehicle=passenger');
  });

  it('sorts without touching the filter selection', async () => {
    stubCatalog();
    const block = buildBlock();
    await decorate(block);

    const winter = block.querySelector('input[value="Winter"]');
    winter.checked = true;
    winter.dispatchEvent(new Event('change', { bubbles: true }));

    const sort = block.querySelector('.tire-listing-sort select');
    sort.value = 'az';
    sort.dispatchEvent(new Event('change', { bubbles: true }));

    expect(block.querySelector('.tire-listing-count').textContent).to.equal('6 Results');
    expect(block.querySelector('.tire-listing-card-title').textContent)
      .to.contain('ContiWinterContact');
    expect(winter.checked).to.be.true;
  });

  it('starts from the state in the URL', async () => {
    window.history.replaceState({}, '', '/tires?weather=winter&sort=az&page=1');
    stubCatalog();
    const block = buildBlock();
    await decorate(block);

    expect(block.querySelector('.tire-listing-count').textContent).to.equal('6 Results');
    expect(block.querySelector('input[value="Winter"]').checked).to.be.true;
    expect(block.querySelector('.tire-listing-sort select').value).to.equal('az');
  });

  it('pre-selects the facet the page authored, for a category page', async () => {
    stubCatalog();
    const block = buildBlock('<div><div>Ultra-High Performance</div></div>');
    await decorate(block);

    expect(block.querySelector('.tire-listing-count').textContent).to.equal('15 Results');
    expect(block.querySelector('input[value="Ultra-High Performance"]').checked).to.be.true;
  });

  /*
   * The mega menu hands out `/tires/ultra-high-performance` and the nav document
   * holds exactly that href. Live's own canonical is the clean path and its
   * markup carries no `condition=` anywhere. A facet the path already implies
   * says nothing new in the query string, so the address the reader copies,
   * shares and that analytics records stays the one live published. Issue #239.
   */
  it('leaves a clean category path clean', async () => {
    window.history.replaceState({}, '', '/tires/ultra-high-performance');
    stubCatalog();
    const block = buildBlock('<div><div>Ultra-High Performance</div></div>');
    await decorate(block);

    expect(block.querySelector('.tire-listing-count').textContent).to.equal('15 Results');
    expect(window.location.pathname).to.equal('/tires/ultra-high-performance');
    expect(window.location.search).to.equal('');
  });

  it('still normalises a legacy Drupal deep link on that same path', async () => {
    window.history.replaceState({}, '', '/tires/ultra-high-performance?tire_category_conditions%5B13%5D=13');
    stubCatalog();
    const block = buildBlock('<div><div>Ultra-High Performance</div></div>');
    await decorate(block);

    expect(window.location.search).to.equal('?condition=ultra-high-performance');
  });

  it('restores the category, and its clean address, on Back', async () => {
    window.history.replaceState({}, '', '/tires/ultra-high-performance');
    stubCatalog();
    const block = buildBlock('<div><div>Ultra-High Performance</div></div>');
    await decorate(block);

    const summer = block.querySelector('input[value="Summer"]');
    summer.checked = true;
    summer.dispatchEvent(new Event('change', { bubbles: true }));
    expect(window.location.search).to.equal('?condition=ultra-high-performance&weather=summer');

    // Back lands on the address the page was entered at, which carries no query
    window.history.replaceState({}, '', '/tires/ultra-high-performance');
    window.dispatchEvent(new PopStateEvent('popstate'));

    // the facet the path implies comes back with it, rather than all 46 tires
    expect(block.querySelector('.tire-listing-count').textContent).to.equal('15 Results');
    expect(block.querySelector('input[value="Ultra-High Performance"]').checked).to.be.true;
    expect(summer.checked).to.be.false;
    // and the address is left as Back found it
    expect(window.location.search).to.equal('');
  });

  it('writes the address once a reader changes a facet on a category page', async () => {
    window.history.replaceState({}, '', '/tires/winter');
    stubCatalog();
    const block = buildBlock('<div><div>Winter</div></div>');
    await decorate(block);
    expect(window.location.search, 'clean on arrival').to.equal('');

    const passenger = block.querySelector('input[value="Passenger"]');
    passenger.checked = true;
    passenger.dispatchEvent(new Event('change', { bubbles: true }));

    expect(window.location.search).to.equal('?vehicle=passenger&weather=winter');
  });

  it('renders a category page in that category\'s own order', async () => {
    stubCatalog();
    const block = buildBlock('<div><div>Winter</div></div>');
    await decorate(block);

    const titles = [...block.querySelectorAll('.tire-listing-card-title')]
      .map((el) => el.textContent.trim());
    expect(titles[0]).to.contain('VikingContact 7');
    expect(titles[1]).to.contain('VikingContact 8');
  });

  it('clears everything on reset', async () => {
    stubCatalog();
    const block = buildBlock();
    await decorate(block);

    const summer = block.querySelector('input[value="Summer"]');
    summer.checked = true;
    summer.dispatchEvent(new Event('change', { bubbles: true }));
    expect(block.querySelector('.tire-listing-count').textContent).to.equal('12 Results');

    block.querySelector('.tire-listing-reset').click();
    expect(block.querySelector('.tire-listing-count').textContent).to.equal('46 Results');
    expect(summer.checked).to.be.false;
    expect(window.location.search).to.equal('');
  });

  it('shows the live empty state when nothing matches', async () => {
    stubCatalog();
    const block = buildBlock();
    await decorate(block);

    ['Fleet', 'Summer'].forEach((value) => {
      const box = block.querySelector(`input[value="${value}"]`);
      box.checked = true;
      box.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(block.querySelector('.tire-listing-count').textContent).to.equal('0 Results');
    expect(block.querySelector('.tire-listing-empty').textContent).to.contain('No match found.');
    expect(block.querySelector('.tire-listing-empty a[href^="tel:"]')).to.exist;
    expect(!!block.querySelector('.tire-listing-pages')).to.be.false;
  });

  it('announces the result count politely', async () => {
    stubCatalog();
    const block = buildBlock();
    await decorate(block);

    const live = block.querySelector('[aria-live="polite"]');
    expect(live).to.exist;
    expect(live.contains(block.querySelector('.tire-listing-count'))).to.be.true;
  });

  it('renders nothing at all when the catalog cannot be loaded', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response('', { status: 404 }));
    const block = buildBlock();
    await decorate(block);

    expect(block.textContent.trim()).to.equal('');
  });
});
