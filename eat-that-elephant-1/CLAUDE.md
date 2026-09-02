# Claude instructions — adding & verifying pages (both sub-sites + root)

Applies to **`eat-that-elephant-1/`** and **`eat-that-elephant-2/`** (same mechanism,
separate `assets/` copies) and the repo-root `index.html`. `eat-that-elephant-2/CLAUDE.md`
lists that sub-site's specifics; the procedure below is identical for both.

Static site, no build. Shared UI (theme, sidebar, page `<title>`/`<h1>`, breadcrumb)
comes from three files per sub-site — **edit these, never hand-copy their output into pages:**

- `assets/site.css` — theme (colours, fonts, components)
- `assets/sitemap.js` → `window.SITE_MAP` — sidebar sections, order, icons, links, PDF resources
- `assets/pages.js` → `window.SITE_PAGES` — per-page `<title>`, `<h1>`, lead line, breadcrumb

`assets/site-header.js` applies them at runtime; `scripts/regen-sidebars.js` bakes them
into the static HTML. Full detail is in `README.md` — **don't re-derive the flow, follow
the checklist below.**

---

## When the user shares content for a NEW page — do all of this, don't ask

1. **Copy the template:**
   `cp eat-that-elephant-1/_TEMPLATE-page.html eat-that-elephant-1/<folder>/<slug>.html`
   Default = one folder deep, which is what the template is wired for (`data-root="../"`,
   gate `../../login.html`, `../assets/…`). At another depth, fix those four spots
   (see the table in `README.md`).

2. **Fill the new file:**
   - set `window.PAGE_CONFIG = { id: "<slug>" };` in `<head>`
   - convert the shared content to plain semantic HTML (`h2`/`h3`/`p`/`ul`/`ol`/`table`) —
     match the existing pages' style, **no framework classes**, keep every bit of content
   - paste it into the `═══ PAGE CONTENT ═══` block only
   - if there's no lead sentence, delete the `<p ... data-page-subtitle>` line

3. **Add to `assets/pages.js`:**
   ```js
   "<slug>": {
     href: "<folder>/<slug>.html",
     section: "<exact section name, see list below>",
     title: "<full H1 text>",
     subtitle: "<optional one-liner, inline HTML allowed>"
   },
   ```

4. **Add to the sidebar** (only if it belongs there) — the right section's `pages` array
   in `assets/sitemap.js`:
   ```js
   { "href": "<folder>/<slug>.html", "title": "<short sidebar label>" }
   ```

5. **Bake:** `node scripts/regen-sidebars.js`
   (writes the nav, `<title>`, `<h1>`, breadcrumb, index grids, `data-section-pages`
   lists into every affected page)

6. **Verify — do not skip:** `node scripts/regen-sidebars.js --check`
   Must exit `0` with `0 error(s)`. It checks, across both sub-sites + root:
   - every `sitemap.js` / `pages.js` `href` points to a file that exists
   - every `sitemap.js` page has a `pages.js` entry (warns if not)
   - every page's `window.PAGE_CONFIG.id` exists in `pages.js` and matches its key
   - every page listed in `pages.js` actually carries that `PAGE_CONFIG`
   - `pages.js` `section` values are real sitemap section names; `title` non-empty
   - the baked HTML is not stale (would `regen` change it? → error)
   - the ACCESS GATE block is present (redirect stubs exempt); `login.html` /
     `hash-tool.html` are **not** gated
   Then run plain `regen` once more → it must say `updated 0` (idempotent).

That's it — the new page now has the full sidebar with itself marked `active`, the
heading/breadcrumb from `pages.js`, the top band and the theme, with nothing hand-copied.
Every other page's sidebar picks up the new link in the same run.

## Before finishing ANY change to this site

Run `node scripts/regen-sidebars.js --check`. If it reports errors, fix them (or tell
the user exactly what's inconsistent) before considering the task done.

---

## When the user changes shared data

- Edited `sitemap.js` or `pages.js` → **always** `node scripts/regen-sidebars.js` after.
- Never hand-edit a baked `<nav>`, any `data-*` region, or the index card grid — re-run
  the script instead.
- Files whose name starts with `_` (e.g. `_TEMPLATE-page.html`) are skipped by the
  script — don't touch the template.
- `--dry-run` shows a diff and writes nothing.

## Section names — use one of these verbatim for `section` / the sitemap section

`Front-End` · `Database` · `Distributed Systems` · `Distributed Database` ·
`Messaging & Queues` · `Storage` · `Web Servers` · `Dev Principles` ·
`Planning & Roadmap` · `Project Walkthroughs` · `Miscellaneous`

To create a NEW section: add `{ "icon": "…", "name": "…", "pages": [ … ] }` to
`SITE_MAP.sections` in `sitemap.js`, then regen.

## Progress tracking — every page has a coverage tracker at the top

`site-header.js` injects a sticky **coverage bar** at the top of *every* page that is
listed in `SITE_MAP` (no per-page markup needed): a **"Mark covered"** toggle, the
current section's `done/total` with a progress meter, and the site-wide `done/total`.
Covered pages also get a green ✓ in the sidebar. State is per-viewer in
`localStorage` (`sdnotes_covered_<siteId>`).

**So: a new page gets its coverage tracker automatically the moment it's in `sitemap.js`
+ `pages.js` and `regen` has run — do not hand-add a tracker to a page.** If it isn't
showing, the page is missing its `pages.js` / `sitemap.js` entry (the `--check` step
catches that).

For **multi-part learning / roadmap pages** that also need *within-page* progress
(per stage / per topic), add checkboxes `<input type="checkbox" data-stage="N">` on the
section headings plus the small inline progress script — copy it from
`01-front-end/frontend-roadmap.html` (keeps its own `localStorage` key). This is on top
of the site-wide "page covered" bar, not a replacement.

## Read-aloud — every information page has a "Listen" bar at the top

`site-header.js` also injects a sticky **read-aloud bar** directly under the coverage
tracker on every page that has a real content container (`.sd-study-main`, `main`,
`.layout`, or `article` with meaningful text). It gives a play / pause / resume button,
a Stop button, an `n / total` progress readout, a **voice picker** (English voices ranked
best-first, default = the nicest "Natural" / "Online" / "Google" voice the browser exposes,
saved under `sdnotes_tts_voice`) and a **speed selector** (0.75×–1.75×, saved under
`sdnotes_tts_rate`). It's free — the Web Speech API speaks with voices already on the
viewer's device. It walks the content block-by-block (`h1`–`h6`, `p`, `li`, `blockquote`,
`pre`, `tr`, …), speaks each block, and highlights + scrolls to the block being read
(`.sd-tts-active`). The breadcrumb trail is skipped.

**It is fully automatic** — no per-page markup. A new page gets the Listen bar the moment
it uses the standard shell (`#site-header-root` mount, the three central scripts, and a
`.sd-study-main` / `main` content area with the pasted page content). Do **not** hand-add
a read-aloud control to a page. It safely renders nothing when the browser lacks
`speechSynthesis` or the page has no content container (e.g. an index/overview page).
Styling is in `assets/site.css` (`.sd-readaloud`, `.sd-tts-btn`, `.sd-tts-stop`,
`.sd-tts-rate`, `.sd-tts-voice`, `.sd-tts-status`, `.sd-tts-active`).

## Optional hooks for index / overview pages

`data-topic-grid` (one card per section) · `data-topic-grid="flat"` (one card, all pages) ·
`data-resource-list` (all PDF/zip resources) · `data-stat-topics` / `data-stat-pages`
(counts) · `data-section-pages` (sibling pages of this page's section, auto-updating).
The grid / resource-list / section-pages hooks need a sentinel comment right after the
close tag, e.g. `</ul><!--/section-pages-->`.
