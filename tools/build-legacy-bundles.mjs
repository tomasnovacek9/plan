import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styleDir = path.join(root, "src", "styles", "legacy");
const scriptDir = path.join(root, "src", "scripts", "legacy");
const styleBundle = "bundle.css";
const scriptBundle = "bundle.js";
const runtimeSkippedScripts = new Set([
  "03-weekly-note-script-v8.js",
  "04-note-separate-v12.js",
  "05-all-day-time-v52.js",
  "06-repeat-events-v53.js",
  "07-reload-calendar-on-week-change-v54.js",
  "10-empty-days-only-v83.js",
  "11-current-week-on-start-v84.js",
  "14-hide-left-dates-v103-js.js",
  "17-empty-days-all-day-v162-js.js",
  "18-footer-bg-allday-v164-js.js",
  "22-note-direct-render-v174-js.js",
  "23-note-source-fixed-v180-js.js",
  "24-note-colors-final-v181-js.js",
  "25-note-no-blue-left-yellow-v182-js.js",
  "26-weekend-created-v184-js.js",
  "27-multiline-note-page-align-v186-js.js",
  "28-final-polish-v188-js.js",
  "29-restore-controls-note-v190-js.js",
  "30-note-source-final-v193-js.js",
  "32-clean-responsible-core-v213-js.js"
]);

async function bundleCss() {
  const files = (await readdir(styleDir))
    .filter((file) => file.endsWith(".css") && file !== styleBundle)
    .sort();

  const parts = await Promise.all(files.map(async (file) => {
    const content = await readFile(path.join(styleDir, file), "utf8");
    return `/* ${file} */\n${content.trim()}\n`;
  }));

  await writeFile(path.join(styleDir, styleBundle), `${parts.join("\n")}\n`, "utf8");
}

async function bundleJs() {
  const files = (await readdir(scriptDir))
    .filter((file) => (
      file.endsWith(".js")
      && file !== scriptBundle
      && !file.startsWith("mutation-guard-")
      && !runtimeSkippedScripts.has(file)
    ))
    .sort();

  const parts = await Promise.all(files.map(async (file) => {
    const content = await readFile(path.join(scriptDir, file), "utf8");
    return `// ${file}\n${content.trim()}\n`;
  }));

  await writeFile(path.join(scriptDir, scriptBundle), `${parts.join("\n;\n")}\n`, "utf8");
}

await bundleCss();
await bundleJs();
