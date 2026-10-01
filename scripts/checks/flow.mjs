// Walks the main job: bill -> memo (English + Urdu picture) -> refusal -> payment -> stock in -> cash out.
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
const fail = (m) => { errors.push(m); };
page.on("pageerror", (e) => fail("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") fail("console: " + m.text()); });
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
// Sheets render last in the DOM, so pick the last visible match inside one.
const pickInSheet = async (t) => { await page.getByText(t, { exact: true }).locator("visible=true").last().click(); await page.waitForTimeout(450); };
const tap = async (t, opts = {}) => { await page.getByText(t, { exact: true, ...opts }).locator("visible=true").last().click(); await page.waitForTimeout(450); };

// Up to 3 tries: a sandbox proxy sometimes drops the first download of the bundle.
for (let i = 0; ; i++) {
  await page.goto(base, { waitUntil: "networkidle" });
  try { await page.getByText("New Bill", { exact: true }).first().waitFor({ timeout: 20000 }); break; }
  catch (e) { if (i === 2) throw e; }
}

// 1. Bill for Mehran Mart (balance 0): 2 cartons powder + 12 bottles tel, 100 discount, 3000 received.
await page.getByRole("tab", { name: /New Bill/ }).click();
await tap("Tap to choose customer");
await page.getByPlaceholder("Search name or phone", { exact: true }).locator("visible=true").last().fill("Mehran");
await pickInSheet("Mehran Mart");
await page.getByLabel("Add Washing Powder 1kg").locator("visible=true").first().click();
await page.getByLabel("Add Washing Powder 1kg").locator("visible=true").first().click();
await page.getByLabel("Add Washing Tel 1L").locator("visible=true").first().click();
await page.getByLabel("Quantity").locator("visible=true").nth(1).fill("12");
await page.getByPlaceholder("e.g. 100", { exact: true }).locator("visible=true").last().fill("100");
await page.getByPlaceholder("e.g. 5000", { exact: true }).locator("visible=true").last().fill("3000");
await page.waitForTimeout(300);
await shot("6-bill-filled");
const body = await page.locator("body").innerText();
if (!body.includes("Rs 6,860")) fail("bill total wrong (expected 2x2350 + 12x180 - 100 = 6,860)");
if (!body.includes("Remaining balance") && !body.includes("Advance")) fail("no remaining balance line");
await tap("Save and show memo");
await page.getByText("Send memo on WhatsApp").waitFor({ timeout: 15000 });
await page.waitForTimeout(800);
await shot("7-memo-en");

// 2. Urdu memo and the generated pictures.
await page.getByRole("tab", { name: "اردو" }).click();
await page.getByText("Send memo on WhatsApp").waitFor({ timeout: 15000 });
await page.waitForTimeout(800);
await shot("8-memo-ur");
const dl = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
await tap("Print 58mm memo");
const file = await dl;
if (!file) fail("print picture was not produced");
else {
  await file.saveAs(`${out}/memo-print-from-app.png`);
}

// 3. Refusal: more soda than in stock.
await tap("New bill");
await page.waitForTimeout(800);
await shot("8b-after-newbill");
await page.getByText("Tap to choose customer").locator("visible=true").first().waitFor();
await tap("Tap to choose customer");
await page.getByPlaceholder("Search name or phone", { exact: true }).locator("visible=true").last().fill("usman");
await pickInSheet("Usman Store");
await page.getByLabel("Add Soda 25kg").locator("visible=true").first().click();
await page.getByLabel("Quantity").locator("visible=true").first().fill("50");
await tap("Save and show memo");
await page.getByText(/Not enough stock: Soda 25kg/).waitFor({ timeout: 5000 }).catch(() => fail("no stock refusal shown"));
await shot("9-refusal");
await tap("Clear bill");

// 4. Receive payment from Sindh Kiryana.
await page.getByRole("tab", { name: /Khata/ }).click();
await page.getByPlaceholder("Search name or phone", { exact: true }).locator("visible=true").last().fill("Sindh");
await page.waitForTimeout(400);
await tap("Sindh Kiryana");
const owed = async () => Number(((await page.locator("body").innerText()).match(/He owes you\s*Rs ([\d,]+)/) || [])[1]?.replace(/,/g, "") || NaN);
const before = await owed();
await tap("Receive");
await page.getByPlaceholder("e.g. 5000", { exact: true }).locator("visible=true").last().fill("5000");
await tap("Save");
await page.waitForTimeout(500);
await shot("10-party");
const after = await owed();
if (!(before - after === 5000)) fail(`payment did not reduce balance by 5,000 (${before} -> ${after})`);
await page.getByLabel("Back").locator("visible=true").first().click();

// 5. Stock in 10 bori soda from Lever on credit, 5000 paid.
await page.getByRole("tab", { name: /Stock/ }).click();
await tap("Stock In (maal aaya)");
await pickInSheet("Soda 25kg");
await page.getByPlaceholder("e.g. 20", { exact: true }).locator("visible=true").last().fill("10");
await page.getByPlaceholder("e.g. 2100", { exact: true }).locator("visible=true").last().fill("2400");
await pickInSheet("Lever Distributor Hyderabad");
await page.getByPlaceholder("e.g. 0 if on credit", { exact: true }).locator("visible=true").last().fill("5000");
await shot("11-stockin");
await tap("Save stock");
await page.waitForTimeout(500);
const sb = await page.locator("body").innerText();
if (!/Soda 25kg[\s\S]{0,60}\b1[0-9]\b/.test(sb)) fail("soda stock did not go up by 10");

// 6. Cash out.
await page.getByRole("tab", { name: /Cash/ }).click();
await tap("Cash Out");
await page.getByPlaceholder("e.g. 500", { exact: true }).locator("visible=true").last().fill("400");
await tap("Tea / Food");
await tap("Save");
await page.waitForTimeout(500);
await shot("12-cash");
await page.getByRole("tab", { name: /Home/ }).click();
await page.waitForTimeout(500);
await shot("13-home-after");

// 7. All bills: open from Home, filter and search.
await tap("See all bills");
await page.getByText("All bills").locator("visible=true").first().waitFor();
await page.waitForTimeout(600);
await shot("14-all-bills");
const ab = await page.locator("body").innerText();
const n = Number((ab.match(/(\d+) bills? \|/) || [])[1] || 0);
if (n < 15) fail(`all bills shows ${n}, expected the whole history`);
await page.getByPlaceholder("Search customer or bill number", { exact: true }).locator("visible=true").last().fill("Mehran");
await page.waitForTimeout(600);
const sr = await page.locator("body").innerText();
if (!sr.includes("Mehran Mart") || sr.includes("Sindh Kiryana")) fail("search by customer did not filter the list");
await shot("15-all-bills-search");
await page.getByPlaceholder("Search customer or bill number", { exact: true }).locator("visible=true").last().fill("");
await page.getByRole("tab", { name: "Today", exact: true }).locator("visible=true").last().click();
await page.waitForTimeout(600);
const td = await page.locator("body").innerText();
await shot("16-all-bills-today");
if (/Yesterday/.test(td)) fail("Today filter still shows yesterday's bills");

console.log(errors.length ? "FAIL\n" + errors.join("\n") : "flow ok");
await browser.close();
process.exit(errors.length ? 1 : 0);
