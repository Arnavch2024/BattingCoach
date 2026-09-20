import os
import uvicorn

# Hugging Face Spaces ZeroGPU startup verification hook
try:
    import spaces
    @spaces.GPU(duration=10)
    def _zero_gpu_startup_check():
        return True
except (ImportError, Exception):
    pass

from coach_backend import app

# If Gradio is installed (standard on Hugging Face Gradio Spaces), mount a live status UI
try:
    import gradio as gr
    with gr.Blocks(title="BatCoach AI Pro - API Engine") as demo:
        gr.Markdown("# 🏏 BatCoach AI Pro - Vision & Biomechanics Backend")
        gr.Markdown("🟢 **System Status:** Online & Ready for Live Video Coaching")
        gr.Markdown("This Hugging Face Space powers the real-time AI pipeline (MediaPipe 3D World Landmarks, VideoMAE 16-frame spatiotemporal classification, and YOLOv8-OBB bat orientation) for BatCoach AI Pro.")
        gr.Markdown("- **Live Telemetry WebSocket:** `wss://<space-host>/ws`")
        gr.Markdown("- **API Swagger Docs:** `/docs`")

    app_to_run = gr.mount_gradio_app(app, demo, path="/")
except Exception as e:
    app_to_run = app

# Hugging Face Spaces Entrypoint (Port 7860)
if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    print(f"🚀 Starting BatCoach AI Backend on port {port}...")
    uvicorn.run(app_to_run, host="0.0.0.0", port=port)
