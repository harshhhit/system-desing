# Infra Owl (System Design Notes) — how the site is wired

Static HTML/CSS/JS, no build step. Every page pulls its shared parts (theme,
sidebar, top band, page heading, breadcrumb) from **three central files** so one
edit propagates everywhere.

## The single sources of truth

| What you want to change | Edit this file |
|---|---|
| Colours, fonts, spacing, component styles | `assets/site.css` |
| Sidebar sections, order, icons, links, PDF resources | `assets/sitemap.js` (`window.SITE_MAP`) |
| A page's `<title>`, `<h1>`, lead line, breadcrumb | `assets/pages.js` (`window.SITE_PAGES`) |
| Search, practice mode, backup, shortcuts, reading tools | `assets/site-extras.js` + `assets/site-extras.css` |

**Generated files — never hand-edit, the bake rewrites them from the pages:**

| File | Built by | Used for |
|---|---|---|
| `assets/revision-cards.js` | `scripts/build-revision-cards.js` | homepage revision cards |
| `assets/search-index.js` | `scripts/build-study-data.js` | Ctrl+K full-text search |
| `assets/practice-bank.js` | `scripts/build-study-data.js` | practice-mode questions |

`assets/site-header.js` reads `SITE_MAP` + `SITE_PAGES` at runtime and fills each
page in. `scripts/regen-sidebars.js` bakes the same output into the static HTML
(so it still works with JavaScript off). **Run the script after editing
`sitemap.js` or `pages.js` — and after editing any page's content, so the
generated files above stay current:**

```
node scripts/regen-sidebars.js            # apply
node scripts/regen-sidebars.js --dry-run  # preview a diff, write nothing
node scripts/regen-sidebars.js --check    # verify only; must print 0 error(s)
```

## Add a new page

### 1. Copy the template

```
cp docs/_TEMPLATE-page.html  docs/<section>/<your-page>.html
```

Paste your content into the marked block in the middle. Leave the sidebar
`<aside>`, the `data-breadcrumb` / `data-page-title` / `data-page-subtitle`
placeholders, and the three `<script>` tags alone — those are the central wiring.

Files whose name starts with `_` (like the template) are ignored by the regen
script.

### 2. Give the page an id

Near the top of `<head>`:

```html
<script>window.PAGE_CONFIG = { id: "my-page" };</script>
```

### 3. Add the page's text to `assets/pages.js`

```js
"my-page": {
  href: "section/my-page.html",     // relative to docs/
  section: "Front-End",             // middle segment of the breadcrumb
  title: "My Page Title",           // fills <title> and <h1>
  subtitle: "One-line lead. <a href=\"x.html\">links</a> / <strong>markup</strong> allowed."
},
```

`subtitle` is optional — if you omit it, also delete the
`<p ... data-page-subtitle>` line from the page.

### 4. Add it to the sidebar (only if it belongs there) — `assets/sitemap.js`

Inside the relevant section's `"pages": [ … ]`:

```js
{ "href": "section/my-page.html", "title": "My Page" }
```

### 5. Bake the static copies

```
node scripts/regen-sidebars.js
```

Your new page now has: the full sidebar with itself marked **active**, the
`<title>` / `<h1>` / breadcrumb from `pages.js`, the shared top band, and the
theme — with nothing hand-copied. The same run adds the page to the search
index and the practice bank; commit those generated files together with the page.

## Relative paths / depth

The template targets a page **one folder deep**
(`docs/<folder>/page.html`), so its prefixes are `../`. Deeper or
shallower, update these five spots to match:

| Depth | ACCESS GATE `login.html` | `src=` / `href=` prefix | `data-root` |
|---|---|---|---|
| `docs/page.html` | `../login.html` | `assets/…` | `""` |
| `docs/a/page.html` (template) | `../../login.html` | `../assets/…` | `"../"` |
| `docs/a/b/page.html` | `../../../login.html` | `../../assets/…` | `"../../"` |

All paths are relative, so the site also works when deployed under a subpath.

## Special hooks (optional, for index / overview pages)

| Attribute | Filled with |
|---|---|
| `<div data-topic-grid>` | one card per `SITE_MAP` section |
| `<div data-topic-grid="flat">` | a single card listing every page |
| `<div data-resource-list>` | the PDF/zip `resources` from every section |
| `<b data-stat-topics>` / `<b data-stat-pages>` | section count / page count |
| `<ul data-section-pages>` | the sibling pages of the current page's section (auto-updates as you add pages) |

The grid / resource-list / section-pages hooks need a sentinel comment right
after their closing tag so the regen script can find them, e.g.
`</ul><!--/section-pages-->`.

## Interactive extras (`assets/site-extras.js`)

One additive layer on top of every page — injected by `site-header.js` on `docs/`
pages, loaded by its own `<script>` tag on the repo-root homepage (which also has
the `#studyHub` "Your study desk" mount). Nothing in it changes page text; with
the file missing, every page reads exactly as before.

| Feature | How the reader reaches it | What feeds it |
|---|---|---|
| Full-text search | `Ctrl/Cmd+K`, 🔍 in the top band | `assets/search-index.js` |
| Practice mode (Missed / Shaky / Got it, spaced repetition) | `q`, 🎯 in the top band, homepage card | Interview Answer block + `.sd-qa` bank → `assets/practice-bank.js` |
| Backup / restore of all saved state | homepage "Your data" card, search palette | every `localStorage` key except the `unlocked` login flag |
| Text size, focus mode | `Aa` in the top band, `f` | — |
| Shortcuts | `?` lists them (`j`/`k` parts, `]`/`[` pages, `m` covered) | — |
| Copy button | every `<pre>` | — |
| Row filter / in-place scrolling | tables with 6+ rows / tables wider than the column | — |
| Step walk-through | every `<ol class="sd-steps">` with 3+ steps | — |
| Expand, zoom, pan | Mermaid diagrams, content images | — |
| Hover definitions | dotted-underlined terms | a `Term \| Meaning` table on the page |
| Reading progress, "~n min read", resume prompt, streak | automatic | per-viewer `localStorage` |

Rules when touching it:

- **Additive only.** It may wrap or decorate existing nodes, but never changes,
  removes or permanently hides page text. Mark everything it injects with
  `data-sd-ui` (the Listen bar, notes and outline skip those nodes).
- **Never add its UI to a page by hand** — no per-page `<script>` tag, button,
  search box or filter. Pages only supply the plain markup in the table above.
- New per-viewer state uses a `localStorage` key starting with `sdnotes_`
  (the backup exports every key automatically, so nothing else is needed).
- After changing `site-extras.js` or `site-extras.css`, bump `EXTRAS_VERSION`
  in `site-header.js` **and** the `?v=` on the homepage's `site-extras.js` tag.
  After changing `site-header.js` or `site.css`, bump their `?v=` on every page.

## Conventions

- Theme is light only. `login.html` and `hash-tool.html` are never gated.
- Don't hand-edit a baked `<nav>`, a `data-*` region, or the index card grid —
  re-run the script instead.
