/* Shared header injector: brand bar + daily revision banner.
   Pure client-side, no build step. Reads window.SITE_MAP (assets/sitemap.js,
   must be loaded first) and the data-root attribute on this <script> tag,
   which is the relative path back to this directory's own root (e.g. "../../"). */
(function () {
  var thisScript = document.currentScript;
  var root = (thisScript && thisScript.getAttribute("data-root")) || "";
  var map = window.SITE_MAP;
  var mount = document.getElementById("site-header-root");
  if (!mount || !map) return;

  var STORAGE_KEY = "sdnotes_revision_" + map.siteId;
  var DISMISS_KEY = "sdnotes_revision_dismissed_" + map.siteId;

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function allPages() {
    var pages = [];
    map.sections.forEach(function (section) {
      section.pages.forEach(function (p) {
        pages.push({ href: p.href, title: p.title, section: section.name });
      });
    });
    return pages;
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
    catch (e) { return null; }
  }
  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function pickToday() {
    var pages = allPages();
    if (!pages.length) return null;
    var state = readState() || { date: "", history: [] };
    var today = todayStr();
    if (state.date === today && state.current) {
      return state.current;
    }
    var seen = state.history || [];
    var remaining = pages.filter(function (p) { return seen.indexOf(p.href) === -1; });
    if (!remaining.length) {
      seen = [];
      remaining = pages;
    }
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
  home.href = root + "../index.html";
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
    dismiss.addEventListener("click", function () {
      dismissToday();
      rev.remove();
    });
    rev.appendChild(dismiss);

    band.appendChild(rev);
  }

  mount.appendChild(band);
})();
