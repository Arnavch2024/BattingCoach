"""
=============================================================
  YOLOv8-OBB Training Script — Cricket Bat Detection
  Dataset : Cricket Bat Dataset v1 (Roboflow)
  Task    : Oriented Bounding Box (OBB) detection
  Class   : Bat (1 class)
=============================================================

Usage:
    python train_yolov8.py                   # default settings
    python train_yolov8.py --epochs 150      # custom epochs
    python train_yolov8.py --model yolov8m-obb.pt  # larger model
    python train_yolov8.py --resume          # resume from last checkpoint

Dependencies:
    pip install ultralytics
"""

import argparse
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Argument Parser
# ---------------------------------------------------------------------------
def parse_args():
    parser = argparse.ArgumentParser(
        description="Train YOLOv8-OBB model for Cricket Bat Detection"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8s-obb.pt",
        help=(
            "Pretrained model checkpoint. Options:\n"
            "  yolov8n-obb.pt  (nano  – fastest)\n"
            "  yolov8s-obb.pt  (small – recommended default)\n"
            "  yolov8m-obb.pt  (medium)\n"
            "  yolov8l-obb.pt  (large)\n"
            "  yolov8x-obb.pt  (xlarge – best accuracy)\n"
        ),
    )
    parser.add_argument(
        "--epochs", type=int, default=100,
        help="Number of training epochs (default: 100)"
    )
    parser.add_argument(
        "--imgsz", type=int, default=512,
        help="Training image size in pixels (default: 512)"
    )
    parser.add_argument(
        "--batch", type=int, default=16,
        help="Batch size. Use -1 for auto-batch (default: 16)"
    )
    parser.add_argument(
        "--device", type=str, default="",
        help="Device to use: '' for auto, '0' for GPU 0, 'cpu' for CPU"
    )
    parser.add_argument(
        "--workers", type=int, default=8,
        help="Number of dataloader worker threads (default: 8)"
    )
    parser.add_argument(
        "--project", type=str, default="runs/bat_detection",
        help="Output project folder (default: runs/bat_detection)"
    )
    parser.add_argument(
        "--name", type=str, default="train",
        help="Run name inside project folder (default: train)"
    )
    parser.add_argument(
        "--patience", type=int, default=30,
        help="Early-stopping patience in epochs (default: 30)"
    )
    parser.add_argument(
        "--lr0", type=float, default=0.01,
        help="Initial learning rate (default: 0.01)"
    )
    parser.add_argument(
        "--resume", action="store_true",
        help="Resume training from last checkpoint"
    )
    parser.add_argument(
        "--val", action="store_true", default=True,
        help="Run validation after training (default: True)"
    )
    parser.add_argument(
        "--export", action="store_true",
        help="Export the best model to ONNX after training"
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Dependency Check
# ---------------------------------------------------------------------------
def check_dependencies():
    try:
        import ultralytics
        from ultralytics import YOLO, checks
        print(f"✅  ultralytics {ultralytics.__version__} detected.")
        checks()  # prints system + CUDA info
    except ImportError:
        print("\n❌  ultralytics is not installed.")
        print("    Install it with:  pip install ultralytics\n")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Resolve data.yaml path
# ---------------------------------------------------------------------------
def get_data_yaml() -> str:
    """Return absolute path to data.yaml, wherever the script is run from."""
    script_dir = Path(__file__).parent.resolve()
    yaml_path = script_dir / "data.yaml"
    if not yaml_path.exists():
        print(f"\n❌  data.yaml not found at: {yaml_path}")
        print("    Make sure you run this script from the dataset root folder.\n")
        sys.exit(1)
    return str(yaml_path)


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train(args):
    from ultralytics import YOLO

    data_yaml = get_data_yaml()
    print(f"\n📂  Dataset   : {data_yaml}")
    print(f"🏋️  Model     : {args.model}")
    print(f"🔁  Epochs    : {args.epochs}")
    print(f"📐  Img size  : {args.imgsz}px")
    print(f"📦  Batch     : {args.batch}")
    print(f"⏱️  Patience  : {args.patience} epochs")
    print(f"📁  Output    : {args.project}/{args.name}\n")

    # Load pretrained OBB model
    model = YOLO(args.model)

    # -----------------------------------------------------------------------
    # Core training call
    # -----------------------------------------------------------------------
    results = model.train(
        data=data_yaml,
        task="obb",                   # Oriented Bounding Box task
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device if args.device else None,
        workers=args.workers,
        project=args.project,
        name=args.name,
        patience=args.patience,
        lr0=args.lr0,
        resume=args.resume,
        val=True,
        save=True,
        save_period=10,               # checkpoint every 10 epochs
        plots=True,                   # generate training curves
        # ── Augmentation ───────────────────────────────────────────────────
        hsv_h=0.015,                  # hue jitter
        hsv_s=0.7,                    # saturation jitter
        hsv_v=0.4,                    # brightness jitter
        degrees=15.0,                 # rotation (helps OBB)
        translate=0.1,
        scale=0.5,
        flipud=0.0,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
        copy_paste=0.1,
        # ── Optimizer ──────────────────────────────────────────────────────
        optimizer="AdamW",
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3,
        close_mosaic=10,              # disable mosaic last 10 epochs
        # ── Verbosity ──────────────────────────────────────────────────────
        verbose=True,
        exist_ok=False,               # don't overwrite previous runs
    )

    print("\n" + "=" * 60)
    print("✅  Training complete!")
    print(f"    Best weights  : {args.project}/{args.name}/weights/best.pt")
    print(f"    Last weights  : {args.project}/{args.name}/weights/last.pt")
    print("=" * 60)

    return model, results


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
def validate(model, args):
    from ultralytics import YOLO

    best_pt = Path(args.project) / args.name / "weights" / "best.pt"
    if not best_pt.exists():
        print("⚠️  best.pt not found – skipping validation.")
        return

    print(f"\n🔍  Running validation on best.pt …")
    val_model = YOLO(str(best_pt))
    data_yaml = get_data_yaml()

    metrics = val_model.val(
        data=data_yaml,
        task="obb",
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device if args.device else None,
        plots=True,
        split="test",                 # evaluate on the held-out test set
    )

    print("\n📊  Test-set Metrics:")
    print(f"    mAP50      : {metrics.box.map50:.4f}")
    print(f"    mAP50-95   : {metrics.box.map:.4f}")
    print(f"    Precision  : {metrics.box.mp:.4f}")
    print(f"    Recall     : {metrics.box.mr:.4f}")


# ---------------------------------------------------------------------------
# ONNX Export
# ---------------------------------------------------------------------------
def export_onnx(args):
    from ultralytics import YOLO

    best_pt = Path(args.project) / args.name / "weights" / "best.pt"
    if not best_pt.exists():
        print("⚠️  best.pt not found – skipping ONNX export.")
        return

    print(f"\n📦  Exporting best.pt to ONNX …")
    model = YOLO(str(best_pt))
    model.export(format="onnx", imgsz=args.imgsz, opset=17, simplify=True)
    onnx_path = best_pt.with_suffix(".onnx")
    print(f"✅  ONNX model saved to: {onnx_path}")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    args = parse_args()

    # 1. Dependency check
    check_dependencies()

    # 2. Train
    model, results = train(args)

    # 3. Validate on test split
    validate(model, args)

    # 4. (Optional) Export to ONNX
    if args.export:
        export_onnx(args)

    print("\n🎉  All done! Check the output folder for results and plots.\n")
