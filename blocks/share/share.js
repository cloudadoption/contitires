import { decorateIcons } from '../../scripts/aem.js';

const NETWORKS = [
  {
    name: 'facebook',
    label: 'Facebook',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    external: true,
    iconOnly: true,
  },
  {
    name: 'x',
    label: 'X',
    href: (url, title) => `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    external: true,
    iconOnly: true,
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
    name, label, href, external, iconOnly,
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
    text.className = iconOnly ? 'share-label share-label-hidden' : 'share-label';
    text.textContent = label;
    a.append(icon, text);
    li.append(a);
    ul.append(li);
  });

  // print closes live's sharebar. It acts on this page rather than navigating,
  // so it is a button.
  const print = document.createElement('button');
  print.type = 'button';
  const printIcon = document.createElement('span');
  printIcon.className = 'icon icon-print';
  const printLabel = document.createElement('span');
  printLabel.className = 'share-label';
  printLabel.textContent = 'Print';
  print.append(printIcon, printLabel);
  print.addEventListener('click', () => window.print());
  const printItem = document.createElement('li');
  printItem.append(print);
  ul.append(printItem);

  block.replaceChildren(ul);
  decorateIcons(block);
}
