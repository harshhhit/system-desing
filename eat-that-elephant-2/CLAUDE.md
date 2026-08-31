# Claude instructions — eat-that-elephant-2/ (Authentication Notes)

Same centralized system as `eat-that-elephant-1/`. **Full procedure + the verify step
are in `eat-that-elephant-1/CLAUDE.md`** — follow it, using this sub-site's `assets/`
copies (`eat-that-elephant-2/assets/{site.css,sitemap.js,pages.js,site-header.js}`) and
the numbers below.

## This sub-site's specifics

| | value |
|---|---|
| `siteId` | `e2` |
| Home page | `Authentication Notes.html` (repo-relative `eat-that-elephant-2/Authentication Notes.html`) |
| Sidebar sections (`SITE_MAP.sections[].name`) | `Root`, `01-authentication`, `02-social-login` |
| Homepage topic grid | `<div data-topic-grid="flat">` — one card listing every page, not one card per section |
| Template | copy `eat-that-elephant-1/_TEMPLATE-page.html`, then repoint the three `<script src>`, `data-root`, `site.css` href and the ACCESS GATE `login.html` path at `eat-that-elephant-2/…` and the right depth |

Most e2 pages are one folder deep (`data-root="../"`, gate `../../login.html`); the two
top-level pages (`00-login-steps.html`, `Authentication Notes.html`) use `data-root=""`
and gate `../login.html`.

## Verify

`node scripts/regen-sidebars.js` then `node scripts/regen-sidebars.js --check` — the
check covers **both** sub-sites and the repo root in one run and must exit `0`.
