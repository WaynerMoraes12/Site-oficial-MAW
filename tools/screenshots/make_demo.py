"""Gera o projeto demo "Noite Roxa" (audio sintetizado + .maw) para os prints do site."""
import os
import wave
import numpy as np
from xml.sax.saxutils import quoteattr

SR = 48000
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
NBARS = 32
TOTAL = NBARS * BAR + 2.5
N = int(TOTAL * SR)
rng = np.random.default_rng(7)

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ_DIR = os.path.join(os.path.expanduser("~"), "Music", "MAW Demo")
AUDIO_DIR = os.path.join(PROJ_DIR, "Noite Roxa_Audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# secoes (em compassos, base 0)
INTRO, VERSO, REFRAO, SOLO, FINAL = 0, 4, 12, 20, 28
PROG = ["Em", "C", "G", "D"]
ROOTS = {"Em": 40, "C": 36, "G": 43, "D": 38}  # E2 C2 G2 D2
TRIADS = {"Em": [52, 55, 59, 64], "C": [48, 52, 55, 60], "G": [55, 59, 62, 67], "D": [50, 54, 57, 62]}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def bar_t(b, step16=0):
    return b * BAR + step16 * BEAT / 4


def add(buf, sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def fft_filter(x, resp):
    n = 1 << int(np.ceil(np.log2(len(x))))
    X = np.fft.rfft(x, n)
    f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(X * resp(f), n)[: len(x)]


def lowpass(f, fc, order=2):
    return 1 / np.sqrt(1 + (f / fc) ** (2 * order))


def highpass(f, fc, order=2):
    return 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order))


def saw(freq, dur, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    ph = (freq * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def env_adsr(n, a=0.005, d=0.08, s=0.7, r=0.05):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = max(1, min(na, n))
    e[:na] = np.linspace(0, 1, na)
    if na + nd < n:
        e[na:na + nd] = np.linspace(1, s, nd)
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def norm(x, peak_db=-1.0):
    p = np.max(np.abs(x)) or 1.0
    return x / p * (10 ** (peak_db / 20))


def write_wav(name, x):
    path = os.path.join(AUDIO_DIR, name)
    y = np.clip(x, -1, 1)
    pcm = (y * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path


# ---------------- BATERIA ----------------
def kick():
    t = np.arange(int(0.38 * SR)) / SR
    f = 46 + 120 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = rng.standard_normal(len(t)) * np.exp(-t * 400) * 0.3
    return (np.sin(ph) * np.exp(-t * 8.5) + click)


def snare():
    t = np.arange(int(0.26 * SR)) / SR
    nz = np.diff(rng.standard_normal(len(t) + 1)) * 0.5 * np.exp(-t * 16)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28)
    return nz * 0.8 + tone * 0.7


def hat(open_=False):
    t = np.arange(int((0.22 if open_ else 0.05) * SR)) / SR
    nz = np.diff(np.diff(rng.standard_normal(len(t) + 2)))
    return nz * np.exp(-t * (14 if open_ else 70)) * 0.22


def crash():
    t = np.arange(int(2.2 * SR)) / SR
    nz = np.diff(rng.standard_normal(len(t) + 1))
    return nz * np.exp(-t * 2.2) * 0.33


drums = np.zeros(N)
for b in range(NBARS):
    sec_intro = b < VERSO
    for s in range(16):
        t0 = bar_t(b, s)
        if b < 2:  # intro: so chimbal e bumbo no 1
            if s % 4 == 0:
                add(drums, hat(), t0, 0.8)
            if s == 0:
                add(drums, kick(), t0)
            continue
        if REFRAO <= b < SOLO:  # bumbo duplo
            add(drums, kick(), t0, 0.75)
            if s in (4, 12):
                add(drums, snare(), t0)
            if s % 4 == 0:
                add(drums, hat(True), t0, 0.7)
        elif SOLO <= b < FINAL:
            if s % 2 == 0:
                add(drums, kick(), t0, 0.8)
            if s in (4, 12):
                add(drums, snare(), t0)
            if s % 2 == 0:
                add(drums, hat(), t0)
        elif b >= FINAL:  # meio tempo
            if b == NBARS - 1:
                if s == 0:
                    add(drums, kick(), t0)
                    add(drums, crash(), t0, 1.2)
                continue
            if s in (0, 10):
                add(drums, kick(), t0)
            if s == 8:
                add(drums, snare(), t0)
            if s % 4 == 0:
                add(drums, hat(True), t0, 0.6)
        else:  # verso e fim da intro
            if s in (0, 6, 8, 10):
                add(drums, kick(), t0)
            if s in (4, 12):
                add(drums, snare(), t0)
            if s % 2 == 0:
                add(drums, hat(), t0)
            if sec_intro and b == VERSO - 1 and s >= 12:
                add(drums, snare(), t0, 0.8)
    if b in (2, VERSO, REFRAO, REFRAO + 4, SOLO, FINAL):
        add(drums, crash(), bar_t(b), 1.0)
drums = norm(fft_filter(drums, lambda f: highpass(f, 30)), -1.0)

# ---------------- BAIXO ----------------
bass = np.zeros(N)
for b in range(2, NBARS):
    ch = PROG[b % 4]
    f0 = hz(ROOTS[ch])
    if b == NBARS - 1:
        n = saw(f0, BAR * 1.2) * env_adsr(int(BAR * 1.2 * SR), d=0.3, s=0.5, r=0.6)
        add(bass, n, bar_t(b))
        continue
    step = 2 if (REFRAO <= b < SOLO) else 2
    for s in range(0, 16, step):
        dur = BEAT / 2 * 0.92
        dur = BEAT / 2 * 0.8
        nn = int(dur * SR)
        n = (saw(f0, dur) + 0.5 * saw(f0 * 0.5, dur)) * env_adsr(nn, d=0.05, s=0.55, r=0.03) * np.exp(-np.arange(nn) / SR * 5)
        add(bass, n, bar_t(b, s), 1.0 if s % 8 == 0 else (0.75 if s % 4 == 0 else 0.55))
bass = norm(fft_filter(bass, lambda f: lowpass(f, 800, 3) * highpass(f, 35)), -1.5)

# ---------------- GUITARRA BASE ----------------
def power_chord(root_midi, dur, mute=False):
    f = hz(root_midi)
    n = int(dur * SR)
    x = sum(saw(f * r, dur, dt) for r, dt in [(1, 0), (1.4983, 0.002), (2, -0.002), (1, 0.004)])
    x = np.tanh(x * 9)
    e = env_adsr(n, a=0.002, d=0.05 if mute else 0.4, s=0.15 if mute else 0.8, r=0.03 if mute else 0.25)
    if mute:
        e *= np.exp(-np.arange(n) / SR * 22)
    return x * e


gtr = np.zeros(N)
add(gtr, power_chord(ROOTS["Em"] + 12, BAR * 2), 0.0, 0.9)  # intro ringando
for b in range(2, NBARS):
    ch = PROG[b % 4]
    r = ROOTS[ch] + 12
    if VERSO <= b < REFRAO or b in (2, 3):
        add(gtr, power_chord(r, BEAT * 0.9), bar_t(b), 1.0)
        for s in range(4, 16, 2):
            add(gtr, power_chord(r, BEAT / 2 * 0.9, mute=True), bar_t(b, s), 0.85)
    elif REFRAO <= b < SOLO or b >= FINAL:
        dur = BAR * (1.6 if b == NBARS - 1 else 1.0)
        add(gtr, power_chord(r, dur), bar_t(b), 0.9)
    else:  # solo: chugs em semicolcheia
        for s in range(0, 16):
            add(gtr, power_chord(r, BEAT / 4 * 0.9, mute=True), bar_t(b, s), 0.8 if s % 4 else 1.0)
gtr = norm(fft_filter(gtr, lambda f: lowpass(f, 4200, 3) * highpass(f, 90)), -1.0)

# ---------------- GUITARRA SOLO ----------------
PENTA = [64, 67, 69, 71, 74, 76, 79, 81]
solo = np.zeros(N)
phrase_rhythm = [(0, 2), (2, 2), (4, 1), (5, 1), (6, 2), (8, 4), (12, 4)]
for b in range(SOLO, FINAL):
    base = (b - SOLO) % 4
    for k, (s, l) in enumerate(phrase_rhythm):
        idx = (k * 2 + base * 3 + (b - SOLO)) % len(PENTA)
        m = PENTA[idx] + (12 if (b - SOLO) >= 4 and k > 3 else 0)
        dur = l * BEAT / 4 * 0.97
        t = np.arange(int(dur * SR)) / SR
        vib = 1 + (0.012 * np.sin(2 * np.pi * 5.8 * t) * np.clip(t / 0.15 - 0.5, 0, 1) if l >= 4 else 0)
        f = hz(m) * vib
        ph = np.cumsum(f) / SR
        x = 2 * (ph - np.floor(ph + 0.5))
        x = np.tanh(x * 7) * env_adsr(len(t), a=0.003, d=0.1, s=0.8, r=0.04)
        add(solo, x, bar_t(b, s))
add(solo, np.tanh(saw(hz(76), BAR * 2) * 7) * env_adsr(int(BAR * 2 * SR), d=0.2, s=0.8, r=1.0), bar_t(FINAL), 0.6)
solo = norm(fft_filter(solo, lambda f: lowpass(f, 5000, 3) * highpass(f, 180)), -1.5)

# ---------------- VOZ ----------------
VOWELS = {"a": (730, 1090, 2440), "e": (530, 1840, 2480), "i": (270, 2290, 3010), "o": (570, 840, 2410), "u": (300, 870, 2240)}


def sing(m, dur, vowel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.008 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.25, 0, 1)
    f = hz(m) * vib
    ph = np.cumsum(f) / SR
    src = 2 * (ph - np.floor(ph + 0.5)) + rng.standard_normal(n) * 0.04
    F = VOWELS[vowel]

    def resp(fr):
        g = sum(np.exp(-0.5 * ((fr - fc) / bw) ** 2) * amp for fc, bw, amp in zip(F, (90, 110, 160), (1.0, 0.6, 0.25)))
        return g * highpass(fr, 120)

    y = fft_filter(src, resp)
    return y * env_adsr(n, a=0.04, d=0.1, s=0.85, r=0.08)


vox = np.zeros(N)
verse_phr = [[(64, 2, "a"), (67, 2, "o"), (69, 4, "e"), (67, 6, "a")], [(64, 2, "i"), (62, 2, "a"), (64, 10, "o")]]
chorus_phr = [[(71, 4, "o"), (69, 2, "a"), (67, 2, "e"), (64, 6, "a")], [(67, 2, "u"), (69, 2, "a"), (71, 2, "i"), (74, 4, "o"), (71, 6, "a")]]
for b in range(VERSO, REFRAO, 2):
    phr = verse_phr[(b // 2) % 2]
    s = 2
    for m, l, v in phr:
        add(vox, sing(m, l * BEAT / 4 * 0.95, v), bar_t(b, s))
        s += l
for b in range(REFRAO, SOLO, 2):
    phr = chorus_phr[(b // 2) % 2]
    s = 0
    for m, l, v in phr:
        add(vox, sing(m, l * BEAT / 4 * 0.95, v), bar_t(b, s), 1.0)
        s += l
vox = norm(vox, -1.5)

import shutil
shutil.rmtree(AUDIO_DIR, ignore_errors=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
paths = {"drums": "Bateria", "bass": "Baixo", "gtr": "Guitarra Base", "solo": "Guitarra Solo", "vox": "Voz"}

# ---------------- PROJETO .maw ----------------
STEMS_SRC = {"Bateria": drums, "Baixo": bass, "Guitarra Base": gtr, "Guitarra Solo": solo, "Voz": vox}
def T(b):
    return round(b * BAR, 6)


STEMS = STEMS_SRC
_slice_count = {}


def clip(key, start, end, name, fade_in=0.0, fade_out=0.0, gain=1.0, chords=None):
    # um arquivo por clipe, offset 0: a MAW desenha a onda do arquivo inteiro no clipe
    arr = STEMS[key]
    _slice_count[key] = _slice_count.get(key, 0) + 1
    fname = f"{key} {_slice_count[key]:02d}.wav"
    seg = arr[int(start * SR):int(end * SR)]
    path = write_wav(fname, seg)
    rel = os.path.relpath(path, PROJ_DIR)
    inner = ""
    for (t_in, cname) in (chords or []):
        inner += f'      <CHORD time="{t_in:.6f}" name={quoteattr(cname)} confidence="0.86"/>\n'
    attrs = (f'start="{start:.6f}" end="{end:.6f}" offset="0.0" fadeIn="{fade_in}" fadeOut="{fade_out}" '
             f'gain="{gain}" muted="0" name={quoteattr(name)} sourceFile={quoteattr(path)} sourceFileRel={quoteattr(rel)}')
    return f"    <CLIP {attrs}>\n{inner}    </CLIP>\n" if inner else f"    <CLIP {attrs}/>\n"


def midiclip(start, end, notes):
    body = "".join(f'      <NOTE start="{s:.6f}" length="{l:.6f}" num="{n}" vel="{v}"/>\n' for s, l, n, v in notes)
    return f'    <MIDICLIP start="{start:.6f}" end="{end:.6f}" transcribed="0">\n{body}    </MIDICLIP>\n'


def effect(type_, **params):
    extra = " ".join(f'{k}="{v}"' for k, v in params.items())
    return f'    <EFFECT type={quoteattr(type_)} bypass="0" {extra}/>\n'


def track(tid, name, colour, body, volume=0.85, pan=0.0, preset=0):
    return (f'  <TRACK id="{tid}" name={quoteattr(name)} colour="{colour}" volume="{volume}" pan="{pan}" muted="0" soloed="0" '
            f'armed="0" monitoring="0" inputChannel="0" midiInputEnabled="1" midiOutputEnabled="1" instrumentPreset="{preset}">\n'
            f"{body}  </TRACK>\n")


def chords_for(b0, b1):
    return [(T(b) - T(b0), PROG[b % 4]) for b in range(b0, b1)]


tracks = []
tracks.append(track(1, "BATERIA", "ff9d00ff",
    clip(paths["drums"], 0.0, T(VERSO), "Bateria Intro")
    + clip(paths["drums"], T(VERSO), T(FINAL), "Bateria")
    + clip(paths["drums"], T(FINAL), T(NBARS) + 2.2, "Bateria Final", fade_out=1.2)
    + effect("Compressor") + effect("Equalizer"), volume=0.5))
tracks.append(track(2, "BAIXO", "ff6200a3",
    clip(paths["bass"], T(2), T(FINAL), "Baixo")
    + clip(paths["bass"], T(FINAL), T(NBARS) + 1.0, "Baixo Final", fade_out=0.6)
    + effect("Compressor"), volume=0.42))
tracks.append(track(3, "GUITARRA BASE", "ffb82eff",
    clip(paths["gtr"], 0.0, T(VERSO), "Riff Intro", fade_in=0.4)
    + clip(paths["gtr"], T(VERSO), T(REFRAO), "Base Verso", chords=chords_for(VERSO, REFRAO))
    + clip(paths["gtr"], T(REFRAO), T(SOLO), "Base Refrão", chords=chords_for(REFRAO, SOLO))
    + clip(paths["gtr"], T(SOLO), T(FINAL), "Base Solo")
    + clip(paths["gtr"], T(FINAL), T(NBARS) + 2.0, "Base Final", fade_out=1.5)
    + effect("Noise Gate") + effect("Equalizer") + effect("Compressor"), volume=0.38, pan=-0.35))
tracks.append(track(4, "GUITARRA SOLO", "ffd161ff",
    clip(paths["solo"], T(SOLO), T(FINAL) + BAR * 2, "Solo", fade_in=0.02, fade_out=0.8)
    + effect("Delay") + effect("Reverb"), volume=0.36, pan=0.3))
tracks.append(track(5, "VOZ", "ff8a00e6",
    clip(paths["vox"], T(VERSO), T(VERSO + 4), "Verso 1")
    + clip(paths["vox"], T(VERSO + 4), T(REFRAO), "Verso 2")
    + clip(paths["vox"], T(REFRAO), T(SOLO), "Refrão")
    + effect("AutoTune") + effect("Compressor") + effect("Reverb") + effect("Delay")
    + "".join(f'    <AUTONODE time="{t:.6f}" value="{v}"/>\n' for t, v in
              [(T(VERSO), 0.72), (T(REFRAO) - 1.5, 0.72), (T(REFRAO), 1.0), (T(SOLO) - 0.5, 1.0), (T(SOLO), 0.55)]),
    volume=0.45))

pad_notes = []
for b in list(range(REFRAO, SOLO)) + list(range(FINAL, NBARS)):
    for n_ in TRIADS[PROG[b % 4]]:
        pad_notes.append((T(b), BAR * 0.98, n_, 88))
tracks.append(track(6, "SYNTH PAD", "ff7a00cc",
    midiclip(T(REFRAO), T(SOLO), [x for x in pad_notes if x[0] < T(SOLO)])
    + midiclip(T(FINAL), T(NBARS), [x for x in pad_notes if x[0] >= T(FINAL)])
    + effect("Reverb"), volume=0.35, preset=4))

arp = []
for b in range(VERSO, REFRAO):
    tri = TRIADS[PROG[b % 4]]
    pattern = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 3, 2]
    for s, k in enumerate(pattern):
        vel = 110 if s % 4 == 0 else (92 if s % 2 == 0 else 74)
        arp.append((T(b) + s * BEAT / 4, BEAT / 4 * 0.85, tri[k] + 12, vel))
tracks.append(track(7, "TECLAS", "ffb82eff", midiclip(T(VERSO), T(REFRAO), arp) + effect("Delay"), volume=0.3, pan=0.25, preset=5))

markers = "".join(f'    <MARKER name={quoteattr(n)} time="{T(b):.6f}"/>\n' for n, b in
                  [("INTRO", INTRO), ("VERSO", VERSO), ("REFRÃO", REFRAO), ("SOLO", SOLO), ("FINAL", FINAL)])

xml = ('<?xml version="1.0" encoding="UTF-8"?>\n\n'
       f'<MAW_PROJECT bpm="{BPM}" snapEnabled="1" beatsPerBar="4" beatUnit="4" masterGain="0.8" pixelsPerSecond="23.5" trackHeight="96" '
       f'loopEnabled="1" loopStart="{T(REFRAO):.6f}" loopEnd="{T(SOLO):.6f}">\n'
       f"  <MARKERS>\n{markers}  </MARKERS>\n" + "".join(tracks) + "</MAW_PROJECT>\n")

maw_path = os.path.join(PROJ_DIR, "Noite Roxa.maw")
with open(maw_path, "w", encoding="utf-8") as fh:
    fh.write(xml)
print(maw_path)
