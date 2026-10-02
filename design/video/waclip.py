# Cuts the owner's real-phone WhatsApp recording into a fast clip: trims dead
# time, speeds up waits, blurs every contact name, number and photo, and draws
# a gold tap ripple where each tap happened (screen recordings do not show taps).
# Writes frames/wa/*.jpg (640x1440) + taps.json (output seconds) + meta.json.
import av, json, os, shutil
from PIL import Image, ImageDraw, ImageFilter

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "frames", "wa"); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
FPS = 30
SW, SH = 640, 1440            # output screen size (source is 576x1296, same aspect)

# (from, to, speed) in source seconds
SEGS = [(0.30, 2.95, 1.5),     # khata list, tap Al-Habib
        (2.95, 5.12, 1.5),     # Al-Habib khata, tap Send khata on WhatsApp
        (5.90, 10.70, 2.5),    # WhatsApp "Send to": pick the friend, tap send
        (10.70, 14.95, 2.0),   # chat: khata text ready, tap send
        (14.95, 17.40, 1.0)]   # khata delivered, read it
HOLD = 1.2                     # freeze on the delivered khata

# taps: source time, x, y (source pixels)
TAPS = [(2.40, 140, 650), (5.00, 288, 622), (8.80, 120, 356), (10.30, 524, 1216), (14.58, 524, 1220)]

# blur boxes (source pixels) by source time range
def blur_boxes(t):
    if 5.85 <= t < 10.70:                       # Send to: whole contact list + selected bar
        return [(0, 290, 576, 1296)]
    if 10.70 <= t:                              # chat: friend's name/photo, older messages
        boxes = [(40, 62, 330, 132)]
        boxes.append((0, 140, 576, 330) if t >= 14.95 else (40, 140, 576, 440))
        return boxes
    return []

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
    s = SW / 576; x, y = x * s, y * s
    r = 26 + 34 * k; a = int(255 * (1 - k))
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); g = ImageDraw.Draw(ov)
    g.ellipse((x - r, y - r, x + r, y + r), outline=(227, 162, 26, a), width=7, fill=(227, 162, 26, int(a * 0.3)))
    return Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")

c = av.open(os.path.join(here, "wa-raw.mp4"))
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
json.dump({"fps": FPS, "frames": idx}, open(os.path.join(out, "meta.json"), "w"))
print("wa frames", idx, "secs", round(idx / FPS, 1), "taps at", [round(o / FPS, 2) for o, _, _ in tap_out])
