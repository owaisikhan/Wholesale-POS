// Screenshots every screen at a Redmi 14C-sized viewport and fails on console errors.
// Run against scripts/serve-dist.mjs: node scripts/checks/shots.mjs
import { chromium } from "playwright";
import fs from "node:fs";

const base = process.env.BASE || "http://localhost:4173";
const out = process.env.OUT || "shots";
fs.mkdirSync(out, { recursive: true });

// PROXY=1 for testing the live site from a sandbox that goes through an HTTPS proxy.
const viaProxy = process.env.PROXY && process.env.HTTPS_PROXY;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", ...(viaProxy ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ignoreHTTPSErrors: !!viaProxy });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

const shot = async (name) => {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (over) errors.push(`overflow on ${name}`);
};

// Up to 3 tries: a sandbox proxy sometimes drops the first download of the bundle.
for (let i = 0; ; i++) {
  await page.goto(base, { waitUntil: "networkidle" });
  try { await page.getByText("New Bill", { exact: true }).first().waitFor({ timeout: 20000 }); break; }
  catch (e) { if (i === 2) throw e; }
}
await shot("1-home");

for (const [tab, name] of [["New Bill", "2-bill"], ["Khata", "3-khata"], ["Stock", "4-stock"], ["Cash", "5-cash"]]) {
  await page.getByRole("tab", { name: new RegExp(tab) }).click();
  await shot(name);
}
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
