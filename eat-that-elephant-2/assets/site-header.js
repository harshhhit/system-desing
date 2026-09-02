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

  /* ---- top band: brand + home + today's revision ---- */
  function renderTopBand() {
    if (!mount) return;
    var pick = pickToday();

    var band = document.createElement("div");
    band.className = "sd-topband";

    var brand = document.createElement("a");
    brand.className = "sd-brand";
    brand.href = root + (map.home || "index.html");
    brand.textContent = (map.siteIcon || "📚") + " " + (map.siteName || "System Design Notes");
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
    sidebarBrand.textContent = map.siteName || "System Design Notes";

    var nav = sidebar.querySelector("nav");
    if (!nav) { nav = document.createElement("nav"); sidebar.appendChild(nav); }
    nav.replaceChildren();

    map.sections.forEach(function (section) {
      var heading = document.createElement("h3");
      heading.textContent = (section.icon ? section.icon + " " : "") + section.name;
      nav.appendChild(heading);

      var list = document.createElement("ul");
      section.pages.forEach(function (page) {
        var item = document.createElement("li");
        var link = document.createElement("a");
        var target = root + page.href;
        link.href = target;
        link.textContent = page.title;
        link.dataset.href = page.href;
        var p = null;
        try { p = new URL(target, window.location.href).pathname; } catch (e) {}
        if ((activePath && p === activePath) || p === window.location.pathname) {
          link.className = "active";
        }
        item.appendChild(link);
        list.appendChild(item);
      });
      (section.resources || []).forEach(function (resource) {
        var item = document.createElement("li");
        var link = document.createElement("a");
        link.className = "resource";
        link.href = root + resource.href;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "📎 " + resource.title;
        item.appendChild(link);
        list.appendChild(item);
      });
      nav.appendChild(list);
    });
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
    document.querySelectorAll(".sidebar nav a[data-href]").forEach(function (a) {
      a.classList.toggle("covered", cov[a.dataset.href] === true);
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
    if (!mount || !entry) return;
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
    mount.appendChild(box);
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
    if (!mount) return;
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
      if (r.top < 60 || r.bottom > (window.innerHeight || 0) - 20) {
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
    mount.appendChild(bar);
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
  renderCoverageTracker();
  renderReadAloud();
  markCoveredLinks();
  applyPageMeta();
  renderTopicGrid();
  renderResourceList();
  renderSectionPages();
})();
