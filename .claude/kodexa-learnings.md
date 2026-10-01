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
