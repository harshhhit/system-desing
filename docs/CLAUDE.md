# Claude instructions — adding & verifying pages (docs/ + root)

Applies to **`docs/`** (the single content site — System Design + Kubernetes +
Authentication notes) and the repo-root `index.html` (a separate, hand-maintained
portal page that links into `docs/`; it is not baked by `regen-sidebars.js`).

Static site, no build. Shared UI (theme, sidebar, page `<title>`/`<h1>`, breadcrumb)
comes from three files — **edit these, never hand-copy their output into pages:**

- `assets/site.css` — theme (colours, fonts, components)
- `assets/sitemap.js` → `window.SITE_MAP` — sidebar sections, order, icons, links, PDF resources
- `assets/pages.js` → `window.SITE_PAGES` — per-page `<title>`, `<h1>`, lead line, breadcrumb

`assets/site-header.js` applies them at runtime; `scripts/regen-sidebars.js` bakes them
into the static HTML. Full detail is in `README.md` — **don't re-derive the flow, follow
the checklist below.**

---

## When the user shares content for a NEW page — do all of this, don't ask

1. **Copy the template:**
   `cp docs/_TEMPLATE-page.html docs/<folder>/<slug>.html`
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
   Must exit `0` with `0 error(s)`. It checks, across `docs/` + root:
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

`Kubernetes` · `Authentication` · `Front-End` · `Database` · `Distributed Systems` ·
`Distributed Database` · `Messaging & Queues` · `Storage` · `Caching & CDN` ·
`Traffic Management` · `Networking` · `Observability, Security & Ops` · `Web Servers` ·
`Dev Principles` · `Planning & Roadmap` · `Project Walkthroughs` · `Miscellaneous`

`Authentication` (`docs/authentication/`) holds login/session, OAuth/social-login,
and password-hashing notes — folded in from a former separate sub-site. Its pages
sit up to two folders deep (`authentication/01-authentication/…`,
`authentication/02-social-login/…`), so use the matching depth-2 gate/asset paths
from the table below when adding to it.

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
(counts) · `data-section-pages` (sibling pages of this page's section, auto-updating) ·
`data-weekly-target` (this week's random reading-target widget — picks
`WEEKLY_TARGET_COUNT` uncovered pages fresh every Monday and counts down to Sunday;
see "Weekly reading target" below — its mount moved to the root homepage, not a
page inside `docs/`, since `docs/index.html` is now a redirect stub).
The grid / resource-list / section-pages hooks need a sentinel comment right after the
close tag, e.g. `</ul><!--/section-pages-->`. `data-weekly-target` needs no sentinel —
it's pure runtime state, never baked by `regen-sidebars.js`.

## Weekly reading target — random weekly picks, Monday to Sunday

`site-header.js` injects a **"This week's reading target"** card into any page with a
`<div data-weekly-target></div>` mount. Every Monday (viewer-local time) it randomly
picks `WEEKLY_TARGET_COUNT` (3) pages — preferring ones not yet marked covered — as
that week's target, and shows a countdown to Sunday plus a progress meter. Checking an
item off in the widget marks that page covered **site-wide** (it writes the same
`sdnotes_covered_<siteId>` key the coverage tracker uses), so the widget, the sidebar ✓
marks and the per-page "Mark covered" toggle always agree. State lives in `localStorage`
(`sdnotes_weekly_<siteId>`), per-viewer, and is purely additive — no server, no build
step. If the week rolls over with items unfinished, they're simply dropped and a fresh
random batch is picked (no carry-over, by design — see `site-header.js`'s `pickWeek()`).
To add this widget to a page inside `docs/`, just add the `data-weekly-target` mount
`<div>`; nothing else is needed.

**Its current home is the repo-root `index.html`, not a page inside `docs/`.** Root
doesn't load the shared `docs/assets/site-header.js` pipeline (it's a separate,
hand-authored portal page with its own sidebar/grid — loading site-header.js there
would clobber root's custom nav and brand via `renderSidebar()`). Instead, root loads
just `docs/assets/sitemap.js` (data only, no DOM mutation) and carries its own small
inline `<script>` — a line-for-line port of this same `pickWeek()` /
`renderWeeklyTarget()` logic, scoped to `[data-weekly-target]` — plus a copy of the
`.sd-weekly*` CSS adapted to root's own token names. It intentionally uses `map.siteId`
("docs") for both `sdnotes_weekly_docs` and `sdnotes_covered_docs`, so checking a page
off on the homepage marks it covered on the real page too, and vice versa. If you ever
change `pickWeek()`/`renderWeeklyTarget()` here, mirror the edit in root's `index.html`
copy — they're independent code, not a shared file.

## Inline notes — a "🗒️+" marker on every paragraph and list item

`site-header.js` also injects a small **"🗒️+" marker** next to every `<p>` inside the
content container (`.sd-study-main` / `main` / `.layout` / `article`, the same container
read-aloud uses), and next to any `<li>` substantial enough to be its own sentence — a
paragraph is the base unit, not every line, so short one-word/one-phrase list items (e.g.
`Pods`, `kubectl`) are skipped (`LI_MIN_LEN` in `renderNotes()`, currently 40 chars).
Clicking a marker opens a textarea; saving pins an amber note card (with Edit/Delete)
right after that block — **anywhere on the page, not just the bottom.**
State lives in `localStorage` (`sdnotes_notes_<siteId>`), per-viewer only — there is no
server, so a note exists only in the browser it was written in. A note is keyed by the
page's href plus a hash of its block's own text (`hashStr`), with a `#2`, `#3`… suffix
when identical text repeats on the page — **not** the block's position — so it stays
attached to the right block even as content is added or removed elsewhere on the page.
Notes saved under the older `<index>|<hash>` key are migrated automatically the first
time their page is opened. Editing the exact wording of that specific block will orphan
its note (rare, and not destructive — the old entry just stops rendering).

**It is fully automatic — no per-page markup**, exactly like the coverage tracker and
read-aloud bar. `renderNotes()` runs after `renderReadAloud()` specifically so its
markers/cards are never picked up as text for the "Listen" feature to speak.

## Sticky header strip + mobile menu — automatic, never hand-add

The brand band (`#site-header-root`) scrolls away; the coverage tracker and Listen bar
live in a `.sd-sticky` strip that `site-header.js` inserts right *after* the mount so it
stays pinned while reading. Its height is published as the CSS variable `--sd-sticky-h`;
anything else that sticks to the top (sidebars, `.sd-progress`, anchor jumps via
`scroll-padding-top`) offsets by it — do the same for any new sticky element.
Below 860px the `.sd-study-sidebar` becomes an off-canvas drawer opened by a floating
"☰ Menu" button (`renderNavDrawer()`); legacy `.layout` pages keep their own top-bar ☰.
When you change `site.css` or `site-header.js`, bump the `?v=` query on both across
`docs/` so browsers don't mix a new stylesheet with a cached script.

## Sidebar search, "On this page", previous / next — automatic, never hand-add

- **Search** (`renderNavSearch()`): a box above the sidebar `<nav>` filters links by
  page title plus section / group name (every typed word must match). Enter opens the
  first match, Esc clears, `/` focuses it from anywhere. It sits outside the baked
  `<nav>`, so `regen-sidebars.js` never touches it.
- **On this page** (`renderToc()`): built from the content's `<h2>`s when there are 3 or
  more. ≥1400px → sticky right-hand rail with the current section highlighted; narrower →
  a collapsed box right after the lead line. `<h2>`s without an `id` get a slug id at
  runtime; existing ids are never changed. Give an `<h2>` a stable `id` if you want to
  link to it from other pages.
- **Previous / Next** (`renderPager()`): two cards at the end of the content (before a
  legacy `.page-footer`), following the sidebar's reading order across sections — so
  page order in `sitemap.js` (and its `groups`) is also the "Next" order.
- Injected UI carries `data-sd-ui`; the Listen bar and note markers skip anything
  inside it. Mark any new injected widget the same way.
