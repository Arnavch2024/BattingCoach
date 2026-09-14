import subprocess
import time
import sys
import os
from pathlib import Path

def run_coach():
    current_dir = Path(__file__).parent
    
    # If run from inside cricket-coach-ui, backend is in parent
    if (current_dir / "coach_backend.py").exists():
        backend_script = str(current_dir / "coach_backend.py")
        app_dir = current_dir / "cricket-coach-ui"
    else:
        backend_script = str(current_dir.parent / "coach_backend.py")
        app_dir = current_dir

    print("🚀 Starting AI Cricket Coach (BatCoach Pro)...")
    
    # 1. Start Backend
    print(f"📥 Launching Backend: {backend_script}")
    backend_proc = subprocess.Popen([sys.executable, backend_script])
    
    # 2. Start Frontend
    print(f"🎨 Launching Frontend: {app_dir}")
    frontend_proc = subprocess.Popen(["npm", "run", "dev"], 
                                      cwd=str(app_dir),
                                      shell=True)

    print("\n✅ Services started!")
    print("👉 Backend:  http://127.0.0.1:8888")
    print("👉 Frontend: http://localhost:3000")
    print("\nPress Ctrl+C in this terminal to stop both services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping AI Cricket Coach...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("👋 Done.")

if __name__ == "__main__":
    run_coach()
