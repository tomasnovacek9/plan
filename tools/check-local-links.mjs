import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(root, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
const externalPrefixes = ["http://", "https://", "data:", "#", "mailto:"];
const missing = [];

for (const ref of refs) {
  if (externalPrefixes.some((prefix) => ref.startsWith(prefix))) {
    continue;
  }

  const cleanRef = ref.split("#")[0].split("?")[0];
  if (!cleanRef) {
    continue;
  }

  const target = path.join(root, decodeURIComponent(cleanRef));
  try {
    await access(target);
  } catch {
    missing.push(ref);
  }
}

if (missing.length) {
  console.error(`Missing local assets (${missing.length}):`);
  for (const ref of missing) {
    console.error(`- ${ref}`);
  }
  process.exit(1);
}

console.log(`Local links OK (${refs.length} references)`);
