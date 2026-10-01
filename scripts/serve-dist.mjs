// Serves dist/ like Vercel will: COOP/COEP headers and SPA fallback.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".ttf": "font/ttf", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json" };

http.createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, "index.html");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Content-Type", types[path.extname(p)] || "application/octet-stream");
  fs.createReadStream(p).pipe(res);
}).listen(port, () => console.log(`http://localhost:${port}`));
