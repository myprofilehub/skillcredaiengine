import uvicorn, torch, base64, time, os, gc, uuid
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import socket
import threading
import warnings

warnings.filterwarnings("ignore")
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

from dotenv import load_dotenv
load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    print("⚠️  WARNING: HF_TOKEN not found in .env file!")
else:
    print(f"✅ HF_TOKEN loaded (starts with {HF_TOKEN[:8]}...)")

torch.backends.cudnn.benchmark = True
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

from diffusers import HunyuanVideo15Pipeline
from diffusers.utils import export_to_video
from transformers import AutoProcessor, BarkModel
import scipy.io.wavfile
import io

app = FastAPI(title="HunyuanVideo 1.5 Video API", version="6.0")

num_gpus = torch.cuda.device_count()

def print_gpu_status():
    for i in range(num_gpus):
        alloc = torch.cuda.memory_allocated(i) / (1024**3)
        reserved = torch.cuda.memory_reserved(i) / (1024**3)
        total = torch.cuda.get_device_properties(i).total_memory / (1024**3)
        print(f"   GPU:{i} — Allocated: {alloc:.1f} GB | Reserved: {reserved:.1f} GB | Free: {total-alloc:.1f} GB")

# ══════════════════════════════════════════════════════════════════════════════
# MODEL LOADING — Suno Bark TTS (Small)
# ~1.5GB Model, ultra-fast generation of highly realistic voice.
# ══════════════════════════════════════════════════════════════════════════════

print(f"\n⏳ Loading Suno Bark TTS...")
bark_processor = AutoProcessor.from_pretrained("suno/bark-small")
# Load in native fp32 instead of fp16. scipy.io.wavfile crashes if the numpy array is float16!
bark_model = BarkModel.from_pretrained("suno/bark-small").to("cuda:0")
print(f"✅ Suno Bark TTS loaded on GPU 0!")

# ══════════════════════════════════════════════════════════════════════════════
# MODEL LOADING — HunyuanVideo 1.5 (8.3B params, ~17GB in bf16)
#
# Fits easily on a single A100 80GB with ~60GB free for inference.
# No CPU offloading needed = maximum speed.
# ══════════════════════════════════════════════════════════════════════════════

print(f"\n⏳ Loading HunyuanVideo 1.5 (480p T2V)...")
print(f"   Detected {num_gpus} GPU(s)")

model_id = "hunyuanvideo-community/HunyuanVideo-1.5-Diffusers-480p_t2v"

pipe = HunyuanVideo15Pipeline.from_pretrained(
    model_id,
    torch_dtype=torch.bfloat16,
    token=HF_TOKEN
)
# Send exactly to GPU 0 to prevent PCIe transfer bottlenecks
pipe.to("cuda:0")

# 🔥 CRITICAL: Must use slicing and tiling, otherwise decoding 81 frames takes 150GB+ VRAM and silently kills the thread!
pipe.vae.enable_tiling()
pipe.vae.enable_slicing()

torch.cuda.empty_cache()
gc.collect()

print(f"\n✅ HunyuanVideo 1.5 loaded!")
print(f"   Pipeline components:")
for name, component in pipe.components.items():
    if hasattr(component, 'parameters'):
        try:
            total = sum(p.nelement() * p.element_size() for p in component.parameters())
            device = next(component.parameters()).device
            dtype = next(component.parameters()).dtype
            print(f"     {name}: {total/(1024**3):.2f} GB on {device} ({dtype})")
        except StopIteration:
            print(f"     {name}: no parameters")
    else:
        print(f"     {name}: {type(component).__name__}")

print()
print_gpu_status()

gpu0_free = (torch.cuda.get_device_properties(0).total_memory - torch.cuda.memory_allocated(0)) / (1024**3)
print(f"\n   ⚡ GPU:0 has {gpu0_free:.1f} GB free for inference — should be very fast!")

# ── API Schema (same contract as Wan 2.2 server) ────────────────────────────

class VideoRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "16:9"
    quality: str = "balanced"
    negative_prompt: Optional[str] = "worst quality, blurry, low resolution, distorted, noise, artifacts"
    num_frames: Optional[int] = 49

class TTSRequest(BaseModel):
    text: str

generation_lock = threading.Lock()
jobs = {}
jobs_lock = threading.Lock()
STALE_JOB_SECONDS = 300

def cleanup_stale_jobs():
    now = time.time()
    with jobs_lock:
        stale_ids = [
            jid for jid, jdata in jobs.items()
            if jdata["status"] in ("completed", "failed")
            and now - jdata.get("finished_at", now) > STALE_JOB_SECONDS
        ]
        for jid in stale_ids:
            del jobs[jid]
    if stale_ids:
        gc.collect()
        print(f"🧹 Auto-cleaned {len(stale_ids)} stale job(s)")

def periodic_cleanup():
    while True:
        time.sleep(60)
        cleanup_stale_jobs()

threading.Thread(target=periodic_cleanup, daemon=True).start()

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
@app.get("/health")
def health():
    with jobs_lock:
        active = sum(1 for j in jobs.values() if j["status"] in ("pending", "running"))
    return {
        "status": "online",
        "model": "HunyuanVideo-1.5-480p-T2V",
        "version": "6.0",
        "gpus": num_gpus,
        "active_jobs": active,
        "gpu0_vram_gb": round(torch.cuda.memory_allocated(0) / (1024**3), 2),
    }

@app.post("/tts")
def generate_tts(req: TTSRequest):
    try:
        t0 = time.time()
        inputs = bark_processor(req.text, return_tensors="pt").to("cuda:0")
        
        with torch.inference_mode():
            # Stripped the deprecated waveform tensors so the modern
            # transformers library can execute native default generation smoothly!
            audio_array = bark_model.generate(**inputs, pad_token_id=10000)
            
        # VITAL: Force the tensor back to float32 before numpy conversion because scipy CANNOT encode float16!
        audio_array = audio_array.to(torch.float32).cpu().numpy().squeeze()
        sample_rate = bark_model.generation_config.sample_rate
        
        # Save directly to an in-memory byte buffer
        byte_io = io.BytesIO()
        scipy.io.wavfile.write(byte_io, sample_rate, audio_array)
        audio_b64 = base64.b64encode(byte_io.getvalue()).decode("utf-8")
        
        elapsed = round(time.time() - t0, 2)
        print(f"🎤 Bark TTS generated {len(req.text)} chars in {elapsed}s")
        
        return {"success": True, "audio_base64": audio_b64, "sample_rate": sample_rate}
    except Exception as e:
        print(f"❌ Bark Error: {e}")
        return {"success": False, "error": str(e)}


def generate_worker(job_id: str, req: VideoRequest):
    with jobs_lock:
        jobs[job_id]["status"] = "running"
    print(f"\n🎬 Job [{job_id[:8]}]: {req.prompt[:80]}...")
    total_start = time.time()

    with generation_lock:
        try:
            torch.cuda.synchronize()
            torch.cuda.empty_cache()
            gc.collect()

            # Map quality to inference steps
            # HunyuanVideo 1.5 recommended: 50 steps for best quality
            # But 30 steps gives good results much faster
            steps_map = {"fast": 20, "balanced": 30, "high": 50}
            num_steps = steps_map.get(req.quality, 30)

            # Map aspect ratio to resolution (480p variants)
            # HunyuanVideo 1.5 480p optimal resolutions
            if req.aspect_ratio == "9:16":
                width, height = 480, 848
            elif req.aspect_ratio == "1:1":
                width, height = 640, 640
            else:  # 16:9 default
                width, height = 848, 480

            # HunyuanVideo uses 24fps, frame count must be 4n+1
            # Snap num_frames to nearest valid value
            num_frames = min(req.num_frames, 81) # 🔥 Hard limit ~3 secs of video to drop render times to 8 minutes!
            if (num_frames - 1) % 4 != 0:
                num_frames = ((num_frames - 1) // 4) * 4 + 1
                print(f"   Adjusted num_frames to {num_frames} (must be 4n+1 for HunyuanVideo)")

            gpu0_pre = torch.cuda.memory_allocated(0) / (1024**3)
            print(f"   Config: {width}x{height} | {num_frames} frames @ 24fps | {num_steps} steps")
            print(f"   GPU:0 pre: {gpu0_pre:.1f} GB")

            # ── PHASE 1: Diffusion ───────────────────────────────────────
            t1 = time.time()
            with torch.inference_mode():
                output = pipe(
                    prompt=req.prompt,
                    num_frames=num_frames,
                    num_inference_steps=num_steps,
                    height=height,
                    width=width,
                )
            torch.cuda.synchronize()
            diffusion_time = round(time.time() - t1, 1)
            print(f"   ⏱️  Diffusion:   {diffusion_time}s")

            # ── PHASE 2: Export video ────────────────────────────────────
            t2 = time.time()
            out_path = f"/tmp/hunyuan_scene_{job_id}.mp4"
            export_to_video(output.frames[0], out_path, fps=24)
            torch.cuda.synchronize()
            export_time = round(time.time() - t2, 1)
            print(f"   ⏱️  VAE+Export:  {export_time}s")

            del output
            torch.cuda.empty_cache()
            gc.collect()

            # ── PHASE 3: Base64 encode ───────────────────────────────────
            t3 = time.time()
            with open(out_path, "rb") as f:
                video_b64 = base64.b64encode(f.read()).decode("utf-8")
            os.remove(out_path)
            encode_time = round(time.time() - t3, 1)

            total_time = round(time.time() - total_start, 1)

            print(f"   ⏱️  Encode:      {encode_time}s")
            print(f"   ✅ TOTAL: {total_time}s  (diffusion={diffusion_time}s + vae={export_time}s + encode={encode_time}s)")
            print_gpu_status()

            with jobs_lock:
                jobs[job_id]["status"] = "completed"
                jobs[job_id]["video_base64"] = video_b64
                jobs[job_id]["message"] = (
                    f"Generated in {total_time}s "
                    f"(diffusion={diffusion_time}s, vae+export={export_time}s)"
                )
                jobs[job_id]["finished_at"] = time.time()

            del video_b64
            gc.collect()

        except Exception as e:
            print(f"❌ Job [{job_id[:8]}] Error: {e}")
            with jobs_lock:
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["error"] = str(e)
                jobs[job_id]["finished_at"] = time.time()
            torch.cuda.empty_cache()
            gc.collect()


@app.post("/generate")
def generate_video_endpoint(req: VideoRequest):
    job_id = str(uuid.uuid4())
    with jobs_lock:
        jobs[job_id] = {
            "status": "pending",
            "video_base64": None,
            "error": None,
            "message": None,
            "finished_at": None,
        }
    threading.Thread(target=generate_worker, args=(job_id, req), daemon=True).start()
    return {
        "success": True,
        "job_id": job_id,
        "status": "pending",
        "message": "Generation started in background",
    }


@app.get("/status/{job_id}")
def check_status(job_id: str):
    with jobs_lock:
        if job_id not in jobs:
            return {"success": False, "error": "Job not found"}
        job = jobs[job_id]
        response = {
            "success": True,
            "status": job["status"],
            "video_base64": job.get("video_base64"),
            "error": job.get("error"),
            "message": job.get("message"),
        }
        if job["status"] in ("completed", "failed"):
            del jobs[job_id]
            gc.collect()
    return response


@app.post("/reset")
def reset_memory():
    global jobs
    with jobs_lock:
        jobs = {}
    for i in range(num_gpus):
        torch.cuda.synchronize(i)
        with torch.cuda.device(i):
            torch.cuda.empty_cache()
    gc.collect()
    return {"status": "memory cleared", "gpus": num_gpus}


@app.get("/debug/memory")
def debug_memory():
    gpu_info = []
    for i in range(num_gpus):
        allocated = torch.cuda.memory_allocated(i) / (1024**3)
        reserved = torch.cuda.memory_reserved(i) / (1024**3)
        total = torch.cuda.get_device_properties(i).total_memory / (1024**3)
        gpu_info.append({
            "gpu": i,
            "allocated_gb": round(allocated, 2),
            "reserved_gb": round(reserved, 2),
            "total_gb": round(total, 2),
            "free_gb": round(total - allocated, 2),
        })
    with jobs_lock:
        job_count = len(jobs)
        completed_holding = sum(1 for j in jobs.values() if j["status"] == "completed")
    return {
        "gpus": gpu_info,
        "jobs_in_memory": job_count,
        "completed_jobs_holding_video": completed_holding,
    }


if __name__ == "__main__":
    port = 7860
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        ip = "0.0.0.0"
    print(f"\n{'='*60}")
    print(f"🚀 HUNYUANVIDEO 1.5 API  v6.0")
    print(f"   Model:    HunyuanVideo-1.5-480p-T2V (8.3B params)")
    print(f"   GPUs:     {num_gpus}")
    print(f"   FPS:      24")
    print(f"   Network:  http://{ip}:{port}")
    print(f"   Health:   http://{ip}:{port}/health")
    print(f"   Debug:    http://{ip}:{port}/debug/memory")
    print(f"   Reset:    POST http://{ip}:{port}/reset")
    print(f"\n👉 .env file:")
    print(f"   HF_TOKEN=hf_your_token_here")
    print(f'   KAGGLE_VIDEO_ENDPOINT="http://{ip}:{port}"')
    print(f"{'='*60}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)