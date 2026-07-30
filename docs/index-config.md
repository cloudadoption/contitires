# Index configuration

The query index definition is **not in this repo**. It is held by the AEM Config
Service. `helix-query.yaml` was deliberately removed from git, so there is one
source of truth rather than two that drift.

```bash
# read it
curl -H "Authorization: token $ADMIN_KEY" \
  https://admin.hlx.page/config/cloudadoption/sites/contitires/content/query.yaml

# write it
curl -X POST -H 'content-type: text/yaml' -H "x-auth-token: $ADMIN_KEY" \
  --data-binary @query.yaml \
  https://admin.hlx.page/config/cloudadoption/sites/contitires/content/query.yaml
```

This file exists because **a Config Service change is unversioned**. It appears in
no commit, no diff and no pull request. Without a note like this one, the repo
records neither that a field was added nor what it selects. Keep it current when
the definition changes.

## The `learn` index

Indexes `/learn/**`, excluding the hub itself and `/learn/product-highlights`.
Its rows drive the `article-cards` block.

| property | source | what it is |
| --- | --- | --- |
| `title`, `image`, `description`, `robots` | `head` meta tags | the usual page metadata |
| `lastModified` | response header | sort key when no weight is set |
| `category` | `meta[name="category"]` | which LISTING an article belongs to: News, Tire Tips, Technology |
| `weight` | `meta[name="weight"]` | its position in live's listing, ascending |
| `subcategory` | `meta[name="subcategory"]` | which PILL it takes inside the news listing: News, Corporate, or empty |
| `excerpt` | `main > div > p:nth-of-type(-n+3), main > div > ul > li:nth-of-type(-n+2)` | the card's own text |

### Why `category` and `subcategory` are separate

They are two axes. The tabs on `/learn/news-and-events` pick the listing; the
pills under them pick a term inside it. Folding both into one field makes an
empty value mean two things at once: "in this listing under no pill" and "in no
listing". The unfiltered view then has to be computed as a union or an
exclusion, and both readings are wrong. The unfiltered view is the listing with
no term asked for. An article with no term shows there and under neither pill.
Live has 8 of them.

### Why `excerpt` is separate from `description`

Live's card has its own excerpt, which is not the meta description. On 18
articles the description is a bare dateline such as `Fort Mill, S.C.`. Live's
meta description is cut the same way, so the descriptions are correct and are
left alone. The card reads `excerpt` instead.

The selector was chosen by measurement over the 145 articles live shows a teaser
for. Taking paragraphs alone reproduces live on 58. Adding list items reaches 97,
because an imported standfirst is a `ul > li`. Dropping the leading media block
and taking both reaches 141. It is bounded to five elements, which scores the
same as the unbounded form while keeping the row small.

`article-cards` truncates it per surface: 150 characters on a listing card and 95
on the teaser `/events` uses, which is where live cuts the same text.
