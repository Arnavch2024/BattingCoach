# 🏏 AI Cricket Batting Coach

![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![VideoMAE](https://img.shields.io/badge/Model-VideoMAE-blueviolet)
![YOLOv8](https://img.shields.io/badge/YOLOv8-OBB-yellow)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![Next.js](https://img.shields.io/badge/Next.js-Frontend-black)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose%20Estimation-blue)

**AI Cricket Batting Coach** is an intelligent, full-stack application that leverages state-of-the-art computer vision to analyze and classify cricket shots in real-time. By combining a fine-tuned VideoMAE transformer, YOLOv8 Oriented Bounding Box (OBB) detection, and MediaPipe pose estimation, this application acts as a virtual coach, providing live biomechanical feedback to help cricketers perfect their technique.

## ✨ Key Features

- **🎯 Real-Time Shot Classification (10 Classes):** Uses a fine-tuned VideoMAE model to classify 10 distinct cricket shots (e.g., cover drive, pull, hook, sweep, flick) from live video feeds.
- **🤸 Biomechanical Pose Analysis:** Integrates MediaPipe to track the batter's joints and analyze form (e.g., head stability, elbow height, knee bend), delivering tiered, shot-specific coaching tips (Foundational, Technical, Elite).
- **🏏 Bat Tracking (YOLOv8-OBB):** Includes training scripts and a Roboflow dataset for specialized Oriented Bounding Box detection to track the cricket bat's angle and position.
- **⚡ Low-Latency Architecture:** Powered by a FastAPI backend utilizing WebSockets to stream real-time inferences and feedback to the UI.
- **🎨 Modern Web Interface:** A sleek Next.js frontend (`cricket-coach-ui`) that displays the live camera feed, real-time probability charts, and immediate coaching insights.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend** | Next.js, React, Node.js |
| **Backend & WebSockets** | Python, FastAPI, Uvicorn |
| **Shot Classifier** | VideoMAE (HuggingFace Transformers, fine-tuned on `rokmr/cricketshot`) |
| **Pose Estimation** | Google MediaPipe |
| **Bat Detection** | YOLOv8-OBB (Ultralytics) |

## 🚀 Getting Started

Launch the entire AI Coach application (backend and frontend) with a single command!

### Prerequisites
- Python 3.9+
- Node.js (v18+)
- (Highly Recommended) CUDA-enabled GPU for real-time video inference

### Installation

1. **Install Backend Dependencies:**
   ```bash
   pip install fastapi uvicorn torch transformers ultralytics opencv-python mediapipe
   ```
   
2. **Install Frontend Dependencies:**
   ```bash
   cd cricket-coach-ui
   npm install
   cd ..
   ```

### Running the Application

To start both the FastAPI backend and the Next.js frontend simultaneously, simply run from the root directory:

```bash
python run_coach.py
```

- **Frontend UI:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs:** [http://127.0.0.1:8888/docs](http://127.0.0.1:8888/docs)

Press `Ctrl+C` in the terminal to stop both services cleanly.

## 🧠 Training Your Own Models

This repository includes fully-featured scripts to train both the shot classifier and the bat detector:

### 1. Cricket Shot Classifier (VideoMAE)
Use `cricket_shot_classifier_colab.py`. It is a ready-to-run Google Colab script that downloads the `rokmr/cricketshot` dataset from HuggingFace, fine-tunes a `videomae-base` model on 10 shot classes, and evaluates performance.
- Generates accuracy and loss plots, and a confusion matrix.
- Exports the best model for use in the backend.

### 2. Bat Detection (YOLOv8-OBB)
Use `train_yolov8.py` and `data.yaml` to train an Oriented Bounding Box model on the Roboflow Cricket Bat Dataset.
- Run `python train_yolov8.py --epochs 100` to train locally.
- Automatically handles data augmentation, validation, and ONNX export.

## 📁 Repository Structure
- `run_coach.py` - Main orchestration script to launch both servers.
- `coach_backend.py` - FastAPI WebSocket server handling live MediaPipe and VideoMAE inference.
- `cricket-coach-ui/` - Next.js frontend displaying the dashboard.
- `cricket_shot_classifier_colab.py` - End-to-end training script for the VideoMAE classifier.
- `train_yolov8.py` & `data.yaml` - Scripts to train the YOLOv8-OBB bat tracking model.
- `*.pt` - Pre-trained YOLOv8 weights (e.g., `yolov8s-obb.pt`).
