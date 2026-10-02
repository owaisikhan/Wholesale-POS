# Wholesale-POS (Sohana Traders)

Built with the kodexa-builder skill (v1.4.0). Load it for any new feature or
design work, and log preferences, corrections and reversals to
`.claude/kodexa-learnings.md` as they happen.

## Client brief (confirmed)

- Client: Sunil Kumar, SOHANA TRADERS, Sukkur, 0331-3151751. Urdu name on his card: سوھان ٹریڈرس.
- Business: small wholesaler (detergents, washing tel, soda, khaar, amchoor, garam masala), 4 to 5 items, 50 to 60 customers (shops), sells on udhaar.
- Device: one Android phone only (Redmi 14C). Single user, no salesman app.
- Printer: 58mm Bluetooth thermal, model MPT-II (384 dots printable width).
- Memo language: English or Urdu, chosen per bill.
- Needs: customer/supplier khata, stock in/out with low-stock alerts, billing + 58mm print, cash in/out, send bill on WhatsApp.
- He adds his own items later; sample data uses placeholder items.

## Decisions

- Print the memo as a 384px bitmap, not printer text: the MPT-II has no Urdu font.
- Digits stay Latin in the Urdu memo.
- WhatsApp: one-tap share of the memo image (free), not the paid Business API.
- Demo is shown as a web page, not an APK.

- Demo = the web build of the same Expo app, on a free Vercel link. In-memory SQLite per tab (sql.js on web, `src/db/open.web.js`; expo-sqlite on Android, `src/db/open.js`), seeded with sample data, resets on refresh; memos say DEMO; WhatsApp never prefills a stored number in the demo.
- Money and stock rules are SQLite triggers (`src/db/schema.js`): no negative stock, append-only ledger/cash/bills, bill "previous" must equal the khata balance, walk-in pays in full. `src/lib/refusals.js` turns them into sentences with figures.
- Khata sign: balance = SUM(debit - credit). Customer positive = he owes us. Supplier negative = we owe him.

## Stack

Expo SDK 57 (React Native 0.86, React 19), expo-router (routes in `src/app/`), expo-sqlite on Android, sql.js on web (`public/sql-wasm.js` + `.wasm`, loaded at runtime), plain JavaScript.
Read `AGENTS.md` and the versioned Expo docs before touching Expo APIs.

## Layout

- `src/app/(tabs)/` Home, New Bill, Khata, Stock, Cash. `src/app/memo/[id].js` memo + share/print. `src/app/party/[id].js` khata statement. `src/app/bills.js` all bills (Today / 7 days / All, search, day groups, 30 per page), opened from Home.
- `src/db/` schema (rules), actions (writes, each in one transaction), queries (reads), seed (demo shop), DbProvider (`useQuery` re-runs after any write).
- `src/components/Memo.js` the 58mm memo (384px). `src/components/icons.js` the only place icons are imported from.
- `src/lib/share.web.js` memo to PNG (html-to-image) and Web Share; `share.js` is the Android stub (view-shot + Bluetooth print come in the paid build).
- `design/memo/` the approved static memo and its render script.

## Commands

- `npm run web` dev server. `npm run build:web` export to `dist/`. `npm run serve` serve `dist/` with SPA fallback.
- `npm run check` (needs `npm run serve` running): screenshots every tab at 360x800 and walks bill, memo, refusal, payment, stock in, cash out, all bills; opens 3 tabs at once. Playwright is not a dependency; symlink the global one: `ln -sfn /opt/node-tools/node_modules/playwright node_modules/playwright`.

## Gotchas

- Never use expo-sqlite on web: its worker always opens an OPFS access-handle pool that one tab holds, so every other tab hangs on "Opening your shop" (NoModificationAllowedError). `scripts/checks/tabs.mjs` guards this. `explain()` still re-derives refusals from the figures if a trigger's code is missing.
- Import icons only through `src/components/icons.js`; the package root adds about 2 MB.
- From a stack screen, go to a tab with `router.dismissTo(...)`; `navigate`/`replace` stacks a second tabs navigator.
- A ScrollView inside the bottom sheet needs `flexShrink: 1` or long lists cannot scroll.
- Demo seed puts today's bills between 9 AM and now, none before 10 AM, so a late-night visitor does not see bills at 12:05 AM.
- Slow phones: `dist/index.html` gets a plain-HTML loading screen (`#boot`, from `scripts/add-meta.mjs`), removed by `BootDone` in `src/app/_layout.js`. Web uses woff2 subsets (`src/fonts.web.js`, `assets/fonts/web/`, made with `pyftsubset`); only Latin fonts block the first screen, Urdu loads after, and `renderMemo` waits for it. Native uses the TTFs in `src/fonts.js`.
- Link preview image is `assets/og.jpg` (JPEG under 300 KB, or WhatsApp drops it), served with `Cross-Origin-Resource-Policy: cross-origin`. Rebuild it with `node design/og/render.mjs`.
- sql.js is loaded from `public/` with a script tag, not bundled: its build requires Node's `fs`. Upgrading sql.js means copying both files from `node_modules/sql.js/dist/` again.
- Hashed files under `/_expo/static` and `/assets` are served immutable for a year (`vercel.json`).
