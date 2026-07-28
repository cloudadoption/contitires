// add delayed functionality here

// A widget embeds a third party, and third-party code belongs in this phase
// rather than in the one that decorated the block. Three pages carry a widget;
// on the other 317 this costs one query. Issue #109.
if (document.querySelector('.widget[data-source]')) {
  import('../blocks/widget/widget.js').then(({ loadWidgetScripts }) => loadWidgetScripts());
}
