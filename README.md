# Run
Start up a Python server to serve the website `python3 -m http.server 8000`

# Header and footer
The header and footer on every page come from `_partials/header.html` and `_partials/footer.html`. Edit those files, not the copies inside the pages, then run:

```
node scripts/build.mjs
```

This rewrites the generated blocks in every page (between the `<!-- header: generated ... -->` / `<!-- footer: generated ... -->` comments). `node scripts/build.mjs --check` reports pages that are out of date.

# Deploy
Pushing to `master` runs `.github/workflows/deploy.yml`, which runs the build and publishes to GitHub Pages. Only site files are published: folders starting with `_` or `.`, `scripts/`, and `*.md` files are left out.
