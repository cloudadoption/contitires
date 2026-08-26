# json2html configuration

The 46 product pages under `/tires/<slug>` are rendered at request time by
[`helix-json2html`](https://json2html.adobeaem.workers.dev), a generic Cloudflare Worker that reads
the `catalog` sheet and a Mustache template and answers with markup. It sits in front of DA as a
BYOM (Bring Your Own Markup) *content overlay*, the same role a hand-authored DA document would
otherwise play for those 46 paths.

Both pieces of configuration that make this work are **not in this repo**. One lives in the AEM
Config Service, the other in json2html's own Cloudflare KV store. Neither ever appears in a commit,
a diff or a pull request. This is the same situation `helix-query.yaml` was in before it was removed
from git — see [docs/index-config.md](index-config.md) for that precedent. This file exists so the
two configurations are written down somewhere, and has to be kept current when either changes.

## Configuration 1 — the site-level overlay

This is one field added to the site's existing Config Service document, which also holds `access`,
`sidekick`, `apiKeys` and anything else the site config carries. **Read it, splice in `content`,
and write the whole document back — never write a fragment.** A blind overwrite with only the
`content` block loses every other setting in the file.

```bash
# read the current document
curl https://admin.hlx.page/config/cloudadoption/sites/contitires.json

# write it back, unchanged except for the content block below
curl -X POST https://admin.hlx.page/config/cloudadoption/sites/contitires.json \
  -H 'content-type: application/json' \
  -H "x-auth-token: $CONTI_EDS_API_KEY" \
  --data '{
    "...": "...everything already in the document, unchanged...",
    "content": {
      "source": { "type": "markup", "url": "https://content.da.live/cloudadoption/contitires" },
      "overlay": {
        "url": "https://json2html.adobeaem.workers.dev/cloudadoption/contitires/main",
        "type": "markup"
      }
    }
  }'
```

`content.source` is the site's normal DA content source, already there before this change.
`content.overlay` is new: it tells `admin.hlx.page` there is a second markup source to check first.

### The lookup order, and why it is easy to get backwards

**This overlay is consulted on every preview request for the whole site, not just `/tires/*`.**
`admin.hlx.page` fetches the overlay URL first, for every path. Only when the overlay answers `404`
(or `401`/`403`) does it fall back to the primary DA source. There is no path scoping in this
document at all — the `overlay.url` here has no path segment beyond the branch, and it is fetched
for `/`, `/learn/anything`, `/tires/passenger`, everything.

That sounds too broad, and on its own it would be: an overlay that answered every request would
replace the whole site. It is safe here only because json2html's own configuration (below) narrows
what it actually answers to the 46 product paths and 404s on everything else, handing those
requests straight back to the fallback. Get *this* document wrong — absent entirely — and nothing
renders through json2html at all, no error, just the 46 product pages served as whatever DA
currently holds for them (their pre-migration content, or a 404 if that document was already
removed). Get *json2html's* document wrong — too broad, or missing the `path` filter it relies on —
and this document is where the blast radius would actually land, because this is the level with no
narrowing of its own.

## Configuration 2 — json2html's per-path mapping

This lives in json2html's own Cloudflare KV, keyed by `org/site/branch`. It is a JSON array of
mapping rules; this site needs exactly one entry.

```bash
# read it
curl -H "Authorization: token $CONTI_EDS_API_KEY" \
  https://json2html.adobeaem.workers.dev/config/cloudadoption/contitires/main

# write it
curl -X POST https://json2html.adobeaem.workers.dev/config/cloudadoption/contitires/main \
  -H "Authorization: token $CONTI_EDS_API_KEY" \
  -H 'content-type: application/json' \
  --data '[{
    "path": "/tires/",
    "endpoint": "https://main--contitires--cloudadoption.aem.live/products.json?sheet=catalog",
    "arrayKey": "data",
    "pathKey": "path",
    "template": "/templates/tire-product.html",
    "headers": { "Authorization": "token <CONTI_SITE_TOKEN value>" },
    "templateApiKey": "<CONTI_SITE_TOKEN value>"
  }]'
```

There is no separate credential to provision for this call. json2html validates whatever token is
sent by calling `admin.hlx.page/config/cloudadoption/sites/contitires.json` with it and checking for
a `200`, so any token that already works against the Config Service works here too.

### Why the coarse prefix `/tires/` is safe

`/tires/` as a bare prefix also matches the twelve facet/listing pages under `/tires/` (`all-season`,
`passenger`, `crossover`, and the rest) and the bare `/tires` index itself. None of those are meant
to come from json2html, and none of them do, because `path` here is only the route this mapping
rule claims — it is not itself the filter that decides which requests get an answer.

The real filter is `arrayKey`/`pathKey` against the `catalog` sheet's own `path` column. json2html
takes the incoming request path, looks it up inside the `data` array (`arrayKey: "data"`) by
matching each row's `path` field (`pathKey: "path"`), and only answers when it finds a row. The
`catalog` sheet has exactly 46 rows, one per real product, and a facet page's path — `/tires/passenger`,
for instance — is not one of them. json2html answers `404` for it, `admin.hlx.page`'s fallback rule
from configuration 1 takes over, and the request goes on to DA, where the facet page is served
exactly as it is today. The coarse prefix costs nothing because the sheet, not the prefix, is doing
the actual gatekeeping.

**One known exception:** the catalog row for `vancontact-as-ultra` carries `path:
"/vancontact-as-ultra"` — at the site root, with no `/tires/` prefix. It does not match this rule's
`path` claim at all, so json2html never sees a request for it under this mapping, and that one
product continues to be served from its existing DA document. This is a pre-existing quirk in the
catalog sheet's data, not a gap in this configuration to work around; it would take a change to the
sheet, not to json2html, to bring that product under the overlay.

### Why the site token appears twice

`headers.Authorization` and `templateApiKey` both carry the same `CONTI_SITE_TOKEN` value, and that
is not duplication to remove — they authenticate two different fetches json2html makes on its own
behalf:

- `headers.Authorization` is sent on the `endpoint` fetch, i.e. json2html's own request for
  `/products.json?sheet=catalog`. This site requires that token to read anything at all — an
  unauthenticated curl of any page here returns `401` — so json2html has to present it like any
  other client would.
- `templateApiKey` authenticates json2html's separate fetch of the Mustache template file
  (`/templates/tire-product.html`) and, if `useAEMMapping` is ever turned on for this mapping, its
  fetch of this site's own `/config.json`. This is documented behaviour in json2html's own
  configuration surface, not something particular to this site.

Both fetches happen to need the same credential because both are reading from the same
site, but they are two distinct requests failing for two distinct reasons if the value is missing:
drop `headers.Authorization` and the endpoint fetch 401s, so json2html has no data and 404s every
product page; drop `templateApiKey` and the template fetch 401s, so json2html has data but nothing
to render it into.

## What breaks if only one configuration exists

Both failure modes resolve to the same shape: `404` from the missing half, and `admin.hlx.page`'s
fallback rule sends the request on to DA. There is no 500 and no blank page in either direction.

- **Configuration 1 without configuration 2:** the site config names an overlay URL, but json2html's
  KV has no mapping rule for this org/site/branch, so it 404s on every path it is asked about,
  including `/tires/<slug>`. `admin.hlx.page` falls back to DA every time, and the 46 product pages
  are served as whatever DA currently holds for them — pre-migration content if it is still there,
  or DA's own 404 if it has already been removed.
- **Configuration 2 without configuration 1:** json2html has a correct mapping rule and would answer
  `/tires/<slug>` correctly if asked, but nothing ever asks it — `admin.hlx.page` has no overlay
  configured for this site at all, so every request, including `/tires/<slug>`, goes straight to DA
  and json2html is never consulted.

Either way, the failure is silent and falls back to the pre-migration behaviour; there is nothing
for a visitor to notice beyond stale or missing product content, which is what makes checking both
configurations explicitly, rather than assuming one implies the other, worth doing after any change.
