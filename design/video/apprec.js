// Records a scripted walkthrough of a local web app on the virtual clock:
// real taps (with a gold ripple), letter-by-letter typing and smooth scrolls,
// one screenshot per 1/30 s. Writes frames/<name>/*.jpg, captions.json, taps.json.
// node apprec.js <name> <url> <steps.js>
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const { VIRTUAL } = require("./render.js");
const [name, url, stepsFile] = process.argv.slice(2);
const FPS = 30, STEP = 1000 / FPS;
const out = path.join(__dirname, "frames", name);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const ctx = await b.newContext({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: "Asia/Karachi", locale: "en-PK" });
  await ctx.addInitScript(VIRTUAL);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(url, { waitUntil: "load" });
  const adv = (n = 1) => p.evaluate(([n, ms]) => { for (let i = 0; i < n; i++) window.__advance(ms); }, [n, STEP]);
  // warm up off the record until the app is ready
  for (let i = 0; i < 600; i++) {
    await adv(1); await p.waitForTimeout(20);
    if (await p.getByText("New Bill", { exact: true }).count()) break;
  }
  for (let i = 0; i < 40; i++) { await adv(1); await p.waitForTimeout(15); }

  let f = 0;
  const caps = [], taps = [];
  const frame = async () => {
    await adv(1);
    await p.waitForTimeout(12);
    await p.screenshot({ path: path.join(out, String(f).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 90 });
    f++;
  };
  const hold = async (s) => { for (let i = 0, n = Math.round(s * FPS); i < n; i++) await frame(); };

  const vis = (loc) => loc.locator("visible=true").last();
  const find = (t) => {
    if (typeof t !== "string") return t;
    if (t.startsWith("label:")) return vis(p.getByLabel(t.slice(6), { exact: true }));
    if (t.startsWith("ph:")) return vis(p.getByPlaceholder(t.slice(3), { exact: true }));
    if (t.startsWith("tab:")) return vis(p.getByRole("tab", { name: new RegExp("^" + t.slice(4)) }));
    return vis(p.getByText(t, { exact: true }));
  };

  // Scroll the element's own scroll container so it sits mid-screen, smoothly.
  const reveal = async (loc) => {
    const h = await loc.elementHandle();
    const plan = await p.evaluate((el) => {
      const r = el.getBoundingClientRect(), cy = r.top + r.height / 2;
      if (cy > 130 && cy < 630) return null;
      let s = el.parentElement;
      while (s && !(s.scrollHeight > s.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
      if (!s) return null;
      document.querySelectorAll("[data-rec-scroll]").forEach((e) => delete e.dataset.recScroll);
      s.dataset.recScroll = "1";
      const max = s.scrollHeight - s.clientHeight;
      return { from: s.scrollTop, to: Math.max(0, Math.min(max, s.scrollTop + cy - 380)) };
    }, h);
    if (plan && Math.abs(plan.to - plan.from) > 4) await glide(plan.from, plan.to, 18);
  };
  const glide = async (from, to, frames) => {
    for (let i = 1; i <= frames; i++) {
      const k = i / frames, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      await p.evaluate((y) => { const s = document.querySelector('[data-rec-scroll="1"]'); if (s) s.scrollTop = y; }, from + (to - from) * e);
      await frame();
    }
  };
  // Scroll the main scroll area under the screen centre by dy pixels.
  const scroll = async (dy, secs = 1.2) => {
    const plan = await p.evaluate((dy) => {
      document.querySelectorAll("[data-rec-scroll]").forEach((e) => delete e.dataset.recScroll);
      const els = document.elementsFromPoint(180, 420);
      for (const el of els) {
        let s = el;
        while (s && !(s.scrollHeight > s.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
        if (s) { s.dataset.recScroll = "1"; const max = s.scrollHeight - s.clientHeight; return { from: s.scrollTop, to: Math.max(0, Math.min(max, s.scrollTop + dy)) }; }
      }
      return null;
    }, dy);
    if (plan) await glide(plan.from, plan.to, Math.round(secs * FPS)); else await hold(secs);
  };
  const ripple = (x, y) => p.evaluate(([x, y]) => {
    const d = document.createElement("div");
    Object.assign(d.style, { position: "fixed", left: x - 28 + "px", top: y - 28 + "px", width: "56px", height: "56px", borderRadius: "50%", border: "4px solid #E3A21A", background: "rgba(227,162,26,.28)", zIndex: 100000, pointerEvents: "none" });
    document.body.appendChild(d);
    d.animate([{ transform: "scale(.4)", opacity: 1 }, { transform: "scale(1.25)", opacity: 0 }], { duration: 520, easing: "ease-out", fill: "forwards" });
    setTimeout(() => d.remove(), 600);
  }, [x, y]);

  const tap = async (t, { fake = false, wait = 0.5 } = {}) => {
    const loc = find(t);
    await loc.waitFor({ timeout: 15000 });
    await reveal(loc);
    const bx = await loc.boundingBox();
    const x = bx.x + bx.width / 2, y = bx.y + bx.height / 2;
    if (y < 0 || y > 720) throw new Error(`tap target off screen after reveal: ${t} at y=${Math.round(y)}`);
    await ripple(x, y);
    taps.push(+(f / FPS).toFixed(3));
    await hold(0.2);
    if (!fake) await p.mouse.click(x, y);
    await hold(wait);
  };
  const type = async (t, text, { clear = false } = {}) => {
    await tap(t, { wait: 0.15 });
    if (clear) { await p.keyboard.press("Control+A"); await p.keyboard.press("Backspace"); await hold(0.1); }
    for (const ch of text) { await p.keyboard.type(ch); await hold(0.1); }
    await hold(0.3);
  };
  const cap = (ur, en, chapter) => caps.push({ at: +(f / FPS).toFixed(3), ur, en, chapter });

  const steps = require(path.resolve(stepsFile));
  await steps({ tap, type, hold, scroll, cap, page: p, frame });

  fs.writeFileSync(path.join(out, "captions.json"), JSON.stringify(caps, null, 1));
  fs.writeFileSync(path.join(out, "taps.json"), JSON.stringify(taps));
  fs.writeFileSync(path.join(out, "meta.json"), JSON.stringify({ fps: FPS, frames: f }));
  console.log(name, "frames", f, "secs", (f / FPS).toFixed(1), "taps", taps.length, "errors", JSON.stringify(errs));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
