const TITLE = 'Related articles';

/**
 * decorate the related-articles block: a titled list of the links an editor
 * picked for this article. The title is chrome, so only the links are authored.
 * @param {Element} block the related-articles block
 */
export default function decorate(block) {
  const links = [...block.querySelectorAll('a')];
  block.textContent = '';
  if (!links.length) return;

  const title = document.createElement('h2');
  title.className = 'related-articles-title';
  title.textContent = TITLE;

  const list = document.createElement('ul');
  list.className = 'related-articles-list';
  links.forEach((link) => {
    const li = document.createElement('li');
    li.append(link);
    list.append(li);
  });

  block.append(title, list);
}
