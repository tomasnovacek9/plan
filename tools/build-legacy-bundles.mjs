import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styleDir = path.join(root, "src", "styles", "legacy");
const scriptDir = path.join(root, "src", "scripts", "legacy");
const styleBundle = "bundle.css";
const scriptBundle = "bundle.js";

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
