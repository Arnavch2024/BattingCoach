# ==============================================================================
#  🏏 Cricket Shot Classifier — Real-Time Test Script
#  Model  : Fine-tuned VideoMAE (trained via cricket_shot_classifier_colab.py)
#  Stack  : OpenCV  (capture / display)
#           MediaPipe Pose  (skeleton overlay)
#           HuggingFace Transformers  (VideoMAE inference)
#
#  Usage:
#    python test_cricket_shot.py                      # webcam
#    python test_cricket_shot.py --source video.mp4   # video file
#    python test_cricket_shot.py --source video.mp4 --save out.mp4
#
#  Install requirements (once):
#    pip install opencv-python mediapipe transformers torch torchvision
# ==============================================================================

import argparse
import collections
import time
import warnings
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
import torch
from transformers import VideoMAEForVideoClassification, VideoMAEImageProcessor

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

# Path to the best_model folder produced by the Colab training script
MODEL_DIR = (
    Path(__file__).parent
    / "cricket_shot_classifier-20260420T175634Z-3-001"
    / "cricket_shot_classifier"
    / "best_model"
)

CLASS_NAMES = [
    "cover", "defense", "flick", "hook", "late_cut",
    "lofted", "pull", "square_cut", "straight", "sweep",
]

NUM_FRAMES   = 16   # must match training
IMAGE_SIZE   = 224
INFER_EVERY  = 8    # run inference every N new frames (lower = faster feedback)
SMOOTH_ALPHA = 0.6  # exponential smoothing for probabilities (0=no smooth, 1=no smooth hist)

# UI colours (BGR)
CLR_BG        = (15,  15,  15)
CLR_ACCENT    = (0,  200, 100)
CLR_BAR_FG    = (50, 200, 100)
CLR_BAR_BG    = (60,  60,  60)
CLR_WHITE     = (240, 240, 240)
CLR_YELLOW    = (50,  220, 220)
CLR_RED       = (70,   70, 220)
CLR_POSE      = (0,   200, 120)

FONT          = cv2.FONT_HERSHEY_SIMPLEX


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def load_model(model_dir: Path, device: torch.device):
    """Load fine-tuned VideoMAE model and processor."""
    print(f"Loading model from: {model_dir}")
    processor = VideoMAEImageProcessor.from_pretrained(str(model_dir))
    model     = VideoMAEForVideoClassification.from_pretrained(str(model_dir))
    model.to(device).eval()
    print(f"Model loaded. Classes: {list(model.config.id2label.values())}")
    return processor, model


@torch.no_grad()
def run_inference(frames_rgb: list, processor, model, device) -> np.ndarray:
    """
    frames_rgb : list of NUM_FRAMES (H, W, 3) uint8 numpy arrays (RGB order)
    Returns    : (num_classes,) float32 probability array
    """
    inputs       = processor(frames_rgb, return_tensors="pt")
    pixel_values = inputs["pixel_values"].to(device)          # (1, T, C, H, W)
    outputs      = model(pixel_values=pixel_values)
    probs        = torch.softmax(outputs.logits, dim=-1)[0].cpu().numpy()
    return probs                                               # (num_classes,)


# ──────────────────────────────────────────────────────────────────────────────
# Drawing helpers
# ──────────────────────────────────────────────────────────────────────────────

def draw_rounded_rect(img, x, y, w, h, radius, color, thickness=-1, alpha=1.0):
    """Draw a filled or bordered rounded rectangle on img (in-place)."""
    overlay = img.copy()
    # Four corners
    cv2.ellipse(overlay, (x+radius,     y+radius),     (radius, radius), 180, 0, 90, color, thickness)
    cv2.ellipse(overlay, (x+w-radius,   y+radius),     (radius, radius), 270, 0, 90, color, thickness)
    cv2.ellipse(overlay, (x+radius,     y+h-radius),   (radius, radius),  90, 0, 90, color, thickness)
    cv2.ellipse(overlay, (x+w-radius,   y+h-radius),   (radius, radius),   0, 0, 90, color, thickness)
    # Rectangles
    cv2.rectangle(overlay, (x+radius, y),     (x+w-radius, y+h),     color, thickness)
    cv2.rectangle(overlay, (x,        y+radius), (x+w, y+h-radius),  color, thickness)
    if alpha < 1.0:
        cv2.addWeighted(overlay, alpha, img, 1-alpha, 0, img)
    else:
        img[:] = overlay[:]


def draw_panel(frame, x, y, w, h, alpha=0.72):
    """Semi-transparent dark panel."""
    sub = frame[y:y+h, x:x+w]
    rect = np.full_like(sub, (20, 20, 20))
    cv2.addWeighted(rect, alpha, sub, 1 - alpha, 0, sub)
    frame[y:y+h, x:x+w] = sub
    cv2.rectangle(frame, (x, y), (x+w, y+h), (80, 80, 80), 1)


def draw_bar(frame, label, prob, rank_y, panel_x, bar_w, is_top=False):
    """Draw one horizontal probability bar entry."""
    bar_filled = int(bar_w * prob)
    bar_color  = CLR_ACCENT if is_top else CLR_BAR_FG
    label_color = CLR_YELLOW if is_top else CLR_WHITE

    # Background bar
    cv2.rectangle(frame,
                  (panel_x + 10, rank_y),
                  (panel_x + 10 + bar_w, rank_y + 16),
                  CLR_BAR_BG, -1)
    # Filled portion
    if bar_filled > 0:
        cv2.rectangle(frame,
                      (panel_x + 10, rank_y),
                      (panel_x + 10 + bar_filled, rank_y + 16),
                      bar_color, -1)

    # Label text
    cv2.putText(frame, label.upper(),
                (panel_x + 14, rank_y + 12),
                FONT, 0.38, label_color, 1, cv2.LINE_AA)

    # Percentage (right-aligned)
    pct_text = f"{prob*100:.0f}%"
    tw = cv2.getTextSize(pct_text, FONT, 0.38, 1)[0][0]
    cv2.putText(frame, pct_text,
                (panel_x + 10 + bar_w - tw - 4, rank_y + 12),
                FONT, 0.38, label_color, 1, cv2.LINE_AA)


def draw_hud(frame, probs: np.ndarray, class_names: list,
             fps: float, frame_idx: int, buffer_fill: float,
             panel_w: int = 230):
    """Render the complete HUD overlay on the right side of frame."""
    H, W = frame.shape[:2]
    px   = W - panel_w - 8
    py   = 8

    # ── Main prediction panel ─────────────────────────────────────────────────
    panel_h = 240
    draw_panel(frame, px, py, panel_w, panel_h)

    top_idx   = int(probs.argmax())
    top_class = class_names[top_idx]
    top_conf  = probs[top_idx]

    # Cricket bat emoji substitute (text)
    cv2.putText(frame, "CRICKET SHOT", (px + 10, py + 22),
                FONT, 0.52, CLR_ACCENT, 1, cv2.LINE_AA)
    cv2.putText(frame, "CLASSIFIER",   (px + 10, py + 40),
                FONT, 0.52, CLR_ACCENT, 1, cv2.LINE_AA)

    cv2.line(frame, (px + 10, py + 48), (px + panel_w - 10, py + 48),
             (80, 80, 80), 1)

    # Top prediction (big)
    cv2.putText(frame, top_class.replace("_", " ").upper(),
                (px + 10, py + 78),
                FONT, 0.80, CLR_YELLOW, 2, cv2.LINE_AA)

    # Confidence meter
    bar_w = panel_w - 20
    cv2.rectangle(frame, (px+10, py+90), (px+10+bar_w, py+105),
                  CLR_BAR_BG, -1)
    fill = int(bar_w * top_conf)
    if fill > 0:
        # Gradient-style: blend red→green based on confidence
        g = int(80  + 120 * top_conf)
        r = int(220 - 160 * top_conf)
        cv2.rectangle(frame, (px+10, py+90), (px+10+fill, py+105),
                      (0, g, r), -1)
    cv2.putText(frame, f"{top_conf*100:.1f}%",
                (px + 10, py + 120),
                FONT, 0.48, CLR_WHITE, 1, cv2.LINE_AA)
    cv2.putText(frame, "confidence",
                (px + 10 + 60, py + 120),
                FONT, 0.38, (160, 160, 160), 1, cv2.LINE_AA)

    cv2.line(frame, (px+10, py+130), (px+panel_w-10, py+130),
             (60, 60, 60), 1)

    # ── Top-5 bars ────────────────────────────────────────────────────────────
    TOP_K     = 5
    top5_idx  = probs.argsort()[::-1][:TOP_K]
    bar_area  = panel_w - 20

    for rank, cls_idx in enumerate(top5_idx):
        ry = py + 140 + rank * 20
        draw_bar(frame,
                 class_names[cls_idx],
                 probs[cls_idx],
                 ry, px, bar_area,
                 is_top=(rank == 0))

    # ── Buffer / FPS strip ───────────────────────────────────────────────────
    strip_y = py + panel_h + 8
    draw_panel(frame, px, strip_y, panel_w, 38)
    # Buffer fill bar
    buf_bar = int((panel_w - 20) * buffer_fill)
    cv2.rectangle(frame, (px+10, strip_y+6), (px+10+panel_w-20, strip_y+18),
                  CLR_BAR_BG, -1)
    cv2.rectangle(frame, (px+10, strip_y+6), (px+10+buf_bar, strip_y+18),
                  (180, 100, 0), -1)
    cv2.putText(frame, f"Buffer {buffer_fill*100:.0f}%  |  FPS {fps:.1f}",
                (px+10, strip_y+32), FONT, 0.36, (160, 160, 160), 1, cv2.LINE_AA)


def draw_pose(frame, results):
    """Draw MediaPipe skeleton on frame."""
    if not results or not results.pose_landmarks:
        return
    mp_draw = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    mp_draw.draw_landmarks(
        frame,
        results.pose_landmarks,
        mp_pose.POSE_CONNECTIONS,
        mp_draw.DrawingSpec(color=CLR_POSE, thickness=2, circle_radius=3),
        mp_draw.DrawingSpec(color=(50, 150, 255), thickness=2),
    )


# ──────────────────────────────────────────────────────────────────────────────
# Main loop
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Cricket Shot Classifier — Real-Time Test")
    parser.add_argument("--source", default=0,
                        help="Camera index (0) or path to video file")
    parser.add_argument("--save",   default="",
                        help="Optional output video path (e.g. out.mp4)")
    parser.add_argument("--no-pose", action="store_true",
                        help="Disable MediaPipe pose skeleton overlay")
    parser.add_argument("--model-dir", default=str(MODEL_DIR),
                        help="Path to best_model directory")
    args = parser.parse_args()

    # ── Device ────────────────────────────────────────────────────────────────
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # ── Load model ───────────────────────────────────────────────────────────
    processor, model = load_model(Path(args.model_dir), device)

    # ── Open video source ────────────────────────────────────────────────────
    src = int(args.source) if str(args.source).isdigit() else args.source
    cap = cv2.VideoCapture(src)
    if not cap.isOpened():
        print(f"Cannot open source: {args.source}")
        return

    W_in = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H_in = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    print(f"📹 Source: {args.source}  |  {W_in}×{H_in} @ {src_fps:.1f} fps")

    # ── Optional video writer ─────────────────────────────────────────────────
    writer = None
    if args.save:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(args.save, fourcc, src_fps, (W_in, H_in))
        print(f"💾 Saving output to: {args.save}")

    # ── MediaPipe Pose ────────────────────────────────────────────────────────
    mp_pose = mp.solutions.pose
    pose    = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) if not args.no_pose else None

    # ── State ─────────────────────────────────────────────────────────────────
    frame_buffer   = collections.deque(maxlen=NUM_FRAMES)  # stores RGB frames
    smooth_probs   = np.ones(len(CLASS_NAMES)) / len(CLASS_NAMES)  # uniform start
    frame_count    = 0
    fps_deque      = collections.deque(maxlen=30)
    last_time      = time.time()

    print("\nPress  Q  to quit,  S  to save a snapshot,  P  to toggle pose.\n")
    show_pose = not args.no_pose

    while True:
        ret, frame = cap.read()
        if not ret:
            print("End of stream or read error — stopping.")
            break

        frame_count += 1

        # ── FPS tracking ─────────────────────────────────────────────────────
        now = time.time()
        fps_deque.append(1.0 / max(now - last_time, 1e-6))
        last_time = now
        display_fps = float(np.mean(fps_deque))

        # ── MediaPipe Pose ────────────────────────────────────────────────────
        pose_results = None
        if pose and show_pose:
            rgb_mp = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb_mp.flags.writeable = False
            pose_results = pose.process(rgb_mp)
            rgb_mp.flags.writeable = True

        # ── Buffer frames for classifier (resize to IMAGE_SIZE) ───────────────
        frame_rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        small_frame = cv2.resize(frame_rgb, (IMAGE_SIZE, IMAGE_SIZE),
                                  interpolation=cv2.INTER_LINEAR)
        frame_buffer.append(small_frame)

        buffer_fill = len(frame_buffer) / NUM_FRAMES

        # ── Inference (every INFER_EVERY frames once buffer is full) ──────────
        if (len(frame_buffer) == NUM_FRAMES and
                frame_count % INFER_EVERY == 0):
            raw_probs   = run_inference(list(frame_buffer), processor, model, device)
            # Exponential smoothing
            smooth_probs = SMOOTH_ALPHA * raw_probs + (1 - SMOOTH_ALPHA) * smooth_probs

        # ── Draw pose skeleton ────────────────────────────────────────────────
        if show_pose:
            draw_pose(frame, pose_results)

        # ── Draw HUD ──────────────────────────────────────────────────────────
        draw_hud(frame, smooth_probs, CLASS_NAMES,
                 display_fps, frame_count, buffer_fill)

        # ── Shot name large overlay (centre-bottom) ───────────────────────────
        if len(frame_buffer) == NUM_FRAMES:
            top_idx   = int(smooth_probs.argmax())
            top_label = CLASS_NAMES[top_idx].replace("_", " ").upper()
            top_conf  = smooth_probs[top_idx]

            # Shadow
            cv2.putText(frame, top_label,
                        (W_in//2 - len(top_label)*10 + 2, H_in - 38 + 2),
                        FONT, 1.1, (0, 0, 0), 3, cv2.LINE_AA)
            # Foreground
            conf_color = (
                int(50  + 200 * top_conf),     # B
                int(200 * top_conf),            # G
                int(220 - 200 * top_conf),      # R
            )
            cv2.putText(frame, top_label,
                        (W_in//2 - len(top_label)*10, H_in - 38),
                        FONT, 1.1, conf_color, 2, cv2.LINE_AA)
        else:
            cv2.putText(frame, "Buffering...",
                        (W_in//2 - 70, H_in - 38),
                        FONT, 0.8, (120, 120, 120), 1, cv2.LINE_AA)

        # ── Write frame ───────────────────────────────────────────────────────
        if writer:
            writer.write(frame)

        cv2.imshow("Cricket Shot Classifier", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            print("👋 Quit by user.")
            break
        elif key == ord("p"):
            show_pose = not show_pose
            print(f"Pose overlay: {'ON' if show_pose else 'OFF'}")
        elif key == ord("s"):
            snap_path = f"snapshot_{frame_count:06d}.png"
            cv2.imwrite(snap_path, frame)
            print(f"Snapshot saved -> {snap_path}")

    # ── Cleanup ───────────────────────────────────────────────────────────────
    cap.release()
    if writer:
        writer.release()
        print(f"💾 Output video saved → {args.save}")
    if pose:
        pose.close()
    cv2.destroyAllWindows()
    print("Done.")


if __name__ == "__main__":
    main()
