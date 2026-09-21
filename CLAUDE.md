# Project instructions

Static HTML/CSS/JS knowledge-base site (no framework, no build step), hosted on
GitHub Pages, branded **Infra Owl**. All content lives in one directory, `docs/`
(System Design, Kubernetes, Authentication, and everything else — merged from what
used to be two separate sub-sites, `eat-that-elephant-1/` and `eat-that-elephant-2/`;
that split name is gone, `docs/` is now the only content directory). The repo-root
`index.html` is the single homepage — a separate, hand-authored portal page (its own
inline CSS, not `docs/assets/site.css`) that links into every page under `docs/`. Two
tiny redirect stubs remain at the old sub-site homepage paths (`docs/index.html` and
`eat-that-elephant-2/Authentication Notes.html`) so old bookmarks still land somewhere.

## Golden rules (follow on every change)

1. **All pages share one format.** Every content page in `docs/`
   uses the same shell: access-gate block → `<script>window.PAGE_CONFIG={id}</script>`
   → `<meta charset>` etc., `assets/site.css`, then
   `assets/sitemap.js` + `assets/pages.js` + `assets/site-header.js`, then a
   `.sidebar` aside + `.sd-study-main` (or legacy `main`) content area with
   `data-breadcrumb` / `data-page-title` / `data-page-subtitle` placeholders.
   Start from `docs/_TEMPLATE-page.html`.

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

- **Explain concepts the way AWS documentation does.** When writing or rewriting page
  content, follow AWS's explanation pattern (this is about the writing, not the CSS):
  - **Define first, mechanics second.** State plainly what the thing is and the
    problem it solves *before* describing how it works internally.
  - **Say why it exists.** Every concept should be motivated — what breaks or gets
    harder without it — not just described in isolation.
  - **Walk cause → effect explicitly.** When explaining a mechanism ("what happens
    when X changes"), spell out the chain of consequences step by step instead of
    stating only the end result.
  - **Ground the abstract in a concrete example** immediately after introducing a
    general concept — prefer this repo's real setup (an actual ConfigMap key, an
    actual header name) over a generic placeholder.
  - **Name the distinction when two things are easily confused** ("X vs. Y — the
    difference is …") instead of describing them separately and leaving the reader
    to infer the contrast.
  - **State limits, gotchas, and "this does NOT mean…" caveats plainly**, right next
    to the claim they qualify, rather than burying them in a separate section.
  - **Introduce a term once, define it in one sentence, then reuse that exact term** —
    never silently switch to a synonym for a concept already named.

- **Give each page's core concept an "Interview Answer" block.** Right after the page's
  intro/subtitle (before the deep-dive sections), add a section titled
  `Interview Answer — What is <the concept>?` in this exact three-part shape:
  1. A full explanatory answer (2–4 paragraphs) — the concept, why it exists, and how it
     fits into the surrounding system, following the AWS-doc-style rules above.
  2. A **"Simple interview version"** — one quoted paragraph a candidate could say out
     loud, condensed to the essentials, in a `<div class="sd-study-note">` note box with
     a `<span class="sd-note-title">Simple interview version</span>` title.
  3. **"One important interview follow-up"** — a Q&A pair naming the single most common
     gotcha or misconception about the concept (e.g. "does X store the full history?",
     "is Y actually encrypted?"), with the answer fully written out — never leave the
     answer blank or as a placeholder.
  This block is a companion to the page's existing deep-dive sections, not a
  replacement — cross-reference the fuller section further down the page (an anchor
  link is fine) rather than duplicating it. See `docs/kubernetes/02-etcd.html`'s
  "Interview Answer — What Is etcd?" section for a worked example.

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

- **Shared UI is generated from three central files:**
  `docs/assets/sitemap.js` (`SITE_MAP` — sidebar), `docs/assets/pages.js` (`SITE_PAGES` —
  each page's `<title>`/`<h1>`/lead line/breadcrumb), `docs/assets/site.css` (theme).
  `site-header.js` applies them at runtime; **`node scripts/regen-sidebars.js`** bakes
  them into the static HTML under `docs/` — the `<nav>`, the `data-page-*` regions, and
  `data-section-pages` lists are all pre-rendered copies. The repo-root `index.html`
  homepage is separate and hand-maintained (not baked by this script); when you add or
  move a `docs/` page, also update its matching link(s) there.
  **Run the script after ANY edit to `sitemap.js` or `pages.js`** (idempotent; safe
  anytime; `--dry-run` previews). Never hand-edit a baked `<nav>`, a `data-*` region,
  or the homepage cards — re-run the script. Files named `_*` (e.g.
  `docs/_TEMPLATE-page.html`) are skipped by the script.

- **New page / moving a page:** follow `docs/CLAUDE.md` (procedure) and `docs/README.md`
  (detail). In short: copy `_TEMPLATE-page.html`, set `window.PAGE_CONFIG = { id }`, add
  matching entries to `pages.js` and (for the sidebar) `sitemap.js`, run
  `scripts/regen-sidebars.js`. When moving, also leave a meta-refresh +
  `location.replace` redirect stub at the old path (examples under
  `docs/05-database/data-base/`).

- **Every page has a coverage tracker at the top.** `site-header.js` injects a sticky
  bar on every page in `SITE_MAP`: a "Mark covered" toggle, section + site-wide
  `done/total` progress, and a green ✓ on covered links in the sidebar (state per-viewer
  in `localStorage`). It's automatic — never hand-add a tracker to a page; just ensure
  the page has its `sitemap.js` + `pages.js` entries. Finer *within-page* progress
  (per stage/topic) uses `data-stage` checkboxes + a small inline script — copy it from
  `docs/01-front-end/frontend-roadmap.html`.

- **Every information page has a "Listen" (read-aloud) bar at the top.** `site-header.js`
  injects a sticky bar under the coverage tracker on any page whose content container
  (`.sd-study-main` / `main` / `.layout` / `article`) holds real text: a play/pause/resume
  button, a Stop button, an `n / total` progress readout, a voice picker (English voices
  best-first, defaulting to the nicest "Natural"/"Online" voice the browser exposes) and a
  speed selector (0.75×–1.75×) — both remembered per-viewer in `localStorage`. It's free:
  the Web Speech API uses voices already on the viewer's device. It reads the content
  block-by-block via the browser's Web Speech API, highlighting and scrolling to the
  block being spoken. It's automatic and degrades to nothing when the browser has no
  `speechSynthesis` or the page has no content container (e.g. the homepage) — **never
  hand-add it to a page**; a new page gets it for free just by using the standard shell
  (`#site-header-root` + the three central scripts + a `.sd-study-main`/`main` content
  area). Styling lives in `assets/site.css` under `.sd-readaloud` / `.sd-tts-*`.

- **Verify before finishing any change to the notes site:**
  `node scripts/regen-sidebars.js --check` — one run covers `docs/` and the
  repo root. It flags missing/renamed files referenced by `sitemap.js` / `pages.js`,
  `PAGE_CONFIG` ids with no `pages.js` entry (or a mismatched key), pages listed in
  `pages.js` that lack the `PAGE_CONFIG`, stale baked HTML, and pages missing the
  ACCESS GATE. Must exit `0`; fix anything it reports, or tell the user what's
  inconsistent.

- **`login.html` config:** `USERNAME` is `harshhhit` (plain text, case-sensitive,
  trimmed). `PASSWORD_HASH` is the lowercase SHA-256 hex of the password (generate
  with `hash-tool.html`; no trailing newline). "Remember me" → `localStorage`,
  otherwise `sessionStorage`. `robots.txt` disallows the whole site.

- **Do not rewrite `docs/01-front-end/graphql/http/Front end basics
    for system design .html`** — it is a saved external reference page (a Claude web
  snapshot with its own `_files/` assets). It may be gated and linked, and its
  `<html data-mode>` may be set to `light`, but its body content is kept as-is.

- Temp/junk files are covered by the repo-root `.gitignore`.
