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

## Layout

- `design/memo/memo.html` sample cash memo, English/Urdu toggle (`?lang=ur`).
- `design/memo/render.mjs` renders `out/memo-<lang>-print.png` (1:1 printer) and `-whatsapp.png` (2x).
- `design/memo/fonts/` bundled fonts (IBM Plex Sans Condensed, Noto Nastaliq Urdu).
