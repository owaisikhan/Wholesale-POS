// Renders og.html to assets/og.jpg (1200x630). Run: node design/og/render.mjs
// JPEG, not PNG: WhatsApp drops preview images larger than about 300 KB.
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const dir = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(pathToFileURL(path.join(dir, "og.html")).href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: path.join(dir, "../../assets/og.jpg"), type: "jpeg", quality: 82 });
await b.close();
