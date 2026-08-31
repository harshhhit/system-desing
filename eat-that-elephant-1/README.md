# System Design Notes — how the site is wired

Static HTML/CSS/JS, no build step. Every page pulls its shared parts (theme,
sidebar, top band, page heading, breadcrumb) from **three central files** so one
edit propagates everywhere.

## The single sources of truth

| What you want to change | Edit this file |
|---|---|
| Colours, fonts, spacing, component styles | `assets/site.css` |
| Sidebar sections, order, icons, links, PDF resources | `assets/sitemap.js` (`window.SITE_MAP`) |
| A page's `<title>`, `<h1>`, lead line, breadcrumb | `assets/pages.js` (`window.SITE_PAGES`) |

`assets/site-header.js` reads `SITE_MAP` + `SITE_PAGES` at runtime and fills each
page in. `scripts/regen-sidebars.js` bakes the same output into the static HTML
(so it still works with JavaScript off). **Run the script after editing
`sitemap.js` or `pages.js`:**

```
node scripts/regen-sidebars.js            # apply
node scripts/regen-sidebars.js --dry-run  # preview a diff, write nothing
```

## Add a new page

### 1. Copy the template

```
cp eat-that-elephant-1/_TEMPLATE-page.html  eat-that-elephant-1/<section>/<your-page>.html
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
  href: "section/my-page.html",     // relative to eat-that-elephant-1/
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
theme — with nothing hand-copied.

## Relative paths / depth

The template targets a page **one folder deep**
(`eat-that-elephant-1/<folder>/page.html`), so its prefixes are `../`. Deeper or
shallower, update these five spots to match:

| Depth | ACCESS GATE `login.html` | `src=` / `href=` prefix | `data-root` |
|---|---|---|---|
| `eat-that-elephant-1/page.html` | `../login.html` | `assets/…` | `""` |
| `eat-that-elephant-1/a/page.html` (template) | `../../login.html` | `../assets/…` | `"../"` |
| `eat-that-elephant-1/a/b/page.html` | `../../../login.html` | `../../assets/…` | `"../../"` |

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

## Conventions

- One `assets/` copy per sub-site (`eat-that-elephant-1/`, `eat-that-elephant-2/`)
  on purpose — either can be split into its own repo later.
- Theme is light only. `login.html` and `hash-tool.html` are never gated.
- Don't hand-edit a baked `<nav>`, a `data-*` region, or the index card grid —
  re-run the script instead.
