#!/usr/bin/env node
/*
 * Regenerate the static <nav> inside every eat-that-elephant-1 page's .sidebar
 * from assets/sitemap.js, so the on-disk sidebar matches what site-header.js
 * renders at runtime (JS and no-JS stay identical).
 *
 * Run this after ANY edit to eat-that-elephant-1/assets/sitemap.js.
 *
 *   node scripts/regen-sidebars.js
 */
const fs = require("fs");
const path = require("path");

const E1 = path.join(__dirname, "..", "eat-that-elephant-1");
global.window = {};
require(path.join(E1, "assets", "sitemap.js"));
const MAP = window.SITE_MAP;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildNav(relPath) {
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

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "_files" && e.name !== "assets") walk(p, out); }
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const NAV_RE = /<nav\b[^>]*>[\s\S]*?<\/nav>/;
let updated = 0, unchanged = 0, noSidebar = 0, missing = 0;
for (const abs of walk(E1)) {
  let t = fs.readFileSync(abs, "utf8");
  const rel = path.relative(E1, abs).split(path.sep).join("/");
  if (!/class="sidebar/.test(t)) { noSidebar++; continue; }
  if (!NAV_RE.test(t)) { console.log("!! .sidebar but no <nav>:", rel); missing++; continue; }
  const nt = t.replace(NAV_RE, () => buildNav(rel));
  if (nt === t) { unchanged++; continue; }
  fs.writeFileSync(abs, nt);
  updated++;
}
console.log(`sidebars — updated ${updated}, already current ${unchanged}, no sidebar ${noSidebar}` +
            (missing ? `, MISSING <nav> ${missing}` : ""));
