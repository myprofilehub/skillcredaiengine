# JarvisLabs Dual-GPU (2x H100) Deployment Guide

This guide covers provisioning the HW, installing native dependencies, running a 1-scene dry run isolated test, and finally deploying the main FastAPI server.

## Step 1: Provision the Server
1. Log into your JarvisLabs account.
2. Select **PyTorch** as your base image (preferably PyTorch 2.x / CUDA 12).
3. Select **H100 PCIe (80 GB)** and adjust the GPU slider to **2**.
4. Increase the Storage slider to **at least 150 GB** (the model downloads are massive).
5. Launch the instance and open the JupyterLab Terminal securely.

## Step 2: Install Pipeline Dependencies
Run the following commands in the terminal sequentially to prepare the engine limits:
```bash
# 1. Update OS packages and install ffmpeg (required for edge-tts and video stitching)
apt update && apt install -y ffmpeg

# 2. Install the exact Python packages required by the engine components
pip install fastapi uvicorn edge-tts huggingface-hub sentencepiece imageio[ffmpeg]
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install git+https://github.com/huggingface/diffusers.git
pip install transformers accelerate protobuf flash-attn --no-build-isolation --no-cache-dir
```

## Step 3: Run the Dry-Run Test (1 Scene)
Before launching the massive API server, let's run a standalone Python script to force the server to download the models into cache, test the hardware limits, and produce exactly 1 video without relying on Qwen or FFmpeg audio stitching.

1. On JarvisLabs, create a new file named `dry_run.py` and paste the following Python code into it:

```python
import torch
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

from diffusers import DiffusionPipeline
from diffusers.utils import export_to_video

print("Loading HunyuanVideo-1.5 (8.3B)... This will trigger a massive 30GB+ download the first time!")

# Switched to 480p to prevent 15-minute 21.6s/it quadratic attention lockup
model_id = "hunyuanvideo-community/HunyuanVideo-1.5-Diffusers-480p_t2v"

# Use DiffusionPipeline so it auto-resolves the HunyuanVideo15Pipeline architecture
pipe = DiffusionPipeline.from_pretrained(
    model_id, torch_dtype=torch.bfloat16
)
pipe.to("cuda")
pipe.vae.enable_tiling()

prompt = "A cinematic tracking shot of a glowing futuristic sports car driving through a cyberpunk city street at night."
print(f"\\n✅ Models Loaded! Generating 121-frame (5 seconds) video for:\\n'{prompt}'")

# Generate 480p limits to bypass O(N^2) token count bottlenecks
video = pipe(
    prompt=prompt,
    num_frames=121,  # 121 frames exactly aligns with the 4k + 1 VAE rule for 5.04 seconds!
    height=480,
    width=848,
    num_inference_steps=40,
).frames[0]

export_to_video(video, "test_output.mp4", fps=24)
print("\\n🎉 SUCCESS! File saved as test_output.mp4")
```

2. Start the dry run test using the command:
```bash
python dry_run.py
```
*(Note: Because no models are offline, the very first time you execute this, it will hang for 5+ minutes while the HuggingFace backend pulls gigabytes of model weight checkpoints layers onto the server disk. Do not cancel the terminal. Subsequent runs will boot up in seconds!)*


## Step 4: Launch the Full Orchestrator (30 Scenes)
Once `test_output.mp4` successfully appears, it proves your GPU and library packages are perfectly communicating.
1. Upload the `parallel_video_engine.md` Python code to JarvisLabs as a file named `dual_engine.py`.
2. Start the FastAPI orchestrator so it listens permanently:
```bash
uvicorn dual_engine:app --host 0.0.0.0 --port 7860
```
3. Expose the port over the Jarvis API UI and begin testing your 30-scene Next.js API calls against it!
