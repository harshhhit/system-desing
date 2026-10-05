/* Shared header + shell injector. Pure client-side, no build step.

   Reads:
     window.SITE_MAP    (assets/sitemap.js)  — sidebar sections + links
     window.SITE_PAGES  (assets/pages.js)    — per-page <title>/<h1>/subtitle/breadcrumb
     window.PAGE_CONFIG = { id: "<page-id>" } — set inline near the top of each page
     data-root="<rel>"  on this <script>      — relative path back to the sub-site root

   Renders / fills, when the matching mount points exist:
     #site-header-root      -> brand bar + daily-revision band
     .sidebar > nav         -> navigation, with the current link marked .active
     [data-page-title]      -> page <h1> text (+ document.title)
     [data-page-subtitle]   -> the lead line (innerHTML; only when the entry has one)
     [data-breadcrumb]      -> Home / Section / Title trail
     [data-topic-grid]      -> "browse by topic" cards (index pages)
     [data-resource-list]   -> downloadable-resource chips (index pages)
     [data-stat-topics] / [data-stat-pages] -> counts (index pages)
     [data-weekly-target]   -> "this week's reading target" widget (homepage)
     .sidebar               -> a search box that filters the nav
     content <h2>s (3+)     -> a numbered topic outline (left sidebar on desktop,
                               collapsed box + pinned part chips on mobile)
     the content area        -> a study panel to its right (Interview / Notes /
                               Reminders / Review / Commands), below it on narrow screens
     end of the content     -> previous / next page cards
     every <p> (and every substantial <li>) in the content area -> a "🗒️+"
                                            note marker, or the note you already saved there

   Everything is guarded: a missing map, missing PAGE_CONFIG, or a missing mount
   is a no-op, never an error. */
(function () {
  var thisScript = document.currentScript;
  var root = (thisScript && thisScript.getAttribute("data-root")) || "";
  var map = window.SITE_MAP;
  var pages = window.SITE_PAGES || null;
  var mount = document.getElementById("site-header-root");
  if (!map) return;

  var STORAGE_KEY = "sdnotes_revision_" + map.siteId;
  var DISMISS_KEY = "sdnotes_revision_dismissed_" + map.siteId;

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function allPages() {
    var out = [];
    map.sections.forEach(function (section) {
      section.pages.forEach(function (p) {
        out.push({ href: p.href, title: p.title, section: section.name });
      });
    });
    return out;
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
    catch (e) { return null; }
  }
  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function pickToday() {
    var list = allPages();
    if (!list.length) return null;
    var state = readState() || { date: "", history: [] };
    var today = todayStr();
    if (state.date === today && state.current) return state.current;
    var seen = state.history || [];
    var remaining = list.filter(function (p) { return seen.indexOf(p.href) === -1; });
    if (!remaining.length) { seen = []; remaining = list; }
    var pick = remaining[Math.floor(Math.random() * remaining.length)];
    seen = seen.concat([pick.href]);
    writeState({ date: today, current: pick, history: seen });
    return pick;
  }

  function isDismissedToday() {
    try { return localStorage.getItem(DISMISS_KEY) === todayStr(); } catch (e) { return false; }
  }
  function dismissToday() {
    try { localStorage.setItem(DISMISS_KEY, todayStr()); } catch (e) {}
  }

  /* ---- which SITE_PAGES entry is this page? ---- */
  function currentEntry() {
    if (!pages) return null;
    var cfg = window.PAGE_CONFIG;
    if (cfg && cfg.id && pages[cfg.id]) return pages[cfg.id];
    // fallback: match the current URL against each entry's href
    for (var id in pages) {
      if (!Object.prototype.hasOwnProperty.call(pages, id)) continue;
      try {
        var t = new URL(root + pages[id].href, window.location.href).pathname;
        if (t === window.location.pathname) return pages[id];
      } catch (e) {}
    }
    return null;
  }
  var entry = currentEntry();
  var activePath = null;
  if (entry) {
    try { activePath = new URL(root + entry.href, window.location.href).pathname; } catch (e) {}
  }

  /* ---- sticky strip: the coverage tracker and Listen bar live in here.
     It sits right AFTER #site-header-root (not inside it) so that
     position: sticky is bounded by <body> and the strip stays pinned while
     the page scrolls — a sticky child of the short header mount would scroll
     away with it. Its measured height is published as --sd-sticky-h so the
     desktop sidebar, anchor jumps and page-level sticky boxes sit below it. ---- */
  var stickyStrip = null;
  if (mount) {
    stickyStrip = document.createElement("div");
    stickyStrip.className = "sd-sticky";
    mount.insertAdjacentElement("afterend", stickyStrip);
  }
  function syncStickyHeight() {
    var h = stickyStrip ? stickyStrip.offsetHeight : 0;
    document.documentElement.style.setProperty("--sd-sticky-h", h + "px");
  }
  if (stickyStrip) {
    if (typeof window.ResizeObserver === "function") new window.ResizeObserver(syncStickyHeight).observe(stickyStrip);
    else window.addEventListener("resize", syncStickyHeight);
  }

  /* ---- top band: brand + home + today's revision ---- */
  function renderTopBand() {
    if (!mount) return;
    var pick = pickToday();

    var band = document.createElement("div");
    band.className = "sd-topband";

    var brand = document.createElement("a");
    brand.className = "sd-brand";
    brand.href = root + (map.home || "index.html");
    brand.textContent = (map.siteIcon || "📚") + " " + (map.siteName || "Notes");
    band.appendChild(brand);

    var home = document.createElement("a");
    home.className = "sd-home-btn";
    home.href = root + (map.parentHome || "index.html");
    home.title = "All notes (site home)";
    home.textContent = "🏠 Home";
    band.appendChild(home);

    if (pick && !isDismissedToday()) {
      var rev = document.createElement("div");
      rev.className = "sd-revision";

      var label = document.createElement("span");
      label.className = "sd-revision-label";
      label.textContent = "📌 Today's revision:";
      rev.appendChild(label);

      var link = document.createElement("a");
      link.className = "sd-revision-link";
      link.href = root + pick.href;
      link.textContent = pick.title;
      rev.appendChild(link);

      var dismiss = document.createElement("button");
      dismiss.className = "sd-revision-dismiss";
      dismiss.type = "button";
      dismiss.setAttribute("aria-label", "Dismiss revision suggestion for today");
      dismiss.textContent = "✕";
      dismiss.addEventListener("click", function () { dismissToday(); rev.remove(); });
      rev.appendChild(dismiss);

      band.appendChild(rev);
    }

    mount.appendChild(band);
  }

  /* ---- sidebar nav, rebuilt from SITE_MAP ---- */
  function renderSidebar() {
    var sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    var sidebarBrand = sidebar.querySelector(".brand");
    if (!sidebarBrand) {
      sidebarBrand = document.createElement("a");
      sidebarBrand.className = "brand";
      sidebar.insertBefore(sidebarBrand, sidebar.firstChild);
    }
    sidebarBrand.href = root + (map.home || "index.html");
    sidebarBrand.textContent = map.siteName || "Notes";

    var nav = sidebar.querySelector("nav");
    if (!nav) { nav = document.createElement("nav"); sidebar.appendChild(nav); }
    nav.replaceChildren();

    function isActivePage(page) {
      var target = root + page.href;
      var p = null;
      try { p = new URL(target, window.location.href).pathname; } catch (e) {}
      return (activePath && p === activePath) || p === window.location.pathname;
    }

    function renderPageList(pages) {
      var list = document.createElement("ul");
      pages.forEach(function (page) {
        var item = document.createElement("li");
        var link = document.createElement("a");
        link.href = root + page.href;
        link.textContent = page.title;
        link.dataset.href = page.href;
        if (isActivePage(page)) link.className = "active";
        item.appendChild(link);
        list.appendChild(item);
      });
      return list;
    }

    map.sections.forEach(function (section) {
      var heading = document.createElement("h3");
      heading.textContent = (section.icon ? section.icon + " " : "") + section.name;
      nav.appendChild(heading);

      if (section.groups && section.groups.length) {
        var byHref = {};
        section.pages.forEach(function (p) { byHref[p.href] = p; });
        section.groups.forEach(function (group) {
          var groupPages = group.hrefs.map(function (h) { return byHref[h]; }).filter(Boolean);
          var details = document.createElement("details");
          details.className = "sd-nav-group";
          var summary = document.createElement("summary");
          summary.textContent = group.name;
          details.appendChild(summary);
          details.appendChild(renderPageList(groupPages));
          if (groupPages.some(isActivePage)) details.open = true;
          nav.appendChild(details);
        });
      } else {
        nav.appendChild(renderPageList(section.pages));
      }

      if (section.resources && section.resources.length) {
        var resList = document.createElement("ul");
        section.resources.forEach(function (resource) {
          var item = document.createElement("li");
          var link = document.createElement("a");
          link.className = "resource";
          link.href = root + resource.href;
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = "📎 " + resource.title;
          item.appendChild(link);
          resList.appendChild(item);
        });
        nav.appendChild(resList);
      }
    });
  }

  /* ---- mobile nav drawer: below 860px the .sd-study-sidebar becomes an
     off-canvas drawer (CSS) opened by a floating "☰ Menu" button, so the
     page content comes first instead of ~100 sidebar links. Legacy .layout
     pages already have their own top-bar ☰ toggle, so they're left alone. ---- */
  function renderNavDrawer() {
    // the sidebar comes after this script in the page, so wait for it
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderNavDrawer, { once: true });
      return;
    }
    var sidebar = document.querySelector(".sd-study-sidebar");
    if (!sidebar) return;
    var body = document.body;

    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "sd-nav-fab";
    fab.setAttribute("aria-label", "Open navigation");
    fab.setAttribute("aria-expanded", "false");
    fab.textContent = "☰ Menu";

    var backdrop = document.createElement("div");
    backdrop.className = "sd-nav-backdrop";

    function setOpen(open) {
      body.classList.toggle("sd-nav-open", open);
      fab.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var active = sidebar.querySelector("nav a.active");
        if (active) { try { active.scrollIntoView({ block: "center" }); } catch (e) {} }
      }
    }
    fab.addEventListener("click", function () { setOpen(!body.classList.contains("sd-nav-open")); });
    backdrop.addEventListener("click", function () { setOpen(false); });
    sidebar.addEventListener("click", function (ev) { if (ev.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && body.classList.contains("sd-nav-open")) { setOpen(false); fab.focus(); }
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(min-width: 861px)");
      var onWide = function () { if (mq.matches) setOpen(false); };
      if (mq.addEventListener) mq.addEventListener("change", onWide);
      else if (mq.addListener) mq.addListener(onWide);
    }

    body.appendChild(backdrop);
    body.appendChild(fab);
  }

  /* ---- coverage tracker: a sticky "mark covered" bar on every SITE_MAP page,
     plus ✓ marks in the sidebar. State is per-viewer in localStorage. ---- */
  var COVERED_KEY = "sdnotes_covered_" + map.siteId;
  function readCovered() {
    try { return JSON.parse(localStorage.getItem(COVERED_KEY) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function writeCovered(o) {
    try { localStorage.setItem(COVERED_KEY, JSON.stringify(o)); } catch (e) {}
  }
  function allMapPages() {
    var out = [];
    map.sections.forEach(function (s) {
      s.pages.forEach(function (p) { out.push({ href: p.href, section: s.name }); });
    });
    return out;
  }
  function markCoveredLinks() {
    var cov = readCovered();
    // baked sidebar links carry no data-href, so match them by resolved path
    var byPath = {};
    allMapPages().forEach(function (p) {
      try { byPath[new URL(root + p.href, window.location.href).pathname] = p.href; } catch (e) {}
    });
    document.querySelectorAll(".sidebar nav a").forEach(function (a) {
      var href = a.dataset.href || byPath[a.pathname];
      if (href) a.classList.toggle("covered", cov[href] === true);
    });
  }
  function currentSection() {
    if (!entry) return null;
    var found = null;
    map.sections.forEach(function (s) {
      if (s.pages.some(function (p) { return p.href === entry.href; })) found = s;
    });
    return found;
  }
  function renderCoverageTracker() {
    if (!stickyStrip || !entry) return;
    var sec = currentSection();
    var all = allMapPages();

    var box = document.createElement("div");
    box.className = "sd-coverage";

    var toggle = document.createElement("label");
    toggle.className = "sd-cov-toggle";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    var txt = document.createElement("span");
    toggle.appendChild(cb);
    toggle.appendChild(txt);
    box.appendChild(toggle);

    var meter = document.createElement("div");
    meter.className = "sd-cov-meter";
    var fill = document.createElement("span");
    meter.appendChild(fill);
    box.appendChild(meter);

    var stat = document.createElement("span");
    stat.className = "sd-cov-stat";
    box.appendChild(stat);

    function paint() {
      var cov = readCovered();
      cb.checked = cov[entry.href] === true;
      txt.textContent = cb.checked ? "Covered" : "Mark covered";
      var secPages = sec ? sec.pages : [];
      var secDone = secPages.filter(function (p) { return cov[p.href]; }).length;
      var allDone = all.filter(function (p) { return cov[p.href]; }).length;
      fill.style.width = (secPages.length ? (secDone / secPages.length * 100) : 0) + "%";
      stat.textContent = (sec ? sec.name + " " + secDone + "/" + secPages.length : "") +
        "  ·  site " + allDone + "/" + all.length;
      markCoveredLinks();
    }
    cb.addEventListener("change", function () {
      var cov = readCovered();
      if (cb.checked) cov[entry.href] = true; else delete cov[entry.href];
      writeCovered(cov);
      paint();
    });
    paint();
    stickyStrip.appendChild(box);
    syncStickyHeight();
  }

  /* ---- weekly reading target: a homepage-only widget ([data-weekly-target]).
     Every Monday it picks a fresh batch of WEEKLY_TARGET_COUNT random pages —
     preferring pages not yet marked covered — as "this week's target", and
     counts down to Sunday. Unfinished picks are simply dropped and replaced
     with a new random batch next Monday; nothing carries over, so the state
     stays a single small object. Checking a target off marks it covered
     site-wide (shares COVERED_KEY with the coverage tracker above), so this
     widget's progress and the sidebar ✓ marks always agree. ---- */
  var WEEKLY_KEY = "sdnotes_weekly_" + map.siteId;
  var WEEKLY_TARGET_COUNT = 3;
  function mondayOf(d) {
    var m = new Date(d);
    m.setHours(0, 0, 0, 0);
    var day = m.getDay(); // 0 = Sun .. 6 = Sat
    m.setDate(m.getDate() + (day === 0 ? -6 : 1) - day);
    return m;
  }
  function dateKey(d) {
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function readWeekly() {
    try { return JSON.parse(localStorage.getItem(WEEKLY_KEY) || "null"); }
    catch (e) { return null; }
  }
  function writeWeekly(state) {
    try { localStorage.setItem(WEEKLY_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function pickWeek() {
    var list = allPages();
    if (!list.length) return null;
    var weekStart = dateKey(mondayOf(new Date()));
    var state = readWeekly();
    if (state && state.weekStart === weekStart && state.targets && state.targets.length) return state;

    var cov = readCovered();
    var pool = list.filter(function (p) { return cov[p.href] !== true; });
    if (pool.length < WEEKLY_TARGET_COUNT) pool = list.slice(); // not enough left uncovered — allow repeats
    var picks = [];
    var n = Math.min(WEEKLY_TARGET_COUNT, pool.length);
    for (var i = 0; i < n; i++) {
      picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    state = { weekStart: weekStart, targets: picks };
    writeWeekly(state);
    return state;
  }
  function renderWeeklyTarget() {
    var box = document.querySelector("[data-weekly-target]");
    if (!box) return;
    var state = pickWeek();
    if (!state) return;

    var sunday = mondayOf(new Date());
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    var daysLeft = Math.max(0, Math.ceil((sunday - new Date()) / 86400000));

    box.replaceChildren();
    var card = document.createElement("div");
    card.className = "sd-weekly";

    var head = document.createElement("div");
    head.className = "sd-weekly-head";
    var h = document.createElement("h2");
    h.textContent = "🎯 This week's reading target";
    head.appendChild(h);
    var countdown = document.createElement("span");
    countdown.className = "sd-weekly-countdown";
    countdown.textContent = daysLeft === 0
      ? "Last day — resets Monday"
      : daysLeft + " day" + (daysLeft === 1 ? "" : "s") + " left · resets Monday";
    head.appendChild(countdown);
    card.appendChild(head);

    var meter = document.createElement("div");
    meter.className = "sd-weekly-meter";
    var fill = document.createElement("span");
    meter.appendChild(fill);
    card.appendChild(meter);

    var stat = document.createElement("span");
    stat.className = "sd-weekly-stat";
    card.appendChild(stat);

    var list = document.createElement("ul");
    list.className = "sd-weekly-list";
    card.appendChild(list);

    function paint() {
      var cov = readCovered();
      var done = state.targets.filter(function (p) { return cov[p.href] === true; }).length;
      var total = state.targets.length;
      fill.style.width = (total ? (done / total * 100) : 0) + "%";
      stat.textContent = done + " / " + total + " done this week";
      list.replaceChildren();
      state.targets.forEach(function (p) {
        var li = document.createElement("li");
        li.className = "sd-weekly-item";
        var label = document.createElement("label");
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = cov[p.href] === true;
        cb.addEventListener("change", function () {
          var c = readCovered();
          if (cb.checked) c[p.href] = true; else delete c[p.href];
          writeCovered(c);
          paint();
          markCoveredLinks();
        });
        label.appendChild(cb);
        var a = document.createElement("a");
        a.href = root + p.href;
        a.textContent = p.title;
        label.appendChild(a);
        var sec = document.createElement("span");
        sec.className = "sd-weekly-section";
        sec.textContent = p.section;
        label.appendChild(sec);
        li.appendChild(label);
        list.appendChild(li);
      });
    }
    paint();
    box.appendChild(card);
  }

  /* ---- read-aloud: a "Listen" control that speaks the page's main content
     with the browser's Web Speech API (free — uses the voices already on the
     viewer's device; Chrome/Edge route to their cloud "Natural"/"Google"
     voices at no cost). Text is split by block element so the bar can show
     progress, highlight the sentence being read and scroll to it. The chosen
     voice and reading speed are remembered per-viewer in localStorage. The
     whole thing is a no-op when the browser has no speechSynthesis or the page
     has no real content container (e.g. the homepage). ---- */
  var TTS_RATE_KEY = "sdnotes_tts_rate";
  var TTS_VOICE_KEY = "sdnotes_tts_voice";
  /* higher = nicer / more natural; used to pick the default voice */
  function rankVoice(v) {
    var n = (v.name || "") + " " + (v.voiceURI || "");
    var s = 0;
    if (/natural|neural|online|enhanced|premium/i.test(n)) s += 100;
    if (/google/i.test(n)) s += 40;
    if (v.localService === false) s += 20;
    if (/^en[-_]us/i.test(v.lang || "")) s += 10;
    else if (/^en/i.test(v.lang || "")) s += 5;
    if (v.default) s += 1;
    return s;
  }
  function findReadableEl() {
    return document.querySelector(".sd-study-main")
        || document.querySelector("main")
        || document.querySelector(".layout")
        || document.querySelector("article");
  }
  function collectReadChunks(container) {
    var sel = "h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption,pre,tr,caption";
    var taken = [];
    var out = [];
    Array.prototype.forEach.call(container.querySelectorAll(sel), function (el) {
      if (el.closest("[data-breadcrumb]")) return;               // skip the nav trail
      if (el.closest("[data-sd-ui]")) return;                    // injected UI (contents, pager)
      if (el.closest(".sd-interview .sd-qa")) return;            // moves into the study panel
      for (var k = 0; k < taken.length; k++) {
        if (taken[k].contains(el)) return;                       // already inside a chunk
      }
      var text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length < 2) return;
      taken.push(el);
      out.push({ el: el, text: text });
    });
    return out;
  }
  function renderReadAloud() {
    // This script runs in <head>-ish position, before <main> is parsed, so wait
    // for the document before looking for the content container.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderReadAloud, { once: true });
      return;
    }
    if (!stickyStrip) return;
    var synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") return;

    var container = findReadableEl();
    if (!container) return;
    var chunks = collectReadChunks(container);
    var totalLen = chunks.reduce(function (n, c) { return n + c.text.length; }, 0);
    if (chunks.length < 2 || totalLen < 200) return;             // near-empty / index page

    var bar = document.createElement("div");
    bar.className = "sd-readaloud";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sd-tts-btn";
    bar.appendChild(btn);

    var stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "sd-tts-stop";
    stopBtn.textContent = "■ Stop";
    stopBtn.hidden = true;
    bar.appendChild(stopBtn);

    var status = document.createElement("span");
    status.className = "sd-tts-status";
    bar.appendChild(status);

    var rateSel = document.createElement("select");
    rateSel.className = "sd-tts-rate";
    rateSel.setAttribute("aria-label", "Reading speed");
    [["0.75", "0.75×"], ["1", "1×"], ["1.25", "1.25×"],
     ["1.5", "1.5×"], ["1.75", "1.75×"]].forEach(function (o) {
      var op = document.createElement("option");
      op.value = o[0]; op.textContent = o[1];
      rateSel.appendChild(op);
    });
    try { rateSel.value = localStorage.getItem(TTS_RATE_KEY) || "1"; } catch (e) {}
    if (!rateSel.value) rateSel.value = "1";
    bar.appendChild(rateSel);

    /* voice picker — English voices best-first, hidden until the list loads */
    var voiceSel = document.createElement("select");
    voiceSel.className = "sd-tts-voice";
    voiceSel.setAttribute("aria-label", "Voice");
    voiceSel.hidden = true;
    bar.appendChild(voiceSel);

    var savedVoice = "";
    try { savedVoice = localStorage.getItem(TTS_VOICE_KEY) || ""; } catch (e) {}

    function voiceList() {
      var all = synth.getVoices() || [];
      var en = all.filter(function (v) { return /^en/i.test(v.lang || ""); });
      var list = (en.length ? en : all).slice();
      list.sort(function (a, b) { return rankVoice(b) - rankVoice(a); });
      return list;
    }
    function populateVoices() {
      var list = voiceList();
      if (!list.length) return;
      voiceSel.replaceChildren();
      list.forEach(function (v) {
        var op = document.createElement("option");
        op.value = v.voiceURI || v.name;
        op.textContent = v.name + (v.localService === false ? " · online" : "");
        voiceSel.appendChild(op);
      });
      if (savedVoice && list.some(function (v) { return (v.voiceURI || v.name) === savedVoice; })) {
        voiceSel.value = savedVoice;
      } else {
        voiceSel.value = list[0].voiceURI || list[0].name;   // best available
      }
      voiceSel.hidden = false;
    }
    function currentVoice() {
      var want = voiceSel.value;
      if (!want) return null;
      var all = synth.getVoices() || [];
      for (var i = 0; i < all.length; i++) {
        if ((all[i].voiceURI || all[i].name) === want) return all[i];
      }
      return null;
    }
    populateVoices();
    if (voiceSel.hidden && typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", populateVoices);
    }

    var idx = 0, playing = false, paused = false, keepAlive = null, activeEl = null, gen = 0;

    function rate() {
      var r = parseFloat(rateSel.value) || 1;
      return Math.min(2, Math.max(0.5, r));
    }
    function clearActive() {
      if (activeEl) { activeEl.classList.remove("sd-tts-active"); activeEl = null; }
    }
    function highlight(el) {
      clearActive();
      activeEl = el;
      el.classList.add("sd-tts-active");
      var r = el.getBoundingClientRect();
      var top = (stickyStrip ? stickyStrip.offsetHeight : 0) + 20;
      if (r.top < top || r.bottom > (window.innerHeight || 0) - 20) {
        try { el.scrollIntoView({ block: "center", behavior: "smooth" }); }
        catch (e) { el.scrollIntoView(); }
      }
    }
    function setLabel() {
      btn.textContent = !playing ? "🔊 Listen" : paused ? "▶ Resume" : "⏸ Pause";
      stopBtn.hidden = !playing;
      status.textContent = playing ? (idx + 1) + " / " + chunks.length : "";
    }
    function stopKeepAlive() { if (keepAlive) { clearInterval(keepAlive); keepAlive = null; } }
    function startKeepAlive() {
      stopKeepAlive();
      // Chrome silently stops utterances longer than ~15s unless nudged.
      keepAlive = setInterval(function () {
        if (playing && !paused) { try { synth.pause(); synth.resume(); } catch (e) {} }
      }, 9000);
    }
    function finish() {
      playing = false; paused = false; idx = 0;
      stopKeepAlive(); clearActive(); setLabel();
    }
    function speakFrom(i) {
      if (i >= chunks.length) { finish(); return; }
      idx = i;
      var myGen = gen;
      var c = chunks[idx];
      highlight(c.el);
      setLabel();
      var u = new window.SpeechSynthesisUtterance(c.text);
      u.rate = rate();
      var v = currentVoice();
      if (v) { u.voice = v; u.lang = v.lang; }
      else { u.lang = document.documentElement.lang || "en"; }
      u.onend = function () { if (myGen === gen && playing && !paused) speakFrom(idx + 1); };
      u.onerror = function () { if (myGen === gen && playing && !paused) speakFrom(idx + 1); };
      synth.speak(u);
    }
    function start() { gen++; synth.cancel(); playing = true; paused = false; startKeepAlive(); speakFrom(0); }
    function stop() { gen++; synth.cancel(); finish(); }

    btn.addEventListener("click", function () {
      if (!playing) { start(); return; }
      if (paused) { paused = false; synth.resume(); startKeepAlive(); setLabel(); }
      else { paused = true; synth.pause(); stopKeepAlive(); setLabel(); }
    });
    stopBtn.addEventListener("click", stop);
    rateSel.addEventListener("change", function () {
      try { localStorage.setItem(TTS_RATE_KEY, rateSel.value); } catch (e) {}
      if (playing && !paused) { gen++; synth.cancel(); speakFrom(idx); }  // re-read current chunk at new speed
    });
    voiceSel.addEventListener("change", function () {
      savedVoice = voiceSel.value;
      try { localStorage.setItem(TTS_VOICE_KEY, voiceSel.value); } catch (e) {}
      if (playing && !paused) { gen++; synth.cancel(); speakFrom(idx); }  // re-read current chunk in the new voice
    });
    window.addEventListener("beforeunload", function () { try { synth.cancel(); } catch (e) {} });
    window.addEventListener("pagehide", function () { try { synth.cancel(); } catch (e) {} });

    setLabel();
    stickyStrip.appendChild(bar);
    syncStickyHeight();
  }

  /* ---- inline notes: a "🗒️+" marker next to every <p> in the content
     container, and next to any <li> substantial enough to be its own sentence
     (short one-line items like "Pods" or "kubectl" don't get one — the
     paragraph is the base unit, not every line). Click it to write a note;
     it's pinned right after that block until edited or deleted. Notes are
     keyed by page href + a hash of the block's own text (plus "#2", "#3"…
     when the same text appears more than once on the page), so a note stays
     attached to the right block even as other content is added or removed
     elsewhere on the page. Older notes were keyed "<index>|<hash>" — which
     broke whenever a block was inserted above them — and are migrated to
     the new key the first time their page is opened. Purely per-viewer, localStorage only — there is
     no server, so notes live only in the browser they were written in.
     Runs after renderReadAloud() so its markers/cards are never picked up as
     text to speak. ---- */
  var NOTES_KEY = "sdnotes_notes_" + map.siteId;
  function readNotes() {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function writeNotes(o) {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(o)); } catch (e) {}
  }
  function hashStr(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h = h | 0; }
    return (h >>> 0).toString(36);
  }
  function renderNotes() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderNotes, { once: true });
      return;
    }
    var container = findReadableEl();
    if (!container) return;
    var pageKey = entry ? entry.href : window.location.pathname;

    var LI_MIN_LEN = 40; // short one-line list items ("Pods", "kubectl") don't get their own marker

    var blocks = [];
    Array.prototype.forEach.call(container.querySelectorAll("p,li"), function (el) {
      if (el.closest("[data-breadcrumb]") || el.closest("[data-page-subtitle]")) return;
      if (el.closest("[data-sd-ui]")) return;
      if (el.closest(".sd-note-card") || el.closest(".sd-note-form")) return;
      if (el.closest(".sd-learn") || el.closest(".sd-next")) return;      // lesson nav blocks, not content
      if (el.closest(".sd-interview .sd-qa")) return;                     // moves into the study panel
      if (el.classList.contains("sd-callout-title")) return;
      var text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length < 2) return;
      if (el.tagName === "LI" && text.length < LI_MIN_LEN) return; // paragraphs are the base unit
      blocks.push({ el: el, text: text });
    });

    function place(el, node) {
      if (el.tagName === "LI") el.appendChild(node);
      else el.insertAdjacentElement("afterend", node);
    }
    function saveNote(pageNotes, id, text) {
      var store = readNotes();
      var pn = store[pageKey] || {};
      if (text) { pn[id] = { text: text, ts: Date.now() }; pageNotes[id] = pn[id]; }
      else { delete pn[id]; delete pageNotes[id]; }
      store[pageKey] = pn;
      writeNotes(store);
    }
    function buildMarker(el, id, pageNotes) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sd-note-marker";
      btn.setAttribute("aria-label", "Add a note here");
      btn.textContent = "🗒️+";
      btn.addEventListener("click", function () { btn.replaceWith(buildForm(el, id, pageNotes, "")); });
      return btn;
    }
    function buildCard(el, id, pageNotes) {
      var note = pageNotes[id];
      var card = document.createElement("div");
      card.className = "sd-note-card";
      var body = document.createElement("p");
      body.className = "sd-note-text";
      body.textContent = note.text;
      card.appendChild(body);
      var actions = document.createElement("div");
      actions.className = "sd-note-actions";
      var editBtn = document.createElement("button");
      editBtn.type = "button"; editBtn.textContent = "✏️ Edit";
      var delBtn = document.createElement("button");
      delBtn.type = "button"; delBtn.textContent = "🗑️ Delete";
      actions.appendChild(editBtn); actions.appendChild(delBtn);
      card.appendChild(actions);
      editBtn.addEventListener("click", function () { card.replaceWith(buildForm(el, id, pageNotes, note.text)); });
      delBtn.addEventListener("click", function () {
        saveNote(pageNotes, id, null);
        card.replaceWith(buildMarker(el, id, pageNotes));
      });
      return card;
    }
    function buildForm(el, id, pageNotes, initial) {
      var wrap = document.createElement("div");
      wrap.className = "sd-note-form";
      var ta = document.createElement("textarea");
      ta.className = "sd-note-input";
      ta.value = initial || "";
      ta.placeholder = "Write a note about this…";
      wrap.appendChild(ta);
      var actions = document.createElement("div");
      actions.className = "sd-note-actions";
      var saveBtn = document.createElement("button");
      saveBtn.type = "button"; saveBtn.textContent = "Save";
      var cancelBtn = document.createElement("button");
      cancelBtn.type = "button"; cancelBtn.textContent = "Cancel";
      actions.appendChild(saveBtn); actions.appendChild(cancelBtn);
      wrap.appendChild(actions);
      saveBtn.addEventListener("click", function () {
        var val = ta.value.trim();
        if (!val) { wrap.replaceWith(pageNotes[id] ? buildCard(el, id, pageNotes) : buildMarker(el, id, pageNotes)); return; }
        saveNote(pageNotes, id, val);
        wrap.replaceWith(buildCard(el, id, pageNotes));
      });
      cancelBtn.addEventListener("click", function () {
        wrap.replaceWith(pageNotes[id] ? buildCard(el, id, pageNotes) : buildMarker(el, id, pageNotes));
      });
      setTimeout(function () { ta.focus(); }, 0);
      return wrap;
    }

    var store = readNotes();
    var pageNotes = store[pageKey] || {};
    var LEGACY_ID = /^\d+\|/;
    var seen = {};
    var migrated = false;
    function legacyFor(i, h) {
      if (pageNotes[i + "|" + h]) return i + "|" + h;           // block hasn't moved
      var suffix = "|" + h, found = null;
      Object.keys(pageNotes).forEach(function (k) {            // block moved: same text, other index
        if (!found && LEGACY_ID.test(k) && k.slice(-suffix.length) === suffix) found = k;
      });
      return found;
    }
    var ids = blocks.map(function (block) {
      var h = hashStr(block.text);
      seen[h] = (seen[h] || 0) + 1;
      return seen[h] === 1 ? h : h + "#" + seen[h];
    });
    blocks.forEach(function (block, i) {
      var id = ids[i];
      if (pageNotes[id]) return;
      var old = legacyFor(i, hashStr(block.text));
      if (old) { pageNotes[id] = pageNotes[old]; delete pageNotes[old]; migrated = true; }
    });
    if (migrated) { store[pageKey] = pageNotes; writeNotes(store); }
    blocks.forEach(function (block, i) {
      var id = ids[i];
      var node = pageNotes[id] ? buildCard(block.el, id, pageNotes) : buildMarker(block.el, id, pageNotes);
      place(block.el, node);
    });
  }

  /* ---- sidebar search: a filter box above the sidebar nav. Typing narrows
     the nav to links whose title — or section / group name — contains every
     typed word, opening the groups that hold a match and hiding empty
     sections. Enter opens the first match, Esc clears; "/" anywhere on the
     page focuses the box (opening the mobile drawer first). Runtime-only:
     the box sits outside the baked <nav>, so regen-sidebars.js never sees it. ---- */
  function renderNavSearch() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderNavSearch, { once: true });
      return;
    }
    var sidebar = document.querySelector(".sidebar");
    var nav = sidebar && sidebar.querySelector("nav");
    if (!nav) return;

    var box = document.createElement("div");
    box.className = "sd-nav-search";
    var input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Search pages…   /";
    input.setAttribute("aria-label", "Search pages");
    input.autocomplete = "off";
    box.appendChild(input);
    var empty = document.createElement("p");
    empty.className = "sd-nav-empty";
    empty.textContent = "No pages match.";
    empty.hidden = true;
    box.appendChild(empty);
    sidebar.insertBefore(box, nav);

    // split the nav into per-section segments: an <h3> plus the blocks under it
    var segs = [], cur = null;
    Array.prototype.forEach.call(nav.children, function (ch) {
      if (ch.tagName === "H3") { cur = { h3: ch, blocks: [] }; segs.push(cur); return; }
      if (!cur) { cur = { h3: null, blocks: [] }; segs.push(cur); }
      cur.blocks.push(ch);
    });
    function norm(s) { return (s || "").toLowerCase().replace(/\s+/g, " "); }

    function filter(q) {
      var words = norm(q).split(" ").filter(Boolean);
      var on = words.length > 0;
      var total = 0;
      segs.forEach(function (seg) {
        var segText = seg.h3 ? norm(seg.h3.textContent) : "";
        var segHits = 0;
        seg.blocks.forEach(function (block) {
          var isGroup = block.tagName === "DETAILS";
          if (isGroup && block.dataset.sdOpen == null) block.dataset.sdOpen = block.open ? "1" : "0";
          var groupText = isGroup ? norm((block.querySelector("summary") || {}).textContent) : "";
          var hits = 0;
          Array.prototype.forEach.call(block.querySelectorAll("li"), function (li) {
            var hay = segText + " " + groupText + " " + norm(li.textContent);
            var match = !on || words.every(function (w) { return hay.indexOf(w) !== -1; });
            li.hidden = !match;
            if (match) hits++;
          });
          block.hidden = on && hits === 0;
          if (isGroup) block.open = on ? hits > 0 : block.dataset.sdOpen === "1";
          segHits += hits;
        });
        if (seg.h3) seg.h3.hidden = on && segHits === 0;
        total += segHits;
      });
      empty.hidden = !on || total > 0;
    }
    input.addEventListener("input", function () { filter(input.value); });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        var first = Array.prototype.find.call(nav.querySelectorAll("li:not([hidden]) > a"),
          function (a) { return !a.closest("[hidden]"); });
        if (first) { ev.preventDefault(); first.click(); }
      } else if (ev.key === "Escape" && input.value) {
        ev.stopPropagation();          // clear first; a second Esc closes the drawer
        input.value = ""; filter("");
      }
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "/" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var t = ev.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      ev.preventDefault();
      var fab = document.querySelector(".sd-nav-fab");
      if (fab && fab.offsetParent !== null && !document.body.classList.contains("sd-nav-open")) fab.click();
      input.focus();
    });
  }

  /* ---- reading order: SITE_MAP pages in the order the sidebar shows them
     (grouped sections follow their groups' order). Shared by the pager. ---- */
  function readingOrder() {
    var out = [];
    map.sections.forEach(function (s) {
      var list = s.pages;
      if (s.groups && s.groups.length) {
        var byHref = {};
        s.pages.forEach(function (p) { byHref[p.href] = p; });
        list = [];
        s.groups.forEach(function (g) {
          g.hrefs.forEach(function (h) { if (byHref[h]) list.push(byHref[h]); });
        });
      }
      list.forEach(function (p) { out.push({ href: p.href, title: p.title, section: s.name }); });
    });
    return out;
  }

  /* ---- previous / next: two cards at the end of the content, following the
     sidebar's reading order across sections, so finishing a page isn't a
     dead end. Only on pages that are in SITE_MAP. ---- */
  function renderPager() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderPager, { once: true });
      return;
    }
    if (!entry) return;
    var container = findReadableEl();
    if (!container) return;
    var order = readingOrder();
    var at = -1;
    order.forEach(function (p, i) { if (p.href === entry.href) at = i; });
    if (at === -1) return;
    var prev = order[at - 1], next = order[at + 1];
    if (!prev && !next) return;

    var pager = document.createElement("nav");
    pager.className = "sd-pager";
    pager.setAttribute("aria-label", "Previous and next page");
    pager.setAttribute("data-sd-ui", "");
    function card(p, dir) {
      var a = document.createElement("a");
      a.className = "sd-pager-link sd-pager-" + dir;
      a.href = root + p.href;
      a.rel = dir;
      var k = document.createElement("span");
      k.className = "sd-pager-kicker";
      k.textContent = (dir === "prev" ? "← Previous" : "Next →") + (p.section !== entry.section ? " · " + p.section : "");
      var t = document.createElement("span");
      t.className = "sd-pager-title";
      t.textContent = p.title;
      a.appendChild(k); a.appendChild(t);
      return a;
    }
    pager.appendChild(prev ? card(prev, "prev") : document.createElement("span"));
    if (next) pager.appendChild(card(next, "next"));

    var footer = container.querySelector(":scope > .page-footer");
    if (footer) container.insertBefore(pager, footer); else container.appendChild(pager);
  }

  /* ---- topic outline: a numbered contents list built from the content's <h2>s
     (only when there are 3+). Topic pages tag each <h2> with data-stage="…";
     the twelve standard parts (STAGE_ORDER) always carry the same number on
     every page — "09 Troubleshooting" means the same thing everywhere — and a
     part a topic doesn't need is simply absent (never an empty heading).
     Older lesson stages ("Foundations", "In production" …) keep their label
     unnumbered. Desktop (> 860px): the outline sits at the top of the LEFT
     sidebar, above the site navigation, and highlights the part being read.
     Narrow screens: a collapsed "On this page" box above the content, plus a
     horizontal strip of part chips pinned in the sticky bar. Headings without
     an id get one (slug of their text); existing ids are never changed. ---- */
  var STAGE_ORDER = ["Overview", "Core Concepts", "Architecture", "How It Works", "Implementation",
    "Production", "Security", "Performance & Scalability", "Troubleshooting", "Best Practices",
    "Interview Preparation", "Summary"];
  function stageNum(stage) {
    var i = STAGE_ORDER.indexOf(stage);
    return i === -1 ? "" : (i < 9 ? "0" : "") + (i + 1);
  }
  function renderToc() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderToc, { once: true });
      return;
    }
    var container = findReadableEl();
    if (!container) return;
    var heads = Array.prototype.filter.call(container.querySelectorAll("h2"), function (h) {
      return !h.closest("[data-sd-ui]") && !h.closest(".sd-learn") && (h.textContent || "").trim();
    });
    if (heads.length < 3) return;

    var used = {};
    Array.prototype.forEach.call(document.querySelectorAll("[id]"), function (el) { used[el.id] = true; });
    function slug(s) {
      var base = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
      var id = base, n = 2;
      while (used[id]) id = base + "-" + n++;
      used[id] = true;
      return id;
    }

    var toc = document.createElement("details");
    toc.className = "sd-toc";
    toc.setAttribute("data-sd-ui", "");
    var sum = document.createElement("summary");
    sum.textContent = "On this page";
    toc.appendChild(sum);
    // "Section n of N" + a thin progress meter, updated by spy() below
    var where = document.createElement("div");
    where.className = "sd-toc-where";
    var whereText = document.createElement("span");
    var meter = document.createElement("span");
    meter.className = "sd-toc-meter";
    var meterFill = document.createElement("span");
    meter.appendChild(meterFill);
    where.appendChild(whereText);
    where.appendChild(meter);
    toc.appendChild(where);

    // a part label is emitted whenever data-stage changes; numbered parts also
    // label the heading itself (h2[data-stage-label] — see site.css)
    var list = document.createElement("ol");
    var links = [];
    var stageLabels = [];
    var stages = [];          // [{label, head}] — one per part, for the mobile chip strip
    var lastStage = null;
    heads.forEach(function (h, i) {
      if (!h.id) h.id = slug(h.textContent.trim());
      var stage = h.getAttribute("data-stage");
      var num = stage ? stageNum(stage) : "";
      if (stage) h.setAttribute("data-stage-label", (num ? num + " · " : "") + stage);
      if (stage && stage !== lastStage) {
        var sl = document.createElement("li");
        sl.className = "sd-toc-stage";
        var sa = document.createElement("a");
        sa.href = "#" + h.id;
        if (num) {
          var sn = document.createElement("span");
          sn.className = "sd-toc-num";
          sn.textContent = num;
          sa.appendChild(sn);
        }
        sa.appendChild(document.createTextNode(stage));
        sl.appendChild(sa);
        list.appendChild(sl);
        stages.push({ label: (num ? num + " " : "") + stage, head: i });
        lastStage = stage;
      }
      stageLabels.push(stage ? (num ? num + " " : "") + stage : (lastStage || ""));
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.replace(/\s+/g, " ").trim();
      li.appendChild(a);
      list.appendChild(li);
      links.push(a);
    });
    toc.appendChild(list);

    // "Up next": the following page in the sidebar's reading order
    if (entry) {
      var order = readingOrder(), at = -1;
      order.forEach(function (p, i) { if (p.href === entry.href) at = i; });
      var nxt = at > -1 ? order[at + 1] : null;
      if (nxt) {
        var up = document.createElement("a");
        up.className = "sd-toc-next";
        up.href = root + nxt.href;
        var k = document.createElement("span");
        k.textContent = "Up next";
        up.appendChild(k);
        up.appendChild(document.createTextNode(nxt.title));
        toc.appendChild(up);
      }
    }

    // mobile: a horizontal, pinned strip of part chips (lesson pages only)
    var strip = null, chips = [];
    if (stages.length >= 2 && stickyStrip) {
      strip = document.createElement("nav");
      strip.className = "sd-stage-strip";
      strip.setAttribute("aria-label", "Parts of this page");
      stages.forEach(function (s) {
        var c = document.createElement("a");
        c.href = "#" + heads[s.head].id;
        c.textContent = s.label;
        strip.appendChild(c);
        chips.push({ a: c, head: s.head });
      });
      stickyStrip.appendChild(strip);
      syncStickyHeight();
    }

    var sidebar = document.querySelector(".sidebar");
    var anchor = container.querySelector("[data-page-subtitle]") || container.querySelector("[data-page-title]");
    var mq = window.matchMedia ? window.matchMedia("(min-width: 861px)") : null;
    function place() {
      if (sidebar && mq && mq.matches) {
        // desktop: top of the left sidebar, above the search box + site nav
        toc.classList.add("sd-toc-side");
        sidebar.insertBefore(toc, sidebar.querySelector(".sd-nav-search") || sidebar.querySelector("nav"));
        toc.open = true;
      } else {
        toc.classList.remove("sd-toc-side");
        if (anchor) anchor.insertAdjacentElement("afterend", toc);
        else container.insertBefore(toc, container.firstChild);
        toc.open = false;
      }
    }
    place();
    if (mq) {
      if (mq.addEventListener) mq.addEventListener("change", place);
      else if (mq.addListener) mq.addListener(place);
    }
    // the sidebar outline stays open; clicking its title shouldn't collapse it
    sum.addEventListener("click", function (ev) {
      if (toc.classList.contains("sd-toc-side")) ev.preventDefault();
    });

    // highlight the section currently at the top of the reading area
    var ticking = false, lastChip = null;
    function spy() {
      ticking = false;
      var line = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sd-sticky-h")) || 0;
      line += 90;
      var cur = -1;
      heads.forEach(function (h, i) { if (h.getBoundingClientRect().top <= line) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
      var shown = Math.max(cur, 0);
      whereText.textContent = "Section " + (shown + 1) + " of " + heads.length +
        (stageLabels[shown] ? " · " + stageLabels[shown] : "");
      meterFill.style.width = Math.round(((cur + 1) / heads.length) * 100) + "%";
      if (chips.length) {
        var on = null;
        chips.forEach(function (c) { if (c.head <= shown) on = c; });
        chips.forEach(function (c) { c.a.classList.toggle("active", c === on); });
        if (on && on !== lastChip && strip.offsetParent !== null) {
          strip.scrollTo({ left: on.a.offsetLeft - 12, behavior: "smooth" });
        }
        lastChip = on;
      }
      if (toc.classList.contains("sd-toc-side") && links[shown] && sidebar) {
        // keep the active outline entry visible inside the scrolling sidebar
        var r = links[shown].getBoundingClientRect(), sr = sidebar.getBoundingClientRect();
        if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) {
          sidebar.scrollTop += r.top - sr.top - sr.height / 3;
        }
      }
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(spy); }
    }, { passive: true });
    spy();
  }

  /* ---- study panel: the revision workspace to the RIGHT of the content
     (≥ 1280px; below the content on narrower screens). It never holds theory —
     only the layer you revise and practise with:
       Interview  – questions grouped Basic / Intermediate / Advanced / Scenario.
                    Topic pages author them in <section class="sd-interview"> as
                    <details class="sd-qa" data-level="…"><summary>Q</summary>…A…</details>;
                    those are MOVED here (the page keeps a pointer). Pages without
                    that section get questions harvested (copied) from what they
                    already have: the Interview Answer block, its follow-up Q&A,
                    "Quick check" items, 🎯 interview callouts, and "…?" headings.
       Notes      – a free-form scratchpad for this page (+ the inline 🗒️ notes)
       Reminders  – a per-page checklist: suggested items + your own
       Review     – headings / questions you flagged "review later", site-wide
       Commands   – CLI lines found in this page's code blocks, with copy buttons
     All state is per-viewer localStorage (no server), like the inline notes. ---- */
  var PAD_KEY = "sdnotes_pad_" + map.siteId;
  var REM_KEY = "sdnotes_reminders_" + map.siteId;
  var REVIEW_KEY = "sdnotes_review_" + map.siteId;
  var PANEL_TAB_KEY = "sdnotes_panel_tab";
  var PANEL_HIDE_KEY = "sdnotes_panel_hidden";
  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) { return {}; }
  }
  function writeJSON(key, o) {
    try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) {}
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function cleanText(n) { return (n.textContent || "").replace(/\s+/g, " ").trim(); }

  var QA_LEVELS = [["basic", "Basic"], ["intermediate", "Intermediate"], ["advanced", "Advanced"], ["scenario", "Scenario"]];
  var CMD_RE = /^(?:\$\s+|#\s+(?=sudo|kubectl))?(?:sudo\s+)?(kubectl|kubeadm|etcdctl|crictl|helm|aws|eksctl|terraform|docker|podman|nginx|curl|wget|dig|nslookup|host|nc|ping|traceroute|mtr|ss|netstat|lsof|tcpdump|openssl|systemctl|journalctl|ps|top|htop|free|df|du|vmstat|iostat|tail|less|grep|awk|git|gh|gitleaks|psql|pg_dump|pg_restore|pg_isready|pgbouncer|mysql|mysqldump|redis-cli|mongosh|gunicorn|uvicorn|python3?|pip3?|npm|npx|node|yarn|ssh|scp|kafka-[\w-]+|ab|wrk|hey|watch|ulimit|sysctl|iptables|nft|ip|certbot|htpasswd|openssl)\b/;

  function renderStudyPanel() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderStudyPanel, { once: true });
      return;
    }
    var container = findReadableEl();
    if (!container || !container.parentNode) return;
    if (!/\S/.test(container.textContent || "") || (container.textContent || "").length < 400) return;
    var pageKey = entry ? entry.href : window.location.pathname;
    var pageTitle = (entry && entry.title) || cleanText(container.querySelector("h1") || { textContent: document.title });

    var panel = el("aside", "sd-panel");
    panel.setAttribute("data-sd-ui", "");
    panel.setAttribute("aria-label", "Study panel");
    var head = el("div", "sd-panel-head");
    head.appendChild(el("span", "sd-panel-title", "Study panel"));
    var hideBtn = el("button", "sd-panel-hide", "Hide ⟩");
    hideBtn.type = "button";
    hideBtn.title = "Hide the study panel (widens the content)";
    head.appendChild(hideBtn);
    panel.appendChild(head);
    var tabBar = el("div", "sd-panel-tabs");
    tabBar.setAttribute("role", "tablist");
    panel.appendChild(tabBar);
    var tabs = {};
    function addTab(key, label) {
      var b = el("button", "sd-panel-tab");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.appendChild(document.createTextNode(label));
      var badge = el("span", "sd-panel-badge");
      b.appendChild(badge);
      var body = el("div", "sd-panel-body");
      body.setAttribute("role", "tabpanel");
      body.hidden = true;
      tabBar.appendChild(b);
      panel.appendChild(body);
      tabs[key] = { btn: b, body: body, badge: badge };
      b.addEventListener("click", function () { showTab(key, true); });
      return body;
    }
    function setBadge(key, n) { if (tabs[key]) tabs[key].badge.textContent = n ? String(n) : ""; }
    function showTab(key, remember) {
      Object.keys(tabs).forEach(function (k) {
        var on = k === key;
        tabs[k].body.hidden = !on;
        tabs[k].btn.classList.toggle("active", on);
        tabs[k].btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (remember) { try { localStorage.setItem(PANEL_TAB_KEY, key); } catch (e) {} }
    }

    /* -- Interview -- */
    var ivBody = addTab("interview", "Interview");
    var bank = container.querySelector(".sd-interview");
    var qas = [];           // {level, node}
    var tips = [];
    function mkQA(level, qText, answerNodes, jumpTo) {
      var d = el("details", "sd-qa");
      d.setAttribute("data-level", level);
      d.appendChild(el("summary", null, qText));
      var ans = el("div", "sd-qa-a");
      answerNodes.forEach(function (n) { ans.appendChild(n); });
      if (jumpTo && jumpTo.id) {
        var j = el("a", "sd-qa-jump", "↳ Read it on the page");
        j.href = "#" + jumpTo.id;
        ans.appendChild(j);
      }
      d.appendChild(ans);
      return d;
    }
    function textP(s) { return el("p", null, s); }
    function cloneClean(n) {
      var c = n.cloneNode(true);
      Array.prototype.forEach.call(c.querySelectorAll(".sd-note-marker,.sd-note-card,.sd-note-form,[data-sd-ui],.sd-callout-title,.sd-note-title"),
        function (x) { x.remove(); });
      c.removeAttribute("id");
      Array.prototype.forEach.call(c.querySelectorAll("[id]"), function (x) { x.removeAttribute("id"); });
      return c;
    }
    if (bank) {
      Array.prototype.forEach.call(bank.querySelectorAll(".sd-qa"), function (d) {
        qas.push({ level: d.getAttribute("data-level") || "basic", node: d });
      });
      Array.prototype.forEach.call(bank.querySelectorAll(".sd-callout.interview"), function (c) { tips.push(c); });
    } else {
      var headsAll = Array.prototype.slice.call(container.querySelectorAll("h2,h3,h4"));
      headsAll.forEach(function (h) {
        var t = cleanText(h);
        if (/^Interview Answer/i.test(t)) {
          var concept = t.replace(/^Interview Answer\s*[—–-]\s*/i, "").replace(/\?$/, "");
          var note = null, sib = h.nextElementSibling;
          while (sib && !/^H[12]$/.test(sib.tagName)) {
            if (sib.classList.contains("sd-study-note") && /Simple interview version/i.test(sib.textContent)) { note = sib; break; }
            sib = sib.nextElementSibling;
          }
          if (note) {
            var parts = Array.prototype.map.call(note.querySelectorAll("p"), cloneClean);
            if (!h.id) h.id = "interview-answer";
            qas.push({ level: "basic", node: mkQA("basic", "In 30 seconds: " + concept.replace(/^what is\s+/i, "what is ") + "?", parts, h) });
          }
        } else if (/^One important interview follow-up/i.test(t)) {
          var s = h.nextElementSibling, q = null, ans = [];
          while (s && !/^H[1-4]$/.test(s.tagName)) {
            var st = cleanText(s);
            if (!q && /^Q[:.]/.test(st)) q = st.replace(/^Q[:.]\s*/, "");
            else if (q && !s.classList.contains("sd-callout")) {
              var c = cloneClean(s);
              var strong = c.querySelector("strong");
              if (strong && /^A[:.]?$/.test(cleanText(strong))) strong.remove();
              ans.push(c);
            }
            s = s.nextElementSibling;
          }
          if (q && ans.length) qas.push({ level: "intermediate", node: mkQA("intermediate", q, ans, h) });
        } else if (/^Quick check$/i.test(t)) {
          var list = h.nextElementSibling;
          if (list && /^(UL|OL)$/.test(list.tagName)) {
            Array.prototype.forEach.call(list.children, function (li) {
              var strong = li.querySelector("strong");
              if (!strong) return;
              var c = cloneClean(li);
              var qs = c.querySelector("strong");
              var qt = cleanText(qs);
              qs.remove();
              var a = el("p");
              while (c.firstChild) a.appendChild(c.firstChild);
              qas.push({ level: "basic", node: mkQA("basic", qt, [a], h) });
            });
          }
        } else if (/\?$/.test(t) && h.tagName !== "H4" && !h.hasAttribute("data-stage") && !h.closest("[data-sd-ui]")) {
          // a "…?" heading on a Q&A-style page; lesson headings (h2[data-stage]) are concepts, not questions
          if (!h.id) h.id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
          qas.push({ level: "intermediate", node: mkQA("intermediate", t, [textP("Answered in this section of the page.")], h) });
        }
      });
      Array.prototype.forEach.call(container.querySelectorAll(".sd-callout.interview"), function (c) {
        tips.push(cloneClean(c));
      });
    }
    // level filter chips
    var counts = {};
    qas.forEach(function (q) { counts[q.level] = (counts[q.level] || 0) + 1; });
    if (qas.length) {
      var filt = el("div", "sd-qa-filter");
      var chipAll = el("button", "active", "All " + qas.length);
      chipAll.type = "button";
      filt.appendChild(chipAll);
      var chipEls = [chipAll];
      QA_LEVELS.forEach(function (lv) {
        if (!counts[lv[0]]) return;
        var b = el("button", null, lv[1] + " " + counts[lv[0]]);
        b.type = "button";
        b.setAttribute("data-level", lv[0]);
        filt.appendChild(b);
        chipEls.push(b);
      });
      var toggleAll = el("button", "sd-qa-toggle", "Show answers");
      toggleAll.type = "button";
      filt.appendChild(toggleAll);
      ivBody.appendChild(filt);
      var groups = el("div", "sd-qa-groups");
      QA_LEVELS.forEach(function (lv) {
        var mine = qas.filter(function (q) { return q.level === lv[0]; });
        if (!mine.length) return;
        var g = el("section", "sd-qa-group");
        g.setAttribute("data-level", lv[0]);
        g.appendChild(el("h4", null, lv[1]));
        mine.forEach(function (q) { g.appendChild(q.node); });
        groups.appendChild(g);
      });
      // anything with an unknown level still shows, last
      var other = qas.filter(function (q) { return !QA_LEVELS.some(function (lv) { return lv[0] === q.level; }); });
      if (other.length) {
        var og = el("section", "sd-qa-group");
        og.appendChild(el("h4", null, "More"));
        other.forEach(function (q) { og.appendChild(q.node); });
        groups.appendChild(og);
      }
      ivBody.appendChild(groups);
      chipEls.forEach(function (b) {
        b.addEventListener("click", function () {
          var lv = b.getAttribute("data-level");
          chipEls.forEach(function (x) { x.classList.toggle("active", x === b); });
          Array.prototype.forEach.call(groups.children, function (g) {
            g.hidden = !!lv && g.getAttribute("data-level") !== lv;
          });
        });
      });
      var allOpen = false;
      toggleAll.addEventListener("click", function () {
        allOpen = !allOpen;
        Array.prototype.forEach.call(groups.querySelectorAll("details.sd-qa"), function (d) { d.open = allOpen; });
        toggleAll.textContent = allOpen ? "Hide answers" : "Show answers";
      });
    } else {
      ivBody.appendChild(el("p", "sd-panel-empty", "No interview questions on this page yet."));
    }
    if (tips.length) {
      var tw = el("div", "sd-qa-tips");
      tw.appendChild(el("h4", null, "Interview tips"));
      tips.forEach(function (t) { tw.appendChild(t); });
      ivBody.appendChild(tw);
    }
    setBadge("interview", qas.length);
    if (bank) {
      // the page keeps its heading + a pointer, so the outline entry still lands somewhere useful
      var ptr = el("p", "sd-interview-moved");
      ptr.setAttribute("data-sd-ui", "");
      ptr.appendChild(document.createTextNode("The " + qas.length + " interview questions for this topic (Basic → Scenario) are in the "));
      var open = el("button", null, "Interview tab of the study panel");
      open.type = "button";
      open.addEventListener("click", function () {
        showTab("interview", true);
        if (row.classList.contains("sd-panel-off")) setHidden(false);
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      ptr.appendChild(open);
      ptr.appendChild(document.createTextNode("."));
      var firstQa = bank.querySelector(".sd-qa");
      if (firstQa) firstQa.parentNode.insertBefore(ptr, firstQa); else bank.appendChild(ptr);
    }

    /* -- Notes -- */
    var noteBody = addTab("notes", "Notes");
    var pads = readJSON(PAD_KEY);
    noteBody.appendChild(el("p", "sd-panel-hint", "Your scratchpad for this page — saved in this browser as you type."));
    var prefixes = el("div", "sd-pad-prefixes");
    [["❓", "Don't understand: "], ["🙋", "Question: "], ["💡", "My example: "], ["🎯", "My interview answer: "],
     ["⌨️", "Command to remember: "], ["↻", "Revisit: "]].forEach(function (p) {
      var b = el("button", null, p[0] + " " + p[1].replace(/: $/, ""));
      b.type = "button";
      b.addEventListener("click", function () {
        var v = pad.value;
        pad.value = v + (v && !/\n$/.test(v) ? "\n" : "") + p[1];
        pad.focus();
        pad.selectionStart = pad.selectionEnd = pad.value.length;
        savePad();
      });
      prefixes.appendChild(b);
    });
    noteBody.appendChild(prefixes);
    var pad = el("textarea", "sd-pad");
    pad.placeholder = "Things I don't understand, questions, my own examples, my interview answer, commands to remember, topics to revisit…";
    pad.value = (pads[pageKey] && pads[pageKey].text) || "";
    noteBody.appendChild(pad);
    var padStatus = el("p", "sd-panel-hint");
    noteBody.appendChild(padStatus);
    var padTimer = null;
    function savePad() {
      clearTimeout(padTimer);
      padTimer = setTimeout(function () {
        var store = readJSON(PAD_KEY);
        if (pad.value.trim()) store[pageKey] = { text: pad.value, ts: Date.now(), title: pageTitle };
        else delete store[pageKey];
        writeJSON(PAD_KEY, store);
        padStatus.textContent = pad.value.trim() ? "Saved." : "";
        setBadge("notes", noteCount());
      }, 300);
    }
    pad.addEventListener("input", savePad);
    var inlineBox = el("div", "sd-pad-inline");
    noteBody.appendChild(inlineBox);
    function noteCount() {
      return (pad.value.trim() ? 1 : 0) + document.querySelectorAll(".sd-note-card").length;
    }
    function paintInline() {
      inlineBox.replaceChildren();
      var cards = container.querySelectorAll(".sd-note-card");
      if (!cards.length) {
        inlineBox.appendChild(el("p", "sd-panel-hint", "Tip: the 🗒️+ next to any paragraph pins a note right there."));
        return;
      }
      inlineBox.appendChild(el("h4", null, "Notes pinned on this page (" + cards.length + ")"));
      var ul = el("ul");
      Array.prototype.forEach.call(cards, function (card) {
        var li = el("li");
        var b = el("button", null, cleanText(card.querySelector(".sd-note-text") || card).slice(0, 90));
        b.type = "button";
        b.addEventListener("click", function () { card.scrollIntoView({ behavior: "smooth", block: "center" }); });
        li.appendChild(b);
        ul.appendChild(li);
      });
      inlineBox.appendChild(ul);
    }
    paintInline();
    var exportBtn = el("button", "sd-panel-btn", "⬇ Download this page's notes (.md)");
    exportBtn.type = "button";
    exportBtn.addEventListener("click", function () {
      var out = "# " + pageTitle + "\n\n";
      if (pad.value.trim()) out += "## Scratchpad\n\n" + pad.value.trim() + "\n\n";
      var cards = container.querySelectorAll(".sd-note-card");
      if (cards.length) {
        out += "## Pinned notes\n\n";
        Array.prototype.forEach.call(cards, function (card) {
          out += "- " + cleanText(card.querySelector(".sd-note-text") || card) + "\n";
        });
      }
      var a = el("a");
      a.href = URL.createObjectURL(new Blob([out], { type: "text/markdown" }));
      a.download = (pageKey.split("/").pop() || "notes").replace(/\.html$/, "") + "-notes.md";
      document.body.appendChild(a); a.click(); a.remove();
    });
    noteBody.appendChild(exportBtn);
    setBadge("notes", noteCount());
    container.addEventListener("click", function (ev) {
      // inline notes are added/removed inside the content — keep the list fresh
      if (ev.target.closest && ev.target.closest(".sd-note-actions")) setTimeout(function () { paintInline(); setBadge("notes", noteCount()); }, 0);
    });

    /* -- Reminders -- */
    var remBody = addTab("reminders", "Reminders");
    var shortTitle = pageTitle.replace(/\s*[:(—].*$/, "");
    var seeds = [];
    var authored = container.closest("[data-reminders]") || container.querySelector("[data-reminders]");
    if (authored) {
      authored.getAttribute("data-reminders").split("|").forEach(function (s) { s = s.trim(); if (s) seeds.push(s); });
    }
    seeds.push("Explain " + shortTitle + " out loud without notes");
    if (container.querySelector("svg, .mermaid, .sd-diagram, .topic-map, pre.diagram")) seeds.push("Redraw the main diagram from memory");
    if (container.querySelector("pre")) seeds.push("Re-type the key config / commands from memory");
    if (/troubleshoot|failure|symptom/i.test(container.textContent)) seeds.push("Walk through one failure scenario: symptom → cause → fix");
    if (qas.length) seeds.push("Answer every interview question without peeking");
    var remList = el("ul", "sd-rem-list");
    remBody.appendChild(remList);
    var addRow = el("form", "sd-rem-add");
    var addIn = el("input");
    addIn.type = "text";
    addIn.placeholder = "Add a reminder for this topic…";
    var addBtn = el("button", null, "Add");
    addBtn.type = "submit";
    addRow.appendChild(addIn); addRow.appendChild(addBtn);
    remBody.appendChild(addRow);
    function remState() {
      var all = readJSON(REM_KEY);
      var s = all[pageKey] || {};
      s.done = s.done || {}; s.custom = s.custom || []; s.hidden = s.hidden || [];
      return { all: all, s: s };
    }
    function remSave(st) { st.s.title = pageTitle; st.all[pageKey] = st.s; writeJSON(REM_KEY, st.all); }
    function paintRem() {
      var st = remState();
      remList.replaceChildren();
      var items = seeds.filter(function (t) { return st.s.hidden.indexOf(t) === -1; }).concat(st.s.custom);
      var open = 0;
      items.forEach(function (t) {
        var li = el("li");
        var lab = el("label");
        var cb = el("input");
        cb.type = "checkbox";
        cb.checked = !!st.s.done[t];
        if (!cb.checked) open++;
        lab.appendChild(cb);
        lab.appendChild(el("span", null, t));
        li.classList.toggle("done", cb.checked);
        cb.addEventListener("change", function () {
          var s2 = remState();
          if (cb.checked) s2.s.done[t] = Date.now(); else delete s2.s.done[t];
          remSave(s2); paintRem();
        });
        var del = el("button", "sd-rem-del", "×");
        del.type = "button";
        del.setAttribute("aria-label", "Remove reminder");
        del.addEventListener("click", function () {
          var s2 = remState();
          var ci = s2.s.custom.indexOf(t);
          if (ci > -1) s2.s.custom.splice(ci, 1); else s2.s.hidden.push(t);
          delete s2.s.done[t];
          remSave(s2); paintRem();
        });
        li.appendChild(lab);
        li.appendChild(del);
        remList.appendChild(li);
      });
      setBadge("reminders", open);
    }
    addRow.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var t = addIn.value.trim();
      if (!t) return;
      var st = remState();
      if (st.s.custom.indexOf(t) === -1 && seeds.indexOf(t) === -1) st.s.custom.push(t);
      var hi = st.s.hidden.indexOf(t);
      if (hi > -1) st.s.hidden.splice(hi, 1);
      remSave(st);
      addIn.value = "";
      paintRem();
    });
    paintRem();

    /* -- Review ("things to review"): flag any <h2> or interview question -- */
    var revBody = addTab("review", "Review");
    function revAll() { return readJSON(REVIEW_KEY); }
    function revToggle(id, label) {
      var all = revAll();
      var p = all[pageKey] || { title: pageTitle, items: {} };
      p.title = pageTitle;
      if (p.items[id]) delete p.items[id]; else p.items[id] = { label: label, ts: Date.now() };
      if (Object.keys(p.items).length) all[pageKey] = p; else delete all[pageKey];
      writeJSON(REVIEW_KEY, all);
      paintReview();
      return !!(all[pageKey] && all[pageKey].items[id]);
    }
    function isFlagged(id) { var p = revAll()[pageKey]; return !!(p && p.items[id]); }
    var flagBtns = {};
    function flagButton(id, label, cls) {
      var b = el("button", "sd-flag " + (cls || ""));
      b.type = "button";
      b.setAttribute("data-sd-ui", "");
      function paint(on) {
        b.classList.toggle("on", on);
        b.textContent = on ? "↻ In review" : "＋ Review";
        b.title = on ? "Remove from your review list" : "Add to your review list (Study panel → Review)";
      }
      paint(isFlagged(id));
      b.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); paint(revToggle(id, label)); });
      flagBtns[id] = paint;
      return b;
    }
    Array.prototype.forEach.call(container.querySelectorAll("h2[id]"), function (h) {
      if (h.closest("[data-sd-ui]") || h.closest(".sd-learn")) return;
      h.appendChild(flagButton("h:" + h.id, cleanText(h)));
    });
    Array.prototype.forEach.call(panel.querySelectorAll("details.sd-qa"), function (d) {
      var q = cleanText(d.querySelector("summary"));
      var id = "q:" + hashStr(q);
      d.setAttribute("data-review-id", id);
      var b = flagButton(id, q, "sd-flag-q");
      var a = d.querySelector(".sd-qa-a") || d;
      a.appendChild(b);
    });
    function paintReview() {
      revBody.replaceChildren();
      var all = revAll();
      var mine = all[pageKey] ? all[pageKey].items : {};
      var ids = Object.keys(mine);
      revBody.appendChild(el("p", "sd-panel-hint", "Flag a section heading or an interview question with ＋ Review and it lands here — and on every page's Review tab."));
      if (ids.length) {
        revBody.appendChild(el("h4", null, "On this page"));
        var ul = el("ul", "sd-rev-list");
        ids.forEach(function (id) {
          var li = el("li");
          var go = el("button", "sd-rev-go", mine[id].label);
          go.type = "button";
          go.addEventListener("click", function () {
            if (id.indexOf("h:") === 0) {
              var t = document.getElementById(id.slice(2));
              if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              var d = panel.querySelector('details[data-review-id="' + id + '"]');
              if (d) { showTab("interview", true); d.open = true; d.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
            }
          });
          var x = el("button", "sd-rem-del", "×");
          x.type = "button";
          x.setAttribute("aria-label", "Remove from review");
          x.addEventListener("click", function () { revToggle(id); if (flagBtns[id]) flagBtns[id](false); });
          li.appendChild(go); li.appendChild(x);
          ul.appendChild(li);
        });
        revBody.appendChild(ul);
      }
      var others = Object.keys(all).filter(function (k) { return k !== pageKey; });
      if (others.length) {
        revBody.appendChild(el("h4", null, "Elsewhere on the site"));
        var ul2 = el("ul", "sd-rev-list");
        others.forEach(function (k) {
          var li = el("li");
          var a = el("a", null, all[k].title || k);
          a.href = root + k;
          li.appendChild(a);
          li.appendChild(el("span", "sd-rev-count", String(Object.keys(all[k].items).length)));
          ul2.appendChild(li);
        });
        revBody.appendChild(ul2);
      }
      if (!ids.length && !others.length) revBody.appendChild(el("p", "sd-panel-empty", "Nothing flagged yet."));
      setBadge("review", ids.length);
    }
    paintReview();

    /* -- Commands: CLI lines from the page's code blocks (+ an authored .sd-commands list) -- */
    var cmds = [], seenCmd = {};
    function addCmd(text, src) {
      text = text.replace(/^\$\s+/, "").trim();
      var key = text.replace(/^sudo\s+/, "");                     // "sudo nginx -t" = "nginx -t"
      if (!text || text.length > 200 || seenCmd[key]) return;     // (whole SQL queries are added directly below)
      seenCmd[key] = true;
      cmds.push({ text: text, src: src });
    }
    Array.prototype.forEach.call(container.querySelectorAll(".sd-commands code"), function (c) { addCmd(cleanText(c), c); });
    var SQL_RE = /^(SELECT|SHOW|EXPLAIN|WITH|SET|ALTER SYSTEM|VACUUM|ANALYZE|REINDEX|CREATE (UNIQUE )?INDEX)\b/i;
    Array.prototype.forEach.call(container.querySelectorAll("pre"), function (pre) {
      if (pre.classList.contains("mermaid") || pre.closest(".mermaid")) return;
      var whole = (pre.textContent || "").trim();
      var nLines = whole.split("\n").length;
      if (SQL_RE.test(whole) && nLines <= 15 && whole.length <= 900) {   // a diagnostic query: keep it whole
        if (!seenCmd[whole]) { seenCmd[whole] = true; cmds.push({ text: whole, src: pre }); }
        return;
      }
      whole.split("\n").forEach(function (line) {
        var l = line.trim();
        if (CMD_RE.test(l) && !/^(ps|top|free|host|ip|watch|less|python3?|node)\s*[:=(]/.test(l)) addCmd(l, pre);
      });
    });
    if (cmds.length) {
      var cmdBody = addTab("commands", "Commands");
      cmdBody.appendChild(el("p", "sd-panel-hint", "Every command and diagnostic query found in this page's code blocks."));
      var cl = el("ul", "sd-cmd-list");
      cmds.forEach(function (c) {
        var li = el("li");
        var code = el("code", null, c.text);
        li.appendChild(code);
        var acts = el("span", "sd-cmd-acts");
        var cp = el("button", null, "Copy");
        cp.type = "button";
        cp.addEventListener("click", function () {
          function ok() { cp.textContent = "Copied"; setTimeout(function () { cp.textContent = "Copy"; }, 1200); }
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c.text).then(ok, function () {});
          else {
            var ta = el("textarea"); ta.value = c.text; document.body.appendChild(ta); ta.select();
            try { document.execCommand("copy"); ok(); } catch (e) {}
            ta.remove();
          }
        });
        var go = el("button", null, "↳");
        go.type = "button";
        go.title = "Show where it's explained";
        go.addEventListener("click", function () { c.src.scrollIntoView({ behavior: "smooth", block: "center" }); });
        acts.appendChild(cp); acts.appendChild(go);
        li.appendChild(acts);
        cl.appendChild(li);
      });
      cmdBody.appendChild(cl);
      setBadge("commands", cmds.length);
    }

    /* -- place it: wrap the content column + panel in one row -- */
    var row = el("div", "sd-panel-row");
    container.parentNode.insertBefore(row, container);
    row.appendChild(container);
    row.appendChild(panel);

    var showBtn = el("button", "sd-panel-show", "⟨ Study panel");
    showBtn.type = "button";
    showBtn.setAttribute("data-sd-ui", "");
    row.appendChild(showBtn);
    function setHidden(h) {
      row.classList.toggle("sd-panel-off", h);
      try { if (h) localStorage.setItem(PANEL_HIDE_KEY, "1"); else localStorage.removeItem(PANEL_HIDE_KEY); } catch (e) {}
    }
    hideBtn.addEventListener("click", function () { setHidden(true); });
    showBtn.addEventListener("click", function () { setHidden(false); });
    try { if (localStorage.getItem(PANEL_HIDE_KEY) === "1") row.classList.add("sd-panel-off"); } catch (e) {}

    var start = null;
    try { start = localStorage.getItem(PANEL_TAB_KEY); } catch (e) {}
    if (!start || !tabs[start]) start = "interview";
    showTab(start, false);
  }

  /* ---- page <title> / <h1> / subtitle / breadcrumb, from SITE_PAGES ---- */
  function applyPageMeta() {
    if (!entry) return;
    var siteName = map.siteName || "Notes";
    if (entry.title) document.title = entry.title + " · " + siteName;

    var tEl = document.querySelector("[data-page-title]");
    if (tEl && entry.title) tEl.textContent = entry.title;

    var sEl = document.querySelector("[data-page-subtitle]");
    if (sEl && entry.subtitle != null) sEl.innerHTML = entry.subtitle;

    var bEl = document.querySelector("[data-breadcrumb]");
    if (bEl) {
      bEl.replaceChildren();
      var a = document.createElement("a");
      a.href = root + (map.home || "index.html");
      a.textContent = "Home";
      bEl.appendChild(a);
      if (entry.section) bEl.appendChild(document.createTextNode(" / " + entry.section));
      if (entry.title) bEl.appendChild(document.createTextNode(" / " + entry.title));
    }
  }

  /* ---- index-page helpers: topic grid, resource chips, stat counts ----
     <div data-topic-grid>        -> one card per section
     <div data-topic-grid="flat"> -> a single card listing every page     */
  function renderTopicGrid() {
    var grid = document.querySelector("[data-topic-grid]");
    if (!grid) return;
    grid.replaceChildren();
    var pageCount = 0;

    if (grid.getAttribute("data-topic-grid") === "flat") {
      var card = document.createElement("article");
      card.className = "sd-card";
      card.style.setProperty("--accent", "var(--sd-auth, var(--sd-c1))");
      var ic = document.createElement("div");
      ic.className = "sd-icon";
      ic.textContent = map.siteIcon || "📄";
      card.appendChild(ic);
      var hh = document.createElement("h2");
      hh.textContent = (map.siteName || "Notes").replace(/ Notes$/, "");
      card.appendChild(hh);
      var ulf = document.createElement("ul");
      map.sections.forEach(function (section) {
        section.pages.forEach(function (page) {
          pageCount++;
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = root + page.href;
          a.textContent = page.title;
          li.appendChild(a);
          ulf.appendChild(li);
        });
      });
      var cf = document.createElement("span");
      cf.className = "sd-count";
      cf.textContent = pageCount + (pageCount === 1 ? " page" : " pages");
      card.insertBefore(cf, ulf);
      card.appendChild(ulf);
      grid.appendChild(card);
      var tf = document.querySelector("[data-stat-topics]");
      if (tf) tf.textContent = String(map.sections.length);
      var pf = document.querySelector("[data-stat-pages]");
      if (pf) pf.textContent = String(pageCount);
      return;
    }

    map.sections.forEach(function (section, i) {
      pageCount += section.pages.length;
      var card = document.createElement("article");
      card.className = "sd-card";
      card.style.setProperty("--accent", "var(--sd-c" + ((i % 11) + 1) + ")");

      var icon = document.createElement("div");
      icon.className = "sd-icon";
      icon.textContent = section.icon || "📄";
      card.appendChild(icon);

      var h2 = document.createElement("h2");
      h2.textContent = section.name;
      card.appendChild(h2);

      var count = document.createElement("span");
      count.className = "sd-count";
      count.textContent = section.pages.length + (section.pages.length === 1 ? " page" : " pages");
      card.appendChild(count);

      var ul = document.createElement("ul");
      section.pages.forEach(function (page) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = root + page.href;
        a.textContent = page.title;
        li.appendChild(a);
        ul.appendChild(li);
      });
      card.appendChild(ul);
      grid.appendChild(card);
    });

    var topics = document.querySelector("[data-stat-topics]");
    if (topics) topics.textContent = String(map.sections.length);
    var pagesStat = document.querySelector("[data-stat-pages]");
    if (pagesStat) pagesStat.textContent = String(pageCount);
  }

  function renderResourceList() {
    var box = document.querySelector("[data-resource-list]");
    if (!box) return;
    box.replaceChildren();
    map.sections.forEach(function (section) {
      (section.resources || []).forEach(function (resource) {
        var a = document.createElement("a");
        a.href = root + resource.href;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "📎 " + resource.title;
        box.appendChild(a);
      });
    });
  }

  /* <ul data-section-pages> on a section-index page -> the sibling pages in the
     same SITE_MAP section (this page itself omitted). Add a page to that section
     in sitemap.js and it shows up here automatically. */
  function renderSectionPages() {
    var box = document.querySelector("[data-section-pages]");
    if (!box) return;
    var here = entry ? entry.href : null;
    var section = null;
    map.sections.forEach(function (s) {
      s.pages.forEach(function (p) {
        if (here && p.href === here) section = s;
        else if (!here) {
          try {
            var tp = new URL(root + p.href, window.location.href).pathname;
            if (tp === window.location.pathname) section = s;
          } catch (e) {}
        }
      });
    });
    if (!section) return;
    box.replaceChildren();
    section.pages.forEach(function (p) {
      if (here && p.href === here) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = root + p.href;
      a.textContent = p.title;
      li.appendChild(a);
      box.appendChild(li);
    });
  }

  renderTopBand();
  renderSidebar();
  renderNavDrawer();
  renderNavSearch();
  renderCoverageTracker();
  renderReadAloud();
  renderNotes();
  renderToc();
  renderPager();
  renderStudyPanel();
  markCoveredLinks();
  // the baked sidebar is parsed after this script runs, so re-mark it once it exists
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", markCoveredLinks, { once: true });
  applyPageMeta();
  renderTopicGrid();
  renderResourceList();
  renderSectionPages();
  renderWeeklyTarget();
})();
