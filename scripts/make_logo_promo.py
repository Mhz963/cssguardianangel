"""Generate a 4s Guardian Angel logo promo with growing book glow + wing emission."""

from __future__ import annotations

import math
from pathlib import Path

import imageio.v2 as imageio
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "assets" / "guardian-angel-logo.png"
OUT = ROOT / "src" / "assets" / "guardian-angel-promo.mp4"
TMP_AUDIO = ROOT / "src" / "assets" / "_promo_tone.wav"

DURATION = 4.0
FPS = 30
GOLD = np.array([255, 196, 72], dtype=np.float32)
WARM = np.array([255, 168, 48], dtype=np.float32)


def ease_out_cubic(t: float) -> float:
    return 1.0 - (1.0 - t) ** 3


def soft_radial(h: int, w: int, cx: float, cy: float, radius: float, power: float = 2.0) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    return np.clip(1.0 - dist / max(radius, 1.0), 0.0, 1.0) ** power


def find_glow_center(rgb: np.ndarray) -> tuple[int, int]:
    r, g, b = rgb[:, :, 0].astype(np.float32), rgb[:, :, 1].astype(np.float32), rgb[:, :, 2].astype(np.float32)
    warm = (r > 140) & (g > 90) & (b < 140) & (r > g) & (g > b)
    ys, xs = np.where(warm)
    if len(xs) == 0:
        h, w = rgb.shape[:2]
        return w // 2, int(h * 0.55)
    brightness = r[warm] * 0.5 + g[warm] * 0.4 + b[warm] * 0.1
    # Prefer the densest / brightest cluster near the book (lower-central glow)
    cx = int(np.average(xs, weights=brightness))
    cy = int(np.average(ys, weights=brightness))
    return cx, cy


def build_wing_mask(rgb: np.ndarray, cx: int, cy: int) -> np.ndarray:
    """Soft mask of existing golden light across the wings / body (excluding book core)."""
    r, g, b = rgb[:, :, 0].astype(np.float32), rgb[:, :, 1].astype(np.float32), rgb[:, :, 2].astype(np.float32)
    warm = (r > 90) & (g > 50) & (b < 160) & (r >= g) & ((r - b) > 20)
    strength = np.clip((r - 60) / 160.0, 0.0, 1.0) * warm.astype(np.float32)
    # Reduce book-core influence so wing emission is distinct
    core = soft_radial(*rgb.shape[:2], cx, cy, radius=min(rgb.shape[:2]) * 0.12, power=1.4)
    wing = strength * (1.0 - 0.75 * core)
    # Blur for soft emission field
    wing_img = Image.fromarray((wing * 255).astype(np.uint8), mode="L")
    wing_img = wing_img.filter(ImageFilter.GaussianBlur(radius=6))
    return np.asarray(wing_img, dtype=np.float32) / 255.0


def make_ray_layer(h: int, w: int, cx: int, cy: int, n_rays: int = 10) -> np.ndarray:
    canvas = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(canvas)
    length = int(max(h, w) * 0.55)
    for i in range(n_rays):
        angle = -math.pi * 0.15 + (i / (n_rays - 1)) * math.pi * 1.3
        x2 = cx + math.cos(angle) * length
        y2 = cy + math.sin(angle) * length * 0.85
        width = 1 if i % 2 else 2
        draw.line([(cx, cy), (x2, y2)], fill=40 + (i % 3) * 18, width=width)
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius=3))
    return np.asarray(canvas, dtype=np.float32) / 255.0


def synthesize_tone(path: Path, duration: float = DURATION, sample_rate: int = 44100) -> None:
    """Soft warm ambient pad that gently rises with the book light."""
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    # Soft major chord pad (C4 / E4 / G4) with slight detune
    freqs = [261.63, 329.63, 392.00, 523.25]
    amps = [0.22, 0.16, 0.14, 0.08]
    wave = np.zeros_like(t)
    for f, a in zip(freqs, amps):
        wave += a * np.sin(2 * np.pi * f * t)
        wave += (a * 0.35) * np.sin(2 * np.pi * (f * 1.002) * t)
    # Slow swell envelope
    attack = np.clip(t / 1.2, 0.0, 1.0) ** 1.4
    sustain = 0.55 + 0.45 * np.sin(2 * np.pi * 0.35 * t) ** 2
    release = np.clip((duration - t) / 0.45, 0.0, 1.0)
    env = attack * sustain * release
    audio = (wave * env * 0.35).astype(np.float32)
    # Stereo mild width
    left = audio
    right = np.roll(audio, 180) * 0.92
    stereo = np.stack([left, right], axis=1)
    pcm = np.clip(stereo * 32767, -32768, 32767).astype(np.int16)
    import wave as wav

    with wav.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm.tobytes())


def even_pad(rgb: np.ndarray) -> np.ndarray:
    """libx264 needs even width/height for yuv420p."""
    h, w = rgb.shape[:2]
    pad_h = h % 2
    pad_w = w % 2
    if pad_h or pad_w:
        rgb = np.pad(rgb, ((0, pad_h), (0, pad_w), (0, 0)), mode="constant")
    return rgb


def render() -> Path:
    base = Image.open(SRC).convert("RGBA")
    rgb = even_pad(np.asarray(base.convert("RGB"), dtype=np.float32))
    h, w = rgb.shape[:2]
    cx, cy = find_glow_center(rgb.astype(np.uint8))
    # Book is a bit below the overall warm centroid
    book_cx, book_cy = cx, int(cy + h * 0.04)

    wing_mask = build_wing_mask(rgb.astype(np.uint8), book_cx, book_cy)
    rays = make_ray_layer(h, w, book_cx, book_cy)

    n_frames = int(DURATION * FPS)
    frames: list[np.ndarray] = []

    for i in range(n_frames):
        t = i / max(n_frames - 1, 1)
        book_grow = ease_out_cubic(t)  # 0 -> 1 over full clip
        # Continuous wing emission (never stops)
        wing_pulse = 0.55 + 0.45 * (0.5 + 0.5 * math.sin(2 * math.pi * (0.85 * t * DURATION + 0.15)))
        wing_flow = 0.5 + 0.5 * math.sin(2 * math.pi * (1.15 * t * DURATION))
        backlight_pulse = 0.7 + 0.3 * (0.5 + 0.5 * math.sin(2 * math.pi * (0.4 * t * DURATION)))

        frame = rgb.copy()

        # --- Soft light tone / backlight behind the angel ---
        back_r = soft_radial(h, w, book_cx, book_cy - h * 0.08, radius=min(h, w) * 0.62, power=1.8)
        back_strength = (0.18 + 0.22 * book_grow) * backlight_pulse
        frame += back_r[..., None] * WARM * back_strength

        # --- Growing book light (core + bloom + rays) ---
        core_r = soft_radial(h, w, book_cx, book_cy, radius=min(h, w) * (0.08 + 0.16 * book_grow), power=1.6)
        bloom_r = soft_radial(h, w, book_cx, book_cy, radius=min(h, w) * (0.18 + 0.38 * book_grow), power=2.2)
        core_strength = 0.35 + 0.95 * book_grow
        bloom_strength = 0.18 + 0.55 * book_grow
        frame += core_r[..., None] * GOLD * core_strength
        frame += bloom_r[..., None] * WARM * bloom_strength
        frame += rays[..., None] * GOLD * (0.12 + 0.55 * book_grow)

        # --- Continuous wing light emission ---
        # Traveling shimmer: modulate wing mask with a soft horizontal wave
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        shimmer = 0.65 + 0.35 * np.sin((xx / w) * math.pi * 3.0 + t * DURATION * 4.2)
        shimmer *= 0.75 + 0.25 * np.sin((yy / h) * math.pi * 2.0 - t * DURATION * 2.6)
        emit = wing_mask * shimmer * (0.35 + 0.55 * wing_pulse + 0.15 * wing_flow)
        # Keep a baseline emission so light "continues" from the start
        emit = np.maximum(emit, wing_mask * 0.22)
        frame += emit[..., None] * GOLD * 0.85

        # Preserve white line art so glow doesn't wash it out completely
        luma = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        line = np.clip((luma - 180) / 60.0, 0.0, 1.0) * (1.0 - (wing_mask > 0.15).astype(np.float32) * 0.3)
        frame = np.clip(frame + line[..., None] * 18.0, 0, 255)

        # Keep original alpha silhouette on black (logo already on black)
        out = np.clip(frame, 0, 255).astype(np.uint8)
        # Subtle overall vignette breathe
        vig = soft_radial(h, w, w / 2, h / 2, radius=max(h, w) * 0.78, power=1.2)
        out = (out.astype(np.float32) * (0.88 + 0.12 * vig)[..., None]).clip(0, 255).astype(np.uint8)
        frames.append(out)

    synthesize_tone(TMP_AUDIO)

    # Write silent video then mux tone with ffmpeg
    silent = OUT.with_name("_promo_silent.mp4")
    writer = imageio.get_writer(
        str(silent),
        fps=FPS,
        codec="libx264",
        quality=8,
        pixelformat="yuv420p",
        macro_block_size=1,
    )
    for fr in frames:
        writer.append_data(fr)
    writer.close()

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    import subprocess

    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(silent),
        "-i",
        str(TMP_AUDIO),
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-shortest",
        "-movflags",
        "+faststart",
        str(OUT),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    silent.unlink(missing_ok=True)
    TMP_AUDIO.unlink(missing_ok=True)
    print(f"Wrote {OUT} ({DURATION}s, {FPS}fps, center=({book_cx},{book_cy}))")
    return OUT


if __name__ == "__main__":
    render()
