/* Generated site data — see reorg script. Used by assets/site-header.js
   and by index.html to render the topic-card grid. */
window.SITE_MAP = {
  "siteId": "e2",
  "siteName": "Authentication Notes",
  "siteIcon": "🔐",
  "home": "Authentication Notes.html",
  "parentHome": "../eat-that-elephant-1/index.html",
  "sections": [
    {
      "icon": "🔐",
      "name": "Root",
      "pages": [
        {
          "href": "00-login-steps.html",
          "title": "Secure Login Implementation Steps"
        }
      ]
    },
    {
      "icon": "🔐",
      "name": "01-authentication",
      "pages": [
        {
          "href": "01-authentication/01-introduction.html",
          "title": "Authentication Schemes: An Introduction"
        },
        {
          "href": "01-authentication/03-hashing-process.html",
          "title": "Secure Password Hashing Process"
        }
      ]
    },
    {
      "icon": "🌐",
      "name": "02-social-login",
      "pages": [
        {
          "href": "02-social-login/google-key-task.html",
          "title": "Google Social Login Checklist"
        },
        {
          "href": "02-social-login/google-login.html",
          "title": "Google Sign-In with Credential Manager"
        }
      ]
    }
  ]
};
/* Register this map so a multi-site page (the repo-root portal) can read every
   sub-site's map without the last-loaded one clobbering the others. */
(window.SITE_MAPS = window.SITE_MAPS || {})[window.SITE_MAP.siteId] = window.SITE_MAP;
