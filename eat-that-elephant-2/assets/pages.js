/* Per-page metadata — the single source of truth for page <title>,
   <h1> (data-page-title), the lead line (data-page-subtitle) and the
   breadcrumb trail. Read at runtime by assets/site-header.js via
   window.PAGE_CONFIG.id, and baked into static markup by
   scripts/regen-sidebars.js. Keys are the page id used in PAGE_CONFIG.

   Add a page:  give it  <script>window.PAGE_CONFIG={id:"my-id"}</script>
   then add a matching entry here (href relative to this sub-site root).
   'subtitle' is optional and may contain inline HTML. */
window.SITE_PAGES = {
  "00-login-steps": {
    href: "00-login-steps.html",
    section: "Root",
    title: "Secure Login Implementation Steps"
  },
  "01-introduction": {
    href: "01-authentication/01-introduction.html",
    section: "01-authentication",
    title: "Authentication Schemes: An Introduction"
  },
  "03-hashing-process": {
    href: "01-authentication/03-hashing-process.html",
    section: "01-authentication",
    title: "Secure Password Hashing Process"
  },
  "google-key-task": {
    href: "02-social-login/google-key-task.html",
    section: "02-social-login",
    title: "Google Social Login Checklist"
  },
  "google-login": {
    href: "02-social-login/google-login.html",
    section: "02-social-login",
    title: "Google Sign-In with Credential Manager"
  },
};
(window.SITE_PAGES_BY_SITE = window.SITE_PAGES_BY_SITE || {})["e2"] = window.SITE_PAGES;

