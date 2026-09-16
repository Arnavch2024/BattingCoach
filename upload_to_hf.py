import os
import sys
from pathlib import Path
from huggingface_hub import HfApi

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

def upload_models():
    api = HfApi()
    username = "Arnav2005"
    
    base_dir = Path(__file__).parent.resolve()
    
    # 1. VideoMAE Model Repo
    videomae_repo = f"{username}/cricket-videomae-classifier"
    videomae_local_path = base_dir / "cricket_shot_classifier-20260420T175634Z-3-001" / "cricket_shot_classifier" / "best_model"
    
    print(f"[Upload] Uploading VideoMAE model from {videomae_local_path} to {videomae_repo}...")
    api.create_repo(repo_id=videomae_repo, repo_type="model", exist_ok=True)
    api.upload_folder(
        folder_path=str(videomae_local_path),
        repo_id=videomae_repo,
        repo_type="model",
    )
    print(f"[Success] VideoMAE model uploaded to: https://huggingface.co/{videomae_repo}")
    
    # 2. YOLO Bat Detection Model Repo
    yolo_repo = f"{username}/cricket-yolov8-bat-detection"
    yolo_local_file = base_dir / "runs" / "obb" / "runs" / "bat_detection" / "train" / "weights" / "best.pt"
    
    print(f"[Upload] Uploading YOLO bat detection weights from {yolo_local_file} to {yolo_repo}...")
    api.create_repo(repo_id=yolo_repo, repo_type="model", exist_ok=True)
    api.upload_file(
        path_or_fileobj=str(yolo_local_file),
        path_in_repo="best.pt",
        repo_id=yolo_repo,
        repo_type="model",
    )
    print(f"[Success] YOLO Bat Detection model uploaded to: https://huggingface.co/{yolo_repo}")

if __name__ == "__main__":
    upload_models()
