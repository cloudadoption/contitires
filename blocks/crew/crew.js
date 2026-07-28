import { decorateIcons } from '../../scripts/aem.js';
import { buildBreadcrumb } from '../banner/banner.js';

// the networks live links a Conti Crew page to, keyed by the host, so the
// author writes the address and the block draws the mark
const NETWORKS = [
  { host: 'facebook.com', name: 'facebook' },
  { host: 'instagram.com', name: 'instagram' },
  { host: 'tiktok.com', name: 'tiktok' },
  { host: 'youtube.com', name: 'youtube' },
  { host: 'twitter.com', name: 'x' },
  { host: 'x.com', name: 'x' },
];

/** The network an address belongs to, or nothing where it belongs to none. */
function network(href) {
  let host;
  try {
    ({ hostname: host } = new URL(href, window.location.href));
  } catch (e) {
    return null;
  }
  host = host.replace(/^www\./, '');
  const found = NETWORKS.find((n) => host === n.host || host.endsWith(`.${n.host}`));
  return found ? found.name : null;
}

/** A cell holding nothing but a list of links, which is how socials arrive. */
function isLinkList(cell) {
  const list = cell.firstElementChild;
  if (!list || list.tagName !== 'UL' || cell.children.length !== 1) return false;
  return [...list.children].every((item) => {
    const link = item.querySelector('a');
    return link && item.textContent.trim() === link.textContent.trim();
  });
}

/** The people column: a name, then the car and the tire under it. */
function buildPeople(cell) {
  const people = document.createElement('ul');
  people.className = 'crew-people';
  [...cell.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      const person = document.createElement('li');
      person.className = 'crew-person';
      person.append(el);
      people.append(person);
      return;
    }
    const person = people.lastElementChild;
    if (el.tagName !== 'UL' || !person) return;
    // live marks the car with a car and every tire under it with a tire
    [...el.children].forEach((pref, i) => {
      pref.className = 'crew-preference';
      const icon = document.createElement('span');
      icon.className = `icon icon-${i === 0 ? 'car' : 'tire'}`;
      pref.prepend(icon);
    });
    person.append(el);
  });
  return people;
}

/** The row of social marks, each link named by the word the author wrote. */
function buildSocials(cell) {
  const socials = document.createElement('ul');
  socials.className = 'crew-socials';
  cell.querySelectorAll('a').forEach((link) => {
    const name = network(link.href);
    if (!name) return;
    link.setAttribute('aria-label', link.textContent.trim());
    link.textContent = '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const icon = document.createElement('span');
    icon.className = `icon icon-${name}`;
    link.append(icon);
    const item = document.createElement('li');
    item.append(link);
    socials.append(item);
  });
  return socials.children.length ? socials : null;
}

/**
 * Conti Crew member marquee: live's photo with the show title over it, and
 * under it the black bar carrying the round logo, the people, the summary and
 * the social links. The author writes one row per part: the photo with the
 * title, the logo on its own, a name and its preferences per person, the
 * summary, and the social addresses as a list.
 * @param {Element} block the crew block
 */
export default function decorate(block) {
  const cells = [...block.children].map((row) => row.firstElementChild || row);

  const marqueeCell = cells.find((cell) => cell.querySelector('h1'));
  const peopleCell = cells.find((cell) => cell.querySelector('h2'));
  const logoCell = cells.find((cell) => cell !== marqueeCell && cell !== peopleCell
    && cell.querySelector('picture') && !cell.querySelector('ul'));
  const socialCell = cells.find((cell) => cell !== peopleCell && isLinkList(cell));
  const summaryCell = cells.find((cell) => ![marqueeCell, peopleCell, logoCell, socialCell]
    .includes(cell));

  const marquee = document.createElement('div');
  marquee.className = 'crew-marquee';

  const photo = document.createElement('div');
  photo.className = 'crew-photo';

  if (marqueeCell) {
    const title = marqueeCell.querySelector('h1');
    const trail = buildBreadcrumb(window.location.pathname, title.textContent.trim());
    if (trail) {
      trail.className = 'crew-breadcrumb';
      marquee.append(trail);
    }
    const picture = marqueeCell.querySelector('picture');
    if (picture) {
      photo.append(picture);
      // the marquee opens the page, so its photo is the LCP image
      const img = picture.querySelector('img');
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
    }
    marquee.append(photo, title);
  }

  if (logoCell) {
    const logo = document.createElement('div');
    logo.className = 'crew-logo';
    logo.append(logoCell.querySelector('picture'));
    photo.append(logo);
  }

  const content = document.createElement('div');
  content.className = 'crew-bar-content';
  if (peopleCell) content.append(buildPeople(peopleCell));
  if (summaryCell) {
    const summary = document.createElement('div');
    summary.className = 'crew-summary';
    while (summaryCell.firstChild) summary.append(summaryCell.firstChild);
    content.append(summary);
  }
  if (socialCell) {
    const socials = buildSocials(socialCell);
    if (socials) content.append(socials);
  }

  const bar = document.createElement('div');
  bar.className = 'crew-bar';
  bar.append(content);

  block.replaceChildren(marquee, bar);
  decorateIcons(block);
}
