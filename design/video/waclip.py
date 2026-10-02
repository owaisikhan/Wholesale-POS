# Cuts the owner's real-phone WhatsApp recording into a fast clip: trims dead
# time, speeds up waits, blurs every contact name, number and photo, and draws
# a gold tap ripple where each tap happened (screen recordings do not show taps).
# Writes frames/wa/*.jpg + taps.json + captions.json (output seconds) + meta.json.
import av, json, os, shutil
from PIL import Image, ImageDraw, ImageFilter

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "frames", "wa"); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
FPS = 30
SRC = "wa-raw2.mp4"           # owner's real-phone recording: bill -> memo picture -> WhatsApp
SRCW = 1080                   # source is 1080x2412
SW, SH = 640, 1429            # output screen size, same aspect

# (from, to, speed) in source seconds
SEGS = [(0.40, 1.40, 1.5),     # Home, tap New Bill
        (1.40, 4.20, 1.5),     # choose customer: Cash Customer
        (4.20, 6.30, 1.5),     # tap Washing Powder again (qty 2)
        (6.30, 10.10, 2.0),    # scroll, Save and show memo
        (10.10, 13.95, 2.0),   # memo, tap Send memo on WhatsApp
        (13.95, 16.00, 1.5),   # Android share sheet, tap WhatsApp
        (16.00, 19.40, 1.5),   # WhatsApp: pick the chat, send
        (19.40, 21.80, 1.0)]   # memo picture delivered
HOLD = 1.0

# taps: source time, x, y (source pixels), found from frame differences
TAPS = [(1.20, 540, 648), (2.75, 540, 691), (3.75, 259, 929), (5.65, 259, 1123), (9.85, 540, 1767),
        (13.40, 540, 2195), (15.60, 160, 2069), (17.70, 216, 1054), (18.66, 976, 2268)]

def blur_boxes(t):
    if 13.90 <= t < 15.95:                      # share sheet: recent contacts row
        return [(0, 1340, 1080, 1660)]
    if 15.95 <= t < 18.30:                      # WhatsApp send list, to the bottom edge
        return [(0, 760, 1080, 2412)]
    if 18.30 <= t < 19.40:                      # caption screen: list + chat name, keep the send button
        return [(0, 760, 1080, 2160), (0, 2160, 880, 2412)]
    if 19.40 <= t:                              # chat header: name and photo
        return [(90, 100, 820, 235)]
    return []

# caption changes, as source times
CAPS = [(0.40, "Ab asli phone par: naya bill", "On a real phone: make a bill", "BONUS  REAL PHONE"),
        (9.96, "Memo ki picture WhatsApp par", "Send the memo picture on WhatsApp", "BONUS  REAL PHONE"),
        (19.40, "Memo customer ke WhatsApp par pohanch gaya", "The memo picture reaches the customer", "BONUS  REAL PHONE")]

# output timeline -> source times
src_times, seg_of = [], []
for k, (a, b, sp) in enumerate(SEGS):
    n = int(round((b - a) / sp * FPS))
    for i in range(n):
        src_times.append(a + i * sp / FPS); seg_of.append(k)

def src_to_out(ts):
    best = min(range(len(src_times)), key=lambda i: abs(src_times[i] - ts))
    return best

tap_out = [(src_to_out(ts - 0.25), x, y) for ts, x, y in TAPS]

def ripple(img, k, x, y):
    # k: 0..1 progress; drawn at output scale
    s = SW / SRCW; x, y = x * s, y * s
    r = 26 + 34 * k; a = int(255 * (1 - k))
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); g = ImageDraw.Draw(ov)
    g.ellipse((x - r, y - r, x + r, y + r), outline=(227, 162, 26, a), width=7, fill=(227, 162, 26, int(a * 0.3)))
    return Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")

c = av.open(os.path.join(here, SRC))
frames = c.decode(video=0)
cur = next(frames); nxt = next(frames)
idx = 0
for i, t in enumerate(src_times):
    while nxt is not None and float(nxt.pts * nxt.time_base) <= t:
        cur = nxt; nxt = next(frames, None)
    im = cur.to_image().convert("RGB")
    for box in blur_boxes(t):
        reg = im.crop(box).filter(ImageFilter.GaussianBlur(22)).filter(ImageFilter.GaussianBlur(10))
        im.paste(reg, box[:2])
    im = im.resize((SW, SH), Image.LANCZOS)
    for o, x, y in tap_out:
        if o <= i < o + 11: im = ripple(im, (i - o) / 11, x, y)
    im.save(os.path.join(out, f"{idx:05d}.jpg"), quality=90); idx += 1
last = im
for j in range(int(HOLD * FPS)):
    last.save(os.path.join(out, f"{idx:05d}.jpg"), quality=90); idx += 1

json.dump([round(o / FPS, 3) for o, _, _ in tap_out], open(os.path.join(out, "taps.json"), "w"))
json.dump([{"at": round(src_to_out(t) / FPS, 3), "ur": u, "en": e, "chapter": ch} for t, u, e, ch in CAPS], open(os.path.join(out, "captions.json"), "w"))
json.dump({"fps": FPS, "frames": idx}, open(os.path.join(out, "meta.json"), "w"))
print("wa frames", idx, "secs", round(idx / FPS, 1), "taps at", [round(o / FPS, 2) for o, _, _ in tap_out])
