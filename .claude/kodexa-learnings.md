# kodexa-builder learnings

This file is how this repo teaches the kodexa-builder skill. Every session
that loads the skill reads it first and appends to it as the user corrects,
reverses or chooses things. Entries promoted into the skill are marked with
the version they landed in. See the skill's `references/self-improvement.md`
for the rules.

- **Project:** Wholesale-POS (Sohana Traders, Sukkur)
- **Type:** mobile-app
- **Who reads it daily:** the shop owner, alone, on one Android phone, printing 58mm memos
- **Palette exceptions:** none (thermal memo is pure black on white)
- **Skill version when started:** 1.4.0

## Summary

| ID | Date | Kind | Lesson (short) | Scope | Status |
|---|---|---|---|---|---|
| L-001 | 2026-10-01 | gap | 58mm thermal + Urdu: print the memo as a 384px bitmap | type: mobile-app | logged |
| L-002 | 2026-10-01 | gotcha | Headless renders silently fall back when web fonts are blocked; bundle fonts | all | logged |
| L-003 | 2026-10-01 | gotcha | expo-sqlite on web loses RAISE messages; derive refusals from figures | type: mobile-app | logged |
| L-004 | 2026-10-01 | gotcha | lucide-react-native root import adds ~2 MB on web; Expo tree shaking breaks the SQLite worker | type: mobile-app | logged |
| L-005 | 2026-10-01 | gotcha | expo-router: stack screen to tab needs dismissTo, navigate stacks a second tabs navigator | type: mobile-app | logged |
| L-007 | 2026-10-01 | gap | Every "recent X" list needs a "see all" screen with filters and paging | all | logged |
| L-009 | 2026-10-02 | choice | Client link previews lead with the client's own branding (his visiting card), product proof beside it | type: mobile-app | logged |
| L-010 | 2026-10-02 | correction | Web builds need an instant HTML loading screen and small fonts; a white page on slow 4G reads as a crash | all | logged |
| L-006 | 2026-10-01 | choice | Client demo = web build of the Expo app, in-memory DB, free Vercel link | type: mobile-app | logged |

## Entries

### L-001 · 2026-10-01 · medium · gap
- **Said / saw:** client wants the bill "both in english and urdu with select each option" on a 58mm MPT-II Bluetooth printer
- **Context:** sample cash memo for a wholesale POS
- **Lesson:** Cheap 58mm ESC/POS printers have no Urdu glyphs. Draw the memo at 384px (48mm at 203 dpi), pure black, and send it as a raster image. The same image is the WhatsApp share, so one renderer serves both.
- **Scope:** type: mobile-app
- **Target in skill:** references/types/mobile-app.md, new "Thermal printing" section
- **Status:** logged

### L-002 · 2026-10-01 · medium · gotcha
- **Said / saw:** first memo render used fallback fonts with no error; Google Fonts was blocked for the headless browser
- **Context:** rendering memo PNGs with Playwright in the cloud container
- **Lesson:** Bundle woff2 files next to the page instead of linking Google Fonts, and check the screenshot by eye. Offline apps need bundled fonts anyway.
- **Scope:** all
- **Target in skill:** section 5, verification
- **Status:** logged

### L-003 · 2026-10-01 · medium · gotcha
- **Said / saw:** stock refusal came back as "Error finalizing statement" in the web build
- **Context:** SQLite trigger `RAISE(ABORT, 'STOCK_SHORT')` in expo-sqlite 57 web (wa-sqlite worker)
- **Lesson:** On web the RAISE text does not reach JavaScript. Keep the rule in the trigger, and when no code arrives, re-check the figures (stock, walk-in) to choose the sentence. Never show the raw error.
- **Scope:** type: mobile-app
- **Target in skill:** references/types/mobile-app.md, Gotchas
- **Status:** logged

### L-004 · 2026-10-01 · medium · gotcha
- **Said / saw:** web bundle 3.5 MB; with EXPO_UNSTABLE_TREE_SHAKING 1.4 MB but "importScripts ... /worker failed to load"
- **Context:** Expo web export with lucide-react-native and expo-sqlite
- **Lesson:** Import each icon from `lucide-react-native/icons/<name>` through one `icons.js`. That alone gives 1.4 MB with the SQLite worker intact. Do not turn on Expo's unstable tree shaking with expo-sqlite.
- **Scope:** type: mobile-app
- **Target in skill:** references/types/mobile-app.md, Stack
- **Status:** logged

### L-005 · 2026-10-01 · medium · gotcha
- **Said / saw:** after "New bill" on the memo screen, two New Bill screens existed (Playwright strict-mode error)
- **Context:** expo-router 57, root Stack with (tabs) plus memo/[id]
- **Lesson:** From a stack screen back into a tab use `router.dismissTo(href)`. `navigate` and `replace` push a second tabs navigator.
- **Scope:** type: mobile-app
- **Target in skill:** references/types/mobile-app.md, Gotchas
- **Status:** logged

### L-006 · 2026-10-01 · medium · choice
- **Said / saw:** "sending him an APK file would be dangerous, he might not reply ... and wont send me the money"; then "Free Vercel link"
- **Context:** showing a client the app before payment
- **Lesson:** Demo the Android app as its own web build on a free Vercel link: in-memory database seeded with the client's shop, DEMO on every memo, resets on refresh, and no WhatsApp to stored numbers. The APK and license key come after payment.
- **Scope:** type: mobile-app
- **Target in skill:** references/types/mobile-app.md, new "Client demo" section
- **Status:** logged

### L-007 · 2026-10-01 · medium · gap
- **Said / saw:** "it has few recent bills where can i see all the bills entered"
- **Context:** Home showed the last 6 bills and nothing else listed them
- **Lesson:** A "recent" list on a dashboard is a preview, never the only way in. Ship the full list with it: date filter, search, totals for the filter, grouping by day, paging. Link it from the preview's heading and from the matching stat tile.
- **Scope:** all
- **Target in skill:** references/types/dashboard.md and mobile-app.md, UI conventions
- **Status:** logged

### L-008 · 2026-10-01 · low · gotcha
- **Said / saw:** user's screenshot showed today's demo bills at 12:05 AM to 12:50 AM
- **Context:** seed data timed relative to "now", opened just after midnight
- **Lesson:** Seeded "today" activity must sit inside business hours and before now; when the day has not started yet, seed none.
- **Scope:** all
- **Target in skill:** section 5, realistic data
- **Status:** logged

### L-009 · 2026-10-02 · strong · choice
- **Said / saw:** "this is the picture of card, would it be nicer to add this picture instad of memo"; offered A (text + memo) and B (his visiting card + memo); "ok merge B with main"
- **Context:** WhatsApp link preview (og:image) for a client demo
- **Lesson:** For a demo sent to one client, the preview image leads with something he already owns (his visiting card, shop sign, logo) so he sees at a glance it was made for him, with one piece of product proof (the memo) beside it. Keep text to a short label and one line.
- **Scope:** type: mobile-app (client demos)
- **Target in skill:** references/types/mobile-app.md, "Client demo" section
- **Status:** logged

### L-010 · 2026-10-02 · strong · correction
- **Said / saw:** phone screenshot of a white page at 14 KB/s, then "it was there before, what did you do???", "the crashed the whole site"
- **Context:** Expo web demo, 1.6 MB compressed before first paint (361 KB JS, 311 KB wasm, ~930 KB TTF fonts), nothing in index.html but an empty #root
- **Lesson:** Nothing had crashed (live files were byte-identical to the tested build), but to a client a white page is a crash. Every web build ships (1) a plain-HTML loading screen inside index.html with the brand and a "slow internet" line after 6 s, removed when the app mounts, and (2) woff2 subsets for web, never TTF, with non-Latin scripts loaded after first paint. Test with throttled network (CDP emulateNetworkConditions), not only on fast wifi. Prove a "site is broken" report against the live files before changing anything, and say what was found.
- **Scope:** all
- **Target in skill:** references/loading-states.md and section 5
- **Status:** logged
