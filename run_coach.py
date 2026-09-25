import subprocess
import time
import sys
import os
import signal
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Ensure Datadog APM environment defaults
os.environ.setdefault("DD_SITE", "us5.datadoghq.com")
os.environ.setdefault("DD_SERVICE", "batcoach-backend")
os.environ.setdefault("DD_ENV", "development")

def kill_proc_tree(proc):
    """Cleanly terminates a process and all its children across platforms."""
    if proc is None:
        return
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                capture_output=True,
                check=False
            )
        else:
            proc.terminate()
            proc.wait(timeout=3)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass

def cleanup_stale_ports(ports=(3000, 8888)):
    """Frees up development ports if previous runs were forcefully closed."""
    if sys.platform == "win32":
        for port in ports:
            try:
                out = subprocess.check_output(
                    f"netstat -ano | findstr :{port}",
                    shell=True,
                    stderr=subprocess.DEVNULL
                ).decode()
                for line in out.strip().splitlines():
                    parts = line.strip().split()
                    if len(parts) >= 5 and "LISTENING" in parts:
                        pid = parts[-1]
                        if pid != "0":
                            subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True, check=False)
            except Exception:
                pass

def run_coach():
    current_dir = Path(__file__).parent
    
    # If run from inside cricket-coach-ui, backend is in parent
    if (current_dir / "coach_backend.py").exists():
        backend_script = str(current_dir / "coach_backend.py")
        app_dir = current_dir / "cricket-coach-ui"
    else:
        backend_script = str(current_dir.parent / "coach_backend.py")
        app_dir = current_dir

    print("🚀 Initializing AI Cricket Coach (BatCoach Pro)...")
    print("🧹 Cleaning up stale background processes...")
    cleanup_stale_ports((3000, 8888))
    
    backend_proc = None
    frontend_proc = None

    try:
        # 1. Start Backend
        print(f"📥 Launching Backend: {backend_script}")
        backend_proc = subprocess.Popen([sys.executable, backend_script])
        
        # 2. Start Frontend
        print(f"🎨 Launching Frontend: {app_dir}")
        frontend_proc = subprocess.Popen(
            ["npm", "run", "dev"], 
            cwd=str(app_dir),
            shell=True
        )

        print("\n✅ Services started successfully!")
        print("👉 Backend:  http://127.0.0.1:8888")
        print("👉 Frontend: http://localhost:3000")
        print("\nPress Ctrl+C in this terminal to gracefully stop both services.\n")

        while True:
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n🛑 Stopping AI Cricket Coach and terminating process trees...")
    finally:
        kill_proc_tree(backend_proc)
        kill_proc_tree(frontend_proc)
        print("👋 All processes stopped cleanly.")

if __name__ == "__main__":
    run_coach()
