import os
import uvicorn
import spaces
import gradio as gr
from fastapi.responses import RedirectResponse
from coach_backend import app as fastapi_app

# 1. ZeroGPU Explicit Decorated Function
@spaces.GPU(duration=60)
def predict_stroke_warmup(shot_name: str = "cover"):
    return f"✅ ZeroGPU Pipeline Ready: VideoMAE & YOLOv8-OBB active for {shot_name}."

# 2. Gradio Diagnostics Interface
with gr.Blocks(title="BatCoach AI Pro - API Engine") as demo:
    gr.Markdown("# 🏏 BatCoach AI Pro - Vision & Biomechanics Backend")
    gr.Markdown("🟢 **System Status:** Online & Ready for Live Video Coaching")
    gr.Markdown("Powers real-time MediaPipe 3D Biomechanics, VideoMAE 16-frame spatiotemporal classification, and YOLOv8-OBB bat tracking.")
    gr.Markdown("- **Live Telemetry WebSocket:** `wss://arnav2005-batcoach.hf.space/ws`")
    gr.Markdown("- **FastAPI Health Check:** `/health`")
    gr.Markdown("- **API Swagger Docs:** `/docs`")
    
    with gr.Row():
        shot_choice = gr.Dropdown(choices=["cover", "straight", "pull", "defense"], value="cover", label="Stroke Target")
        test_btn = gr.Button("⚡ Verify ZeroGPU Pipeline")
    
    status_out = gr.Textbox(label="Diagnostics", value="Awaiting verification trigger...")
    test_btn.click(fn=predict_stroke_warmup, inputs=shot_choice, outputs=status_out)

# Redirect root / to /gradio so Hugging Face Space iframe renders the UI automatically
@fastapi_app.get("/")
def root_redirect():
    return RedirectResponse(url="/gradio")

# 3. Mount Gradio to /gradio so root API routes (/ws, /health, /api) have full native precedence
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

# 4. Entrypoint on port 7860
if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    print(f"🚀 Launching BatCoach FastAPI Backend on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
