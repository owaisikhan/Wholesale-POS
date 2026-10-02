# Demo walkthrough video

Records the web demo as a client walkthrough (about 2 minutes, 1080x1920, 30 fps).
Uses the kodexa-reels skill workspace (`setup.sh`, `render.js`, `music.py`, `sheet.py`, `frames.py`).

1. `npm run build:web && npm run serve` in the repo (demo on http://localhost:4173).
2. In the reels workspace, copy these files in, then:
   - `VIEW=432x768 node render.js endcard "reels/endcard-app.html?line=...&hot=android&eyebrow=this%20app%20was%20built%20by" 3 "" "" none`
   - `node apprec.js demo http://localhost:4173/ steps.js` (frames on a virtual clock; real taps, typing and scrolls)
   - `python walk.py demo sohana-demo.mp4 <repo>/design/og/card.jpg`
3. Check: `sheet.py demo <times>` for the bill figures, `levels.py` around -21 dB, `onsets.py` on tap times.

`steps.js` is the script: one `cap()` per caption (Roman Urdu, English, chapter), then the taps.
If a screen changes, edit the step and re-record; `apprec.js` stops if a tap target is off screen.

## Real-phone WhatsApp clip (bonus, before the end card)

`waclip.py` cuts the owner's own screen recording (`wa-raw2.mp4` in the workspace, never committed:
it shows private chats) into a 15 s clip (bill, memo picture, WhatsApp): speeds up waits,
blurs every contact name, number and photo (`blur_boxes`), and draws a gold ripple at each tap
(`TAPS`, found from frame differences), and writes its captions (`CAPS`). `walk.py` adds it after the demo frames when `frames/wa/` exists.
