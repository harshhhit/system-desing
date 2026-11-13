#!/usr/bin/env node
/*
 * Build the two generated data files that docs/assets/site-extras.js loads on demand:
 *
 *   docs/assets/search-index.js   window.SD_SEARCH   — full-text search index.
 *       Every page in docs/assets/sitemap.js is split at its headings (h1–h4);
 *       each chunk is [pageIndex, headingText, headingId, plainText]. The search
 *       palette (Ctrl+K) matches against these and jumps to the matching heading.
 *
 *   docs/assets/practice-bank.js  window.SD_PRACTICE — practice-mode question bank.
 *       Per page: every <details class="sd-qa"> question (with its data-level and
 *       its answer), plus one "core" card from the Interview Answer block
 *       (the heading's question → the "Simple interview version" paragraph).
 *
 * Both files are COPIES of text that lives in the pages — the pages stay the
 * source of truth and are never modified by this script.
 *
 * Called automatically by scripts/regen-sidebars.js (and verified by its --check),
 * so you normally never run this by hand. Standalone use:
 *   node scripts/build-study-data.js           # write the files
 *   node scripts/build-study-data.js --check   # exit 1 if either file is stale
 */
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const DOCS = path.join(REPO, "docs");
const OUT_SEARCH = path.join(DOCS, "assets", "search-index.js");
const OUT_PRACTICE = path.join(DOCS, "assets", "practice-bank.js");

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", rarr: "→", larr: "←", harr: "↔", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", times: "×", middot: "·", bull: "•", check: "✓", ge: "≥", le: "≤", ne: "≠", deg: "°", copy: "©" };
const INLINE = /<\/?(?:a|b|strong|i|em|code|span|mark|sup|sub|small|abbr|u|s|kbd|var)\b[^>]*>/gi;

function decode(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return m; } })
    .replace(/&#(\d+);/g, (m, d) => { try { return String.fromCodePoint(+d); } catch (e) { return m; } })
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENTITIES ? ENTITIES[n.toLowerCase()] : m));
}
// Inline tags vanish without a space so "<b>P</b>artition" stays one word.
function toText(html) {
  return decode(String(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(INLINE, "")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function contentArea(html) {
  const m = html.match(/<(?:div|main)[^>]*class="[^"]*sd-study-main[^"]*"[^>]*>([\s\S]*)/i)
    || html.match(/<main\b[^>]*>([\s\S]*)/i)
    || html.match(/<article\b[^>]*>([\s\S]*)/i)
    || html.match(/<body\b[^>]*>([\s\S]*)/i);
  return (m ? m[1] : html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<p[^>]*data-breadcrumb[^>]*>[\s\S]*?<\/p>/gi, " ");
}

function load() {
  global.window = {};
  for (const f of ["sitemap.js", "pages.js"]) {
    const p = path.join(DOCS, "assets", f);
    delete require.cache[require.resolve(p)];
    require(p);
  }
  return { MAP: global.window.SITE_MAP, PAGES: global.window.SITE_PAGES || {} };
}

// every unique .html page of the sitemap, in sidebar order
function pageList() {
  const { MAP, PAGES } = load();
  const metaByHref = {};
  for (const id of Object.keys(PAGES)) metaByHref[decodeURIComponent(PAGES[id].href)] = PAGES[id];
  const out = [];
  const seen = new Set();
  for (const section of MAP.sections) {
    for (const p of section.pages) {
      const href = decodeURIComponent(p.href);
      if (seen.has(href) || !/\.html$/i.test(href)) continue;
      seen.add(href);
      const abs = path.join(DOCS, href);
      if (!fs.existsSync(abs)) continue;
      const meta = metaByHref[href];
      out.push({
        href: p.href,
        title: toText((meta && meta.title) || p.title),
        section: section.name,
        icon: section.icon || "",
        html: fs.readFileSync(abs, "utf8"),
      });
    }
  }
  return out;
}

/* ---------- search index ---------- */
function chunksFor(html) {
  // Mermaid source ("A -->|504| B[…]") is diagram syntax, not prose — its labels repeat
  // in the text around the diagram, so it is left out of the index (never out of the page).
  const body = contentArea(html).replace(/<(div|pre)\b[^>]*class="[^"]*\bmermaid\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const out = [];
  const re = /<(h[1-4])\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let last = 0, heading = "", id = "", m;
  const push = (end) => {
    const text = toText(body.slice(last, end));
    if (text || heading) out.push([heading, id, text]);
  };
  while ((m = re.exec(body))) {
    push(m.index);
    heading = toText(m[3]);
    const idm = m[2].match(/\bid="([^"]*)"/i);
    id = idm ? idm[1] : "";
    last = re.lastIndex;
  }
  push(body.length);
  return out;
}

function buildSearch(pages) {
  const meta = [];
  const chunks = [];
  pages.forEach((p, i) => {
    meta.push({ href: p.href, title: p.title, section: p.section, icon: p.icon });
    for (const c of chunksFor(p.html)) chunks.push([i, c[0], c[1], c[2]]);
  });
  return (
    "/* GENERATED by scripts/build-study-data.js (run via scripts/regen-sidebars.js).\n" +
    "   Do not hand-edit — a plain-text copy of every docs/ page, split at its headings,\n" +
    "   for the full-text search palette in assets/site-extras.js.\n" +
    "   chunks: [pageIndex, headingText, headingId, text] */\n" +
    "window.SD_SEARCH = {\n\"pages\": " + JSON.stringify(meta) + ",\n\"chunks\": [\n" +
    chunks.map(c => JSON.stringify(c)).join(",\n") + "\n]};\n"
  );
}

/* ---------- practice bank ---------- */
const KEEP = new Set(["p", "ul", "ol", "li", "code", "pre", "strong", "b", "em", "i", "br", "table", "thead", "tbody", "tr", "th", "td", "blockquote", "kbd"]);
// keep the answer's structure (lists, code, tables) but drop every attribute and
// every tag outside the allow-list (its text stays)
function cleanHtml(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi, (m, slash, tag) => (KEEP.has(tag.toLowerCase()) ? "<" + slash + tag.toLowerCase() + ">" : ""))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function cardsFor(html) {
  const cards = [];
  const seen = new Set();
  const add = (q, a, l) => {
    q = toText(q);
    a = cleanHtml(a);
    if (!q || !toText(a) || seen.has(q)) return;
    seen.add(q);
    cards.push({ q, a, l });
  };
  // 1. the Interview Answer block: heading question → "Simple interview version"
  const head = html.match(/<h[2-4]\b[^>]*>\s*Interview Answer\s*(?:—|–|-|&mdash;|&ndash;)\s*([\s\S]*?)<\/h[2-4]>/i);
  const simple = html.match(/Simple interview version\s*<\/span>\s*([\s\S]*?)<\/div>/i);
  if (head && simple) add(head[1], /<p\b/i.test(simple[1]) ? simple[1] : "<p>" + simple[1] + "</p>", "core");
  // 2. the question bank
  const re = /<details\b([^>]*\bclass="[^"]*\bsd-qa\b[^"]*"[^>]*)>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  let m;
  while ((m = re.exec(html))) {
    const lv = m[1].match(/data-level="([^"]*)"/i);
    add(m[2], m[3], lv ? lv[1].toLowerCase() : "basic");
  }
  return cards;
}

function buildPractice(pages) {
  const out = [];
  for (const p of pages) {
    const cards = cardsFor(p.html);
    if (cards.length) out.push({ href: p.href, title: p.title, section: p.section, icon: p.icon, cards });
  }
  return (
    "/* GENERATED by scripts/build-study-data.js (run via scripts/regen-sidebars.js).\n" +
    "   Do not hand-edit — practice-mode cards copied from each page's Interview Answer\n" +
    "   block (level \"core\") and its .sd-qa question bank. To change a card, edit the page. */\n" +
    "window.SD_PRACTICE = [\n" + out.map(p => JSON.stringify(p)).join(",\n") + "\n];\n"
  );
}

function build() {
  const pages = pageList();
  return [
    { file: OUT_SEARCH, name: "search-index.js", out: buildSearch(pages) },
    { file: OUT_PRACTICE, name: "practice-bank.js", out: buildPractice(pages) },
  ];
}

module.exports = { build };

if (require.main === module) {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const f of build()) {
    const cur = fs.existsSync(f.file) ? fs.readFileSync(f.file, "utf8") : "";
    if (check) {
      if (f.out !== cur) { console.log("STALE: docs/assets/" + f.name + " — run node scripts/regen-sidebars.js"); stale++; }
      else console.log(f.name + " is current");
    } else {
      if (f.out !== cur) fs.writeFileSync(f.file, f.out);
      console.log(`${f.name} — ${(f.out.length / 1024).toFixed(0)} KB${f.out === cur ? " (unchanged)" : " written"}`);
    }
  }
  process.exit(stale ? 1 : 0);
}
