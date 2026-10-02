// Runs after `expo export -p web`: adds the link-preview tags WhatsApp and
// Facebook read, and copies the preview image next to index.html.
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
    <meta property="og:image" content="${SITE}/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Sohana Traders app with a sample 58mm cash memo" />
    <meta name="twitter:card" content="summary_large_image" />`;

const file = "dist/index.html";
let html = fs.readFileSync(file, "utf8");
if (!html.includes('property="og:image"')) {
  html = html.replace("</title>", `</title>${tags}`);
  fs.writeFileSync(file, html);
}
fs.copyFileSync("assets/og.png", "dist/og.png");
console.log("link preview tags added");
