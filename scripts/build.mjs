#!/usr/bin/env node
// Stamps shared partials into every HTML page so they're edited in one place:
// the header (_partials/header.html) and the footer (_partials/footer.html).
//
//   node scripts/build.mjs              update pages in place
//   node scripts/build.mjs --check      exit 1 if any page is out of date
//   node scripts/build.mjs --out _site  update pages, then copy the publishable site to _site
//
// In a partial, {{root}} becomes the relative path from the page back to the
// site root ("", "../", "../../"), so links work at any folder depth and in
// local preview. {{active:<section>}} becomes class="active" on the page's own
// nav link, where the section comes from the page's folder (tote/, blog/, or
// the home page).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const outIndex = args.indexOf("--out");
const outDir = outIndex !== -1 ? path.resolve(ROOT, args[outIndex + 1] ?? "_site") : null;

// Never published: tooling, notes and source-only files.
const SKIP_DIRS = new Set(["scripts", "node_modules"]);
const isSkippedDir = (name) => name.startsWith("_") || name.startsWith(".") || SKIP_DIRS.has(name);
const isSkippedFile = (name) => name.endsWith(".md") || name.startsWith(".") || name.startsWith("package");

const PARTIALS = ["header", "footer"].map((tag) => ({
  tag,
  start: `<!-- ${tag}: generated from _partials/${tag}.html by scripts/build.mjs. Edit the partial, not this block. -->`,
  end: `<!-- /${tag} -->`,
  template: fs.readFileSync(path.join(ROOT, `_partials/${tag}.html`), "utf8").trimEnd(),
}));

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!isSkippedDir(entry.name)) walk(full, files);
    } else if (!isSkippedFile(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function rootPrefix(file) {
  const rel = path.relative(path.dirname(file), ROOT);
  return rel ? rel.split(path.sep).join("/") + "/" : "";
}

function section(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  if (rel === "index.html") return "home";
  if (rel.startsWith("tote/")) return "tote";
  if (rel.startsWith("blog/") || rel.startsWith("blog")) return "blog";
  return null;
}

function render(partial, file, indent) {
  const current = section(file);
  const body = partial.template
    .replaceAll("{{root}}", rootPrefix(file))
    .replace(/\{\{active:(\w+)\}\}/g, (_m, name) => (name === current ? ' class="active"' : ""));
  return [partial.start, ...body.split("\n"), partial.end].map((line) => (line ? indent + line : line)).join("\n");
}

// Replaces an existing generated block, or the page's first hand-written
// element. Pages without one (redirect stubs, previews) are left alone.
function stamp(file, html) {
  for (const partial of PARTIALS) {
    const generated = new RegExp(`([ \\t]*)${escapeRegExp(partial.start)}[\\s\\S]*?${escapeRegExp(partial.end)}`);
    const handWritten = new RegExp(`([ \\t]*)<${partial.tag}[\\s>][\\s\\S]*?</${partial.tag}>`);
    const pattern = generated.test(html) ? generated : handWritten.test(html) ? handWritten : null;
    if (pattern) html = html.replace(pattern, (_match, indent) => render(partial, file, indent));
  }
  return html;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const files = walk(ROOT);
const stale = [];

for (const file of files.filter((f) => f.endsWith(".html"))) {
  const html = fs.readFileSync(file, "utf8");
  const updated = stamp(file, html);
  if (updated === html) continue;
  stale.push(path.relative(ROOT, file));
  if (!check) fs.writeFileSync(file, updated);
}

if (check) {
  if (stale.length) {
    console.error(`Out of date (run node scripts/build.mjs):\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log("All pages up to date.");
  process.exit(0);
}

console.log(stale.length ? `Updated ${stale.length} page(s).` : "All pages up to date.");

if (outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  for (const file of files) {
    const dest = path.join(outDir, path.relative(ROOT, file));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
  }
  console.log(`Copied ${files.length} file(s) to ${path.relative(ROOT, outDir)}/`);
}
