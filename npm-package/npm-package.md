Fine — you want the *full* documentation of everything we’ve been slogging through?
Here you go: one clear, complete guide for your task — from building, configuring, authenticating, to publishing private packages into **your GitHub npm registry** — without any “go read the README” nonsense.

---

# 🧾 **Task Documentation: Build and Publish Package to GitHub npm Registry**

**Objective:**
To build and publish the `welibraryos-shared` (or `@raryos/shared`) package into your **private GitHub npm registry**, ensuring it’s fully automated in CI/CD (GitHub Actions), secure, and scoped under your organization.

---

## 🧩 **1. Prerequisites**

Before starting, confirm you have:

* Access to the target GitHub repository.
* Node.js and npm installed (`>= 18` recommended).
* A **GitHub Personal Access Token (PAT)** with:

  * `write:packages`
  * `read:packages`
  * `repo` (for private repos)
* The dependent internal repositories cloned or accessible (if your build requires them).

---

## 🧱 **2. Repository Structure**

Typical structure:

```
welibraryos-shared/
 ├── src/
 ├── dist/
 ├── package.json
 ├── .npmrc
 ├── tsconfig.json
 ├── .github/
 │    └── workflows/
 │         └── publish.yml
```

---

## 🧠 **3. package.json Configuration**

Your `package.json` should look like this:

```json
{
  "name": "@raryos/shared",
  "version": "1.0.0",
  "description": "Shared internal utilities and configurations for Raryos projects.",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "lint": "eslint .",
    "format": "prettier --write .",
    "prepare": "npm run build"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/raryos/shared.git"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/"
  },
  "files": [
    "dist/**/*"
  ],
  "devDependencies": {
    "eslint": "^7.4.0",
    "eslint-config-airbnb": "^18.2.0",
    "eslint-plugin-import": "^2.22.0",
    "eslint-plugin-jsx-a11y": "^6.3.1",
    "eslint-plugin-prettier": "^3.1.4",
    "eslint-plugin-react": "^7.20.3",
    "eslint-plugin-react-hooks": "^4.0.6",
    "prettier": "^2.0.5",
    "typescript": "^5.0.0"
  }
}
```

### Key parts:

* `"name"` → Scoped to your org (`@raryos`).
* `"publishConfig"` → Ensures it publishes to **GitHub Packages** (not npmjs.org).
* `"files"` → Only the `/dist` folder will be published.
* `"prepare"` → Ensures automatic build before publishing.

---

## 🧾 **4. .npmrc Configuration**

Create a `.npmrc` file in the root of the repo:

```
@raryos:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

**Purpose:**

* Points npm to the GitHub Packages registry.
* Uses an environment variable token (`NODE_AUTH_TOKEN`) provided by GitHub Actions or manually during local publishing.

---

## 🔐 **5. Create the Personal Access Token (PAT)**

1. Visit [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Fine-grained personal access token** → **Generate new token**
3. Permissions:

   * **Contents:** Read
   * **Packages:** Read and Write
   * **Metadata:** Read
   * **Repository access:** Select the repo(s)
4. Copy the token (you’ll only see it once).
5. Go to your repository → **Settings → Secrets and Variables → Actions → New Repository Secret**
6. Add:

   ```
   Name: WL_TOKEN
   Value: <paste your token here>
   ```

---

## ⚙️ **6. GitHub Actions Workflow (publish.yml)**

Create the file:
`.github/workflows/publish.yml`

```yaml
name: Build and Publish @raryos/shared

on:
  push:
    branches:
      - release/*      # publish from release branches
      - main           # optional: publish from main

permissions:
  contents: read
  packages: write

jobs:
  build-and-publish:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@raryos'

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: npm run build

      - name: Publish to GitHub Packages
        env:
          NODE_AUTH_TOKEN: ${{ secrets.WL_TOKEN }}
        run: |
          echo "Publishing @raryos/shared..."
          npm publish
```

---

## 🧩 **7. Verify Before Publishing**

Run locally to test the configuration safely:

```bash
npm publish --dry-run
```

✅ You should see:

```
publishing to: https://npm.pkg.github.com/
```

❌ If you see:

```
https://registry.npmjs.org/
```

— your setup is wrong (you’re targeting public npm).

---

## 🚀 **8. Publishing Flow**

### Option 1: Publish from `release/*` branch

```bash
git checkout -b release/v1.0.0
npm version patch   # or minor/major
git push origin release/v1.0.0
```

GitHub Actions automatically builds and publishes the package.

### Option 2: Publish manually (local)

```bash
export NODE_AUTH_TOKEN=<your PAT>
npm run build
npm publish
```

---

## 🧰 **9. Verifying Published Package**

Go to your GitHub repo → **Packages** tab.
You should see your package listed as:

`@raryos/shared`
with visibility **Private**.

---

## 🧯 **10. Common Issues**

| Error                                      | Cause                                         | Fix                                             |
| ------------------------------------------ | --------------------------------------------- | ----------------------------------------------- |
| `Secret names must not start with GITHUB_` | You tried naming a secret like `GITHUB_TOKEN` | Use `WL_TOKEN` instead                          |
| `403 Forbidden`                            | Token lacks `write:packages` or `repo`        | Regenerate token with correct scopes            |
| `publishConfig missing`                    | npm defaults to public registry               | Add `"publishConfig"` block                     |
| `Cannot find module`                       | Missing build step                            | Ensure `npm run build` creates `/dist/index.js` |
| `404 Not Found` when installing            | Package is private                            | Must authenticate using token in `.npmrc`       |

---

## ✅ **11. Summary**

| Step                    | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| Edit `package.json`     | Define package scope and publish registry |
| Create `.npmrc`         | Configure npm to use GitHub registry      |
| Generate PAT            | Authenticate private publishing           |
| Add PAT as secret       | Securely store for CI/CD use              |
| Create GitHub Action    | Automate build + publish                  |
| Verify with `--dry-run` | Ensure it’s targeting private registry    |
| Merge into release/main | Trigger workflow and publish package      |

---

## 🎯 **Final Outcome**

You’ll have:

* A **private package** hosted in GitHub’s npm registry
* A **working CI/CD pipeline** that builds and publishes automatically
* A secure workflow using a **token-based authentication** setup
* No risk of accidentally pushing to the public npm registry

---

If you want, I can package this doc in **Markdown** format (`README_PUBLISH.md`) so you can drop it straight into your repo’s `/docs` folder — would you like me to generate that version?
