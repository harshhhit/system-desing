---
description: Add source content as a new page in eat-that-elephant-1/2, following the repo's README.md + CLAUDE.md procedure exactly, without dropping a single line.
argument-hint: [source: pasted text, or a file path to read] [sub-site: e1/e2] [section] [slug]
---

You are adding **$ARGUMENTS** as a new page to this knowledge-base site. Follow the
procedure below exactly — it is the documented process from
`eat-that-elephant-1/README.md` (identical for `eat-that-elephant-2/`, per the
root `CLAUDE.md`). Do not improvise a different structure.

## 0. Read before writing

- Re-read `CLAUDE.md` (root), `eat-that-elephant-1/CLAUDE.md` (or `-2/`), and
  `eat-that-elephant-1/README.md` (or `-2/`) before touching any file — the
  detailed depth/path table and the section-name list live there.
- If the source is a file path, `Read` the **entire** file — do not summarize
  or skip a "for large files" excerpt. If it's a large HTML export (e.g. a
  chat-tool snapshot with a huge `<head>`), the real content is almost always
  a small pasted block, not the boilerplate — read enough of the file to find
  where the actual authored content starts and ends, then use all of it.
- If the sub-site, section, or slug isn't given in $ARGUMENTS, infer the most
  sensible one from existing `assets/sitemap.js` sections and ask only if
  genuinely ambiguous.

## 1. Zero content loss — this is the hard requirement

The project's golden rule is **"Add info, never delete it."** When converting
the source into HTML:

- Preserve every sentence, list item, table row, code block, and caveat from
  the source. Reformatting (markdown → semantic HTML) is fine; shortening,
  merging, or dropping "less important" parts is not.
- If the source has N headings/sections, the page must have N corresponding
  sections. Before finishing, re-diff your HTML against the source section by
  section and confirm nothing was silently trimmed.
- Convert to plain semantic HTML only: `h2`/`h3`, `p`, `ul`/`ol`, `table`,
  `<pre><code>` for code/HTTP/JSON blocks, `<strong>`/`<em>`/`<code>` inline.
  No framework classes, no inline `<style>` beyond what the template already
  allows for one-off rules.
- Content starts at `<h2>` — the page's own `<h1>` is injected from
  `pages.js`, don't duplicate it in the pasted block.

## 2. Copy the template

```
cp eat-that-elephant-1/_TEMPLATE-page.html eat-that-elephant-1/<section-folder>/<slug>.html
```

(swap `eat-that-elephant-1` for `-2` per $ARGUMENTS).

**Immediately strip every instructional HTML comment the template carries**
(the `HOW TO USE THIS TEMPLATE` block and the `▼ THE ONLY LINE...` comment
above `PAGE_CONFIG`). Leave only the live tags. This is not cosmetic — one of
those comments contains the literal text `<title>` inside it, and
`scripts/regen-sidebars.js` locates the real `<title>` with a comment-blind
regex (`/<title>[\s\S]*?<\/title>/i`). If the instructional comment survives,
the script's replace starts at the fake `<title>` inside the comment and eats
everything up to the real `</title>` — silently deleting the `<meta
color-scheme>`, `<meta viewport>`, and the `<link rel="stylesheet">` in
between, and leaving an unclosed comment. The page then renders with zero CSS
and no visible error. **Every real content page in this repo has already had
these comments removed — match that, don't leave them in.**

After stripping, the `<head>` should look like this (adjust the path depth
per the table below):

```html
<script>window.PAGE_CONFIG = { id: "<slug>" };</script>
<meta name="color-scheme" content="light">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><Page Title> · System Design Notes</title>
<link rel="stylesheet" href="<depth-prefix>assets/site.css?v=4">
```

## 3. Fix paths for depth

The template is wired for one folder deep (`eat-that-elephant-1/<folder>/page.html`,
prefix `../`). If the target is deeper or shallower, fix **all** of:
the ACCESS GATE `location.replace(...)` + `<noscript>` refresh path to
`login.html`, the `site.css` href, the three `<script src>` values, and
`data-root="..."` on `site-header.js` — per this table (see README.md
"Relative paths / depth" for the authoritative version):

| File depth | `login.html` path | asset prefix | `data-root` |
|---|---|---|---|
| `eat-that-elephant-1/page.html` | `../login.html` | `assets/…` | `""` |
| `eat-that-elephant-1/a/page.html` | `../../login.html` | `../assets/…` | `"../"` |
| `eat-that-elephant-1/a/b/page.html` | `../../../login.html` | `../../assets/…` | `"../../"` |
| `eat-that-elephant-1/a/b/c/page.html` | `../../../../login.html` | `../../../assets/…` | `"../../../"` |

## 4. Paste content

Fill the `<h2>`/etc. content into the `═══ PAGE CONTENT ═══` block only. Leave
the sidebar `<aside>` empty (`<nav></nav>`) and the `data-breadcrumb` /
`data-page-title` / `data-page-subtitle` placeholders as-is — those are filled
by the shared scripts, not hand-written. Delete the `data-page-subtitle` line
if you don't add a `subtitle` in `pages.js` (step 5).

## 5. Register in `assets/pages.js`

```js
"<slug>": {
  href: "<section-folder>/<slug>.html",
  section: "<exact section name from sitemap.js — see CLAUDE.md's list>",
  title: "<Page Title>",
  subtitle: "<optional one-liner, inline HTML allowed>"
},
```

**Use a raw `&` in `title`/`subtitle` text, never `&amp;`.** The regen script
HTML-escapes these values itself (`esc()` in `regen-sidebars.js`) — writing
`&amp;` here produces double-escaped `&amp;amp;` in the baked output.

## 6. Place it in the section's study path — `assets/sitemap.js`

Don't just append the new entry to the end of the section's `"pages": […]` array.
Read every existing page in that section (`href` + `title`) and work out where this
page's topic actually falls in the learning sequence, then insert it there:

```js
{ "href": "<section-folder>/<slug>.html", "title": "<stage-number>. <short sidebar label>" }
```

Follow the stage-number convention already used by `Database` and `Front-End`
(full rule in `eat-that-elephant-1/CLAUDE.md`, "Sidebar ordering"):

- A bare number (`00.`, `01.`, `02.`, …) = a new main topic / stage.
- A number + letter (`01a.`, `01b.`, …) = a direct sub-topic or deep dive of the
  numbered page immediately before it (next new deep dive of `01.` after `01a.`
  exists becomes `01b.`).
- The number lives **only** in this `sitemap.js` label — never in `pages.js`'s
  `title` (keep that clean, e.g. `"SQL and Relational Fundamentals"` not
  `"01a. SQL and Relational Fundamentals"`), never in the filename or
  `PAGE_CONFIG.id`.
- If inserting this page pushes later pages' numbers up (what was `02.` must
  become `03.`, etc.), renumber those existing `sitemap.js` labels in the same
  edit so numbers stay sequential with no gaps or collisions — text only, don't
  touch their files/ids.
- **Exception:** if the section has no numbering yet (built before this
  convention existed), just append the new page as before — don't retrofit
  numbers onto a whole section as a side effect of adding one page. Only
  number-and-place when the section is already numbered.

## 7. Bake and verify — do not skip

```
node scripts/regen-sidebars.js
node scripts/regen-sidebars.js --check
node scripts/regen-sidebars.js
```

- `--check` must exit with `0 error(s), 0 warning(s)`.
- The final plain run must report `updated 0` — confirms baking is idempotent
  and nothing is still drifting.
- Read back the baked `<head>` of the new file and confirm `<meta
  color-scheme>`, `<meta viewport>`, `<title>`, and `<link rel="stylesheet">`
  are all present and intact (this is the exact failure mode from step 2 —
  confirm it didn't happen).

## 8. Report

Tell the user the new page path, its section, where you placed it in the study
sequence (and its stage number, plus any existing labels you had to renumber),
and confirm the content was carried over in full (list the section headings you
preserved) — don't just say "done."
