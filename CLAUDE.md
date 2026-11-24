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

- **Give each page's core concept an "Interview Answer" block.** On legacy pages, put it
  right after the page's intro/subtitle (before the deep-dive sections); on lesson-layout
  pages (`.sd-lesson`, see next rule) it opens the **Interview Preparation** part instead
  (the older five-stage lessons: the **Review** part), after the production sections. Either way, add a section titled
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

- **Structure every content page as one topic in 12 standard parts, not a Q&A list**
  (`<main class="sd-study-main sd-lesson">`; skeleton + rules in `docs/_TEMPLATE-page.html`,
  worked example `docs/web-servers/server.html`). Tag every `<h2>` with `data-stage=` one of,
  in this order: **Overview** (what / why / when + `.sd-learn` "What you'll learn") →
  **Core Concepts** (mental model, terminology table, "X vs. Y") → **Architecture** (components,
  diagram) → **How It Works** (lifecycle, diagram + `<ol class="sd-steps">`) → **Implementation**
  (config / commands / code, each followed by what its important lines do) → **Production**
  (real topology, low scale vs. high scale, trade-offs, observability signals) → **Security** →
  **Performance & Scalability** (bottleneck → symptom → lever) → **Troubleshooting** (failure
  table *Symptom → Possible cause → Detect → Debug → Fix → Prevent* + a debugging workflow with
  real commands) → **Best Practices** (Do / Avoid, each with its reason) → **Interview
  Preparation** (Interview Answer block + question bank) → **Summary** ("What Should I Remember?"
  `.sd-takeaways`, optional `<ul class="sd-commands">` quick commands, `.sd-next`).
  `site-header.js` numbers the parts (01–12, the same number on every page), builds the left
  outline and mobile part chips from them, and labels each heading ("04 · How It Works").
  **Leave out a part the topic genuinely doesn't need** — never an empty heading, never invented
  facts to fill a part. Inside the parts follow the memory pattern WHY → WHAT → HOW → FLOW →
  EXAMPLE → PRODUCTION → FAILURE → FIX → INTERVIEW. Rules when converting an existing page:
  map every old block to its new part first (old → new), merge overlapping sections into one
  authoritative explanation and link to its `#id` elsewhere (never explain a concept twice —
  but theory, config, failure and interview views of the same thing are different purposes, not
  duplicates); turn Q&A headings into concept headings and move the questions into the
  question bank; place diagrams right after the theory they illustrate; keep every fact
  (rule 2), and check by diffing the old page's text against the new one. Add an insight
  callout roughly every ~10 lines of substantial content, where it helps, and never as a recap:
  `<aside class="sd-callout important|mistake|think|production|interview">` with a
  `<p class="sd-callout-title">💡 Important</p>` (⚠️ Common mistake / 🧠 Think about it /
  🔥 Production insight / 🎯 Interview tip) first line. If a diagram would clearly help but
  doesn't exist, add a `sd-callout diagram` "🗺️ Diagram recommended" note. `--check` errors on
  a `.sd-lesson` page that loses any of the required blocks or uses an unknown `data-stage` /
  `data-level`. The older five-stage lesson labels (Start here / Foundations / How it works /
  In production / Review — `kubernetes/01-kube-apiserver.html`) still validate but render
  unnumbered; convert them when the page is next touched. Pages not yet converted keep working
  unchanged.

- **Interview question bank** (Interview Preparation part): `<section class="sd-interview">`
  holding `<details class="sd-qa" data-level="basic|intermediate|advanced|scenario"><summary>
  Question</summary> answer…</details>`. Prefer questions that test understanding ("why does X
  use…", "what happens internally when…", "what would you check if…", "what changes at
  scale…") over "what is X?"; answers concise but complete. Scenario questions describe a
  production symptom. The study panel moves them out of the page into its Interview tab and
  leaves a pointer; the long-form Interview Answer block stays in the page.

- **Every content page has a study panel** (`site-header.js` → `renderStudyPanel`): a right-hand
  column on desktop (≥ 1280px), below the content on narrower screens, with tabs **Interview**
  (the page's `.sd-qa` bank by level; on pages without one, questions harvested from the
  Interview Answer block, its follow-up, "Quick check" items, 🎯 callouts and "…?" headings),
  **Notes** (per-page scratchpad + the pinned 🗒️ section notes — one per `<h3>`, see `docs/CLAUDE.md` — downloadable as .md), **Reminders**
  (per-page checklist: optional `data-reminders="a|b|c"` on `<main>` + generic suggestions +
  your own), **Review** (anything flagged with the "＋ Review" button on each `<h2>` or question,
  listed site-wide), and **Commands** (CLI lines and short diagnostic SQL found in `<pre>` blocks,
  plus any `.sd-commands` list). State is per-viewer `localStorage`. It's automatic — **never
  hand-add it**; the page outline that used to be the right rail now sits at the top of the
  left sidebar.

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

- **Homepage revision cards** (`index.html` → "Revision cards") read
  `docs/assets/revision-cards.js`, which is **generated** by
  `scripts/build-revision-cards.js`: one short paragraph per sitemap page (the
  "Simple interview version" note if the page has one, else its `pages.js` subtitle,
  else the body paragraph that best stands alone — chat filler like "Got it 👍", dangling
  "These …" openers, "…:" lead-ins and heading-like fragments are skipped or repaired).
  `regen-sidebars.js` rebuilds it on every run and
  `--check` fails if it's stale, so never hand-edit it — improving a page's Interview
  Answer block is the best way to improve its card. The homepage's topic cards are
  grouped into five categories (Infrastructure & Ops / Data & Distributed Systems /
  Application & Code / Planning & Projects / Books); when you add a new `SITE_MAP` section,
  add it to the `CATEGORY` and `ACCENT` maps in `index.html`'s inline script and put
  its card in the matching `.cat-group`.

- **New page / moving a page:** follow `docs/CLAUDE.md` (procedure) and `docs/README.md`
  (detail). In short: copy `_TEMPLATE-page.html`, set `window.PAGE_CONFIG = { id }`, add
  matching entries to `pages.js` and (for the sidebar) `sitemap.js`, run
  `scripts/regen-sidebars.js` — which also rebuilds the generated
  `revision-cards.js`, `search-index.js` and `practice-bank.js`; commit them with the
  page. Write the page with the interactive hooks (a `Term | Meaning` table,
  `<ol class="sd-steps">`, `.sd-qa` bank, stable heading `id`s — table in
  `.claude/commands/add-page.md`) and never hand-add the extras' UI. When moving, also leave a meta-refresh +
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

- **Interactive study extras are one additive layer: `docs/assets/site-extras.js` +
  `docs/assets/site-extras.css`.** `site-header.js` injects the script on every `docs/` page
  (no per-page tag — **never hand-add it**); the repo-root `index.html` loads it with its own
  `<script>` tag and gives it the `#studyHub` mount ("Your study desk": continue reading, study
  streak + 12-week activity map, practice, backup / restore). Its CSS lives in its own sheet —
  the one exception to "all CSS in `site.css`" — because the homepage does not load `site.css`.
  What it adds: **Ctrl/Cmd+K full-text search** (jumps to the matching heading and marks the
  term), **practice mode** (self-graded *Missed / Shaky / Got it* cards with spaced repetition,
  drawn from every page's Interview Answer block and `.sd-qa` bank), **backup / restore** of all
  per-viewer `localStorage` state to one JSON file (import merges and can be undone; the
  `unlocked` login flag never travels), top-band buttons (Search · Practice · `Aa` text size and
  focus mode · `?`), keyboard shortcuts (`j`/`k` parts, `]`/`[` pages, `m` covered, `q` practice,
  `f` focus, `?` help), a reading-progress bar, "~n min read", a resume-where-you-left-off toast,
  a Copy button on every `<pre>`, a filter box above every table with 6+ rows, in-place
  scrolling for tables wider than the text column, a step-by-step walk-through on every
  `<ol class="sd-steps">`, expand / zoom / pan for Mermaid diagrams and images, hover
  definitions for terms from a page's `Term | Meaning` table, and a small celebration when a
  page is marked covered. **It must stay additive:** it may wrap or decorate existing nodes but
  never changes, removes or permanently hides page text (rule 2) — everything it injects
  carries `data-sd-ui`, and with the file missing every page reads exactly as before. Its two
  data files, `docs/assets/search-index.js` and `docs/assets/practice-bank.js`, are
  **generated** by `scripts/build-study-data.js` (run by `regen-sidebars.js`; `--check` fails
  if they are stale) — never hand-edit them; edit the page and re-run the script. When you
  change `site-extras.js` / `.css`, bump `EXTRAS_VERSION` in `site-header.js` and the `?v=` on
  the homepage's script tag.

- **Adding or changing an interactive feature — follow this every time:**
  1. **Where it goes.** Behaviour → `docs/assets/site-extras.js`; its styles →
     `docs/assets/site-extras.css` (`.sx-` prefix, every colour with a fallback, light theme
     only, `prefers-reduced-motion` respected, hidden in `@media print`). Do **not** add
     feature code to individual pages, and do not add a per-page `<script>` / `<link>` for it.
     The shell features that already live in `site-header.js` (tracker, Listen bar, notes,
     outline, study panel, pager) stay there.
  2. **Additive only (rule 2).** A feature may wrap or decorate existing nodes; it must never
     change, remove or permanently hide page text. Anything it injects carries `data-sd-ui`,
     so read-aloud, notes, the outline and the study panel ignore it. A filter or a
     walk-through may dim or hide rows temporarily, but clearing it must show everything again.
  3. **Content stays in the pages.** If a feature needs data from the pages (like search and
     practice do), generate it in `scripts/build-study-data.js` and hook it into
     `regen-sidebars.js` with a `--check` staleness test — never hand-maintain a second copy
     of page text.
  4. **State.** Per-viewer state goes in `localStorage` under a key starting with `sdnotes_`.
     The backup exports every key automatically; import must keep merging (never replace)
     and must never write the `unlocked` login flag.
  5. **Keyboard.** Register a new shortcut in the `keydown` handler **and** in the `openHelp()`
     list; never fire shortcuts while the user is typing; leave `/` (sidebar filter) and the
     existing keys as they are.
  6. **Both entry points.** `site-extras.js` runs on `docs/` pages and on the repo-root
     homepage (`#studyHub`); check a change on both, at desktop and phone width.
  7. **Versions.** Bump `EXTRAS_VERSION` in `site-header.js` and the `?v=` on the homepage's
     `site-extras.js` tag; if `site-header.js` or `site.css` changed, bump their `?v=` on
     every page under `docs/` (and in `docs/_TEMPLATE-page.html`).
  8. **Prove nothing was lost.** `git diff` on the content pages must show only `?v=` lines;
     `node scripts/regen-sidebars.js --check` must exit `0`; and in a browser the content
     text of a page (ignoring `[data-sd-ui]`) must be identical with the extras on and off,
     with no console errors.
  9. **Document it.** Add the feature to the extras bullet above, to the "Interactive
     extras" sections of `docs/CLAUDE.md` and `docs/README.md`, and — if authors need to
     write markup for it — to the hook table in `.claude/commands/add-page.md`.

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
