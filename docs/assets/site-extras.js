/* Interactive study extras. Pure client-side, no build step, ADDITIVE ONLY:
   nothing here edits, hides for good, or removes page content — every feature
   is a layer on top of the HTML that is already in the page, and with this
   file missing every page reads exactly as before.

   Loaded on every docs/ page by assets/site-header.js (it injects the <script>),
   and on the repo-root homepage by a <script> tag. Styling: assets/site-extras.css
   (injected from here — the homepage doesn't load site.css, so the shared pieces
   need their own sheet).

   Everywhere:
     Ctrl/Cmd+K           full-text search palette (assets/search-index.js, lazy)
     practice mode        self-graded questions with spaced repetition
                          (assets/practice-bank.js, lazy)
     backup / restore     every localStorage key of the site ↔ one JSON file
   Docs pages:
     top band buttons     Search · Practice · Aa (text size, focus mode) · ?
     keyboard shortcuts   j/k parts · [ ] pages · m covered · f focus · q practice · ?
     reading progress bar, "~n min read", resume-where-you-left-off toast
     copy button on every <pre>; filter box on every table with 6+ rows
     step-by-step walk-through on every <ol class="sd-steps">
     expand / zoom / pan for Mermaid diagrams and content images
     hover definitions for terms from the page's "Term | Meaning" table
     a small celebration when a page is marked covered
   Homepage (#studyHub mount):
     continue reading · study streak + 12-week activity map · practice · backup

   State is per-viewer localStorage (all keys start with "sdnotes_"):
     sdnotes_practice_<siteId>   card id -> { b: box, due: "YYYY-MM-DD", n, g }
     sdnotes_activity_<siteId>   "YYYY-MM-DD" -> { pg: [href…], c: covered, q: answered }
     sdnotes_pos_<siteId>        href -> { p: scroll fraction, h: heading, ts }
     sdnotes_prefs               { fs: text size %, focus: bool }
     sdnotes_last_backup         ISO date of the last export
     sdnotes_backup_undo         snapshot taken right before the last import */
(function () {
  "use strict";
  var script = document.currentScript;
  var map = window.SITE_MAP;
  if (!script || !script.src || !map || window.__sdExtras) return;
  window.__sdExtras = true;

  var ASSETS = script.src.replace(/[^\/]*$/, "");
  var VER = (script.src.match(/[?&]v=([\w.-]+)/) || [])[1] || "1";
  var DOCS, HOME;
  try { DOCS = new URL("../", ASSETS).href; HOME = new URL("../index.html", DOCS).href; }
  catch (e) { return; }
  var SID = map.siteId || "site";

  var K_COVERED = "sdnotes_covered_" + SID;
  var K_PRACTICE = "sdnotes_practice_" + SID;
  var K_ACTIVITY = "sdnotes_activity_" + SID;
  var K_POS = "sdnotes_pos_" + SID;
  var K_PREFS = "sdnotes_prefs";
  var K_LAST_BACKUP = "sdnotes_last_backup";
  var K_UNDO = "sdnotes_backup_undo";
  var K_JUMP = "sdnotes_jump";             // sessionStorage: where to land on the next page

  /* ---------- small helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function ui(n) { n.setAttribute("data-sd-ui", ""); return n; }   // site-header.js skips [data-sd-ui]
  function btn(cls, text, fn) {
    var b = el("button", cls, text);
    b.type = "button";
    if (fn) b.addEventListener("click", fn);
    return b;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function jget(key, dflt) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? dflt : v; }
    catch (e) { return dflt; }
  }
  function jset(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  function reducedMotion() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb(true); };
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }
  function hashStr(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function isTyping(t) {
    return !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
  }
  function stickyOffset() {
    var s = document.querySelector(".sd-sticky");
    return (s ? s.offsetHeight : 0) + 14;
  }
  function scrollToEl(node, center) {
    try { node.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: center ? "center" : "start" }); }
    catch (e) { node.scrollIntoView(); }
  }

  /* ---------- the page list ---------- */
  function urlFor(href) { try { return new URL(href, DOCS).href; } catch (e) { return DOCS + href; } }
  function pathOf(u) {
    try { return decodeURI(new URL(u, window.location.href).pathname); }
    catch (e) { return String(u); }
  }
  var PAGES = [], byHref = {};
  (map.sections || []).forEach(function (s) {
    (s.pages || []).forEach(function (p) {
      if (byHref[p.href]) return;
      var o = { href: p.href, title: p.title, section: s.name, icon: s.icon || "", url: urlFor(p.href),
                html: /\.html?$/i.test(p.href) };
      byHref[p.href] = o;
      PAGES.push(o);
    });
  });
  var herePath = pathOf(window.location.href);
  var HERE = null;
  PAGES.some(function (p) { if (pathOf(p.url) === herePath) { HERE = p; return true; } return false; });

  function findContainer() {
    return document.querySelector(".sd-study-main") || document.querySelector("main") ||
           document.querySelector(".layout") || document.querySelector("article");
  }
  var IS_DOC = !!document.getElementById("site-header-root");

  // the stylesheet (shared by docs pages and the homepage)
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = ASSETS + "site-extras.css?v=" + VER;
  document.head.appendChild(css);

  /* ---------- toast ---------- */
  var toastBox = null;
  function toast(msg, opts) {
    opts = opts || {};
    if (!toastBox) {
      toastBox = ui(el("div", "sx-toasts"));
      toastBox.setAttribute("role", "status");
      toastBox.setAttribute("aria-live", "polite");
      document.body.appendChild(toastBox);
    }
    var t = el("div", "sx-toast");
    t.appendChild(el("span", "sx-toast-msg", msg));
    function close() { if (t.parentNode) t.remove(); }
    if (opts.action) {
      t.appendChild(btn("sx-toast-act", opts.action.label, function () { close(); opts.action.fn(); }));
    }
    t.appendChild(btn("sx-toast-x", "✕", close)).setAttribute("aria-label", "Dismiss");
    toastBox.appendChild(t);
    setTimeout(close, opts.ms || 5000);
    return close;
  }

  /* ---------- confetti (a short burst; skipped with prefers-reduced-motion) ---------- */
  function confetti(x, y) {
    if (reducedMotion()) return;
    var colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#eab308"];
    var layer = ui(el("div", "sx-confetti"));
    layer.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 42; i++) {
      var p = el("i");
      var ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 190;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--dy", (Math.sin(ang) * dist - 60) + "px");
      p.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      p.style.animationDelay = (Math.random() * 80) + "ms";
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 1700);
  }

  /* ---------- activity log + streak ---------- */
  function readActivity() { var a = jget(K_ACTIVITY, {}); return a && typeof a === "object" ? a : {}; }
  function logActivity(kind, val) {
    var a = readActivity(), k = dayKey();
    var d = a[k] || (a[k] = { pg: [], c: 0, q: 0 });
    if (!Array.isArray(d.pg)) d.pg = [];
    if (kind === "page") { if (d.pg.indexOf(val) === -1 && d.pg.length < 80) d.pg.push(val); }
    else if (kind === "covered") d.c = (d.c || 0) + 1;
    else if (kind === "question") d.q = (d.q || 0) + (val || 1);
    var keys = Object.keys(a).sort();
    while (keys.length > 400) delete a[keys.shift()];       // keep ~13 months
    jset(K_ACTIVITY, a);
  }
  function dayScore(d) { return d ? ((d.pg && d.pg.length) || 0) + (d.c || 0) * 2 + Math.ceil((d.q || 0) / 5) : 0; }
  function streak() {
    var a = readActivity(), d = new Date(), n = 0;
    if (!dayScore(a[dayKey(d)])) d = addDays(d, -1);        // today not started yet — the streak still stands
    while (dayScore(a[dayKey(d)])) { n++; d = addDays(d, -1); }
    return n;
  }

  /* ---------- modal shell (one at a time) ---------- */
  var modal = null;
  function openModal(cls, label) {
    closeModal();
    var back = ui(el("div", "sx-modal-back"));
    var box = el("div", "sx-modal " + (cls || ""));
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", label || "Dialog");
    box.tabIndex = -1;
    back.appendChild(box);
    back.addEventListener("mousedown", function (ev) { if (ev.target === back) closeModal(); });
    modal = { back: back, box: box, prev: document.activeElement, onKey: null, onClose: null };
    document.body.appendChild(back);
    document.documentElement.classList.add("sx-noscroll");
    return modal;
  }
  function closeModal() {
    if (!modal) return;
    var m = modal;
    modal = null;
    m.back.remove();
    document.documentElement.classList.remove("sx-noscroll");
    if (m.onClose) m.onClose();
    try { if (m.prev && m.prev.focus) m.prev.focus(); } catch (e) {}
  }
  function modalHead(m, title) {
    var head = el("div", "sx-modal-head");
    head.appendChild(el("h2", "sx-modal-title", title));
    var x = btn("sx-modal-x", "✕", closeModal);
    x.setAttribute("aria-label", "Close");
    head.appendChild(x);
    m.box.appendChild(head);
    return head;
  }

  /* =====================================================================
     1. BACKUP / RESTORE — every localStorage key of the site ↔ one file
     ===================================================================== */
  var SKIP_KEYS = { unlocked: 1 };            // the login flag never travels in a backup
  SKIP_KEYS[K_UNDO] = 1;
  function snapshot() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && !SKIP_KEYS[k]) out[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return out;
  }
  function download(name, text, type) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type || "application/json" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportBackup() {
    var data = snapshot();
    var payload = { app: "infra-owl-study-backup", version: 1, exported: new Date().toISOString(),
                    site: map.siteName || "", keys: Object.keys(data).length, data: data };
    download("infra-owl-backup-" + dayKey() + ".json", JSON.stringify(payload, null, 1));
    try { localStorage.setItem(K_LAST_BACKUP, payload.exported); } catch (e) {}
    toast("💾 Backup downloaded — " + payload.keys + " saved items. Keep the file somewhere safe.");
    paintHub();
  }
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  // Merge so that nothing already here is lost: keys only in `local` stay, keys only in
  // `incoming` are added, and on a real conflict the backup's value wins (the snapshot
  // taken before the import keeps the old one for "Undo").
  function deepMerge(local, incoming) {
    if (isObj(local) && isObj(incoming)) {
      var out = {};
      Object.keys(local).forEach(function (k) { out[k] = local[k]; });
      Object.keys(incoming).forEach(function (k) { out[k] = k in local ? deepMerge(local[k], incoming[k]) : incoming[k]; });
      return out;
    }
    if (Array.isArray(local) && Array.isArray(incoming)) {
      var seen = {}, arr = [];
      local.concat(incoming).forEach(function (v) {
        var key = typeof v === "object" ? JSON.stringify(v) : typeof v + ":" + v;
        if (!seen[key]) { seen[key] = 1; arr.push(v); }
      });
      return arr;
    }
    return incoming;
  }
  function importBackup(file, done) {
    var reader = new FileReader();
    reader.onerror = function () { toast("Couldn't read that file."); };
    reader.onload = function () {
      var payload;
      try { payload = JSON.parse(String(reader.result)); } catch (e) { payload = null; }
      if (!payload || payload.app !== "infra-owl-study-backup" || !isObj(payload.data)) {
        toast("That file isn't an Infra Owl backup — nothing was changed.");
        return;
      }
      // 1. keep what is here now, so the import can be undone
      var before = snapshot();
      var undoText = JSON.stringify({ taken: new Date().toISOString(), data: before });
      var stored = false;
      try { localStorage.setItem(K_UNDO, undoText); stored = true; } catch (e) {}
      if (!stored) download("infra-owl-before-import-" + dayKey() + ".json",
        JSON.stringify({ app: "infra-owl-study-backup", version: 1, exported: new Date().toISOString(), data: before }, null, 1));
      // 2. merge the backup into it
      var added = 0, merged = 0, failed = 0;
      Object.keys(payload.data).forEach(function (k) {
        if (SKIP_KEYS[k]) return;
        var inc = payload.data[k];
        if (typeof inc !== "string") return;
        var cur = null;
        try { cur = localStorage.getItem(k); } catch (e) {}
        var next = inc;
        if (cur != null && cur !== inc) {
          var a, b, ok = true;
          try { a = JSON.parse(cur); b = JSON.parse(inc); } catch (e) { ok = false; }
          if (ok && ((isObj(a) && isObj(b)) || (Array.isArray(a) && Array.isArray(b)))) next = JSON.stringify(deepMerge(a, b));
          merged++;
        } else if (cur == null) added++;
        try { localStorage.setItem(k, next); } catch (e) { failed++; }
      });
      toast("✅ Backup restored — " + added + " added, " + merged + " merged with what was here" +
            (failed ? ", " + failed + " could not be saved (storage full)" : "") +
            (stored ? ". Undo is available." : ". A copy of the previous state was downloaded."), { ms: 9000 });
      if (done) done();
      setTimeout(function () { window.location.reload(); }, 2200);
    };
    reader.readAsText(file);
  }
  function pickBackupFile() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", function () { if (input.files && input.files[0]) importBackup(input.files[0]); });
    input.click();
  }
  function undoImport() {
    var u = jget(K_UNDO, null);
    if (!u || !isObj(u.data)) { toast("Nothing to undo."); return; }
    try {
      var now = snapshot();
      Object.keys(now).forEach(function (k) { if (!(k in u.data)) localStorage.removeItem(k); });
      Object.keys(u.data).forEach(function (k) { localStorage.setItem(k, u.data[k]); });
      localStorage.removeItem(K_UNDO);
    } catch (e) { toast("Undo failed — storage error."); return; }
    toast("↩️ Import undone — back to the state from before it.");
    setTimeout(function () { window.location.reload(); }, 1500);
  }
  function backupAge() {
    var iso = null;
    try { iso = localStorage.getItem(K_LAST_BACKUP); } catch (e) {}
    if (!iso) return null;
    var days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return isNaN(days) ? null : days;
  }
  function backupLine() {
    var age = backupAge();
    if (age == null) return "No backup yet — your notes and progress exist only in this browser.";
    if (age <= 0) return "Last backup: today.";
    return "Last backup: " + age + " day" + (age === 1 ? "" : "s") + " ago" + (age > 14 ? " — time for a fresh one." : ".");
  }
  function dataControls(wrap) {
    wrap.appendChild(btn("sx-btn sx-btn-primary", "⬇ Export backup", exportBackup));
    wrap.appendChild(btn("sx-btn", "⬆ Import backup", pickBackupFile));
    if (jget(K_UNDO, null)) wrap.appendChild(btn("sx-btn sx-btn-quiet", "↩ Undo last import", undoImport));
  }
  function openDataModal() {
    var m = openModal("sx-data", "Backup and restore");
    modalHead(m, "💾 Backup & restore");
    var body = el("div", "sx-modal-body");
    body.appendChild(el("p", null, "Your notes, covered pages, reminders, review flags and practice history are stored only in this browser. Export them to a file, and import that file on another device or after clearing browser data."));
    body.appendChild(el("p", "sx-muted", backupLine()));
    var row = el("div", "sx-row");
    dataControls(row);
    body.appendChild(row);
    body.appendChild(el("p", "sx-muted", "Import merges: anything already here stays, the backup adds to it, and the previous state is kept so the import can be undone."));
    m.box.appendChild(body);
    m.box.focus();
  }

  /* =====================================================================
     2. FULL-TEXT SEARCH PALETTE (Ctrl/Cmd+K)
     ===================================================================== */
  var IDX = null, idxState = 0, idxWaiters = [];   // 0 not loaded · 1 loading · 2 ready · -1 failed
  function loadIndex(cb) {
    if (idxState === 2 || idxState === -1) { cb(); return; }
    idxWaiters.push(cb);
    if (idxState === 1) return;
    idxState = 1;
    loadScript(ASSETS + "search-index.js?v=" + VER, function (ok) {
      var s = ok && window.SD_SEARCH;
      if (s && s.pages && s.chunks) {
        s.pages.forEach(function (p) { p._t = (p.title + " " + p.section).toLowerCase(); p.url = urlFor(p.href); });
        s.chunks.forEach(function (c) { c[4] = (c[1] + " \n " + c[3]).toLowerCase(); });
        IDX = s;
        idxState = 2;
      } else idxState = -1;
      idxWaiters.splice(0).forEach(function (f) { f(); });
    });
  }
  function countHits(hay, w, max) {
    var n = 0, i = -1;
    while (n < max && (i = hay.indexOf(w, i + 1)) !== -1) n++;
    return n;
  }
  function runSearch(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    var phrase = terms.join(" ");
    var out = [];
    var pages = IDX ? IDX.pages : PAGES.map(function (p) {
      return { href: p.href, title: p.title, section: p.section, icon: p.icon, url: p.url, _t: (p.title + " " + p.section).toLowerCase() };
    });
    pages.forEach(function (p) {                             // a page whose title / section matches
      if (!terms.every(function (w) { return p._t.indexOf(w) !== -1; })) return;
      var tl = p.title.toLowerCase(), s = 60;
      terms.forEach(function (w) { if (tl.indexOf(w) !== -1) s += 10; });
      if (tl.indexOf(phrase) === 0) s += 15;
      out.push({ page: p, head: "", id: "", text: "", score: s, whole: true });
    });
    if (IDX) {
      var perPage = {};
      var hits = [];
      IDX.chunks.forEach(function (c) {
        var p = IDX.pages[c[0]], hay = c[4];
        var any = false;
        for (var i = 0; i < terms.length; i++) {
          var inHay = hay.indexOf(terms[i]) !== -1;
          if (inHay) any = true;
          else if (p._t.indexOf(terms[i]) === -1) return;
        }
        if (!any) return;
        var hl = c[1].toLowerCase(), s = 0;
        terms.forEach(function (w) {
          if (hl.indexOf(w) !== -1) s += 9;
          s += countHits(hay, w, 4);
        });
        if (terms.length > 1 && hay.indexOf(phrase) !== -1) s += 12;
        if (hl === phrase) s += 12;
        hits.push({ page: p, head: c[1], id: c[2], text: c[3], score: s });
      });
      hits.sort(function (a, b) { return b.score - a.score; });
      hits.forEach(function (h) {                            // at most 3 places per page
        var n = perPage[h.page.href] || 0;
        if (n >= 3) return;
        perPage[h.page.href] = n + 1;
        out.push(h);
      });
    }
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 40);
  }
  function highlight(text, terms) {
    var re;
    try { re = new RegExp("(" + terms.map(reEsc).join("|") + ")", "ig"); } catch (e) { return esc(text); }
    return String(text).split(re).map(function (part, i) { return i % 2 ? "<mark>" + esc(part) + "</mark>" : esc(part); }).join("");
  }
  function snippet(text, terms) {
    if (!text) return "";
    var low = text.toLowerCase(), at = low.indexOf(terms.join(" "));
    for (var i = 0; at === -1 && i < terms.length; i++) at = low.indexOf(terms[i]);
    if (at === -1) at = 0;
    var from = Math.max(0, at - 70), to = Math.min(text.length, at + 170);
    return (from > 0 ? "…" : "") + text.slice(from, to) + (to < text.length ? "…" : "");
  }
  function goTo(page, jump) {
    var here = HERE && page.href === HERE.href;
    if (here) { closeModal(); doJump(jump || {}); return; }
    if (jump) {
      jump.path = pathOf(page.url);
      try { sessionStorage.setItem(K_JUMP, JSON.stringify(jump)); } catch (e) {}
    }
    window.location.href = page.url + (jump && jump.id ? "#" + encodeURIComponent(jump.id) : "");
  }
  function lastRead() {
    var pos = jget(K_POS, {}), best = null;
    Object.keys(pos).forEach(function (h) {
      if (byHref[h] && (!best || (pos[h].ts || 0) > (pos[best].ts || 0))) best = h;
    });
    return best ? { page: byHref[best], p: pos[best].p || 0, h: pos[best].h || "", ts: pos[best].ts || 0 } : null;
  }
  function recentPages(n) {
    var pos = jget(K_POS, {});
    return Object.keys(pos).filter(function (h) { return byHref[h]; })
      .sort(function (a, b) { return (pos[b].ts || 0) - (pos[a].ts || 0); }).slice(0, n)
      .map(function (h) { return { page: byHref[h], p: pos[h].p || 0, h: pos[h].h || "" }; });
  }
  function randomUncovered() {
    var cov = jget(K_COVERED, {});
    var pool = PAGES.filter(function (p) { return p.html && cov[p.href] !== true && p !== HERE; });
    if (!pool.length) pool = PAGES.filter(function (p) { return p.html && p !== HERE; });
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }
  function openSearch(initial) {
    var m = openModal("sx-palette", "Search all notes");
    var input = el("input", "sx-pal-input");
    input.type = "search";
    input.placeholder = "Search inside every page…";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("aria-label", "Search inside every page");
    var list = el("div", "sx-pal-list");
    list.setAttribute("role", "listbox");
    var foot = el("div", "sx-pal-foot");
    foot.innerHTML = "<span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span><span class=\"sx-pal-state\"></span>";
    var state = foot.querySelector(".sx-pal-state");
    m.box.appendChild(input);
    m.box.appendChild(list);
    m.box.appendChild(foot);
    var items = [], sel = -1;

    function select(i) {
      if (!items.length) { sel = -1; return; }
      sel = (i + items.length) % items.length;
      items.forEach(function (it, n) { it.classList.toggle("is-sel", n === sel); it.setAttribute("aria-selected", String(n === sel)); });
      try { items[sel].scrollIntoView({ block: "nearest" }); } catch (e) {}
    }
    function row(icon, title, meta, snipHtml, fn) {
      var a = el("button", "sx-res");
      a.type = "button";
      a.setAttribute("role", "option");
      var t = el("span", "sx-res-title");
      t.innerHTML = (icon ? "<span class=\"sx-res-icon\">" + esc(icon) + "</span>" : "") + title;
      a.appendChild(t);
      if (meta) a.appendChild(el("span", "sx-res-meta", meta));
      if (snipHtml) { var s = el("span", "sx-res-snip"); s.innerHTML = snipHtml; a.appendChild(s); }
      a.addEventListener("click", fn);
      a.addEventListener("mousemove", function () { var i = items.indexOf(a); if (i !== sel) select(i); });
      list.appendChild(a);
      items.push(a);
    }
    function label(text) { list.appendChild(el("div", "sx-pal-label", text)); }
    function renderHome() {
      list.replaceChildren();
      items = [];
      label("Quick actions");
      var last = lastRead();
      if (last && last.page !== HERE) {
        row("▶", "Continue: " + esc(last.page.title), Math.round(last.p * 100) + "% read" + (last.h ? " · " + last.h : ""), "",
          function () { goTo(last.page, { pct: last.p }); });
      }
      row("🎯", "Practice questions", "Self-graded, spaced repetition", "", function () { openPractice(); });
      row("🎲", "Surprise me — a page I haven't covered", "", "", function () { var p = randomUncovered(); if (p) goTo(p); });
      row("💾", "Backup & restore my notes and progress", backupLine(), "", function () { openDataModal(); });
      if (IS_DOC) row("⌨️", "Keyboard shortcuts", "", "", function () { openHelp(); });
      row("🏠", "Home", "", "", function () { window.location.href = HOME; });
      var rec = recentPages(6).filter(function (r) { return r.page !== HERE && !(last && r.page === last.page); });
      if (rec.length) {
        label("Recently read");
        rec.forEach(function (r) {
          row(r.page.icon, esc(r.page.title), r.page.section + " · " + Math.round(r.p * 100) + "% read", "",
            function () { goTo(r.page, { pct: r.p }); });
        });
      }
      select(0);
    }
    function render() {
      var q = input.value.trim();
      if (!q) { renderHome(); return; }
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      var res = runSearch(q);
      list.replaceChildren();
      items = [];
      if (!res.length) {
        list.appendChild(el("div", "sx-pal-empty", idxState === 1 ? "Loading the full-text index…" : "Nothing matches “" + q + "”."));
        sel = -1;
        return;
      }
      res.forEach(function (r) {
        var title = highlight(r.page.title, terms) + (r.head ? " <span class=\"sx-res-sep\">›</span> " + highlight(r.head, terms) : "");
        row(r.page.icon, title, r.page.section, r.text ? highlight(snippet(r.text, terms), terms) : "",
          function () { goTo(r.page, r.whole ? null : { h: r.head, id: r.id, q: terms }); });
      });
      select(0);
    }
    var timer = null;
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(render, 70); });
    m.onKey = function (ev) {
      if (ev.key === "ArrowDown") { ev.preventDefault(); select(sel + 1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); select(sel - 1); }
      else if (ev.key === "Enter") { ev.preventDefault(); if (items[sel]) items[sel].click(); }
    };
    function paintState() {
      state.textContent = idxState === 2 ? IDX.chunks.length + " sections of " + IDX.pages.length + " pages indexed"
        : idxState === -1 ? "Full-text index unavailable — searching titles only" : "Loading full text…";
    }
    paintState();
    loadIndex(function () { if (modal !== m) return; paintState(); if (input.value.trim()) render(); });
    if (initial) input.value = initial;
    render();
    input.focus();
    if (initial) { try { input.setSelectionRange(initial.length, initial.length); } catch (e) {} }
  }

  /* ---------- landing on a search hit / a resume point ---------- */
  function headText(h) {
    var c = h.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll("[data-sd-ui],.sd-note-marker"), function (x) { x.remove(); });
    return norm(c.textContent);
  }
  function flash(node) {
    node.classList.add("sx-flash");
    setTimeout(function () { node.classList.remove("sx-flash"); }, 2600);
  }
  function openAncestors(node) {
    for (var p = node.parentElement; p; p = p.parentElement) if (p.tagName === "DETAILS") p.open = true;
  }
  function doJump(j) {
    var container = findContainer();
    if (!container) return;
    if (typeof j.pct === "number" && !j.h && !j.id) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(0, max * j.pct), behavior: reducedMotion() ? "auto" : "smooth" });
      return;
    }
    var target = null;
    if (j.id) { try { target = document.getElementById(j.id); } catch (e) {} }
    if (!target && j.h) {
      var want = norm(j.h);
      Array.prototype.some.call(container.querySelectorAll("h1,h2,h3,h4"), function (h) {
        if (h.closest("[data-sd-ui]")) return false;
        if (headText(h) === want) { target = h; return true; }
        return false;
      });
    }
    if (!target) return;
    openAncestors(target);
    // the first place the search term shows up under that heading
    var mark = null;
    var terms = Array.isArray(j.q) ? j.q : [];
    if (terms.length && document.createTreeWalker) {
      var w = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      w.currentNode = target;
      var n, seen = 0;
      while ((n = w.nextNode()) && seen < 900) {
        var par = n.parentElement;
        if (!par || target.contains(n)) continue;
        if (par.closest("script,style,svg,.mermaid,[data-sd-ui],.sd-note-card,.sd-note-form,.sd-note-marker")) continue;
        var hd = par.closest("h1,h2,h3,h4");
        if (hd && hd !== target) break;
        seen++;
        var low = n.data.toLowerCase(), at = -1, len = 0;
        for (var i = 0; i < terms.length; i++) {
          var x = low.indexOf(terms[i]);
          if (x !== -1 && (at === -1 || x < at)) { at = x; len = terms[i].length; }
        }
        if (at === -1) continue;
        try {
          var hit = n.splitText(at);
          hit.splitText(len);
          mark = ui(el("mark", "sx-hit"));
          hit.parentNode.replaceChild(mark, hit);
          mark.appendChild(hit);
        } catch (e) { mark = null; }
        break;
      }
    }
    if (mark) openAncestors(mark);
    scrollToEl(target, false);
    flash(target);
    if (mark) setTimeout(function () {
      var r = mark.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.8 || r.bottom < 0) scrollToEl(mark, true);
    }, 700);
  }

  /* =====================================================================
     3. PRACTICE MODE — self-graded cards, spaced repetition
     ===================================================================== */
  var BANK = null, bankState = 0, bankWaiters = [];
  function loadBank(cb) {
    if (bankState === 2 || bankState === -1) { cb(); return; }
    bankWaiters.push(cb);
    if (bankState === 1) return;
    bankState = 1;
    loadScript(ASSETS + "practice-bank.js?v=" + VER, function (ok) {
      if (ok && Array.isArray(window.SD_PRACTICE)) {
        BANK = [];
        window.SD_PRACTICE.forEach(function (pg) {
          (pg.cards || []).forEach(function (c) {
            BANK.push({ id: pg.href + "::" + hashStr(c.q), href: pg.href, title: pg.title, section: pg.section,
                        icon: pg.icon || "", q: c.q, a: c.a, l: c.l || "basic" });
          });
        });
        bankState = 2;
      } else bankState = -1;
      bankWaiters.splice(0).forEach(function (f) { f(); });
    });
  }
  var INTERVALS = [0, 1, 3, 7, 14, 30, 60];           // days until the next review, by box
  var LEVELS = ["core", "basic", "intermediate", "advanced", "scenario"];
  var LEVEL_LABEL = { core: "Core idea", basic: "Basic", intermediate: "Intermediate", advanced: "Advanced", scenario: "Scenario" };
  function readPractice() { var s = jget(K_PRACTICE, {}); return isObj(s) ? s : {}; }
  function dueCount() {
    var st = readPractice(), today = dayKey(), n = 0;
    Object.keys(st).forEach(function (k) { if (st[k] && st[k].due && st[k].due <= today) n++; });
    return n;
  }
  function learnedCount() {
    var st = readPractice(), n = 0;
    Object.keys(st).forEach(function (k) { if (st[k] && st[k].b >= 2) n++; });
    return n;
  }
  function grade(card, g) {                            // g: 0 missed · 1 shaky · 2 got it
    var st = readPractice();
    var s = st[card.id] || { b: 0, n: 0 };
    if (g === 2) s.b = Math.min(INTERVALS.length - 1, (s.b || 0) + 1);
    else if (g === 1) s.b = Math.max(1, s.b || 0);
    else s.b = 0;
    s.due = dayKey(addDays(new Date(), g === 1 ? 1 : INTERVALS[s.b]));
    s.n = (s.n || 0) + 1;
    s.g = g;
    st[card.id] = s;
    jset(K_PRACTICE, st);
    logActivity("question", 1);
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function openPractice() {
    var m = openModal("sx-practice", "Practice questions");
    modalHead(m, "🎯 Practice");
    var body = el("div", "sx-modal-body");
    m.box.appendChild(body);
    body.appendChild(el("p", "sx-muted", "Loading the question bank…"));
    m.box.focus();
    loadBank(function () {
      if (modal !== m) return;
      if (bankState !== 2 || !BANK.length) {
        body.replaceChildren(el("p", null, "The question bank couldn't be loaded. Check the connection and try again."));
        return;
      }
      setup();
    });

    var opt = { scope: "all", levels: {}, size: 10 };
    function inScope(c) {
      if (opt.scope === "page") return HERE && c.href === HERE.href;
      if (opt.scope === "section") return HERE && c.section === HERE.section;
      return true;
    }
    function pool() {
      var anyLevel = LEVELS.some(function (l) { return opt.levels[l]; });
      return BANK.filter(function (c) { return inScope(c) && (!anyLevel || opt.levels[c.l]); });
    }
    function setup() {
      m.onKey = null;
      body.replaceChildren();
      var st = readPractice(), today = dayKey();
      var here = HERE ? BANK.filter(function (c) { return c.href === HERE.href; }).length : 0;
      var sect = HERE ? BANK.filter(function (c) { return c.section === HERE.section; }).length : 0;
      if (opt.scope === "all" && here && !opt._picked) opt.scope = "page";

      body.appendChild(el("p", null, "Read the question, answer it in your head (or out loud), then reveal the answer and grade yourself honestly. Questions you miss come back sooner; ones you know come back after longer and longer gaps."));

      var summary = el("p", "sx-prac-summary");
      body.appendChild(summary);

      body.appendChild(el("div", "sx-field-label", "Questions from"));
      var scopes = el("div", "sx-chips");
      function scopeChip(key, text) {
        var b = btn("sx-chip", text, function () { opt.scope = key; opt._picked = true; setup(); });
        if (opt.scope === key) b.classList.add("is-on");
        scopes.appendChild(b);
      }
      if (here) scopeChip("page", "This page (" + here + ")");
      if (sect && sect !== here) scopeChip("section", HERE.section + " (" + sect + ")");
      scopeChip("all", "Everything (" + BANK.length + ")");
      body.appendChild(scopes);

      body.appendChild(el("div", "sx-field-label", "Level — none selected means all"));
      var levels = el("div", "sx-chips");
      LEVELS.forEach(function (l) {
        var n = BANK.filter(function (c) { return inScope(c) && c.l === l; }).length;
        if (!n) return;
        var b = btn("sx-chip", LEVEL_LABEL[l] + " (" + n + ")", function () { opt.levels[l] = !opt.levels[l]; setup(); });
        if (opt.levels[l]) b.classList.add("is-on");
        levels.appendChild(b);
      });
      body.appendChild(levels);

      body.appendChild(el("div", "sx-field-label", "Session length"));
      var sizes = el("div", "sx-chips");
      [5, 10, 20].forEach(function (n) {
        var b = btn("sx-chip", n + " questions", function () { opt.size = n; setup(); });
        if (opt.size === n) b.classList.add("is-on");
        sizes.appendChild(b);
      });
      body.appendChild(sizes);

      var p = pool();
      var due = p.filter(function (c) { return st[c.id] && st[c.id].due <= today; }).length;
      var fresh = p.filter(function (c) { return !st[c.id]; }).length;
      summary.textContent = p.length + " questions in this selection — " + due + " due for review, " + fresh + " new, " +
        (p.length - due - fresh) + " not due yet.";

      var row = el("div", "sx-row");
      var go = btn("sx-btn sx-btn-primary", "Start →", function () { run(buildQueue(p, st, today)); });
      go.disabled = !p.length;
      row.appendChild(go);
      body.appendChild(row);
      go.focus();
    }
    function buildQueue(p, st, today) {
      var due = p.filter(function (c) { return st[c.id] && st[c.id].due <= today; })
        .sort(function (a, b) { return st[a.id].due < st[b.id].due ? -1 : 1; });
      var fresh = shuffle(p.filter(function (c) { return !st[c.id]; }));
      var later = shuffle(p.filter(function (c) { return st[c.id] && st[c.id].due > today; }));
      return due.concat(fresh, later).slice(0, opt.size);
    }
    function run(queue) {
      var total = queue.length, done = 0, tally = [0, 0, 0], retried = {};
      function next() {
        if (!queue.length) { finish(); return; }
        var c = queue.shift();
        var revealed = false;
        body.replaceChildren();

        var top = el("div", "sx-prac-top");
        var meter = el("div", "sx-prac-meter");
        var fill = el("span");
        fill.style.width = (done / total * 100) + "%";
        meter.appendChild(fill);
        top.appendChild(meter);
        top.appendChild(el("span", "sx-prac-count", (done + 1) + " / " + total));
        body.appendChild(top);

        var meta = el("div", "sx-prac-meta");
        meta.appendChild(el("span", "sx-pill sx-lv-" + c.l, LEVEL_LABEL[c.l] || c.l));
        var link = el("a", "sx-prac-page", (c.icon ? c.icon + " " : "") + c.title + " ↗");
        link.href = urlFor(c.href);
        link.target = "_blank";
        link.rel = "noopener";
        link.title = "Open the page in a new tab";
        meta.appendChild(link);
        body.appendChild(meta);

        body.appendChild(el("h3", "sx-prac-q", c.q));
        var ans = el("div", "sx-prac-a");
        ans.hidden = true;
        ans.innerHTML = c.a;                              // generated from this site's own pages
        body.appendChild(ans);

        var actions = el("div", "sx-prac-actions");
        body.appendChild(actions);
        function reveal() {
          if (revealed) return;
          revealed = true;
          ans.hidden = false;
          actions.replaceChildren();
          actions.appendChild(el("span", "sx-prac-ask", "How did you do?"));
          [["✗ Missed it", 0, "1"], ["~ Shaky", 1, "2"], ["✓ Got it", 2, "3"]].forEach(function (g) {
            var b = btn("sx-btn sx-grade sx-grade-" + g[1], g[0], function () { answer(g[1]); });
            b.appendChild(el("kbd", null, g[2]));
            actions.appendChild(b);
          });
          m.box.focus();
        }
        function answer(g) {
          grade(c, g);
          tally[g]++;
          done++;
          if (g === 0 && !retried[c.id]) { retried[c.id] = true; queue.push(c); total++; }   // one more try this session
          next();
        }
        var show = btn("sx-btn sx-btn-primary", "Show answer", reveal);
        show.appendChild(el("kbd", null, "Space"));
        actions.appendChild(show);
        m.onKey = function (ev) {
          if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
          var onControl = ev.target && /^(BUTTON|A)$/.test(ev.target.tagName);
          if (!revealed && (ev.key === " " || ev.key === "Enter") && !onControl) { ev.preventDefault(); reveal(); }
          else if (revealed && (ev.key === "1" || ev.key === "2" || ev.key === "3")) { ev.preventDefault(); answer(+ev.key - 1); }
        };
        m.box.focus();
        m.box.scrollTop = 0;
      }
      function finish() {
        m.onKey = null;
        body.replaceChildren();
        var answered = tally[0] + tally[1] + tally[2];
        body.appendChild(el("h3", "sx-prac-q", tally[2] === answered ? "🎉 Clean run!" : "Session done"));
        var stats = el("div", "sx-prac-stats");
        [["✓ Got it", tally[2], 2], ["~ Shaky", tally[1], 1], ["✗ Missed", tally[0], 0]].forEach(function (s) {
          var d = el("div", "sx-stat sx-grade-" + s[2]);
          d.appendChild(el("b", null, String(s[1])));
          d.appendChild(el("span", null, s[0]));
          stats.appendChild(d);
        });
        body.appendChild(stats);
        var days = streak();
        body.appendChild(el("p", "sx-muted", "Missed and shaky questions return tomorrow; the ones you got return later. " +
          (days > 1 ? "🔥 " + days + "-day study streak." : "")));
        var row = el("div", "sx-row");
        row.appendChild(btn("sx-btn sx-btn-primary", "Another round", setup));
        row.appendChild(btn("sx-btn", "Close", closeModal));
        body.appendChild(row);
        if (tally[2] === answered && answered) confetti(window.innerWidth / 2, window.innerHeight / 3);
        paintHub();
        paintPracticeBadge();
      }
      next();
    }
  }

  /* =====================================================================
     4. KEYBOARD SHORTCUTS + HELP
     ===================================================================== */
  function contentHeads() {
    var c = findContainer();
    if (!c) return [];
    return Array.prototype.filter.call(c.querySelectorAll("h2"), function (h) {
      return !h.closest("[data-sd-ui]") && h.offsetParent !== null;
    });
  }
  function stepPart(dir) {
    var heads = contentHeads();
    if (!heads.length) return;
    var off = stickyOffset(), target = null;
    if (dir > 0) {
      for (var i = 0; i < heads.length; i++) if (heads[i].getBoundingClientRect().top > off + 6) { target = heads[i]; break; }
    } else {
      for (var k = heads.length - 1; k >= 0; k--) if (heads[k].getBoundingClientRect().top < off - 6) { target = heads[k]; break; }
      if (!target) { window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" }); return; }
    }
    if (target) scrollToEl(target, false);
  }
  function openHelp() {
    var m = openModal("sx-help", "Keyboard shortcuts");
    modalHead(m, "⌨️ Keyboard shortcuts");
    var body = el("div", "sx-modal-body");
    var rows = [
      ["Ctrl K", "Search inside every page (⌘K on a Mac)"],
      ["/", "Filter the sidebar's page list"],
      ["j  /  k", "Next / previous part of this page"],
      ["]  /  [", "Next / previous page"],
      ["m", "Mark this page covered (or un-mark it)"],
      ["q", "Practice questions"],
      ["f", "Focus mode — hide everything but the text"],
      ["?", "This list"],
      ["Esc", "Close whatever is open"]
    ];
    var t = el("table", "sx-keys");
    rows.forEach(function (r) {
      var tr = el("tr");
      var k = el("td");
      r[0].split("  /  ").forEach(function (key, i) {
        if (i) k.appendChild(document.createTextNode(" / "));
        k.appendChild(el("kbd", null, key));
      });
      tr.appendChild(k);
      tr.appendChild(el("td", null, r[1]));
      t.appendChild(tr);
    });
    body.appendChild(t);
    body.appendChild(el("p", "sx-muted", "Shortcuts are off while you are typing in a box."));
    m.box.appendChild(body);
    m.box.focus();
  }
  document.addEventListener("keydown", function (ev) {
    if (modal) {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); closeModal(); return; }
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === "k" || ev.key === "K")) { ev.preventDefault(); closeModal(); return; }
      if (modal.onKey) modal.onKey(ev);
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && (ev.key === "k" || ev.key === "K")) {
      ev.preventDefault();
      openSearch();
      return;
    }
    if (ev.ctrlKey || ev.metaKey || ev.altKey || isTyping(ev.target)) return;
    if (ev.key === "Escape" && lightbox) { closeLightbox(); return; }
    if (!IS_DOC) return;
    switch (ev.key) {
      case "j": stepPart(1); break;
      case "k": stepPart(-1); break;
      case "]": { var n = document.querySelector(".sd-pager-next"); if (n) n.click(); break; }
      case "[": { var p = document.querySelector(".sd-pager-prev"); if (p) p.click(); break; }
      case "m": { var cb = document.querySelector(".sd-cov-toggle input"); if (cb) cb.click(); break; }
      case "q": openPractice(); break;
      case "f": setFocusMode(!prefs.focus); break;
      case "?": openHelp(); break;
      default: return;
    }
    ev.preventDefault();
  }, true);

  /* =====================================================================
     5. READING PREFERENCES — text size + focus mode
     ===================================================================== */
  var prefs = jget(K_PREFS, {});
  if (!isObj(prefs)) prefs = {};
  function applyPrefs() {
    var fs = +prefs.fs || 100;
    document.documentElement.style.fontSize = fs === 100 ? "" : fs + "%";
    if (document.body) document.body.classList.toggle("sx-focus", !!prefs.focus && IS_DOC);
  }
  function setTextSize(fs) {
    prefs.fs = Math.max(85, Math.min(135, fs));
    jset(K_PREFS, prefs);
    applyPrefs();
  }
  var focusPill = null;
  function setFocusMode(on) {
    // keep the line being read in place while the layout around it changes
    var anchor = null, before = 0, c = findContainer();
    if (c && document.elementFromPoint) {
      var r = c.getBoundingClientRect();
      anchor = document.elementFromPoint(r.left + Math.min(r.width / 2, 200), stickyOffset() + 30);
      if (anchor && !c.contains(anchor)) anchor = null;
      if (anchor) before = anchor.getBoundingClientRect().top;
    }
    prefs.focus = !!on;
    jset(K_PREFS, prefs);
    applyPrefs();
    paintFocusPill();
    if (anchor && anchor.isConnected) window.scrollBy(0, anchor.getBoundingClientRect().top - before);
    if (on) toast("Focus mode on — press f (or the button, bottom right) to bring everything back.", { ms: 3500 });
  }
  function paintFocusPill() {
    if (!IS_DOC) return;
    if (prefs.focus && !focusPill) {
      focusPill = ui(btn("sx-focus-pill", "✕ Exit focus", function () { setFocusMode(false); }));
      document.body.appendChild(focusPill);
    } else if (!prefs.focus && focusPill) { focusPill.remove(); focusPill = null; }
  }
  if (IS_DOC) applyPrefs();                        // text size applies as early as possible

  /* =====================================================================
     6. DOCS PAGES — top band buttons
     ===================================================================== */
  var practiceBadge = null;
  function paintPracticeBadge() {
    if (!practiceBadge) return;
    var n = dueCount();
    practiceBadge.textContent = n ? String(n) : "";
    practiceBadge.title = n ? n + " question" + (n === 1 ? "" : "s") + " due for review" : "";
  }
  function renderTools() {
    var band = document.querySelector(".sd-topband");
    if (!band || band.querySelector(".sx-tools")) return;
    var tools = ui(el("div", "sx-tools"));

    var s = btn("sx-tool sx-tool-search", null, function () { openSearch(); });
    s.appendChild(el("span", null, "🔍 Search"));
    s.appendChild(el("kbd", null, /Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘K" : "Ctrl K"));
    s.title = "Search inside every page";
    tools.appendChild(s);

    var p = btn("sx-tool", null, function () { openPractice(); });
    p.appendChild(el("span", null, "🎯 Practice"));
    practiceBadge = el("span", "sx-badge");
    p.appendChild(practiceBadge);
    tools.appendChild(p);

    var wrap = el("div", "sx-pop-wrap");
    var aa = btn("sx-tool", "Aa", null);
    aa.title = "Text size and focus mode";
    aa.setAttribute("aria-haspopup", "true");
    aa.setAttribute("aria-expanded", "false");
    var pop = el("div", "sx-pop");
    pop.hidden = true;
    var size = el("div", "sx-pop-row");
    size.appendChild(el("span", "sx-pop-label", "Text size"));
    var val = el("span", "sx-pop-val");
    function paintSize() { val.textContent = (+prefs.fs || 100) + "%"; }
    size.appendChild(btn("sx-pop-btn", "A−", function () { setTextSize((+prefs.fs || 100) - 5); paintSize(); })).title = "Smaller text";
    size.appendChild(val);
    size.appendChild(btn("sx-pop-btn", "A+", function () { setTextSize((+prefs.fs || 100) + 5); paintSize(); })).title = "Larger text";
    size.appendChild(btn("sx-pop-btn sx-pop-reset", "Reset", function () { setTextSize(100); paintSize(); }));
    pop.appendChild(size);
    var foc = el("div", "sx-pop-row");
    foc.appendChild(el("span", "sx-pop-label", "Focus mode"));
    var focBtn = btn("sx-pop-btn", "", function () { setFocusMode(!prefs.focus); paintFocus(); });
    function paintFocus() { focBtn.textContent = prefs.focus ? "On — turn off" : "Turn on (f)"; }
    foc.appendChild(focBtn);
    pop.appendChild(foc);
    function setPop(open) {
      pop.hidden = !open;
      aa.setAttribute("aria-expanded", String(open));
      if (open) { paintSize(); paintFocus(); }
    }
    aa.addEventListener("click", function () { setPop(pop.hidden); });
    document.addEventListener("click", function (ev) { if (!wrap.contains(ev.target)) setPop(false); });
    wrap.appendChild(aa);
    wrap.appendChild(pop);
    tools.appendChild(wrap);

    var h = btn("sx-tool", "?", function () { openHelp(); });
    h.title = "Keyboard shortcuts";
    h.setAttribute("aria-label", "Keyboard shortcuts");
    tools.appendChild(h);

    var rev = band.querySelector(".sd-revision");
    if (rev) band.insertBefore(tools, rev); else band.appendChild(tools);
    paintPracticeBadge();
  }

  /* =====================================================================
     7. DOCS PAGES — reading progress, read time, resume
     ===================================================================== */
  function renderProgress(container) {
    var bar = ui(el("div", "sx-progress"));
    bar.setAttribute("aria-hidden", "true");
    var fill = el("span");
    bar.appendChild(fill);
    document.body.appendChild(bar);

    var saved = null;
    if (HERE) {
      var pos = jget(K_POS, {});
      saved = pos[HERE.href] || null;
    }
    var heads = Array.prototype.filter.call(container.querySelectorAll("h2,h3"), function (h) { return !h.closest("[data-sd-ui]"); });
    var moved = false, tick = null;
    function fraction() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 40 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }
    function save() {
      tick = null;
      if (!HERE || !moved) return;
      var off = stickyOffset() + 8, cur = "";
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top <= off) cur = headText(heads[i]); else break;
      }
      var pos = jget(K_POS, {});
      if (!isObj(pos)) pos = {};
      pos[HERE.href] = { p: Math.round(fraction() * 1000) / 1000, h: cur.slice(0, 90), ts: Date.now() };
      var keys = Object.keys(pos);
      if (keys.length > 40) {
        keys.sort(function (a, b) { return (pos[a].ts || 0) - (pos[b].ts || 0); });
        while (keys.length > 40) delete pos[keys.shift()];
      }
      jset(K_POS, pos);
    }
    function onScroll() {
      fill.style.width = (fraction() * 100) + "%";
      moved = true;
      if (!tick) tick = setTimeout(save, 700);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    fill.style.width = (fraction() * 100) + "%";
    return saved;
  }
  function renderReadTime(container) {
    var words = (container.textContent || "").split(/\s+/).filter(Boolean).length;
    if (words < 250) return;
    var mins = Math.max(1, Math.round(words / 200));
    var line = ui(el("div", "sx-readtime", "⏱ ~" + mins + " min read · " + words.toLocaleString() + " words"));
    var after = container.querySelector("[data-page-subtitle]") || container.querySelector("h1");
    if (after && after.parentNode) after.insertAdjacentElement("afterend", line);
  }

  /* =====================================================================
     8. DOCS PAGES — copy buttons, table filters, step walk-through
     ===================================================================== */
  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () {}); return; }
    var ta = el("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    ta.remove();
  }
  function renderCopyButtons(container) {
    Array.prototype.forEach.call(container.querySelectorAll("pre"), function (pre) {
      if (pre.classList.contains("mermaid") || pre.closest(".mermaid") || pre.closest("[data-sd-ui]")) return;
      if (!norm(pre.textContent)) return;
      var tools = ui(el("div", "sx-pre-tools"));
      var b = btn("sx-copy", "Copy", function () {
        copyText(pre.textContent.replace(/\n$/, ""), function () {
          b.textContent = "Copied ✓";
          setTimeout(function () { b.textContent = "Copy"; }, 1400);
        });
      });
      b.setAttribute("aria-label", "Copy this code block");
      tools.appendChild(b);
      pre.parentNode.insertBefore(tools, pre);
    });
  }
  function renderTableFilters(container) {
    Array.prototype.forEach.call(container.querySelectorAll("table"), function (table) {
      if (table.closest("[data-sd-ui]") || table.closest(".sd-qa")) return;
      var rows = Array.prototype.filter.call(table.rows, function (r) {
        return !r.closest("thead") && r.querySelector("td");
      });
      if (rows.length < 6) return;
      var box = ui(el("div", "sx-tfilter"));
      var input = el("input");
      input.type = "search";
      input.placeholder = "Filter these " + rows.length + " rows…";
      input.setAttribute("aria-label", "Filter the rows of the table below");
      var count = el("span", "sx-tfilter-count");
      box.appendChild(input);
      box.appendChild(count);
      input.addEventListener("input", function () {
        var terms = input.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
        rows.forEach(function (r) {
          var text = (r.textContent || "").toLowerCase();
          var ok = terms.every(function (w) { return text.indexOf(w) !== -1; });
          r.classList.toggle("sx-row-off", !ok);       // only a display toggle — clearing the box shows every row again
          if (ok) shown++;
        });
        count.textContent = terms.length ? shown + " of " + rows.length + " rows" : "";
      });
      input.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && input.value) { ev.stopPropagation(); input.value = ""; input.dispatchEvent(new Event("input")); }
      });
      var anchor = table.parentElement && table.parentElement !== container && table.parentElement.children.length === 1
        ? table.parentElement : table;                  // a lone table inside a scroll wrapper: sit above the wrapper
      anchor.parentNode.insertBefore(box, anchor);
    });
  }
  // A table wider than the text column used to push the whole page sideways (most
  // visibly on a phone). Such a table now scrolls inside its own box instead; tables
  // that fit are left exactly as they were.
  function renderWideTables(container) {
    var tables = Array.prototype.filter.call(container.querySelectorAll("table"), function (t) { return !t.closest("[data-sd-ui]"); });
    if (!tables.length) return;
    function measure() {
      tables.forEach(function (t) {
        t.classList.remove("sx-table-scroll");
        var box = t.parentElement;
        if (box && t.offsetWidth > box.clientWidth + 1) t.classList.add("sx-table-scroll");
      });
    }
    var timer = null;
    window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(measure, 150); });
    measure();
    setTimeout(measure, 1200);                            // again once fonts and the study panel have settled
  }
  function renderStepWalk(container) {
    Array.prototype.forEach.call(container.querySelectorAll("ol.sd-steps"), function (ol) {
      if (ol.closest("[data-sd-ui]")) return;
      var steps = Array.prototype.filter.call(ol.children, function (c) { return c.tagName === "LI"; });
      if (steps.length < 3) return;
      var bar = ui(el("div", "sx-walk-bar"));
      var at = -1;
      var start = btn("sx-btn sx-btn-small", "▶ Walk through step by step", function () { go(0); });
      var prev = btn("sx-btn sx-btn-small", "← Back", function () { go(at - 1); });
      var next = btn("sx-btn sx-btn-small sx-btn-primary", "Next →", function () { go(at + 1); });
      var where = el("span", "sx-walk-where");
      var all = btn("sx-btn sx-btn-small sx-btn-quiet", "Show all steps", function () { go(-1); });
      function paint() {
        var on = at >= 0;
        ol.classList.toggle("sx-walk", on);
        steps.forEach(function (li, i) { li.classList.toggle("sx-cur", i === at); li.classList.toggle("sx-done", on && i < at); });
        bar.replaceChildren();
        if (!on) { bar.appendChild(start); return; }
        prev.disabled = at === 0;
        next.textContent = at === steps.length - 1 ? "Done ✓" : "Next →";
        where.textContent = "Step " + (at + 1) + " of " + steps.length;
        bar.appendChild(prev); bar.appendChild(where); bar.appendChild(next); bar.appendChild(all);
      }
      function go(i) {
        if (i >= steps.length) i = -1;
        at = Math.max(-1, i);
        paint();
        if (at >= 0) {
          var r = steps[at].getBoundingClientRect();
          if (r.top < stickyOffset() + 50 || r.bottom > window.innerHeight - 20) scrollToEl(steps[at], true);
          next.focus();
        } else start.focus();
      }
      bar.addEventListener("keydown", function (ev) {
        if (at < 0) return;
        if (ev.key === "ArrowRight") { ev.preventDefault(); go(at + 1); }
        else if (ev.key === "ArrowLeft" && at > 0) { ev.preventDefault(); go(at - 1); }
        else if (ev.key === "Escape") { ev.stopPropagation(); go(-1); }
      });
      steps.forEach(function (li, i) {
        li.addEventListener("click", function (ev) {
          if (at < 0 || i === at || ev.target.closest("a,button,input,textarea")) return;
          go(i);
        });
      });
      paint();
      ol.parentNode.insertBefore(bar, ol);
    });
  }

  /* =====================================================================
     9. DOCS PAGES — expand / zoom / pan for diagrams and images
     ===================================================================== */
  var lightbox = null;
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
    document.documentElement.classList.remove("sx-noscroll");
  }
  function openLightbox(node, w, h, caption) {
    closeLightbox();
    var box = ui(el("div", "sx-light"));
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Enlarged diagram");
    var stage = el("div", "sx-light-stage");
    var holder = el("div", "sx-light-holder");
    holder.style.width = w + "px";
    holder.style.height = h + "px";
    holder.appendChild(node);
    stage.appendChild(holder);
    box.appendChild(stage);
    var bar = el("div", "sx-light-bar");
    var s = 1, x = 0, y = 0;
    function apply() { holder.style.transform = "translate(" + x + "px," + y + "px) scale(" + s + ")"; }
    function fit() {
      var r = stage.getBoundingClientRect();
      s = Math.min((r.width - 40) / w, (r.height - 40) / h, 3);
      if (!(s > 0)) s = 1;
      x = (r.width - w * s) / 2;
      y = (r.height - h * s) / 2;
      apply();
    }
    function zoom(f, cx, cy) {
      var r = stage.getBoundingClientRect();
      if (cx == null) { cx = r.width / 2; cy = r.height / 2; }
      var ns = Math.max(0.2, Math.min(8, s * f));
      x = cx - (cx - x) * (ns / s);
      y = cy - (cy - y) * (ns / s);
      s = ns;
      apply();
    }
    bar.appendChild(btn("sx-light-btn", "−", function () { zoom(1 / 1.25); })).setAttribute("aria-label", "Zoom out");
    bar.appendChild(btn("sx-light-btn", "+", function () { zoom(1.25); })).setAttribute("aria-label", "Zoom in");
    bar.appendChild(btn("sx-light-btn", "Fit", fit));
    if (caption) bar.appendChild(el("span", "sx-light-cap", caption));
    bar.appendChild(el("span", "sx-light-hint", "Scroll to zoom · drag to move"));
    bar.appendChild(btn("sx-light-btn sx-light-close", "✕ Close", closeLightbox));
    box.appendChild(bar);
    stage.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      var r = stage.getBoundingClientRect();
      zoom(ev.deltaY < 0 ? 1.12 : 1 / 1.12, ev.clientX - r.left, ev.clientY - r.top);
    }, { passive: false });
    var drag = null;
    stage.addEventListener("pointerdown", function (ev) {
      drag = { px: ev.clientX, py: ev.clientY, x: x, y: y };
      try { stage.setPointerCapture(ev.pointerId); } catch (e) {}
      stage.classList.add("is-drag");
    });
    stage.addEventListener("pointermove", function (ev) {
      if (!drag) return;
      x = drag.x + ev.clientX - drag.px;
      y = drag.y + ev.clientY - drag.py;
      apply();
    });
    function endDrag() { drag = null; stage.classList.remove("is-drag"); }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    box.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.stopPropagation(); closeLightbox(); }
      else if (ev.key === "+" || ev.key === "=") zoom(1.25);
      else if (ev.key === "-") zoom(1 / 1.25);
      else if (ev.key === "0") fit();
    });
    box.tabIndex = -1;
    document.body.appendChild(box);
    document.documentElement.classList.add("sx-noscroll");
    lightbox = box;
    fit();
    box.focus();
  }
  function expandDiagram(holder) {
    var svg = holder.querySelector("svg");
    if (!svg) { toast("The diagram hasn't finished drawing yet — try again in a moment."); return; }
    var w = 0, h = 0;
    try { var vb = svg.viewBox && svg.viewBox.baseVal; if (vb && vb.width) { w = vb.width; h = vb.height; } } catch (e) {}
    if (!w) { var r = svg.getBoundingClientRect(); w = r.width; h = r.height; }
    if (!w || !h) return;
    var copy = svg.cloneNode(true);                     // the page's own diagram stays where it is
    copy.removeAttribute("height");
    copy.setAttribute("width", "100%");
    copy.style.maxWidth = "none";
    copy.style.width = "100%";
    copy.style.height = "100%";
    var cap = holder.nextElementSibling;
    openLightbox(copy, w, h, cap && cap.classList.contains("sd-diagram-caption") ? norm(cap.textContent).slice(0, 110) : "");
  }
  function renderZoom(container) {
    Array.prototype.forEach.call(container.querySelectorAll(".mermaid"), function (d) {
      if (d.closest("[data-sd-ui]")) return;
      var tools = ui(el("div", "sx-zoom-tools"));
      tools.appendChild(btn("sx-copy", "⤢ Expand", function () { expandDiagram(d); })).title = "Open the diagram large — zoom and pan";
      d.parentNode.insertBefore(tools, d);
      d.addEventListener("dblclick", function () { expandDiagram(d); });
    });
    Array.prototype.forEach.call(container.querySelectorAll("img"), function (img) {
      if (img.closest("[data-sd-ui]") || img.closest("a")) return;
      function arm() {
        if (img.naturalWidth < 320) return;
        img.classList.add("sx-zoomable");
        img.title = img.title || "Click to enlarge";
        img.addEventListener("click", function () {
          var copy = img.cloneNode(false);
          copy.removeAttribute("width"); copy.removeAttribute("height");
          copy.className = "";
          copy.style.cssText = "width:100%;height:100%;max-width:none;display:block";
          openLightbox(copy, img.naturalWidth, img.naturalHeight, img.alt || "");
        });
      }
      if (img.complete) arm(); else img.addEventListener("load", arm, { once: true });
    });
  }

  /* =====================================================================
     10. DOCS PAGES — hover definitions from the "Term | Meaning" table
     ===================================================================== */
  function renderGlossary(container) {
    var defs = {}, order = [], firstTable = null;
    Array.prototype.forEach.call(container.querySelectorAll("table"), function (table) {
      if (table.closest("[data-sd-ui]")) return;
      var head = table.rows[0];
      if (!head || head.cells.length < 2) return;
      if (!/^terms?$/i.test(norm(head.cells[0].textContent))) return;
      if (!/meaning|definition|what it (is|means)/i.test(norm(head.cells[1].textContent))) return;
      if (!firstTable) firstTable = table;
      Array.prototype.slice.call(table.rows, 1).forEach(function (r) {
        if (r.cells.length < 2) return;
        var def = norm(r.cells[1].textContent);
        norm(r.cells[0].textContent).split(/\s+\/\s+|\s+or\s+/).forEach(function (raw) {
          var term = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
          var key = term.toLowerCase();
          if (term.length < 3 || term.length > 40 || !def || defs[key]) return;
          defs[key] = { term: term, def: def.length > 320 ? def.slice(0, 317) + "…" : def };
          order.push(term);
        });
      });
    });
    if (!order.length) return;
    order.sort(function (a, b) { return b.length - a.length; });
    var re;
    try { re = new RegExp("(?<![\\w-])(" + order.map(reEsc).join("|") + ")(?![\\w-])", "i"); }
    catch (e) { return; }                                 // no lookbehind support — skip quietly

    var SKIP = "a,code,pre,kbd,button,summary,label,table,h1,h2,h3,h4,h5,h6,script,style,[data-sd-ui]," +
               ".sx-term,.sd-note-marker,.sd-note-card,.sd-note-form,.mermaid,svg,.sd-learn,[data-breadcrumb]";
    var w = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
    var seen = {}, todo = [], n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 1) { if (n.tagName === "H2") seen = {}; continue; }   // each part explains a term once
      if (!(firstTable.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      var par = n.parentElement;
      if (!par || !par.closest("p,li,dd,blockquote") || par.closest(SKIP)) continue;
      var m = re.exec(n.data);
      if (!m) continue;
      var key = m[1].toLowerCase();
      if (seen[key]) continue;
      seen[key] = true;
      todo.push({ node: n, at: m.index, len: m[1].length, key: key });
    }
    todo.forEach(function (t) {
      try {
        var hit = t.node.splitText(t.at);
        hit.splitText(t.len);
        var span = el("span", "sx-term");
        span.tabIndex = 0;
        span.setAttribute("data-def", defs[t.key].def);
        span.setAttribute("data-term", defs[t.key].term);
        hit.parentNode.replaceChild(span, hit);
        span.appendChild(hit);                            // the same text node, now wrapped — the text is unchanged
      } catch (e) {}
    });
    if (!todo.length) return;
    var tip = ui(el("div", "sx-tip"));
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    document.body.appendChild(tip);
    function show(span) {
      tip.replaceChildren(el("b", null, span.getAttribute("data-term")), el("span", null, span.getAttribute("data-def")));
      tip.hidden = false;
      var r = span.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = Math.max(8, Math.min(window.innerWidth - tw - 8, r.left + r.width / 2 - tw / 2));
      var top = r.top - th - 8;
      if (top < stickyOffset()) top = r.bottom + 8;
      tip.style.left = left + "px";
      tip.style.top = top + "px";
    }
    function hide() { tip.hidden = true; }
    container.addEventListener("mouseover", function (ev) { var s = ev.target.closest && ev.target.closest(".sx-term"); if (s) show(s); });
    container.addEventListener("mouseout", function (ev) { if (ev.target.closest && ev.target.closest(".sx-term")) hide(); });
    container.addEventListener("focusin", function (ev) { if (ev.target.classList && ev.target.classList.contains("sx-term")) show(ev.target); });
    container.addEventListener("focusout", hide);
    window.addEventListener("scroll", hide, { passive: true });
  }

  /* =====================================================================
     11. DOCS PAGES — a small celebration when a page is marked covered
     ===================================================================== */
  function watchCoverage() {
    document.addEventListener("change", function (ev) {
      var cb = ev.target;
      if (!cb || !cb.closest || !cb.closest(".sd-cov-toggle") || !cb.checked) return;
      logActivity("covered");
      var r = cb.getBoundingClientRect();
      confetti(r.left + 10, r.top + 10);
      var cov = jget(K_COVERED, {});
      var done = PAGES.filter(function (p) { return cov[p.href] === true; }).length;
      var msg = "🎉 Covered — " + done + " of " + PAGES.length + " pages done.";
      if (HERE) {
        var sec = PAGES.filter(function (p) { return p.section === HERE.section; });
        var secDone = sec.filter(function (p) { return cov[p.href] === true; }).length;
        if (secDone === sec.length) msg = "🏆 " + HERE.section + " complete — every page covered! " + done + " of " + PAGES.length + " site-wide.";
      }
      var nextLink = document.querySelector(".sd-pager-next");
      toast(msg, nextLink ? { action: { label: "Next page →", fn: function () { nextLink.click(); } }, ms: 6500 } : { ms: 5000 });
    });
  }

  /* =====================================================================
     12. HOMEPAGE — the study hub (#studyHub)
     ===================================================================== */
  var hub = null;
  function paintHub() {
    if (!hub) return;
    hub.replaceChildren();
    var head = el("div", "sx-hub-head");
    head.appendChild(el("h2", null, "👋 Your study desk"));
    var quick = el("div", "sx-row");
    var sb = btn("sx-btn", null, function () { openSearch(); });
    sb.appendChild(el("span", null, "🔍 Search inside every page"));
    sb.appendChild(el("kbd", null, /Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘K" : "Ctrl K"));
    quick.appendChild(sb);
    quick.appendChild(btn("sx-btn", "🎲 Surprise me", function () { var p = randomUncovered(); if (p) goTo(p); }));
    head.appendChild(quick);
    hub.appendChild(head);

    var grid = el("div", "sx-hub-grid");

    // continue reading
    var c1 = el("div", "sx-card");
    c1.appendChild(el("div", "sx-card-kicker", "▶ Continue reading"));
    var last = lastRead();
    if (last) {
      c1.appendChild(el("div", "sx-card-title", (last.page.icon ? last.page.icon + " " : "") + last.page.title));
      c1.appendChild(el("div", "sx-card-sub", last.page.section + " · " + Math.round(last.p * 100) + "% read" + (last.h ? " · at “" + last.h + "”" : "")));
      var meter = el("div", "sx-meter");
      var fill = el("span");
      fill.style.width = Math.round(last.p * 100) + "%";
      meter.appendChild(fill);
      c1.appendChild(meter);
      c1.appendChild(btn("sx-btn sx-btn-primary", "Pick up where I left off →", function () { goTo(last.page, { pct: last.p }); }));
    } else {
      c1.appendChild(el("div", "sx-card-title", "Nothing in progress yet"));
      c1.appendChild(el("div", "sx-card-sub", "Open any page and it will show up here, with how far you got."));
      c1.appendChild(btn("sx-btn sx-btn-primary", "Start with a random page →", function () { var p = randomUncovered(); if (p) goTo(p); }));
    }
    grid.appendChild(c1);

    // streak + activity map
    var c2 = el("div", "sx-card");
    c2.appendChild(el("div", "sx-card-kicker", "🔥 Study streak"));
    var days = streak(), act = readActivity();
    var week = 0;
    for (var i = 0; i < 7; i++) if (dayScore(act[dayKey(addDays(new Date(), -i))])) week++;
    c2.appendChild(el("div", "sx-card-title", days ? days + " day" + (days === 1 ? "" : "s") + " in a row" : "No streak yet"));
    c2.appendChild(el("div", "sx-card-sub", "Active " + week + " of the last 7 days. Reading a page, marking one covered or answering practice questions counts."));
    var heat = el("div", "sx-heat");
    heat.setAttribute("role", "img");
    heat.setAttribute("aria-label", "Activity over the last 12 weeks");
    var today = new Date();
    var dow = (today.getDay() + 6) % 7;                     // Monday = 0
    var startDay = addDays(today, -(dow + 7 * 11));
    for (var d = 0; d < 84; d++) {
      var date = addDays(startDay, d);
      var cell = el("i");
      if (date > today) cell.className = "sx-heat-future";
      else {
        var rec = act[dayKey(date)], sc = dayScore(rec);
        cell.className = "sx-heat-" + (sc === 0 ? 0 : sc < 3 ? 1 : sc < 6 ? 2 : sc < 10 ? 3 : 4);
        cell.title = dayKey(date) + ": " + (rec ? ((rec.pg && rec.pg.length) || 0) + " pages read, " + (rec.c || 0) + " covered, " + (rec.q || 0) + " questions" : "no activity");
      }
      heat.appendChild(cell);
    }
    c2.appendChild(heat);
    grid.appendChild(c2);

    // practice
    var c3 = el("div", "sx-card");
    c3.appendChild(el("div", "sx-card-kicker", "🎯 Practice"));
    var due = dueCount(), learned = learnedCount();
    c3.appendChild(el("div", "sx-card-title", due ? due + " question" + (due === 1 ? "" : "s") + " due today" : "Nothing due right now"));
    c3.appendChild(el("div", "sx-card-sub", learned + " learned so far. Questions come from every page's Interview Answer and question bank; you grade yourself, and the ones you miss come back sooner."));
    c3.appendChild(btn("sx-btn sx-btn-primary", due ? "Review now →" : "Start a session →", function () { openPractice(); }));
    grid.appendChild(c3);

    // data
    var c4 = el("div", "sx-card");
    c4.appendChild(el("div", "sx-card-kicker", "💾 Your data"));
    c4.appendChild(el("div", "sx-card-title", "Backup & restore"));
    c4.appendChild(el("div", "sx-card-sub", backupLine() + " Export a file to keep everything safe or to move it to another device; importing merges and can be undone."));
    var row = el("div", "sx-row");
    dataControls(row);
    c4.appendChild(row);
    grid.appendChild(c4);

    hub.appendChild(grid);
  }
  function renderHub() {
    hub = document.getElementById("studyHub");
    if (!hub) return;
    hub.classList.add("sx-hub");
    paintHub();
    // the homepage's own search box: offer the full-text palette under its results
    var input = document.getElementById("siteSearch"), box = document.getElementById("searchResults");
    if (input && box) {
      var offer = function () {
        var q = input.value.trim();
        if (!q || box.hidden || box.querySelector(".sx-more")) return;
        var b = btn("sx-more", null, function () { openSearch(q); });
        b.appendChild(el("span", null, "🔍 Search inside every page for “" + q + "”"));
        b.appendChild(el("kbd", null, "Ctrl K"));
        box.appendChild(b);
      };
      input.addEventListener("input", offer);
      input.addEventListener("focus", offer);
    }
  }

  // a small public handle, so a page (or the console) can open any of these directly
  window.SDExtras = { search: openSearch, practice: openPractice, help: openHelp, data: openDataModal,
                      exportBackup: exportBackup, importBackup: importBackup, undoImport: undoImport };

  /* ---------- boot ---------- */
  ready(function () {
    if (!IS_DOC) { renderHub(); return; }
    applyPrefs();
    paintFocusPill();
    renderTools();
    watchCoverage();
    var container = findContainer();
    if (!container || (container.textContent || "").length < 400) return;
    if (HERE) logActivity("page", HERE.href);
    var saved = renderProgress(container);
    renderReadTime(container);
    renderCopyButtons(container);
    renderTableFilters(container);
    renderWideTables(container);
    renderStepWalk(container);
    renderZoom(container);
    try { renderGlossary(container); } catch (e) {}

    // where to land: a search hit / "continue" from another page, else offer the saved spot
    var jump = null;
    try {
      jump = JSON.parse(sessionStorage.getItem(K_JUMP) || "null");
      sessionStorage.removeItem(K_JUMP);
    } catch (e) {}
    if (jump && jump.path === herePath) {
      setTimeout(function () { doJump(jump); }, 450);     // after the outline, panel and diagrams have settled
    } else if (saved && !window.location.hash && saved.p > 0.08 && saved.p < 0.97) {
      setTimeout(function () {
        if (window.scrollY > 200 || modal) return;        // already reading, or busy in a dialog
        toast("You stopped " + Math.round(saved.p * 100) + "% through" + (saved.h ? " — at “" + saved.h + "”" : "") + ".",
          { action: { label: "Jump back ↓", fn: function () { doJump({ pct: saved.p }); } }, ms: 9000 });
      }, 900);
    }
  });
})();
