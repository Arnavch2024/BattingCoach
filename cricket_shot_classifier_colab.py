# ==============================================================================
#  🏏 Cricket Shot Classifier — Google Colab Training Script
#  Model  : VideoMAE-base (fine-tuned on Kinetics-400)
#  Task   : 10-class cricket shot video classification
#  Dataset: rokmr/cricketshot (HuggingFace Hub)
#
#  HOW TO USE IN COLAB:
#  1. Upload this file to Colab  (or paste sections as cells)
#  2. Runtime → Change runtime type → GPU (T4 or A100)
#  3. Run cells top to bottom
# ==============================================================================


# ==============================================================================
# CELL 1 — Install Dependencies
# ==============================================================================
# Run this cell first. Restart runtime after installation if Colab prompts you.

import subprocess, sys

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

PACKAGES = [
    "transformers>=4.40.0",
    "datasets",
    "accelerate",
    "evaluate",
    "scikit-learn",
    "decord",         # fast video decoder
    "av",             # fallback video decoder (PyAV)
    "matplotlib",
    "seaborn",
    "tqdm",
    "huggingface_hub",
]

print("📦 Installing dependencies...")
for pkg in PACKAGES:
    print(f"  Installing {pkg}...")
    install(pkg)

print("\n✅ All dependencies installed. If prompted, restart the runtime and re-run from Cell 2.")


# ==============================================================================
# CELL 2 — GPU Check & Google Drive Mount
# ==============================================================================

import torch
import os

# --- GPU check ---
if torch.cuda.is_available():
    gpu_name = torch.cuda.get_device_name(0)
    gpu_mem  = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"✅ GPU detected : {gpu_name}  ({gpu_mem:.1f} GB VRAM)")
else:
    print("⚠️  No GPU detected. Switch to GPU runtime: Runtime → Change runtime type → GPU")

# --- Mount Google Drive (saves checkpoints so they survive session restarts) ---
MOUNT_DRIVE = True   # ← Set to False if you don't want Drive

if MOUNT_DRIVE:
    from google.colab import drive
    drive.mount("/content/drive")
    SAVE_DIR = "/content/drive/MyDrive/cricket_shot_classifier"
    os.makedirs(SAVE_DIR, exist_ok=True)
    print(f"\n📁 Models will be saved to: {SAVE_DIR}")
else:
    SAVE_DIR = "/content/cricket_shot_classifier"
    os.makedirs(SAVE_DIR, exist_ok=True)
    print(f"\n📁 Models will be saved to: {SAVE_DIR} (local — will be lost on session end)")


# ==============================================================================
# CELL 3 — HuggingFace Login
# ==============================================================================
# The rokmr/cricketshot dataset requires a HuggingFace account.
# Get your token from: https://huggingface.co/settings/tokens

from huggingface_hub import login

HF_TOKEN = ""   # ← PASTE YOUR TOKEN HERE  e.g. "hf_xxxxxxxxxxxx"
               #   OR leave empty to use interactive login below

if HF_TOKEN:
    login(token=HF_TOKEN, add_to_git_credential=False)
    print("✅ Logged in to HuggingFace with provided token.")
else:
    print("🔑 No token provided — launching interactive login...")
    login()   # Opens a prompt asking for your token


# ==============================================================================
# CELL 4 — Configuration (edit these settings)
# ==============================================================================

CONFIG = {
    # ── Dataset ────────────────────────────────────────────────────────────────
    "dataset_name"   : "rokmr/cricketshot",
    "num_classes"    : 10,
    "class_names"    : [
        "cover", "defense", "flick", "hook", "late_cut",
        "lofted", "pull", "square_cut", "straight", "sweep"
    ],

    # ── Model ──────────────────────────────────────────────────────────────────
    #   Options (pick based on your GPU):
    #   "MCG-NJU/videomae-base-finetuned-kinetics"  ← recommended (T4 / V100)
    #   "MCG-NJU/videomae-large-finetuned-kinetics" ← best accuracy (A100 only)
    #   "facebook/timesformer-base-finetuned-k400"  ← alternative
    "model_checkpoint": "MCG-NJU/videomae-base-finetuned-kinetics",

    # ── Video sampling ─────────────────────────────────────────────────────────
    "num_frames"     : 16,     # frames sampled per clip
    "image_size"     : 224,    # VideoMAE native resolution

    # ── Training ───────────────────────────────────────────────────────────────
    "epochs"         : 30,
    "batch_size"     : 4,      # per-device batch (use 2 if OOM)
    "grad_accum"     : 4,      # effective batch = batch_size × grad_accum = 16
    "learning_rate"  : 5e-5,
    "warmup_epochs"  : 2,
    "weight_decay"   : 0.05,
    "fp16"           : True,   # set False if you get NaN losses
    "patience"       : 10,     # early-stopping patience (epochs)

    # ── Paths ──────────────────────────────────────────────────────────────────
    "output_dir"     : SAVE_DIR,
    "best_model_dir" : os.path.join(SAVE_DIR, "best_model"),
    "plots_dir"      : os.path.join(SAVE_DIR, "plots"),
}

os.makedirs(CONFIG["best_model_dir"], exist_ok=True)
os.makedirs(CONFIG["plots_dir"],      exist_ok=True)

print("⚙️  Configuration:")
for k, v in CONFIG.items():
    print(f"    {k:<20} = {v}")


# ==============================================================================
# CELL 5 — Load Dataset
# ==============================================================================

from datasets import load_dataset

print(f"\n📥 Loading dataset: {CONFIG['dataset_name']} ...")
raw_dataset = load_dataset(CONFIG["dataset_name"])
print(raw_dataset)

# Inspect one sample to understand the data format
sample = raw_dataset["train"][0]
print("\n🔍 Sample keys  :", list(sample.keys()))
print("   label       :", sample.get("label"))

# Find the video column name (varies by dataset)
VIDEO_COL  = None
LABEL_COL  = "label"
for col in ["video", "clip", "frames", "video_path", "file"]:
    if col in sample:
        VIDEO_COL = col
        break

if VIDEO_COL is None:
    raise ValueError(
        f"Could not find a video column. Available columns: {list(sample.keys())}\n"
        "Set VIDEO_COL manually below."
    )

print(f"   video column: {VIDEO_COL}")
print(f"   type        : {type(sample[VIDEO_COL])}")


# ==============================================================================
# CELL 6 — Video Preprocessing Utilities
# ==============================================================================

import numpy as np
import io, av, warnings

# Try importing decord (fast); fall back to PyAV
try:
    from decord import VideoReader, cpu
    DECORD_AVAILABLE = True
    print("✅ Using decord for video decoding.")
except ImportError:
    DECORD_AVAILABLE = False
    print("⚠️  decord not available — using PyAV (slower).")


def decode_video_decord(video_data) -> np.ndarray:
    """Decode video bytes/path with decord → (T, H, W, 3) uint8."""
    if isinstance(video_data, bytes):
        vr = VideoReader(io.BytesIO(video_data), ctx=cpu(0))
    elif isinstance(video_data, str):
        vr = VideoReader(video_data, ctx=cpu(0))
    elif hasattr(video_data, "path"):          # HF Video object
        vr = VideoReader(video_data.path, ctx=cpu(0))
    else:
        raise TypeError(f"Unsupported video type: {type(video_data)}")
    frames = vr.get_batch(range(len(vr))).asnumpy()  # (T, H, W, 3)
    return frames


def decode_video_av(video_data) -> np.ndarray:
    """Decode video bytes/path with PyAV → (T, H, W, 3) uint8."""
    if isinstance(video_data, (bytes, bytearray)):
        container = av.open(io.BytesIO(video_data))
    elif isinstance(video_data, str):
        container = av.open(video_data)
    elif hasattr(video_data, "path"):
        container = av.open(video_data.path)
    else:
        raise TypeError(f"Unsupported video type: {type(video_data)}")

    frames = []
    for frame in container.decode(video=0):
        frames.append(frame.to_ndarray(format="rgb24"))
    container.close()
    return np.stack(frames) if frames else np.zeros((1, 224, 224, 3), dtype=np.uint8)


def decode_video(video_data) -> np.ndarray:
    """Decode video using best available backend."""
    if DECORD_AVAILABLE:
        try:
            return decode_video_decord(video_data)
        except Exception:
            pass
    return decode_video_av(video_data)


def sample_frames_uniform(frames: np.ndarray, num_frames: int) -> np.ndarray:
    """Sample num_frames uniformly from a (T, H, W, 3) array."""
    T = len(frames)
    if T == 0:
        return np.zeros((num_frames, 224, 224, 3), dtype=np.uint8)
    indices = np.linspace(0, T - 1, num_frames, dtype=int)
    return frames[indices]  # (num_frames, H, W, 3)


# Quick test on one sample
print("\n🧪 Testing video decode on one training sample...")
test_frames_raw = decode_video(sample[VIDEO_COL])
test_frames     = sample_frames_uniform(test_frames_raw, CONFIG["num_frames"])
print(f"   Raw video shape  : {test_frames_raw.shape}")
print(f"   Sampled shape    : {test_frames.shape}  (should be {CONFIG['num_frames']} × H × W × 3)")


# ==============================================================================
# CELL 7 — Load Model & Processor
# ==============================================================================

from transformers import (
    VideoMAEImageProcessor,
    VideoMAEForVideoClassification,
    TimesformerForVideoClassification,
)

print(f"\n📥 Loading processor from: {CONFIG['model_checkpoint']}")
processor = VideoMAEImageProcessor.from_pretrained(CONFIG["model_checkpoint"])

print(f"📥 Loading model from     : {CONFIG['model_checkpoint']}")

id2label = {i: name for i, name in enumerate(CONFIG["class_names"])}
label2id = {name: i for i, name in id2label.items()}

model = VideoMAEForVideoClassification.from_pretrained(
    CONFIG["model_checkpoint"],
    num_labels=CONFIG["num_classes"],
    id2label=id2label,
    label2id=label2id,
    ignore_mismatched_sizes=True,   # replaces the 400-class head with 10-class
)

total_params     = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"\n📊 Model parameters:")
print(f"   Total     : {total_params / 1e6:.1f} M")
print(f"   Trainable : {trainable_params / 1e6:.1f} M")


# ==============================================================================
# CELL 8 — Dataset Preprocessing
# ==============================================================================

import torch
from torch.utils.data import Dataset, DataLoader

class CricketShotDataset(Dataset):
    """
    PyTorch Dataset for the rokmr/cricketshot HuggingFace dataset.
    Decodes videos, samples frames, applies VideoMAE processor.
    """

    def __init__(self, hf_dataset, processor, num_frames: int, image_size: int):
        self.data       = hf_dataset
        self.processor  = processor
        self.num_frames = num_frames
        self.image_size = image_size

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item  = self.data[idx]
        label = item[LABEL_COL]

        # ── Decode video → sample frames ──────────────────────────────────────
        try:
            raw_frames = decode_video(item[VIDEO_COL])
        except Exception as e:
            warnings.warn(f"Failed to decode video at index {idx}: {e}. Using blank frames.")
            raw_frames = np.zeros((self.num_frames, self.image_size, self.image_size, 3), dtype=np.uint8)

        frames = sample_frames_uniform(raw_frames, self.num_frames)  # (T, H, W, 3)

        # ── Apply VideoMAE processor ───────────────────────────────────────────
        # Processor expects list of PIL Images or list of (H,W,3) uint8 arrays
        frame_list = [frames[i] for i in range(self.num_frames)]
        inputs = self.processor(frame_list, return_tensors="pt")
        # pixel_values shape: (1, T, C, H, W) → squeeze batch dim
        pixel_values = inputs["pixel_values"].squeeze(0)  # (T, C, H, W)

        return {
            "pixel_values": pixel_values,
            "labels"      : torch.tensor(label, dtype=torch.long),
        }


# Build datasets
print("🔨 Building PyTorch datasets (this may take a moment)...")
train_split = raw_dataset.get("train",      raw_dataset.get("train"))
val_split   = raw_dataset.get("validation", raw_dataset.get("val"))
test_split  = raw_dataset.get("test")

train_dataset = CricketShotDataset(train_split, processor, CONFIG["num_frames"], CONFIG["image_size"])
val_dataset   = CricketShotDataset(val_split,   processor, CONFIG["num_frames"], CONFIG["image_size"])
test_dataset  = CricketShotDataset(test_split,  processor, CONFIG["num_frames"], CONFIG["image_size"]) if test_split else None

print(f"   Train samples : {len(train_dataset)}")
print(f"   Val samples   : {len(val_dataset)}")
print(f"   Test samples  : {len(test_dataset) if test_dataset else 'N/A'}")

# Quick shape check
sample_batch = train_dataset[0]
print(f"\n🔍 Sample pixel_values shape : {sample_batch['pixel_values'].shape}")
print(f"   Sample label              : {sample_batch['labels'].item()} ({id2label[sample_batch['labels'].item()]})")


# ==============================================================================
# CELL 9 — DataLoaders
# ==============================================================================

def collate_fn(batch):
    pixel_values = torch.stack([item["pixel_values"] for item in batch])
    labels       = torch.stack([item["labels"]       for item in batch])
    return {"pixel_values": pixel_values, "labels": labels}

NUM_WORKERS = 2   # Colab usually works fine with 2

train_loader = DataLoader(
    train_dataset,
    batch_size=CONFIG["batch_size"],
    shuffle=True,
    num_workers=NUM_WORKERS,
    pin_memory=True,
    collate_fn=collate_fn,
)

val_loader = DataLoader(
    val_dataset,
    batch_size=CONFIG["batch_size"],
    shuffle=False,
    num_workers=NUM_WORKERS,
    pin_memory=True,
    collate_fn=collate_fn,
)

test_loader = DataLoader(
    test_dataset,
    batch_size=CONFIG["batch_size"],
    shuffle=False,
    num_workers=NUM_WORKERS,
    pin_memory=True,
    collate_fn=collate_fn,
) if test_dataset else None

print(f"✅ DataLoaders ready.")
print(f"   Train batches : {len(train_loader)}")
print(f"   Val batches   : {len(val_loader)}")


# ==============================================================================
# CELL 10 — Training Setup
# ==============================================================================

from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.cuda.amp import GradScaler, autocast

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model  = model.to(DEVICE)
print(f"🖥️  Training on: {DEVICE}")

optimizer = AdamW(
    model.parameters(),
    lr=CONFIG["learning_rate"],
    weight_decay=CONFIG["weight_decay"],
)

total_steps = len(train_loader) * CONFIG["epochs"] // CONFIG["grad_accum"]
warmup_steps = len(train_loader) * CONFIG["warmup_epochs"] // CONFIG["grad_accum"]

scheduler = CosineAnnealingLR(
    optimizer,
    T_max=total_steps - warmup_steps,
    eta_min=1e-6,
)

scaler = GradScaler(enabled=CONFIG["fp16"])


# Linear warmup helper
def get_warmup_factor(current_step: int, warmup_steps: int) -> float:
    if warmup_steps <= 0 or current_step >= warmup_steps:
        return 1.0
    return float(current_step) / float(max(1, warmup_steps))


# ==============================================================================
# CELL 11 — Training & Validation Loop
# ==============================================================================

import time
from tqdm.auto import tqdm

def compute_accuracy(logits: torch.Tensor, labels: torch.Tensor) -> float:
    preds = logits.argmax(dim=-1)
    return (preds == labels).float().mean().item()


def train_one_epoch(model, loader, optimizer, scheduler, scaler, epoch: int,
                    grad_accum: int, warmup_steps: int, global_step: list):
    model.train()
    total_loss, total_acc = 0.0, 0.0
    optimizer.zero_grad()

    pbar = tqdm(loader, desc=f"Epoch {epoch:02d} [Train]", leave=False)
    for step, batch in enumerate(pbar):
        pixel_values = batch["pixel_values"].to(DEVICE)
        labels       = batch["labels"].to(DEVICE)

        with autocast(enabled=CONFIG["fp16"]):
            outputs = model(pixel_values=pixel_values, labels=labels)
            loss    = outputs.loss / grad_accum

        scaler.scale(loss).backward()

        if (step + 1) % grad_accum == 0:
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
            optimizer.zero_grad()

            # Warmup LR override
            global_step[0] += 1
            if global_step[0] < warmup_steps:
                wf = get_warmup_factor(global_step[0], warmup_steps)
                for pg in optimizer.param_groups:
                    pg["lr"] = CONFIG["learning_rate"] * wf
            else:
                scheduler.step()

        total_loss += outputs.loss.item()
        total_acc  += compute_accuracy(outputs.logits, labels)
        pbar.set_postfix(loss=f"{outputs.loss.item():.4f}")

    n = len(loader)
    return total_loss / n, total_acc / n


@torch.no_grad()
def validate(model, loader, split_name="Val"):
    model.eval()
    total_loss, total_acc = 0.0, 0.0

    pbar = tqdm(loader, desc=f"          [{split_name}] ", leave=False)
    for batch in pbar:
        pixel_values = batch["pixel_values"].to(DEVICE)
        labels       = batch["labels"].to(DEVICE)

        with autocast(enabled=CONFIG["fp16"]):
            outputs = model(pixel_values=pixel_values, labels=labels)

        total_loss += outputs.loss.item()
        total_acc  += compute_accuracy(outputs.logits, labels)

    n = len(loader)
    return total_loss / n, total_acc / n


# ── Training loop ──────────────────────────────────────────────────────────────

history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
best_val_acc     = 0.0
patience_counter = 0
global_step      = [0]

print("\n" + "=" * 65)
print(f"  🚀  Starting Training  |  {CONFIG['epochs']} epochs  |  Device: {DEVICE}")
print("=" * 65)
print(f"  {'Epoch':>5}  {'Train Loss':>10}  {'Train Acc':>9}  {'Val Loss':>8}  {'Val Acc':>7}")
print("-" * 65)

for epoch in range(1, CONFIG["epochs"] + 1):
    t0 = time.time()

    train_loss, train_acc = train_one_epoch(
        model, train_loader, optimizer, scheduler, scaler,
        epoch, CONFIG["grad_accum"], warmup_steps, global_step
    )

    val_loss, val_acc = validate(model, val_loader)
    elapsed          = time.time() - t0

    history["train_loss"].append(train_loss)
    history["train_acc"].append(train_acc)
    history["val_loss"].append(val_loss)
    history["val_acc"].append(val_acc)

    # Best model checkpoint
    improved = val_acc > best_val_acc
    if improved:
        best_val_acc = val_acc
        patience_counter = 0
        model.save_pretrained(CONFIG["best_model_dir"])
        processor.save_pretrained(CONFIG["best_model_dir"])
        flag = "⭐ best"
    else:
        patience_counter += 1
        flag = ""

    print(f"  {epoch:>5}  {train_loss:>10.4f}  {train_acc:>8.1%}  "
          f"{val_loss:>8.4f}  {val_acc:>6.1%}  {elapsed:>5.1f}s  {flag}")

    # Early stopping
    if patience_counter >= CONFIG["patience"]:
        print(f"\n⏹️  Early stopping at epoch {epoch} (no improvement for {CONFIG['patience']} epochs).")
        break

print("=" * 65)
print(f"✅ Training complete! Best val accuracy: {best_val_acc:.1%}")
print(f"   Best model saved to: {CONFIG['best_model_dir']}")


# ==============================================================================
# CELL 12 — Plot Training Curves
# ==============================================================================

import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(14, 5))
fig.suptitle("Cricket Shot Classifier — Training Curves", fontsize=14, fontweight="bold")

gs = gridspec.GridSpec(1, 2, figure=fig)

# Loss
ax1 = fig.add_subplot(gs[0, 0])
ax1.plot(history["train_loss"], label="Train Loss", lw=2, color="#4C8BF5")
ax1.plot(history["val_loss"],   label="Val Loss",   lw=2, color="#F56C4C", linestyle="--")
ax1.set_xlabel("Epoch")
ax1.set_ylabel("Cross-Entropy Loss")
ax1.set_title("Loss")
ax1.legend()
ax1.grid(alpha=0.3)

# Accuracy
ax2 = fig.add_subplot(gs[0, 1])
ax2.plot([a * 100 for a in history["train_acc"]], label="Train Acc", lw=2, color="#4C8BF5")
ax2.plot([a * 100 for a in history["val_acc"]],   label="Val Acc",   lw=2, color="#F56C4C", linestyle="--")
ax2.set_xlabel("Epoch")
ax2.set_ylabel("Accuracy (%)")
ax2.set_title("Accuracy")
ax2.legend()
ax2.grid(alpha=0.3)
ax2.set_ylim(0, 100)

plt.tight_layout()
curve_path = os.path.join(CONFIG["plots_dir"], "training_curves.png")
plt.savefig(curve_path, dpi=150, bbox_inches="tight")
plt.show()
print(f"📊 Saved training curves → {curve_path}")


# ==============================================================================
# CELL 13 — Full Evaluation on Test Set
# ==============================================================================

import sklearn.metrics as skm
import seaborn as sns

print("\n🔍 Loading best model for test evaluation...")
best_model = VideoMAEForVideoClassification.from_pretrained(CONFIG["best_model_dir"]).to(DEVICE)
best_model.eval()

if test_loader:
    all_preds, all_labels = [], []

    with torch.no_grad():
        for batch in tqdm(test_loader, desc="Evaluating on test set"):
            pixel_values = batch["pixel_values"].to(DEVICE)
            labels       = batch["labels"].to(DEVICE)

            with autocast(enabled=CONFIG["fp16"]):
                outputs = best_model(pixel_values=pixel_values)

            preds = outputs.logits.argmax(dim=-1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    # Metrics
    acc    = skm.accuracy_score(all_labels, all_preds)
    f1     = skm.f1_score(all_labels, all_preds, average="macro")
    report = skm.classification_report(
        all_labels, all_preds,
        target_names=CONFIG["class_names"]
    )

    print("\n" + "=" * 55)
    print(f"  📊  Test Set Results")
    print("=" * 55)
    print(f"  Accuracy (top-1) : {acc:.1%}")
    print(f"  F1 (macro)       : {f1:.4f}")
    print("-" * 55)
    print(report)

    # Confusion matrix
    cm = skm.confusion_matrix(all_labels, all_preds)
    fig, ax = plt.subplots(figsize=(12, 10))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=CONFIG["class_names"],
        yticklabels=CONFIG["class_names"],
        ax=ax
    )
    ax.set_title("Confusion Matrix — Cricket Shot Classifier", fontsize=14, fontweight="bold")
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("True",      fontsize=12)
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    cm_path = os.path.join(CONFIG["plots_dir"], "confusion_matrix.png")
    plt.savefig(cm_path, dpi=150, bbox_inches="tight")
    plt.show()
    print(f"📊 Confusion matrix saved → {cm_path}")

else:
    print("⚠️  No test split available — skipping test evaluation.")


# ==============================================================================
# CELL 14 — Single-Video Inference (Test with your own clip)
# ==============================================================================
if 'id2label' not in globals():
    id2label = {i: label for i, label in enumerate(CONFIG["class_names"])}
    label2id = {label: i for i, label in enumerate(CONFIG["class_names"])}
def predict_shot(video_path_or_bytes, model, processor, num_frames: int = 16) -> dict:
    """
    Predict cricket shot from a video file.

    Args:
        video_path_or_bytes: path to .mp4 file OR raw bytes
        model              : fine-tuned VideoMAEForVideoClassification
        processor          : VideoMAEImageProcessor
        num_frames         : frames to sample (must match training)

    Returns:
        dict with 'predicted_class', 'confidence', 'top3'
    """
    model.eval()

    # Decode + sample frames
    raw_frames = decode_video(video_path_or_bytes)
    frames     = sample_frames_uniform(raw_frames, num_frames)
    frame_list = [frames[i] for i in range(num_frames)]

    # Preprocess
    inputs       = processor(frame_list, return_tensors="pt")
    pixel_values = inputs["pixel_values"].to(DEVICE)

    # Inference
    with torch.no_grad():
        with autocast(enabled=CONFIG["fp16"]):
            outputs = model(pixel_values=pixel_values)

    probs     = torch.softmax(outputs.logits, dim=-1)[0].cpu().numpy()
    top3_idx  = probs.argsort()[::-1][:3]

    return {
        "predicted_class": id2label[int(probs.argmax())],
        "confidence"     : float(probs.max()),
        "top3"           : [
            {"shot": id2label[int(i)], "prob": float(probs[i])}
            for i in top3_idx
        ],
    }


# ── Example usage (upload a video to Colab first) ─────────────────────────────
#
# from google.colab import files
# uploaded = files.upload()
# video_path = list(uploaded.keys())[0]
#
# result = predict_shot(video_path, best_model, processor)
# print(f"\n🏏 Predicted Shot : {result['predicted_class'].upper()}")
# print(f"   Confidence     : {result['confidence']:.1%}")
# print("\n   Top-3 predictions:")
# for rank, item in enumerate(result["top3"], 1):
#     bar = "█" * int(item["prob"] * 30)
#     print(f"   {rank}. {item['shot']:<12} {item['prob']:>5.1%}  {bar}")

print("✅ Inference function ready. Uncomment the example above to test a video.")


# ==============================================================================
# CELL 15 — Download Results (saves model + plots as ZIP to local machine)
# ==============================================================================

import zipfile

if not MOUNT_DRIVE:
    # If Drive is not mounted, zip everything for manual download
    zip_path = "/content/cricket_shot_classifier_results.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(CONFIG["output_dir"]):
            for file in files:
                fp = os.path.join(root, file)
                zf.write(fp, os.path.relpath(fp, "/content"))

    from google.colab import files
    files.download(zip_path)
    print(f"📦 Downloaded results ZIP: {zip_path}")
else:
    print(f"📁 All results already saved to Google Drive: {CONFIG['output_dir']}")
    print(f"   ├── best_model/    (model weights + processor)")
    print(f"   └── plots/         (training curves + confusion matrix)")


# ==============================================================================
# DONE
# ==============================================================================
print("""
╔══════════════════════════════════════════════════════╗
║      🏏  Cricket Shot Classifier — Training Done!   ║
╠══════════════════════════════════════════════════════╣
║  Model   : VideoMAE-base fine-tuned on your data    ║
║  Weights : best_model/ (saved to Drive or zipped)   ║
║  Plots   : training_curves.png + confusion_matrix   ║
╚══════════════════════════════════════════════════════╝
""")
