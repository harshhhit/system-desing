#!/usr/bin/env node
/*
 * Build docs/assets/revision-cards.js — one short "revision card" per page in
 * docs/assets/sitemap.js, used by the repo-root index.html homepage.
 *
 * For every page it pulls ONE short paragraph out of the page itself, in this order:
 *   1. the quoted paragraph inside the "Simple interview version" note
 *      (the Interview Answer block — see CLAUDE.md)
 *   2. the page's lead line (subtitle) from docs/assets/pages.js, minus boilerplate
 *      ("Study prompt:", "Tick each stage …", "A companion deep-dive to …")
 *   3. the body paragraph that best stands on its own: chat-transcript filler
 *      ("Got it 👍", "Would you like me to …"), dangling openers ("These …", "This is …"),
 *      "…:" lead-ins, heading-like lines and arrow/bullet fragments are skipped or
 *      repaired, and definition-style sentences about the page title's topic win
 * and trims it to ~320 characters.
 *
 * Called automatically by scripts/regen-sidebars.js (and verified by its --check),
 * so you normally never run this by hand. Standalone use:
 *   node scripts/build-revision-cards.js           # write the file
 *   node scripts/build-revision-cards.js --check   # exit 1 if the file is stale
 */
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const DOCS = path.join(REPO, "docs");
const OUT = path.join(DOCS, "assets", "revision-cards.js");
const MAX = 320;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", rarr: "→", larr: "←", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", times: "×" };
// Inline tags are removed without a space so "<b>P</b>artition" stays one word;
// every other tag becomes a space.
const INLINE = /<\/?(?:a|b|strong|i|em|code|span|mark|sup|sub|small|abbr|u|s|kbd|var)\b[^>]*>/gi;
function toText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(INLINE, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENTITIES ? ENTITIES[n.toLowerCase()] : m))
    .replace(/\s+/g, " ")
    .replace(/(?<=[\w)\]"”])\s+([,.;:!])(?=\s|$)/g, "$1")
    .replace(/([a-z])\.([A-Z][a-z])/g, "$1. $2")
    .trim();
}

const EMOJI = "[\\p{Extended_Pictographic}\\u{FE0F}\\u{200D}]";
// chat-transcript openers stripped from the front of a paragraph ("Got it 👍 …")
const OPENER = new RegExp("^(?:" + EMOJI + "|\\s)*(?:great question|great|perfect|got it|alright(?:,\\s*\\w+)?|awesome|sure|okay|ok|yes,? please)\\b[\\s,.!—–-]*(?:" + EMOJI + "|\\s)*[—–-]?\\s*", "iu");
// "Key point:", "Why it matters:" … labels in front of the actual statement
const LABEL = new RegExp("^(?:" + EMOJI + "|\\s)*(?:key points?|key insights?|key takeaways?|bottom line|definition|in short|note|tl;dr|summary|quick summary|why (?:it|this) matters|why it exists|the mindset|crucial step)\\s*:\\s*|^why\\?\\s+", "iu");
// labels that mark the author's own summary of the topic — such a paragraph is preferred
const SUMMARY = new RegExp("^(?:" + EMOJI + "|\\s)*(?:key points?|key insights?|key takeaways?|bottom line|definition|in short|tl;dr|summary|quick summary)\\s*:", "iu");
// "Below is a guide that explains how X …" → "How X …"
// "I'll build you a comparison table that …" → "A comparison table that …",
// "This is where WSGI … comes into play" → "WSGI … comes into play"
const SIGNPOST = /^(?:(?:below is|here(?:’|')s|this (?:guide|page|document|note))\b[^.:]{0,90}?\b(?:that )?(?:explains|covers|shows|walks through)\s+|(?:i(?:’|')ll (?:build|give|make) you|here(?:’|')s)\s+(?=an?\b)|this is where\s+)/i;
// a sentence that only talks to the reader / about the page, not about the topic
const FILLER = /^(?:let me|let(?:’|')s|here(?:’|')s|here are|below is|would you like|should i|do you want|if you want|i(?:’|')ll|i(?:’|')ve|i can|i(?:’|')m|we(?:’|')ll|if you(?:’|')re referring|before we\b|since you(?:’|')re|you probably want|while i cannot|you want|no fluff|this (?:page|document|guide|section|roadmap|index|walks|covers)|deep dive on the site|study prompt|tick each stage|a companion deep-dive|part \d+ (?:of|is)\b|chatgpt said)/i;
// a paragraph that can't stand alone on a card: dangling pronoun / scene-setting openers,
// labelled list rows, breadcrumbs, filler
const DANGLING = /^(?:home \/|resource\b|this\b|these\b|those\b|that(?:’|')?s?\b|it\b|they\b|then\b|now\b|so\b|and\b|but\b|also\b|instead\b|imagine\b|how to use this|pair this\b|goal\s*:|example\s*:|concepts?\s*:|best for\s*:|outcome\s*:|scenario\b)/i;
const STOP = new Set("and the for with from into your what how why who when vs versus explained explanation fundamentals fundamental overview deep dive roadmap basics basic introduction guide notes note part types type planning steps step implementation senior interview masterclass concepts only end".split(" "));

function titleStems(title) {
  return String(title || "").toLowerCase().replace(/&[a-z]+;/g, " ").split(/[^a-z0-9]+/)
    .filter(w => w.length >= 3 && !STOP.has(w)).map(w => w.replace(/(?:es|s)$/, ""));
}

// text of the nearest heading before `idx` ("🔹 2. Basic Authentication" → "Basic Authentication");
// `adjacent` = only when nothing but whitespace sits between that heading and idx
function headingBefore(body, idx, adjacent) {
  const before = body.slice(Math.max(0, idx - 2000), idx);
  const all = [...before.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  const h = all[all.length - 1];
  if (!h || (adjacent && before.slice(h.index + h[0].length).trim())) return "";
  const t = toText(h[2]).replace(new RegExp(EMOJI, "gu"), "")
    .replace(/^\s*(?:\d+(?:\.\d+)*[.)]?|[A-Z][.)]|\(\w\))\s+/, "").replace(/[:.]$/, "").trim();
  return t.length >= 3 && t.length <= 60 ? t : "";
}

// split into sentences, drop reader-facing filler sentences and a trailing "…:" lead-in
function clean(s) {
  s = s.replace(/^["“{]+|["”}]+$/g, "").trim()
    .replace(/^.{0,60}?chatgpt said:\s*/i, "")
    .replace(OPENER, "")
    .replace(/^study prompt:\s*/i, "")
    .replace(LABEL, "")
    .replace(new RegExp("^(?:" + EMOJI + "|\\s)+", "u"), "")
    .replace(SIGNPOST, "")
    .trim();
  const parts = s.split(/(?<=[.!?])\s+(?=["“(]?[A-Z0-9])/u);
  const kept = [];
  for (const p of parts) {
    const t = p.replace(OPENER, "").trim();
    if (!t) continue;
    if (FILLER.test(t)) { if (kept.length) break; continue; }
    kept.push(t);
  }
  while (kept.length > 1 && /:$/.test(kept[kept.length - 1])) kept.pop();
  s = kept.join(" ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function trim(s) {
  if (s.length <= MAX) return s;
  // cut at the last sentence end inside the limit, else at a word boundary
  const cut = s.slice(0, MAX);
  const dot = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  if (dot > MAX * 0.5) return cut.slice(0, dot + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "") + "…";
}

// Can this text stand alone on a card? Returns a score (higher = better), or null.
// `relaxed` keeps fragments (arrow notation, no final full stop) for pages that
// have nothing better — but never filler, dangling openers, or bare lead-ins.
function score(c, stems, i, relaxed) {
  const t = c.t;
  if (t.length < 50) return null;
  if (DANGLING.test(t) || FILLER.test(t) || /https?:\/\/|chatgpt said/i.test(t)) return null;
  if (/:$/.test(t)) return null;                               // lead-in to something not on the card
  if (/\b(?:above|below)[.:]?$/i.test(t)) return null;         // points at the page layout
  if (!relaxed) {
    if (/→/.test(t) && t.length < 140) return null;            // arrow-notation fragment
    if (/•/.test(t)) return null;                              // bullet row
    if (!/[.!?)"”]$/.test(t) && !/ = /.test(t)) return null;    // heading-like line, no sentence
    if (!/[.!?]/.test(t) && !/ = /.test(t)) return null;        // "ACID Properties (Atomicity, …)"
  }
  const lower = t.toLowerCase();
  const head = lower.slice(0, 70);
  let s = 0;
  if (/^(?:an?\s+|the\s+)?[\w\-\/().' ]{1,60}?\s+(?:is|are|means|refers to|answers)\s/i.test(t)) s += 3;
  if (stems.some(w => head.includes(w))) s += 3;
  else if (stems.some(w => lower.includes(w))) s += 1;
  if (/ = /.test(t)) s += 1;
  if (/^[^.:]{2,30}:\s/.test(t)) s -= 3;                    // "Label: …" list row
  if (/\?$/.test(t)) s -= 2;
  if (t.length >= 90) s += 1;
  if (c.summary) s += 3;
  return s - i * 0.3;
}

function contentArea(html) {
  const m = html.match(/<(?:div|main)[^>]*class="[^"]*sd-study-main[^"]*"[^>]*>([\s\S]*)/i)
    || html.match(/<main\b[^>]*>([\s\S]*)/i)
    || html.match(/<article\b[^>]*>([\s\S]*)/i);
  return m ? m[1] : html;
}

// Paragraph-level candidates from the page body, in document order. A paragraph
// that ends in ":" is joined with the paragraph / short list right after it.
function candidates(html) {
  const body = contentArea(html)
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    // ChatGPT web citations: "(<a …utm_source=chatgpt.com>Swagger</a>, …)"
    .replace(/<a [^>]*utm_source=chatgpt\.com[^>]*>[\s\S]*?<\/a>/gi, "")
    .replace(/\s*\((?:\s|,|<[^>]+>)*\)/g, "")
    .replace(/<p[^>]*data-page-subtitle[^>]*>[\s\S]*?<\/p>/gi, " ")
    .replace(/<div class="(?:sd-progress|page-footer)[\s\S]*?<\/div>/gi, " ");
  const out = [];
  const re = /<(p|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(body)) && out.length < 30) {
    if (/data-breadcrumb|class="[^"]*breadcrumb/i.test(m[2])) continue;
    let t = toText(m[3]);
    // "These determine how data is split …" right under "Data Distribution Concepts"
    // → "Data Distribution Concepts determine how data is split …"
    const pron = t.match(/^(?:this|these|they|it)\s+(?=(?:is|are|determine|deal|improve|provide|lets?|makes?|means)\b)/i);
    const lab = t.match(/^concepts?\s*:\s*/i);
    const h = (pron || lab) && headingBefore(body, m.index, !!pron);
    if (h) t = pron ? h + " " + t.slice(pron[0].length) : h + ": " + t.slice(lab[0].length);
    if (/:$/.test(t)) {
      const rest = body.slice(re.lastIndex);
      const next = rest.match(/^\s*<(p|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/i);
      const list = rest.match(/^\s*<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/i);
      const pre = rest.match(/^\s*<pre\b[^>]*>([\s\S]*?)<\/pre>/i);
      if (next) t += " " + toText(next[2]);
      else if (pre) {
        const lines = pre[1].replace(/<[^>]+>/g, "").split("\n").map(x => toText(x)).filter(Boolean);
        if (lines.length && lines.length <= 5 && lines.every(x => x.length <= 120))
          t += " " + lines.map(x => x.replace(/[.;]$/, "")).join("; ") + ".";
      }
      else if (list) {
        const items = (list[2].match(/<li\b[^>]*>[\s\S]*?(?=<li\b|$)/gi) || []).map(toText).filter(Boolean);
        if (items.length && items.length <= 5 && items.every(x => x.length <= 90))
          t += " " + items.map(x => x.replace(/[.;]$/, "")).join("; ") + ".";
      }
    }
    out.push({ t: clean(t), summary: SUMMARY.test(t) });
  }
  return out;
}

function snippetFor(html, meta, title) {
  // 1. the "Simple interview version" note of the page's Interview Answer block
  const iv = html.match(/Simple interview version\s*<\/span>\s*([\s\S]*?)<\/div>/i);
  if (iv) {
    const t = clean(toText(iv[1]));
    if (t.length >= 40) return { text: trim(t), source: "interview" };
  }
  const stems = titleStems(title);
  // 2. the page's lead line, minus "Study prompt:" / "Tick each stage …" boilerplate
  if (meta && meta.subtitle) {
    const raw = toText(meta.subtitle), t = clean(raw);
    if (t.length >= 40 && !DANGLING.test(raw) && !/:$/.test(t) && !DANGLING.test(t) && !FILLER.test(t)) return { text: trim(t), source: "lead" };
  }
  // 3. the body paragraph that best stands alone (definition-style, about the title's topic)
  const cands = candidates(html);
  const pick = relaxed => cands.map((c, i) => ({ t: c.t, s: score(c, stems, i, relaxed) }))
    .filter(c => c.s !== null).sort((a, b) => b.s - a.s)[0];
  const best = pick(false) || pick(true);
  if (best) return { text: trim(best.t), source: "intro" };
  return null;
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

function build() {
  const { MAP, PAGES } = load();
  const metaByHref = {};
  for (const id of Object.keys(PAGES)) metaByHref[decodeURIComponent(PAGES[id].href)] = PAGES[id];

  const cards = [];
  const seen = new Set();
  for (const section of MAP.sections) {
    for (const p of section.pages) {
      const href = decodeURIComponent(p.href);
      if (seen.has(href) || !/\.html$/i.test(href)) continue;
      seen.add(href);
      const abs = path.join(DOCS, href);
      if (!fs.existsSync(abs)) continue;
      const html = fs.readFileSync(abs, "utf8");
      const meta = metaByHref[href];
      const snip = snippetFor(html, meta, (meta && meta.title) || p.title);
      if (!snip) continue;
      cards.push({
        href: p.href,
        title: (meta && meta.title) || p.title,
        section: section.name,
        icon: section.icon || "",
        source: snip.source,
        text: snip.text,
      });
    }
  }
  return (
    "/* GENERATED by scripts/build-revision-cards.js (run via scripts/regen-sidebars.js).\n" +
    "   Do not hand-edit — one short paragraph pulled from each docs/ page, for the\n" +
    "   revision cards on the repo-root index.html. source: interview | lead | intro */\n" +
    "window.REVISION_CARDS = " + JSON.stringify(cards, null, 1) + ";\n"
  );
}

module.exports = { build, OUT };

if (require.main === module) {
  const out = build();
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (process.argv.includes("--check")) {
    if (out !== cur) { console.log("STALE: docs/assets/revision-cards.js — run node scripts/regen-sidebars.js"); process.exit(1); }
    console.log("revision-cards.js is current");
    process.exit(0);
  }
  if (out !== cur) fs.writeFileSync(OUT, out);
  const n = (out.match(/"href"/g) || []).length;
  console.log(`revision-cards.js — ${n} cards${out === cur ? " (unchanged)" : " written"}`);
}
