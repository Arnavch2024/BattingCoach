import os
import uvicorn
from coach_backend import app

# Hugging Face Spaces & Cloud Entrypoint
if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    print(f"🚀 Starting BatCoach AI Backend on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
