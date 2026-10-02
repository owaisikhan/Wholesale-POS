// The demo must open in several tabs at once. expo-sqlite's web worker held
// an OPFS lock that made every tab after the first wait forever.
import { chromium } from "playwright";

const base = process.env.BASE || "http://localhost:4173";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
const fails = [];
const pages = [];
for (let i = 1; i <= 3; i++) {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fails.push(`tab ${i}: ${e.message}`));
  const t0 = Date.now();
  await p.goto(base, { waitUntil: "commit" });
  try {
    await p.getByText("New Bill", { exact: true }).first().waitFor({ timeout: 20000 });
    console.log(`tab ${i} ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch {
    fails.push(`tab ${i} still loading after 20s`);
  }
  pages.push(p);
}
// Each tab has its own demo data: a bill made in tab 1 must not need tab 2.
console.log(fails.length ? "FAIL\n" + fails.join("\n") : "tabs ok");
await browser.close();
process.exit(fails.length ? 1 : 0);
