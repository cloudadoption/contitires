/** the shape of a youtube id, and the three link forms authors paste */
const ID = /^[\w-]{11}$/;

/**
 * The video an authored link points at.
 * @param {string} href a youtube url in watch, short or embed form
 * @returns {string} the video id, or an empty string when it is not one
 */
export function videoId(href) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch (e) {
    return '';
  }
  if (!/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(url.hostname)) return '';
  const watch = url.searchParams.get('v');
  const path = url.pathname.split('/').filter(Boolean).pop() || '';
  const id = watch || path;
  return ID.test(id) ? id : '';
}

/** Live's player settings, with autoplay because the click asked for it. */
function embedUrl(id) {
  const params = new URLSearchParams({
    autoplay: '1', rel: '0', playsinline: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const id = link ? videoId(link.href) : '';
  if (!id) return;

  const title = link.textContent.trim();
  const picture = block.querySelector('picture');
  const image = picture?.querySelector('img');

  // the frame holds the poster and later the player, at one ratio, so swapping
  // one for the other moves nothing below it
  const frame = document.createElement('div');
  frame.className = 'video-frame';
  frame.style.aspectRatio = '16 / 9';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-play';
  button.setAttribute('aria-label', title ? `Play ${title}` : 'Play video');

  if (picture) frame.append(picture);
  else block.classList.add('video-no-poster');
  frame.append(button);

  button.addEventListener('click', () => {
    const player = document.createElement('iframe');
    player.className = 'video-player';
    player.src = embedUrl(id);
    player.title = title || 'Video';
    player.allow = 'autoplay; encrypted-media; picture-in-picture';
    player.setAttribute('allowfullscreen', '');
    player.setAttribute('frameborder', '0');
    frame.replaceChildren(player);
  }, { once: true });

  block.replaceChildren(frame);
}
