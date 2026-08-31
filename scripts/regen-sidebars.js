#!/usr/bin/env node
/*
 * Regenerate the *baked* copy of everything the shared runtime (assets/site-header.js)
 * would otherwise inject, so the on-disk HTML matches the rendered page even with
 * JavaScript disabled (no flash, no divergence):
 *
 *   - the <nav> inside every .sidebar               (from assets/sitemap.js)
 *   - <title>, <h1 data-page-title>, the lead line
 *     (<p data-page-subtitle>) and the breadcrumb    (from assets/pages.js)
 *   - a <script>window.PAGE_CONFIG={id:"…"}</script> and the assets/pages.js
 *     <script> tag, inserted into any page that is missing them
 *
 * Runs over BOTH sub-sites. Idempotent — safe to run anytime.
 * Run it after ANY edit to a sub-site's assets/sitemap.js or assets/pages.js.
 *
 *   node scripts/regen-sidebars.js            # apply
 *   node scripts/regen-sidebars.js --dry-run  # show a diff, write nothing
 *   node scripts/regen-sidebars.js --check    # verify only: missing files,
 *                                             # bad/mismatched ids, stale bakes,
 *                                             # missing gate. Exit 1 on error.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DRY = process.argv.includes("--dry-run") || process.argv.includes("-n");
const CHECK = process.argv.includes("--check");
const REPO = path.join(__dirname, "..");

const ERRORS = [];
const WARNINGS = [];
const err = m => ERRORS.push(m);
const warn = m => WARNINGS.push(m);

const SITES = [
  { id: "e1", dir: path.join(REPO, "eat-that-elephant-1") },
  { id: "e2", dir: path.join(REPO, "eat-that-elephant-2") },
];

const esc = s => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const encHref = h => encodeURI(h).replace(/#/g, "%23");

function loadSite(dir) {
  // fresh globals per sub-site so the two maps don't bleed into each other
  global.window = {};
  const jsonesque = p => { delete require.cache[require.resolve(p)]; require(p); };
  jsonesque(path.join(dir, "assets", "sitemap.js"));
  const MAP = global.window.SITE_MAP;
  let PAGES = {};
  const pagesPath = path.join(dir, "assets", "pages.js");
  if (fs.existsSync(pagesPath)) { jsonesque(pagesPath); PAGES = global.window.SITE_PAGES || {}; }
  // href (decoded, posix) -> { id, ...entry }
  const byHref = {};
  for (const id of Object.keys(PAGES)) {
    const e = PAGES[id];
    byHref[decodeURIComponent(e.href)] = Object.assign({ id }, e);
  }
  return { MAP, PAGES, byHref };
}

function buildNav(relPath, MAP) {
  const dir = path.posix.dirname(relPath);
  const root = "../".repeat(relPath.split("/").length - 1);
  let h = "";
  for (const sec of MAP.sections) {
    h += `<h3>${sec.icon ? sec.icon + " " : ""}${esc(sec.name)}</h3><ul>`;
    for (const p of sec.pages) {
      const target = path.posix.normalize(path.posix.join(dir, root + p.href));
      const active = target === relPath ? ` class="active"` : "";
      h += `<li><a${active} href="${root}${p.href}">${esc(p.title)}</a></li>`;
    }
    for (const r of sec.resources || []) {
      h += `<li><a class="resource" href="${root}${r.href}" target="_blank" rel="noopener">📎 ${esc(r.title)}</a></li>`;
    }
    h += `</ul>`;
  }
  return "<nav>" + h + "</nav>";
}

const NAV_RE = /<nav\b[^>]*>[\s\S]*?<\/nav>/;

/* add one attribute to a tag's existing attribute string if not already present */
function withAttr(attrStr, attr) {
  return new RegExp("(^|\\s)" + attr + "(\\s|=|$)").test(attrStr || "")
    ? (attrStr || "")
    : (attrStr || "") + " " + attr;
}

function bakePageMeta(t, rel, entry, MAP) {
  const root = "../".repeat(rel.split("/").length - 1);
  const notes = [];

  // 1. window.PAGE_CONFIG inline script
  if (!/window\.PAGE_CONFIG/.test(t)) {
    const tag = `\n<script>window.PAGE_CONFIG = { id: ${JSON.stringify(entry.id)} };</script>`;
    if (/<!--\s*\/ACCESS GATE\s*-->/.test(t)) {
      t = t.replace(/(<!--\s*\/ACCESS GATE\s*-->)/, `$1${tag}`);
    } else {
      t = t.replace(/(<meta charset=[^>]*>)/i, `$1${tag}`);
    }
  }

  // 2. assets/pages.js <script>, right before the site-header.js tag
  if (!/assets\/pages\.js/.test(t)) {
    t = t.replace(
      /(<script\s+src="([^"]*?)assets\/site-header\.js"[^>]*><\/script>)/,
      (m, tag, pfx) => `<script src="${pfx}assets/pages.js"></script>${tag}`
    );
  }

  // 3. <title>
  if (/<title>[\s\S]*?<\/title>/i.test(t)) {
    t = t.replace(/<title>[\s\S]*?<\/title>/i,
      `<title>${esc(entry.title)} · ${esc(MAP.siteName)}</title>`);
  }

  // 4. first <h1> -> data-page-title + baked text
  if (/<h1(\s[^>]*)?>[\s\S]*?<\/h1>/i.test(t)) {
    let done = false;
    t = t.replace(/<h1(\s[^>]*?)?>([\s\S]*?)<\/h1>/i, (m, attrs) => {
      if (done) return m;
      done = true;
      return `<h1${withAttr(attrs, "data-page-title")}>${esc(entry.title)}</h1>`;
    });
  } else {
    notes.push("no <h1>");
  }

  // 5. first breadcrumb paragraph -> data-breadcrumb + baked trail
  const crumbRe = /<p class="((?:sd-study-)?breadcrumb)"([^>]*?)>[\s\S]*?<\/p>/i;
  if (crumbRe.test(t)) {
    const trail =
      `<a href="${root}${encHref(MAP.home || "index.html")}">Home</a> / ` +
      `${esc(entry.section)} / ${esc(entry.title)}`;
    let done = false;
    t = t.replace(crumbRe, (m, cls, attrs) => {
      if (done) return m; done = true;
      return `<p class="${cls}"${withAttr(attrs, "data-breadcrumb")}>${trail}</p>`;
    });
  } else {
    notes.push("no breadcrumb");
  }

  // 6. lead line -> data-page-subtitle (only when the entry defines one)
  if (entry.subtitle != null) {
    const leadRe = /<p class="(sd-study-prompt|lede)"([^>]*?)>[\s\S]*?<\/p>/i;
    if (leadRe.test(t)) {
      let done = false;
      t = t.replace(leadRe, (m, cls, attrs) => {
        if (done) return m; done = true;
        return `<p class="${cls}"${withAttr(attrs, "data-page-subtitle")}>${entry.subtitle}</p>`;
      });
    } else {
      notes.push("has subtitle in pages.js but no .sd-study-prompt/.lede lead <p>");
    }
  }

  return { t, notes };
}

/* ---- index pages: bake [data-topic-grid] / [data-resource-list] / stat counts
   from the sub-site map, matching assets/site-header.js renderTopicGrid(). ---- */
function cardHtml(section, i) {
  let li = "";
  for (const p of section.pages) li += `<li><a href="${p.href}">${esc(p.title)}</a></li>`;
  const n = section.pages.length;
  return `\n    <article class="sd-card" style="--accent:var(--sd-c${(i % 11) + 1})">` +
    `\n      <div class="sd-icon">${section.icon || "📄"}</div>` +
    `\n      <h2>${esc(section.name)}</h2>` +
    `\n      <span class="sd-count">${n} ${n === 1 ? "page" : "pages"}</span>` +
    `\n      <ul>${li}</ul>\n    </article>\n`;
}
function flatCardHtml(MAP) {
  let li = "", n = 0;
  for (const s of MAP.sections) for (const p of s.pages) { n++; li += `<li><a href="${p.href}">${esc(p.title)}</a></li>`; }
  const name = (MAP.siteName || "Notes").replace(/ Notes$/, "");
  return `\n<div class="sd-card" style="--accent:var(--sd-auth)">` +
    `\n  <div class="sd-icon">${MAP.siteIcon || "📄"}</div>` +
    `\n  <h2>${esc(name)}</h2>` +
    `\n  <span class="sd-count">${n} ${n === 1 ? "page" : "pages"}</span>` +
    `\n  <ul>${li}</ul>\n</div>\n`;
}
function bakeIndexShell(t, MAP) {
  const gridRe = /(<div\b[^>]*\bdata-topic-grid\b[^>]*>)[\s\S]*?(<\/div><!--\/topic-grid-->)/i;
  const m = gridRe.exec(t);
  if (!m) return t;
  const flat = /data-topic-grid\s*=\s*["']?flat/i.test(m[1]);
  let pageCount = 0;
  MAP.sections.forEach(s => pageCount += s.pages.length);
  const inner = flat
    ? flatCardHtml(MAP)
    : "\n" + MAP.sections.map((s, i) => cardHtml(s, i)).join("") + "\n  ";
  t = t.replace(gridRe, (_all, open, close) => open + inner + close);

  const resRe = /(<div\b[^>]*\bdata-resource-list\b[^>]*>)[\s\S]*?(<\/div><!--\/resource-list-->)/i;
  if (resRe.test(t)) {
    let chips = "";
    MAP.sections.forEach(s => (s.resources || []).forEach(r => {
      chips += `\n    <a href="${r.href}" target="_blank" rel="noopener">📎 ${esc(r.title)}</a>`;
    }));
    t = t.replace(resRe, (_all, open, close) => open + chips + "\n  " + close);
  }

  t = t.replace(/(<[a-z0-9]+\b[^>]*\bdata-stat-topics\b[^>]*>)[\s\S]*?(<\/[a-z0-9]+>)/i,
    (_a, o, c) => o + MAP.sections.length + c);
  t = t.replace(/(<[a-z0-9]+\b[^>]*\bdata-stat-pages\b[^>]*>)[\s\S]*?(<\/[a-z0-9]+>)/i,
    (_a, o, c) => o + pageCount + c);
  return t;
}

/* ---- section-index pages: bake <ul data-section-pages> with the sibling pages
   of THIS page's SITE_MAP section, matching renderSectionPages(). ---- */
function bakeSectionPages(t, rel, MAP) {
  const re = /(<ul\b[^>]*\bdata-section-pages\b[^>]*>)[\s\S]*?(<\/ul><!--\/section-pages-->)/i;
  if (!re.test(t)) return t;
  const section = MAP.sections.find(s => s.pages.some(p => decodeURIComponent(p.href) === rel));
  if (!section) return t;
  const root = "../".repeat(rel.split("/").length - 1);
  let li = "";
  for (const p of section.pages) {
    if (decodeURIComponent(p.href) === rel) continue;
    li += `\n        <li><a href="${root}${p.href}">${esc(p.title)}</a></li>`;
  }
  return t.replace(re, (_all, open, close) => open + li + "\n      " + close);
}

let updated = 0, unchanged = 0, noSidebar = 0, missingNav = 0, metaBaked = 0, indexBaked = 0;
const skips = [];

for (const site of SITES) {
  if (!fs.existsSync(site.dir)) continue;
  const { MAP, PAGES, byHref } = loadSite(site.dir);

  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== "_files" && e.name !== "assets") walk(p, out); }
      // skip templates / scratch pages: anything whose name starts with "_"
      else if (e.name.endsWith(".html") && !e.name.startsWith("_")) out.push(p);
    }
    return out;
  };

  // ---- data-level verification (sitemap.js <-> pages.js <-> files on disk) ----
  if (CHECK) {
    const sectionNames = new Set(MAP.sections.map(s => s.name));
    for (const sec of MAP.sections) {
      for (const p of sec.pages) {
        const rel = decodeURIComponent(p.href);
        if (!fs.existsSync(path.join(site.dir, rel)))
          err(`${site.id} sitemap.js: file missing for "${p.title}" -> ${p.href}`);
        if (!byHref[rel])
          warn(`${site.id} sitemap.js: "${p.href}" has no pages.js entry (its <title>/<h1>/breadcrumb won't be centralized)`);
      }
      for (const r of sec.resources || []) {
        if (!fs.existsSync(path.join(site.dir, decodeURIComponent(r.href))))
          err(`${site.id} sitemap.js: resource missing -> ${r.href}`);
      }
    }
    for (const id of Object.keys(PAGES)) {
      const e = PAGES[id];
      if (!e.href) { err(`${site.id} pages.js "${id}": no href`); continue; }
      if (!fs.existsSync(path.join(site.dir, decodeURIComponent(e.href))))
        err(`${site.id} pages.js "${id}": file missing -> ${e.href}`);
      if (!e.title) err(`${site.id} pages.js "${id}": empty title`);
      if (e.section && !sectionNames.has(e.section))
        warn(`${site.id} pages.js "${id}": section "${e.section}" is not a sitemap section name`);
    }
  }

  for (const abs of walk(site.dir)) {
    const orig = fs.readFileSync(abs, "utf8");
    let t = orig;
    const rel = path.relative(site.dir, abs).split(path.sep).join("/");

    if (/class="sidebar/.test(t)) {
      if (NAV_RE.test(t)) t = t.replace(NAV_RE, () => buildNav(rel, MAP));
      else { console.log("!! .sidebar but no <nav>:", site.id, rel); missingNav++; }
    } else {
      noSidebar++;
    }

    const entry = byHref[rel];
    if (entry) {
      const r = bakePageMeta(t, rel, entry, MAP);
      t = r.t;
      if (r.notes.length) { skips.push(`   ${site.id}/${rel} — ${r.notes.join("; ")}`); }
    }

    if (/data-topic-grid\b/.test(t)) {
      const before = t;
      t = bakeIndexShell(t, MAP);
      if (t !== before) indexBaked++;
    }

    if (/data-section-pages\b/.test(t)) t = bakeSectionPages(t, rel, MAP);

    // ---- per-file verification ----
    if (CHECK) {
      const ref = `${site.id}/${rel}`;
      // redirect stubs (meta-refresh + location.replace, no sidebar) are exempt
      const isStub = /<meta http-equiv="refresh"/i.test(orig)
        && /location\.replace\(/.test(orig) && !/class="sidebar/.test(orig);
      if (isStub) continue;
      if (!/ACCESS GATE/.test(orig)) err(`${ref}: missing the ACCESS GATE block`);
      const pc = orig.match(/window\.PAGE_CONFIG\s*=\s*\{[^}]*id\s*:\s*["']([^"']+)["']/);
      if (pc && !PAGES[pc[1]])
        err(`${ref}: PAGE_CONFIG id "${pc[1]}" has no entry in pages.js`);
      if (entry) {
        if (!pc) warn(`${ref}: listed in pages.js as "${entry.id}" but the page has no window.PAGE_CONFIG`);
        else if (pc[1] !== entry.id) err(`${ref}: PAGE_CONFIG id "${pc[1]}" != pages.js key "${entry.id}"`);
        if (!/data-page-title/.test(t)) warn(`${ref}: no data-page-title element (heading won't be filled)`);
        if (!/data-breadcrumb/.test(t)) warn(`${ref}: no data-breadcrumb element`);
      }
      if (t !== orig) err(`${ref}: STALE baked output — run: node scripts/regen-sidebars.js`);
      if (t !== orig) updated++;
      continue;
    }

    if (t === orig) { unchanged++; continue; }
    if (entry) metaBaked++;

    if (DRY) {
      const tmp = abs + ".regen-preview";
      fs.writeFileSync(tmp, t);
      try {
        execFileSync("diff", ["-u", abs, tmp], { stdio: "inherit" });
      } catch (e) { /* diff exits 1 when files differ */ }
      fs.unlinkSync(tmp);
    } else {
      fs.writeFileSync(abs, t);
    }
    updated++;
  }
}

// ---- root-level checks + report ----
if (CHECK) {
  for (const f of ["index.html", "login.html", "hash-tool.html"]) {
    const p = path.join(REPO, f);
    if (!fs.existsSync(p)) { err(`root: ${f} is missing`); continue; }
    const s = fs.readFileSync(p, "utf8");
    if (f === "index.html" && !/ACCESS GATE/.test(s)) err(`root: index.html missing the ACCESS GATE block`);
    if (f !== "index.html" && /ACCESS GATE/.test(s)) err(`root: ${f} must NOT be gated`);
  }

  for (const w of WARNINGS) console.log("WARN  " + w);
  for (const e of ERRORS) console.log("ERROR " + e);
  console.log(`\n--check: ${ERRORS.length} error(s), ${WARNINGS.length} warning(s)` +
    (ERRORS.length ? "" : WARNINGS.length ? "  (warnings are advisory)" : "  — all good"));
  process.exit(ERRORS.length ? 1 : 0);
}

console.log(
  `${DRY ? "[dry-run] " : ""}pages — ${DRY ? "would update" : "updated"} ${updated}` +
  `, already current ${unchanged}, page-meta baked ${metaBaked}, index shells ${indexBaked}` +
  `, no sidebar ${noSidebar}` +
  (missingNav ? `, MISSING <nav> ${missingNav}` : "")
);
if (skips.length) {
  console.log("\nmanual attention (" + skips.length + "):");
  for (const s of skips) console.log(s);
}
