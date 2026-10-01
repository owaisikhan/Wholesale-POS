// Renders the sample memo to PNGs.
//   memo-<lang>-print.png    384 px wide, 1:1 with the MPT-II's 384 printable dots
//   memo-<lang>-whatsapp.png 2x, crisp for sending on WhatsApp
// Run: node design/memo/render.mjs
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const page_url = pathToFileURL(path.join(dir, "memo.html")).href;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());

for (const lang of ["en", "ur"]) {
  for (const [suffix, scale] of [["print", 1], ["whatsapp", 2]]) {
    const page = await browser.newPage({ viewport: { width: 500, height: 900 }, deviceScaleFactor: scale });
    await page.goto(`${page_url}?lang=${lang}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator("#memo").screenshot({ path: path.join(dir, "out", `memo-${lang}-${suffix}.png`) });
    await page.close();
  }
}
await browser.close();
