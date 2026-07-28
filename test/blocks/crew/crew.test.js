/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/crew/crew.js';

/**
 * A Conti Crew member page opens with live's `partner-crew` marquee: a wide
 * photo with the show title over it, and under it a black bar carrying the
 * round logo, the people, the summary and the social links. Read off
 * continentaltire.com/experience/conti-crew/speed-academy at 1440 and 375.
 * Issue #104.
 */
function buildCrew({
  logo = true, people = true, summary = true, socials = true,
} = {}) {
  const picture = (name) => `
    <picture>
      <source type="image/webp" srcset="/icons/search.svg" media="(min-width: 600px)">
      <img loading="lazy" alt="${name}" src="/icons/search.svg" width="2880" height="1000">
    </picture>`;
  const rows = [
    `${picture('Speed Academy Conti Crew')}<h1>Speed Academy</h1>`,
    logo ? picture('Speed Academy Logo') : null,
    people ? `
      <h2>Peter Tarach</h2>
      <ul>
        <li>1993 BMW M5</li>
        <li><a href="/tires/extremecontact-sport-02">ExtremeContact Sport[02]</a></li>
      </ul>
      <h2>Dave Pratte</h2>
      <ul>
        <li>2002 Acura NSX-R</li>
        <li><a href="/tires/extremecontact-sport-02">ExtremeContact Sport[02]</a></li>
      </ul>` : null,
    summary ? '<p>Speed Academy is a YouTube channel made up of Peter Tarach and Dave Pratte.</p>' : null,
    socials ? `
      <ul>
        <li><a href="https://www.facebook.com/gofastwithclass">Facebook</a></li>
        <li><a href="https://www.instagram.com/speedacademy/">Instagram</a></li>
        <li><a href="https://www.tiktok.com/@speedacademy">TikTok</a></li>
        <li><a href="https://www.youtube.com/@speedacademy">YouTube</a></li>
      </ul>` : null,
  ].filter(Boolean);

  document.body.innerHTML = `
    <main>
      <div class="section">
        <div class="crew block">
          ${rows.map((r) => `<div><div>${r}</div></div>`).join('')}
        </div>
      </div>
    </main>`;
  return document.querySelector('.crew.block');
}

describe('Crew block, the marquee', () => {
  let block;
  beforeEach(() => { block = buildCrew(); });

  it('puts the photo and the title in one marquee', () => {
    decorate(block);
    const marquee = block.querySelector('.crew-marquee');
    expect(marquee, 'marquee built').to.exist;
    expect(marquee.querySelector('picture'), 'the photo').to.exist;
    expect(marquee.querySelector('h1').textContent).to.equal('Speed Academy');
  });

  // the title is one element, over the photo above 1024 and under it below,
  // so nothing is authored twice and no crawler reads the name twice
  it('keeps one title, not a desktop and a mobile copy', () => {
    decorate(block);
    expect(block.querySelectorAll('h1')).to.have.length(1);
  });

  // live opens the page with its own photo, and this one is the LCP image
  it('asks for the photo first', () => {
    decorate(block);
    const img = block.querySelector('.crew-marquee img');
    expect(img.getAttribute('loading')).to.equal('eager');
    expect(img.getAttribute('fetchpriority')).to.equal('high');
  });

  // the trail reads off the path, as the banner's does
  it('shows the trail live shows over the photo', () => {
    const here = window.location.pathname;
    window.history.replaceState({}, '', '/experience/conti-crew/speed-academy');
    decorate(block);
    window.history.replaceState({}, '', here);
    const trail = block.querySelector('.crew-marquee nav');
    expect(trail, 'trail built').to.exist;
    expect(trail.getAttribute('aria-label')).to.equal('Breadcrumb');
    expect(trail.querySelector('a').getAttribute('href')).to.equal('/experience');
    expect(trail.querySelector('[aria-current="page"]').textContent).to.equal('Speed Academy');
  });
});

describe('Crew block, the bar', () => {
  let block;
  beforeEach(() => { block = buildCrew(); });

  it('wraps the logo on its own', () => {
    decorate(block);
    const logo = block.querySelector('.crew-logo');
    expect(logo, 'logo wrapper built').to.exist;
    expect(logo.querySelector('img').alt).to.equal('Speed Academy Logo');
  });

  it('makes one person of each name and the preferences under it', () => {
    decorate(block);
    const people = block.querySelectorAll('.crew-person');
    expect(people).to.have.length(2);
    expect(people[0].querySelector('h2').textContent).to.equal('Peter Tarach');
    expect(people[1].querySelector('h2').textContent).to.equal('Dave Pratte');
    expect(people[0].querySelectorAll('.crew-preference')).to.have.length(2);
  });

  // live marks the car with a car and the tire with a tire, and the icons are
  // chrome, so the block draws them rather than the author
  it('marks the car with a car and the tire with a tire', () => {
    decorate(block);
    const [car, tire] = block.querySelectorAll('.crew-person .crew-preference');
    expect(car.querySelector('span.icon-car'), 'car icon').to.exist;
    expect(tire.querySelector('span.icon-tire'), 'tire icon').to.exist;
    expect(car.textContent.trim()).to.equal('1993 BMW M5');
  });

  it('keeps the link on the tire', () => {
    decorate(block);
    const link = block.querySelector('.crew-person .crew-preference a');
    expect(link.getAttribute('href')).to.equal('/tires/extremecontact-sport-02');
    expect(link.textContent).to.equal('ExtremeContact Sport[02]');
  });

  it('holds the summary apart from the people', () => {
    decorate(block);
    const summary = block.querySelector('.crew-summary');
    expect(summary, 'summary built').to.exist;
    expect(summary.textContent).to.contain('YouTube channel');
    expect(summary.querySelector('h2'), 'no person in the summary').to.not.exist;
  });
});

describe('Crew block, the social links', () => {
  let block;
  beforeEach(() => { block = buildCrew(); });

  it('names each network from the address it points at', () => {
    decorate(block);
    const icons = [...block.querySelectorAll('.crew-socials span.icon')];
    expect(icons.map((i) => i.className.replace('icon ', ''))).to.eql([
      'icon-facebook', 'icon-instagram', 'icon-tiktok', 'icon-youtube',
    ]);
  });

  it('leaves each link a name a screen reader can read', () => {
    decorate(block);
    const links = [...block.querySelectorAll('.crew-socials a')];
    expect(links.map((a) => a.getAttribute('aria-label')))
      .to.eql(['Facebook', 'Instagram', 'TikTok', 'YouTube']);
    expect(links[0].textContent.trim(), 'the label is the icon, not the word').to.equal('');
  });

  it('opens a social link away from the site', () => {
    decorate(block);
    const link = block.querySelector('.crew-socials a');
    expect(link.getAttribute('target')).to.equal('_blank');
    expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
  });
});

// three of the five live pages carry every part; one has no quote and the
// people count runs 1 or 2, so a missing row must not take the page down
describe('Crew block, what an author leaves out', () => {
  it('builds without a logo', () => {
    const block = buildCrew({ logo: false });
    decorate(block);
    expect(block.querySelector('.crew-logo')).to.not.exist;
    expect(block.querySelectorAll('.crew-person')).to.have.length(2);
  });

  it('builds without social links', () => {
    const block = buildCrew({ socials: false });
    decorate(block);
    expect(block.querySelector('.crew-socials')).to.not.exist;
    expect(block.querySelector('.crew-summary')).to.exist;
  });

  it('builds with one person and no summary', () => {
    const block = buildCrew({ summary: false });
    decorate(block);
    expect(block.querySelector('.crew-summary')).to.not.exist;
    expect(block.querySelector('.crew-socials')).to.exist;
  });
});

/**
 * Live's numbers, read off the rendered page. At 1440 the photo runs 600 tall
 * with the title over it at 80/80 in a 600 column; the bar is black, padded
 * 80 over and 40 under, and splits into a 200 people column, the summary and
 * the icons, 60 apart. At 375 the photo is 200 tall, the title drops into the
 * bar at 30/38, and the logo is 80.
 */
describe('Crew block, live\'s measurements', () => {
  let block;

  async function adopt(...paths) {
    const sheets = await Promise.all(paths.map(async (p) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(p)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
  }

  before(async () => {
    await adopt('/styles/styles.css', '/blocks/crew/crew.css');
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
  });

  beforeEach(() => {
    const here = window.location.pathname;
    window.history.replaceState({}, '', '/experience/conti-crew/speed-academy');
    block = buildCrew();
    decorate(block);
    window.history.replaceState({}, '', here);
  });

  it('runs the photo 600 tall over a black bar at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const photo = block.querySelector('.crew-marquee picture');
    const bar = block.querySelector('.crew-bar');
    expect(Math.round(photo.getBoundingClientRect().height)).to.equal(600);
    expect(getComputedStyle(bar).backgroundColor).to.equal('rgb(0, 0, 0)');
    expect(getComputedStyle(bar).padding).to.equal('80px 0px 40px');
  });

  it('lays the title over the photo at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const h1 = block.querySelector('.crew-marquee h1');
    const photo = block.querySelector('.crew-marquee picture');
    const styles = getComputedStyle(h1);
    expect(styles.position).to.equal('absolute');
    expect(styles.fontSize).to.equal('80px');
    expect(styles.lineHeight).to.equal('80px');
    expect(styles.textTransform).to.equal('uppercase');
    expect(Math.round(h1.getBoundingClientRect().width)).to.equal(600);
    const over = h1.getBoundingClientRect().bottom <= photo.getBoundingClientRect().bottom;
    expect(over, 'the title sits inside the photo').to.be.true;
  });

  it('splits the bar into live\'s three columns at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const people = block.querySelector('.crew-people');
    const summary = block.querySelector('.crew-summary');
    const socials = block.querySelector('.crew-socials');
    expect(Math.round(people.getBoundingClientRect().width)).to.equal(200);
    expect(Math.round(summary.getBoundingClientRect().left
      - people.getBoundingClientRect().right)).to.equal(60);
    expect(Math.round(socials.getBoundingClientRect().left
      - summary.getBoundingClientRect().right)).to.equal(60);
    expect(getComputedStyle(summary).fontSize).to.equal('24px');
    expect(getComputedStyle(summary).lineHeight).to.equal('32px');
  });

  it('rings the logo in yellow and hangs it over the photo at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const logo = block.querySelector('.crew-logo');
    const bar = block.querySelector('.crew-bar');
    const box = logo.getBoundingClientRect();
    expect(Math.round(box.width)).to.equal(120);
    expect(Math.round(box.height)).to.equal(120);
    expect(getComputedStyle(logo).borderTopColor).to.equal('rgb(255, 165, 0)');
    expect(Math.round(bar.getBoundingClientRect().top - box.top)).to.equal(75);
  });

  it('names the people in live\'s small caps', async () => {
    await setViewport({ width: 1440, height: 900 });
    const name = block.querySelector('.crew-person h2');
    const styles = getComputedStyle(name);
    expect(styles.fontSize).to.equal('12px');
    expect(styles.lineHeight).to.equal('16px');
    expect(styles.textTransform).to.equal('uppercase');
    expect(styles.letterSpacing).to.equal('0.6px');
  });

  it('drops the title into the bar at 375', async () => {
    await setViewport({ width: 375, height: 800 });
    const h1 = block.querySelector('.crew-marquee h1');
    const photo = block.querySelector('.crew-marquee picture');
    const styles = getComputedStyle(h1);
    expect(Math.round(photo.getBoundingClientRect().height)).to.equal(200);
    expect(styles.position).to.equal('static');
    expect(styles.fontSize).to.equal('30px');
    expect(styles.lineHeight).to.equal('38px');
    const under = h1.getBoundingClientRect().top >= photo.getBoundingClientRect().bottom;
    expect(under, 'the title sits under the photo').to.be.true;
  });

  // the site's body is 18 over 28.8 and live's is 14.88 over 22, which is what
  // made the trail's strip 69 against live's 62 and every preference row 29
  // against live's 22
  it("holds live's own type in the bar and the trail", async () => {
    await setViewport({ width: 1440, height: 900 });
    const type = (sel) => {
      const styles = getComputedStyle(block.querySelector(sel));
      return [styles.fontSize, styles.lineHeight];
    };
    expect(type('.crew-preference')).to.eql(['15px', '22px']);
    expect(type('.crew-socials')).to.eql(['15px', '22px']);
    expect(type('.crew-marquee nav')).to.eql(['15px', '22px']);
  });

  it('stacks the bar and shrinks the logo at 375', async () => {
    await setViewport({ width: 375, height: 800 });
    const logo = block.querySelector('.crew-logo');
    const people = block.querySelector('.crew-people');
    const summary = block.querySelector('.crew-summary');
    expect(Math.round(logo.getBoundingClientRect().width)).to.equal(80);
    expect(Math.round(summary.getBoundingClientRect().top
      - people.getBoundingClientRect().bottom)).to.equal(20);
    expect(getComputedStyle(summary).fontSize).to.equal('18px');
    expect(getComputedStyle(summary).lineHeight).to.equal('22px');
  });
});
