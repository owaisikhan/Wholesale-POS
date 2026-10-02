// Runs after `expo export -p web`:
// 1. adds the link-preview tags WhatsApp and Facebook read, and copies the image;
// 2. adds a plain-HTML loading screen so a slow phone shows the shop name at once
//    instead of a white page while 1 MB of app downloads. The app removes it
//    (#boot, see src/app/_layout.js) when it is ready.
import fs from "node:fs";

const SITE = process.env.SITE_URL || "https://sohana-pos-demo.vercel.app";
const title = "Sohana Traders | Billing and Khata App (Demo)";
const desc = "Bill + 58mm memo in English or Urdu, khata, stock alerts, cash in/out, and bills on WhatsApp. Try the demo on your phone.";

const tags = `
    <meta name="description" content="${desc}" />
    <meta name="theme-color" content="#1B2A4A" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Kodexa" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:url" content="${SITE}/" />
    <meta property="og:image" content="${SITE}/og.jpg" />
    <meta property="og:image:secure_url" content="${SITE}/og.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Sohana Traders visiting card and a sample 58mm cash memo" />
    <meta name="twitter:card" content="summary_large_image" />`;

const boot = `
    <div id="boot" style="position:fixed;inset:0;z-index:9999;background:#1B2A4A;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:system-ui,-apple-system,Roboto,Arial,sans-serif;text-align:center;padding:24px">
      <div style="font-size:26px;font-weight:700;letter-spacing:1px">SOHANA TRADERS</div>
      <div style="width:44px;height:44px;border:4px solid rgba(255,255,255,.25);border-top-color:#E3A21A;border-radius:50%;animation:bootspin 0.9s linear infinite"></div>
      <div style="font-size:16px;color:#D6DBE6">App khul rahi hai... Opening your shop</div>
      <div id="boot-slow" style="font-size:14px;color:#F3D58C;max-width:300px;visibility:hidden">Internet slow hai, thora intezar karein. Pehli dafa khulne mein waqt lagta hai.</div>
    </div>
    <style>@keyframes bootspin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){#boot div{animation:none!important}}</style>
    <script>setTimeout(function(){var s=document.getElementById("boot-slow");if(s)s.style.visibility="visible"},6000)</script>`;

// Preload what the app needs next, so the browser fetches it in parallel with
// the app code instead of one file after another.
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
const files = walk("dist").map((f) => f.slice(4));
const pick = (re) => files.filter((f) => re.test(f));
const preload = [
  `<link rel="preload" href="/sql-wasm.js" as="script" />`,
  `<link rel="preload" href="/sql-wasm.wasm" as="fetch" type="application/wasm" crossorigin />`,
  ...pick(/fonts\/web\/plex-.*\.woff2$/).map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin />`),
].map((l) => `\n    ${l}`).join("");

const file = "dist/index.html";
let html = fs.readFileSync(file, "utf8");
if (!html.includes('property="og:image"')) {
  html = html.replace("</title>", `</title>${tags}`);
}
if (!html.includes('id="boot"')) html = html.replace("<body>", `<body>${boot}`);
if (!html.includes('rel="preload"')) html = html.replace("</title>", `</title>${preload}`);
fs.writeFileSync(file, html);
fs.copyFileSync("assets/og.jpg", "dist/og.jpg");
console.log("link preview tags and loading screen added");
