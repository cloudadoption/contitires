/**
 * Reuses whatever the author placed in the block: up to two pictures
 * (desktop + optional mobile art direction), a heading, subcopy paragraphs
 * and CTA links. Authoring order is preserved (an eyebrow line can precede
 * the heading), CTA paragraphs are pulled into their own row at the end.
 * @param {Element} block the hero block
 */
export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')];

  const isImageOnly = (p) => {
    const kids = [...p.children];
    return kids.length > 0 && kids.every((kid) => kid.tagName === 'PICTURE') && !p.textContent.trim();
  };
  const isEmpty = (p) => !p.textContent.trim() && p.children.length === 0;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'hero-image';
  pictures.slice(0, 2).forEach((picture, i) => {
    picture.classList.add(i === 0 ? 'hero-image-desktop' : 'hero-image-mobile');
    imageWrap.append(picture);
  });
  if (pictures.length > 1) block.classList.add('has-mobile-image');

  const content = document.createElement('div');
  content.className = 'hero-content';
  [...block.querySelectorAll('h1, h2, h3, h4, h5, h6, p')].forEach((el) => {
    if (el.tagName === 'P' && (el.classList.contains('button-wrapper') || isImageOnly(el) || isEmpty(el))) return;
    content.append(el);
  });

  const ctaWrappers = [...block.querySelectorAll('p.button-wrapper')];
  if (ctaWrappers.length) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-ctas';
    ctaWrappers.forEach((p) => ctas.append(p));
    content.append(ctas);
  }

  block.replaceChildren(imageWrap, content);
}
