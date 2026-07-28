import { loadCSS } from '../../scripts/aem.js';

/**
 * Parses a widget href into folder path and name.
 * @param {string} pathname URL pathname (e.g. `/widgets/path1/name.html`)
 * @returns {{ widgetPath: string, widgetName: string }}
 */
function parseWidgetHref(pathname) {
  const pathSegments = pathname.split('/').filter((p) => p);
  const widgetName = pathSegments[pathSegments.length - 1].split('.')[0];
  const widgetPath = pathSegments.slice(1, -1).join('/');
  return { widgetPath, widgetName };
}

/**
 * Builds a widget asset URL.
 * @param {string} widgetPath Folder path under `/widgets/`
 * @param {string} widgetName Widget file name without extension
 * @param {string} extension File extension (`html`, `css`, `js`)
 */
function widgetUrl(widgetPath, widgetName, extension) {
  const prefix = widgetPath ? `${widgetPath}/` : '';
  return `${window.hlx.codeBasePath}/widgets/${prefix}${widgetName}.${extension}`;
}

/**
 * Applies widget metadata, block classes, and section shell classes.
 * Must run before widget HTML/JS load so decorate can read config from the DOM.
 * @param {Element} widget The widget block element
 * @param {HTMLAnchorElement} source The authored widget link
 * @param {string} widgetName Widget file name without extension
 * @param {URLSearchParams} searchParams Query params from the widget href
 */
function applyWidgetShell(widget, source, widgetName, searchParams) {
  widget.classList.add(widgetName);
  widget.classList.remove('block');
  widget.dataset.source = source.href;
  searchParams.forEach((value, key) => {
    widget.dataset[key] = value;
  });

  const wrapper = widget.closest('.widget-wrapper');
  if (wrapper) {
    wrapper.classList.add(`${widgetName}-wrapper`);
    wrapper.classList.remove('widget-wrapper');
  }
  const container = widget.closest('.widget-container');
  if (container) {
    container.classList.add(`${widgetName}-container`);
    container.classList.remove('widget-container');
  }
}

/**
 * @param {string} widgetPath Folder path under `/widgets/`
 * @param {string} widgetName Widget file name without extension
 * @param {Error} error What went wrong
 */
function reportFailure(widgetPath, widgetName, error) {
  // eslint-disable-next-line no-console
  console.error(`failed to load widget ${widgetPath}/${widgetName}`, error);
}

/**
 * Runs one widget's own script. `data-source` is what names the module.
 * @param {Element} widget The widget block element
 */
export async function loadWidgetScript(widget) {
  const { widgetPath, widgetName } = parseWidgetHref(new URL(widget.dataset.source).pathname);
  try {
    const mod = await import(widgetUrl(widgetPath, widgetName, 'js'));
    if (mod.default) await mod.default(widget);
  } catch (error) {
    reportFailure(widgetPath, widgetName, error);
  }
}

// a viewport of lead, so a widget below the fold fills before a reader reaches it
const NEAR = '100% 0px';

/**
 * Waits for each widget on the page to come near the viewport, then loads its
 * own script. A widget's script is third-party, so it waits for the page to
 * finish loading first: an embed that goes out during the eager phase competes
 * with what LCP is made of. Decoration has already put the shell and the
 * stylesheet in place, so the widget fills a box rather than opening one.
 * @param {Element} scope Where to look for widgets
 */
export function initWidgetScripts(scope = document) {
  const widgets = [...scope.querySelectorAll('.widget[data-source]')];
  if (!widgets.length) return;

  const watch = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        observer.unobserve(entry.target);
        loadWidgetScript(entry.target);
      });
    }, { rootMargin: NEAR });
    widgets.forEach((widget) => observer.observe(widget));
  };

  if (document.readyState === 'complete') watch();
  else window.addEventListener('load', watch, { once: true });
}

/**
 * Loads and decorates a widget block: its shell, its markup and its stylesheet.
 * Those are what hold the room a widget's content will take, so they load with
 * the block. The script that fills it follows once the page has loaded and the
 * widget is near the viewport, which is `initWidgetScripts`.
 * @param {Element} widget The widget block element
 */
export default async function decorate(widget) {
  const source = widget.querySelector('a[href]');
  const { pathname, searchParams } = new URL(source.href);
  const { widgetPath, widgetName } = parseWidgetHref(pathname);

  try {
    applyWidgetShell(widget, source, widgetName, searchParams);

    const resp = await fetch(widgetUrl(widgetPath, widgetName, 'html'));
    widget.innerHTML = await resp.text();

    await loadCSS(widgetUrl(widgetPath, widgetName, 'css'));
  } catch (error) {
    reportFailure(widgetPath, widgetName, error);
  }
}
