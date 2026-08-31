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
  applyPageMeta();
  renderTopicGrid();
  renderResourceList();
  renderSectionPages();
})();
