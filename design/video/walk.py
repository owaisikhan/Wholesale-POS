# Composes the client walkthrough: intro card, app frames inside a phone with a
# caption band (Roman Urdu + English, chapter chip), tap sounds on every tap,
# soft lofi music, then the Kodexa end card. 1080x1920, 30 fps, H.264 10 Mbps.
# python walk.py <frames-name> <out.mp4> <intro-card.jpg>
import sys, os, json, glob, textwrap, av, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import music

name, out, cardpath = sys.argv[1], sys.argv[2], sys.argv[3]
here = os.path.dirname(os.path.abspath(__file__))
d = os.path.join(here, "frames", name)
W, H, FPS, SR = 1080, 1920, 30, 44100
FONTS = "/home/user/Wholesale-POS/assets/fonts/"
font = lambda sz, w="700": ImageFont.truetype(FONTS + {"700": "plex-sans-700.ttf", "600": "plex-sans-600.ttf", "400": "plex-sans-400.ttf"}[w], sz)
NAVY, GOLD, CREAM, INK = "#1B2A4A", "#E3A21A", "#F3D58C", "#17233B"

files = sorted(glob.glob(os.path.join(d, "*.jpg")))
caps = json.load(open(os.path.join(d, "captions.json")))
taps = json.load(open(os.path.join(d, "taps.json")))
endfiles = sorted(glob.glob(os.path.join(here, "frames", "endcard", "*.jpg")))
# real-phone WhatsApp clip (waclip.py): blurred, sped up, ripples drawn in
wafiles = sorted(glob.glob(os.path.join(here, "frames", "wa", "*.jpg")))
watap = json.load(open(os.path.join(here, "frames", "wa", "taps.json"))) if wafiles else []
WACAPS = [
    {"at": 0.0, "ur": "Ab asli phone par: khata WhatsApp par", "en": "On a real phone: send the khata on WhatsApp", "chapter": "BONUS  REAL PHONE"},
    {"at": 3.4, "ur": "Customer chunein aur bhej dein", "en": "Pick the customer and send", "chapter": "BONUS  REAL PHONE"},
    {"at": 6.9, "ur": "Khata seedha customer ke WhatsApp par", "en": "The khata reaches the customer on WhatsApp", "chapter": "BONUS  REAL PHONE"},
]
INTRO = int(3.6 * FPS)
XF = 8  # caption cross-fade frames

# ---- phone frame, drawn once ----
SX, SY, SW, SH = 180, 440, 720, 1440
base = Image.new("RGB", (W, H), NAVY)
g = ImageDraw.Draw(base)
g.rounded_rectangle((SX - 14, SY - 14, SX + SW + 14, SY + SH + 60), 58, fill="#0B1220")
mask = Image.new("L", (SW, SH), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, SW, SH), 40, fill=255)

def caption_layer(c):
    im = Image.new("RGBA", (W, SY - 20), (0, 0, 0, 0))
    g = ImageDraw.Draw(im)
    chip = c.get("chapter") or ""
    if chip:
        f = font(30)
        tw = g.textlength(chip, font=f)
        g.rounded_rectangle((60, 54, 60 + tw + 44, 104), 25, fill=GOLD)
        g.text((82, 59), chip, font=f, fill=INK)
    y = 132
    for line in textwrap.wrap(c["ur"], 30):
        g.text((60, y), line, font=font(54), fill="#FFFFFF"); y += 66
    y += 12
    for line in textwrap.wrap(c["en"], 46):
        g.text((60, y), line, font=font(36, "400"), fill=CREAM); y += 46
    return im

layers = [caption_layer(c) for c in caps]
starts = [int(round(c["at"] * FPS)) for c in caps]

def cap_at(i):
    k = max([j for j, s in enumerate(starts) if s <= i], default=None)
    return k

def demo_frame(i):
    fr = base.copy()
    pg = Image.open(files[i]).convert("RGB")
    if pg.size != (SW, SH): pg = pg.resize((SW, SH), Image.LANCZOS)
    fr.paste(pg, (SX, SY), mask)
    k = cap_at(i)
    if k is not None:
        a = min(1, (i - starts[k] + 1) / XF)
        if a < 1 and k > 0:
            old = layers[k - 1].copy(); old.putalpha(old.split()[3].point(lambda v: int(v * (1 - a))))
            fr.paste(old, (0, 0), old)
        lay = layers[k]
        if a < 1:
            lay = lay.copy(); lay.putalpha(lay.split()[3].point(lambda v: int(v * a)))
        fr.paste(lay, (0, 0), lay)
    return fr

WX, WW, WH = (W - 640) // 2, 640, 1440
wabase = Image.new("RGB", (W, H), NAVY)
ImageDraw.Draw(wabase).rounded_rectangle((WX - 14, SY - 14, WX + WW + 14, SY + WH + 60), 58, fill="#0B1220")
wamask = Image.new("L", (WW, WH), 0); ImageDraw.Draw(wamask).rounded_rectangle((0, 0, WW, WH), 40, fill=255)
walayers = [caption_layer(c) for c in WACAPS]
wastarts = [int(round(c["at"] * FPS)) for c in WACAPS]

def wa_frame(i):
    fr = wabase.copy()
    pg = Image.open(wafiles[i]).convert("RGB")
    if pg.size != (WW, WH): pg = pg.resize((WW, WH), Image.LANCZOS)
    fr.paste(pg, (WX, SY), wamask)
    k = max([j for j, st in enumerate(wastarts) if st <= i], default=0)
    a = min(1, (i - wastarts[k] + 1) / XF)
    if a < 1 and k > 0:
        old = walayers[k - 1].copy(); old.putalpha(old.split()[3].point(lambda v: int(v * (1 - a)))); fr.paste(old, (0, 0), old)
    lay = walayers[k]
    if a < 1: lay = lay.copy(); lay.putalpha(lay.split()[3].point(lambda v: int(v * a)))
    fr.paste(lay, (0, 0), lay)
    return fr

# ---- intro: his visiting card + title ----
card = Image.open(cardpath).convert("RGB")
cw = 940; card = card.resize((cw, int(card.height * cw / card.width)), Image.LANCZOS)
def intro_frame(i):
    fr = Image.new("RGB", (W, H), NAVY)
    g = ImageDraw.Draw(fr)
    k = min(1, i / 12)
    s = 1.0 + 0.03 * (i / INTRO)
    c = card.resize((int(card.width * s), int(card.height * s)), Image.LANCZOS)
    sh = Image.new("RGBA", (c.width + 60, c.height + 60), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((30, 40, c.width + 30, c.height + 40), 30, fill=(0, 0, 0, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    x, y = (W - c.width) // 2, 560
    fr.paste(sh, (x - 30, y - 30), sh)
    m = Image.new("L", c.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, c.width, c.height), 26, fill=255)
    fr.paste(c, (x, y), m)
    g.rounded_rectangle((60, 220, 60 + g.textlength("APP DEMO", font=font(32)) + 44, 274), 27, fill=GOLD)
    g.text((82, 226), "APP DEMO", font=font(32), fill=INK)
    g.text((60, 310), "Sohana Traders", font=font(84), fill="#FFFFFF")
    g.text((60, 412), "Billing, khata, stock aur cash app", font=font(40, "400"), fill=CREAM)
    y2 = y + c.height + 80
    for j, t in enumerate(["Bill + 58mm memo", "Khata", "Stock", "Cash"]):
        pass
    chips = ["Bill + memo", "Khata", "Stock", "Cash"]
    cx = 60
    for t in chips:
        tw = g.textlength(t, font=font(34, "600"))
        g.rounded_rectangle((cx, y2, cx + tw + 48, y2 + 64), 32, outline=CREAM, width=3)
        g.text((cx + 24, y2 + 10), t, font=font(34, "600"), fill="#FFFFFF")
        cx += tw + 70
    g.text((60, H - 150), "Demo: sample data. Aap apne items aur customers khud dalenge.", font=font(30, "400"), fill="#AEB6C8")
    if k < 1: fr = Image.blend(Image.new("RGB", (W, H), NAVY), fr, k)
    return fr

# ---- encode ----
o = av.open(out, "w", options={"movflags": "faststart"})
vs = o.add_stream("libx264", rate=FPS); vs.width, vs.height, vs.pix_fmt = W, H, "yuv420p"; vs.bit_rate = 10_000_000
vs.options = {"preset": "slow", "profile": "high", "x264-params": "keyint=60:min-keyint=30:aq-mode=3:vbv-maxrate=14000:vbv-bufsize=20000:nal-hrd=vbr"}
as_ = o.add_stream("aac", rate=SR); as_.layout = "stereo"; as_.bit_rate = 192000
n = 0
def put(img):
    global n
    vf = av.VideoFrame.from_image(img).reformat(format="yuv420p"); vf.pts = n; n += 1
    for pk in vs.encode(vf): o.mux(pk)
last = None
for i in range(INTRO):
    last = intro_frame(i); put(last)
introlast = last
for i in range(len(files)):
    fr = demo_frame(i)
    if i < 10: fr = Image.blend(introlast, fr, (i + 1) / 10)
    put(fr); last = fr
demolast = last
for i in range(len(wafiles)):
    fr = wa_frame(i)
    if i < 10: fr = Image.blend(demolast, fr, (i + 1) / 10)
    put(fr); last = fr
for j, f in enumerate(endfiles):
    ef = Image.open(f).convert("RGB")
    if ef.size != (W, H): ef = ef.resize((W, H), Image.LANCZOS)
    if j < 10: ef = Image.blend(last, ef, (j + 1) / 10)
    put(ef)
for pk in vs.encode(): o.mux(pk)

# ---- audio: lofi bed + a tap on every tap, then the end-card chime ----
body = int((INTRO + len(files) + len(wafiles)) / FPS * SR)
taps = list(taps) + [t + (len(files)) / FPS for t in watap]
fx = np.zeros((2, body), np.float32)
for t in taps:
    snd = music.fx("tap", SR); a = int((t + INTRO / FPS) * SR); b = min(body, a + len(snd))
    if a < body: fx[:, a:b] += snd[: b - a] * 1.3
bed = music.make(body, SR, 23, "lofi") * 2.0
pcm = np.tanh(fx + music.duck(bed, fx, SR)).astype(np.float32)
fo = int(0.6 * SR); pcm[:, -fo:] *= np.linspace(1, 0, fo)
ep = np.frombuffer(open(os.path.join(here, "frames", "endcard", "audio.pcm"), "rb").read(), np.int16).astype(np.float32).reshape(-1, 2).T / 32767
en = int(len(endfiles) / FPS * SR); ep = ep[:, :en]
if ep.shape[1] < en: ep = np.pad(ep, ((0, 0), (0, en - ep.shape[1])))
pcm = np.concatenate([pcm, np.tanh(ep * 1.4).astype(np.float32)], axis=1)
pts = 0
for k in range(0, pcm.shape[1], 1024):
    ch = np.ascontiguousarray(pcm[:, k:k + 1024]); af = av.AudioFrame.from_ndarray(ch, format="fltp", layout="stereo"); af.sample_rate = SR; af.pts = pts; pts += ch.shape[1]
    for pk in as_.encode(af): o.mux(pk)
for pk in as_.encode(): o.mux(pk)
o.close()
print(out, "frames", n, "secs", round(n / FPS, 1), "taps", len(taps))
