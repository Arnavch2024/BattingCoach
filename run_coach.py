import subprocess
import time
import sys
import os
from pathlib import Path

def run_coach():
    app_dir = Path(__file__).parent / "cricket-coach-ui"
    backend_script = "coach_backend.py"

    print("🚀 Starting AI Cricket Coach...")
    
    # 1. Start Backend
    print("📥 Launching Backend (FastAPI)...")
    backend_proc = subprocess.Popen([sys.executable, backend_script], 
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.STDOUT,
                                     text=True)
    
    # 2. Start Frontend
    print("🎨 Launching Frontend (Next.js)...")
    frontend_proc = subprocess.Popen(["npm", "run", "dev"], 
                                      cwd=str(app_dir),
                                      shell=True)

    print("\n✅ Both services are starting!")
    print("👉 Backend: http://127.0.0.1:8888")
    print("👉 Frontend: http://localhost:3000")
    print("\nPress Ctrl+C to stop both services.\n")

    try:
        while True:
            # Optionally print backend lines to see errors
            # line = backend_proc.stdout.readline()
            # if line: print(f"[Backend] {line.strip()}")
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping AI Cricket Coach...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("👋 Done.")

if __name__ == "__main__":
    run_coach()
