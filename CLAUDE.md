# Project instructions

Static HTML/CSS/JS knowledge-base site (no framework, no build step), hosted on
GitHub Pages. Two sub-sites: `eat-that-elephant-1/` (System Design Notes) and
`eat-that-elephant-2/` (Authentication Notes). A repo-root `index.html` links to both.

## Golden rules (follow on every change)

1. **All pages share one format.** Every content page in `eat-that-elephant-1/`
   uses the same shell: `<head>` → access-gate block → `<meta charset>` order,
   `assets/site.css`, `assets/sitemap.js` + `assets/site-header.js`, then a
   `.sidebar` aside + `.sd-study-main` (or legacy `main`) content area. When you
   add or edit a page, match this structure.

2. **Add info, never delete it.** You may add explanations, sections, links, or
   pages whenever it helps. Do not remove or shorten existing content, notes, or
   links. Reorganising is fine as long as nothing is lost (leave a redirect stub
   at any old path — see below).

3. **Every page sits behind the same login / session.** Each page carries the
   `<!-- ACCESS GATE -->` block in `<head>` (noindex meta + a blocking redirect to
   `login.html` unless `sessionStorage.unlocked` or `localStorage.unlocked` === "1",
   + a `<noscript>` refresh fallback). Any new page must get this block, with the
   `login.html` path relative to that page's depth. Never gate `login.html` itself
   or `hash-tool.html`.

## Conventions

- **All CSS lives in `assets/site.css`** (one copy per sub-site). It has three
  layers: design tokens + base element rules (global), the verbose two-column
  note layout scoped under `.layout`, and the `.sd-study-*` learning-path shell.
  Pages must **not** carry a big inline `<style>` — only a small page-specific
  `<style>` for one-off rules is allowed. When you need a new shared rule, add it
  to `site.css`.

- **Theme is light only.** Every page has `<meta name="color-scheme" content="light">`
  in `<head>`. No dark mode: every `@media (prefers-color-scheme: dark)` block is
  disabled with `and (min-width: 99999px)`. If you must add a dark media query,
  disable it the same way. `login.html` is a bespoke light split-screen design
  (its left photo panel keeps a dark image overlay — that's the photo, not a theme).

- **Sidebar is generated from `eat-that-elephant-1/assets/sitemap.js`.**
  `site-header.js` rebuilds `.sidebar > nav` from `SITE_MAP` at runtime; the static
  `<nav>` in each page is a pre-rendered copy of the same output. **After editing
  `sitemap.js`, run `node scripts/regen-sidebars.js`** to refresh every page's
  static `<nav>` (idempotent; safe to run anytime). Section order, icons, titles
  and the `active` link all come from `SITE_MAP`. Keep the homepage cards in
  `eat-that-elephant-1/index.html` and the hero page count in sync too.

- **New page checklist:** copy an existing page of the same template, fix the
  `<root>` relative prefix (gate redirect, `site.css`, `sitemap.js`,
  `site-header.js data-root`), add the entry to `sitemap.js`, run
  `scripts/regen-sidebars.js`, update the homepage card + count.

- **Moving/renaming a page:** create the new file, then leave a tiny
  meta-refresh + `location.replace` redirect stub at the old path pointing to the
  new one (examples under `eat-that-elephant-1/05-database/data-base/`). Update
  `sitemap.js`, the homepage card, and re-run the sidebar regeneration.

- **`login.html` config:** `USERNAME` is `harshhhit` (plain text, case-sensitive,
  trimmed). `PASSWORD_HASH` is the lowercase SHA-256 hex of the password (generate
  with `hash-tool.html`; no trailing newline). "Remember me" → `localStorage`,
  otherwise `sessionStorage`. `robots.txt` disallows the whole site.

- **Do not rewrite `eat-that-elephant-1/01-front-end/graphql/http/Front end basics
    for system design .html`** — it is a saved external reference page (a Claude web
  snapshot with its own `_files/` assets). It may be gated and linked, and its
  `<html data-mode>` may be set to `light`, but its body content is kept as-is.

- Temp/junk files are covered by the repo-root `.gitignore`.
