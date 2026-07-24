/**
 * Reuses whatever the author placed in the block: a heading, one or two
 * pictures (desktop + optional mobile art direction), subcopy paragraphs
 * and CTA links. Everything but the heading and first picture is optional.
 * @param {Element} block the hero block
 */
export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')];
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const ctaWrappers = [...block.querySelectorAll('p.button-wrapper')];

  const isImageOnly = (p) => {
    const kids = [...p.children];
    return kids.length > 0 && kids.every((kid) => kid.tagName === 'PICTURE') && !p.textContent.trim();
  };
  const isEmpty = (p) => !p.textContent.trim() && p.children.length === 0;
  const subcopy = [...block.querySelectorAll('p')]
    .filter((p) => !p.classList.contains('button-wrapper') && !isImageOnly(p) && !isEmpty(p));

  const imageWrap = document.createElement('div');
  imageWrap.className = 'hero-image';
  pictures.slice(0, 2).forEach((picture, i) => {
    picture.classList.add(i === 0 ? 'hero-image-desktop' : 'hero-image-mobile');
    imageWrap.append(picture);
  });
  if (pictures.length > 1) block.classList.add('has-mobile-image');

  const content = document.createElement('div');
  content.className = 'hero-content';
  if (heading) content.append(heading);
  subcopy.forEach((p) => content.append(p));

  if (ctaWrappers.length) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-ctas';
    ctaWrappers.forEach((p) => {
      p.classList.remove('button-wrapper');
      ctas.append(p);
    });
    content.append(ctas);
  }

  block.replaceChildren(imageWrap, content);
}
