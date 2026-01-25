# Deployment Guide for GitHub Pages

## 1. Prerequisites
- A GitHub account.
- The project is pushed to a GitHub repository.
- **IMPORTANT**: Your repository must be **PUBLIC** if you are on a free GitHub plan. GitHub Pages for private repositories requires a paid GitHub Pro subscription.

## 2. Configuration Check
Your project is already configured for GitHub Pages!
- **astro.config.mjs**: `site` is set to `https://aaanilclk.github.io` and `integrations` includes `sitemap`.
- **.github/workflows/deploy.yml**: The deployment workflow is already created.

## 3. Deployment Steps

### Step 1: Push to GitHub
If you haven't already, push your code to your GitHub repository:
```bash
git add .
git commit -m "Finalizing site for launch"
git push origin main
```

### Step 2: Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub.
2. Click on **Settings** > **Pages** (in the sidebar).
3. Under **Build and deployment**:
   - Source: Ensure **GitHub Actions** is selected. Use the dropdown to select it if it's not.
   - **Do NOT** click "Configure" on the suggested workflows (Static HTML or Jekyll).
   - Since we already have a custom workflow (`.github/workflows/deploy.yml`), GitHub will automatically detect it once you push your code.

4. The deployment workflow (`deploy.yml`) will automatically trigger when you push to `main`.

### Step 3: Verify Deployment
1. Go to the **Actions** tab in your repository to see the deployment progress.
2. Once the workflow turns green (Success), your site will be live at `https://aaanilclk.github.io` (or `https://aaanilclk.github.io/personalsite` if your repo is named `personalsite` and not `aaanilclk.github.io`).

**Note on Repository Name:**
- If your repository is named `aaanilclk.github.io`, your site will be at `https://aaanilclk.github.io/`.
- If your repository is named something else (e.g., `personalsite`), your site will be at `https://aaanilclk.github.io/personalsite/`.
  - **Correction Needed**: If this is the case, you need to update `astro.config.mjs`:
    ```javascript
    export default defineConfig({
        site: 'https://aaanilclk.github.io',
        base: '/personalsite', // Add this line matching your repo name
        // ...
    });
    ```

## 4. Updates
Whenever you want to update your site, just commit and push your changes. The GitHub Action will automatically rebuild and deploy the site.
