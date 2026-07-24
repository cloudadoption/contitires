import { decorateIcons } from '../../scripts/aem.js';

const NETWORKS = [
  {
    name: 'facebook',
    label: 'Facebook',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    external: true,
  },
  {
    name: 'x',
    label: 'X',
    href: (url, title) => `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    external: true,
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    external: true,
  },
  {
    name: 'mail',
    label: 'Email',
    href: (url, title) => `mailto:?subject=${title}&body=${url}`,
    external: false,
  },
];

/**
 * decorate the share block: renders social share links for the current page.
 * No author input is required, the block derives the URL and title from
 * the page itself.
 * @param {Element} block the share block
 */
export default function decorate(block) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);

  const ul = document.createElement('ul');
  NETWORKS.forEach(({
    name, label, href, external,
  }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href(url, title);
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    const icon = document.createElement('span');
    icon.className = `icon icon-${name}`;
    const text = document.createElement('span');
    text.className = 'share-label';
    text.textContent = label;
    a.append(icon, text);
    li.append(a);
    ul.append(li);
  });

  block.replaceChildren(ul);
  decorateIcons(block);
}
