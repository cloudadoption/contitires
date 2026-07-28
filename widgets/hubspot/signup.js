// HubSpot's developer embed renders the form into the page. The iframe embed
// beside it in newsletter.js renders into an iframe, which takes none of the
// page's CSS, so live's band and its field grid would be out of reach.
const PORTAL = '48908421';
const SRC = `https://js.hsforms.net/forms/embed/developer/${PORTAL}.js`;

/** Loads the embed once, however many signup forms a page carries. */
export default function decorate() {
  if (document.querySelector(`script[src="${SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = SRC;
  script.defer = true;
  document.head.append(script);
}
