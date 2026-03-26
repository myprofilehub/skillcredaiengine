```python
# ==============================================================================
# 🚀 NATIVE HUNYUAN-VIDEO DUAL-GPU (2x H100) ORCHESTRATOR
# ==============================================================================
# OPTIMIZED FOR: Tencent/HunyuanVideo via HuggingFace Diffusers
# HARDWARE: 2x H100 Hopper (160GB VRAM Total, FP8/BF16 optimized)
#
# MANDATORY INSTALLATION ON JARVISLABS BEFORE RUNNING:
# (You NO LONGER need to clone the official Hunyuan repo. We use standard diffusers.)
# 
# 1. pip install fastapi uvicorn edge-tts huggingface-hub sentencepiece imageio[ffmpeg]
# 2. pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
# 3. pip install git+https://github.com/huggingface/diffusers.git
# 4. pip install transformers accelerate protobuf flash-attn --no-build-isolation
#
# LAUNCH COMMAND:
# python dual_hunyuan_engine.py
# ==============================================================================

import os, time, uuid, json, asyncio, subprocess, threading, base64, math
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from huggingface_hub import AsyncInferenceClient

app = FastAPI()

hf_token = os.getenv("HUGGINGFACE_API_KEY")
hf_client = AsyncInferenceClient(token=hf_token)

jobs = {}

class GenerateRequest(BaseModel):
    topic: str
    style: str = "Cinematic and professional"
    num_scenes: int = 12 # 60 seconds / 5s per scene

# ---------------------------------------------------------
# SCRIPT GENERATION (QWEN)
# ---------------------------------------------------------
async def generate_script(topic: str, style: str, num_scenes: int) -> list:
    print(f"Generating Script for {num_scenes} scenes...")
    prompt = f"""You are a professional cinematic storyteller. 
Topic: "{topic}". Style: {style}.
Mission: "SkillCred (skillcred.in) — Learn. Build. Verify. Get Hired."

TASK: Write a FLUID, CONTINUOUS 60-second monologue.
CRITICAL: Do NOT write isolated slogans for each scene. Every scene's narration MUST be a continuation of the previous thought. Sentences MUST bridge across 2-3 scenes (Enjambment).

FORMAT:
Return ONLY a JSON array of {num_scenes} objects. NO MARKDOWN.
Example:
[
  {{"visual": "Close-up of motherboard (NO TEXT).", "narration": "In the depth of the stack,"}},
  {{"visual": "Dolly shot of server racks.", "narration": "where every line of code matters,"}}
]

STORYTELLING RULES:
1. MONOLOGUE: The entire script read together MUST form one natural, professional technical paragraph.
2. BRIDGING: Use sentence fragments to link scenes seamlessly.
3. PACING: ~4-8 words per scene. 5 seconds per scene.
4. NO GIBBERISH: STRICTLY NO text, logos, or UI on screen in visual prompts.
5. SYLLABUS: Naturally weave in SkillCred's official tracks (AI & ML, Cloud, Cybersecurity, etc.) and the 4-week/8-week patterns.
6. Output: Exactly {num_scenes} objects (12 objects x 5s = 60s total).
"""
    print(f"📡 Requesting script from Llama-3.3-70B for {num_scenes} scenes...")
    try:
        res = await hf_client.chat_completion(
            model="meta-llama/Llama-3.3-70B-Instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4000
        )
        content = res.choices[0].message.content
        print(f"📥 Received AI response ({len(content)} chars).")
        
        # Robust JSON extraction
        raw = content.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
            
        print(f"🧩 Parsing JSON content...")
        return json.loads(raw)
    except Exception as e:
        print(f"❌ Script Generation Error: {e}")
        if 'content' in locals():
            print(f"DEBUG RAW CONTENT: {content[:500]}...")
        raise e

# ---------------------------------------------------------
# ASYNC AUDIO GENERATION (EDGE-TTS ON CPU)
# ---------------------------------------------------------
async def generate_audio(text: str, base_dir: str):
    out_path = os.path.join(base_dir, "master_audio.mp3")
    cmd = ["edge-tts", "--text", text, "--write-media", out_path]
    proc = await asyncio.create_subprocess_exec(*cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await proc.communicate()
    return out_path

def get_audio_duration(path: str) -> float:
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path]
    try:
        out = subprocess.check_output(cmd).decode("utf-8").strip()
        return float(out)
    except:
        return 2.5 # Fallback

# ---------------------------------------------------------
# AUTO-GENERATED GPU WORKER (RUNS ON EACH H100)
# ---------------------------------------------------------
# We dynamically create this worker to load the 8.3B natively ONLY ONCE per GPU.
# OPTIMIZATIONS FOR 2x H100:
# 1. bfloat16 precision native to Hopper architecture.
# 2. No CPU offloading (H100 has 80GB, removing offloading speeds up generation by 40%).
# 3. FlashAttention enabled implicitly via Diffusers.
WORKER_CODE = """
import sys, json, os, torch
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

from diffusers import DiffusionPipeline
from diffusers.utils import export_to_video

def main():
    if len(sys.argv) < 3:
        print("Usage: python worker.py <prompts_json> <out_dir>")
        sys.exit(1)
        
    prompts_file = sys.argv[1]
    out_dir = sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    
    with open(prompts_file, "r") as f:
        scenes = json.load(f)
        
    gpu_name = torch.cuda.get_device_name()
    print(f"Loading HunyuanVideo-1.5 (8.3B) on {gpu_name}...")
    
    # Switched to 480p to bypass the massive 21.6s/it quadratic scaling bottleneck
    model_id = "hunyuanvideo-community/HunyuanVideo-1.5-Diffusers-480p_t2v"
    
    # Use DiffusionPipeline so it auto-resolves the HunyuanVideo15Pipeline architecture
    pipe = DiffusionPipeline.from_pretrained(
        model_id, torch_dtype=torch.bfloat16
    )
    
    # H100 Optimization: No cpu-sequential-offload needed, we load entirely to VRAM!
    pipe.to("cuda")
    
    # Enable VAE tiling to prevent tensor memory fragmentation during output decoding
    pipe.vae.enable_tiling()
    
    print(f"Model loaded. Processing {len(scenes)} scenes natively on VRAM...")
    
    for idx, scene in enumerate(scenes):
        prompt = scene["prompt"]
        local_idx = scene["local_idx"]
        out_path = os.path.join(out_dir, f"sample_{local_idx:04d}.mp4")
        
        print(f"GPU Generating scene {local_idx}: {prompt}")
        
        # 480p Resolution Setup for HunyuanVideo (Bypasses O(N^2) token generation lockup)
        # 49 frames = ~2.04 seconds of video at 24 FPS
        video_tensor = pipe(
            prompt=prompt,
            num_frames=121, 
            height=480,
            width=848,
            num_inference_steps=25, # 25 steps is optimal for HunyuanVideo quality vs speed
        ).frames[0]
        
        export_to_video(video_tensor, out_path, fps=24)
        print(f"Saved {out_path} on {gpu_name}")

if __name__ == "__main__":
    main()
"""

# ---------------------------------------------------------
# MASTER PIPELINE ORCHESTRATOR
# ---------------------------------------------------------
def run_pipeline(job_id: str, req: GenerateRequest):
    jobs[job_id]["status"] = "running"
    base_dir = f"/tmp/job_{job_id}"
    os.makedirs(base_dir, exist_ok=True)
    
    # Drop the worker script to disk to be executed concurrently by sub-processes
    with open("hunyuan_worker.py", "w", encoding="utf-8") as f:
        f.write(WORKER_CODE.strip())
        
    try:
        t0 = time.time()
        
        # 1. GENERATE SCRIPT
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        scenes = loop.run_until_complete(generate_script(req.topic, req.style, req.num_scenes))
        print(f"✅ Script Generated in {round(time.time() - t0, 1)}s")
        
        # 2. GENERATE MASTER AUDIO (Single 60s Monologue)
        t1 = time.time()
        master_text = " ".join([s["narration"] for s in scenes])
        master_audio_path = loop.run_until_complete(generate_audio(master_text, base_dir))
        print(f"✅ Master Audio Generated in {round(time.time() - t1, 1)}s")
        
        # 3. HUNYUAN-VIDEO DUAL-GPU PARALLEL DISTRIBUTION
        num_gpus = 2
        chunk_size = math.ceil(len(scenes) / num_gpus)
        
        prompt_paths = []
        out_dirs = []
        
        for i in range(num_gpus):
            p_path = os.path.join(base_dir, f"prompts_{i}.json")
            o_dir = os.path.join(base_dir, f"out_{i}")
            prompt_paths.append(p_path)
            out_dirs.append(o_dir)
            
            start_idx = i * chunk_size
            end_idx = min(start_idx + chunk_size, len(scenes))
            
            chunk_data = []
            for j in range(start_idx, end_idx):
                chunk_data.append({
                    "local_idx": j % chunk_size,
                    "prompt": scenes[j]["visual"].replace('\n', ' ')
                })
                
            with open(p_path, "w", encoding="utf-8") as f:
                json.dump(chunk_data, f)

        cmds = []
        for i in range(num_gpus):
            cmd = ["python", "hunyuan_worker.py", prompt_paths[i], out_dirs[i]]
            cmds.append(cmd)

        print(f"🚀 Spawning HunyuanVideo Engine on 2x H100s Concurrently...")
        t2 = time.time()

        procs = []
        for i in range(num_gpus):
            env = os.environ.copy()
            env["CUDA_VISIBLE_DEVICES"] = str(i) # Bind process to a specific H100
            
            # Pipe output to None but let stderr stream directly to console so you can see generation progress
            proc = subprocess.Popen(cmds[i], env=env, stdout=subprocess.DEVNULL)
            procs.append(proc)
        
        # Wait for all GPUs to finish generating their chunks
        for i, proc in enumerate(procs):
            proc.wait()
            if proc.returncode != 0:
                print(f"❌ HUNYUAN GPU {i} CRASHED!")
                raise Exception(f"HunyuanVideo Generation Failed on GPU {i}")
        
        print(f"✅ HunyuanVideo 1.5 Dual-GPU Generation Completed in {round(time.time() - t2, 1)}s")

        video_paths = []
        for scene_idx in range(len(scenes)):
            gpu_idx = scene_idx // chunk_size
            local_idx = scene_idx % chunk_size
            vid = os.path.join(out_dirs[gpu_idx], f"sample_{local_idx:04d}.mp4")
            
            if not os.path.exists(vid):
                raise Exception(f"Video missing: GPU {gpu_idx} failed to generate scene {scene_idx}!")
            video_paths.append(vid)

        # 4. CONCATENATE SILENT VIDEO TIMELINE
        t3 = time.time()
        concat_txt = os.path.join(base_dir, "concat.txt")
        with open(concat_txt, "w") as f:
            for p in video_paths:
                f.write(f"file '{p}'\n")
        
        silent_video = os.path.join(base_dir, "silent_full.mp4")
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c", "copy", silent_video], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 5. OVERLAY MASTER AUDIO
        final_out = os.path.join(base_dir, "final_video.mp4")
        # Map audio from mp3 and video from silent_full. Add subtle fade out
        cmd = [
            "ffmpeg", "-y", "-i", silent_video, "-i", master_audio_path,
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", final_out
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print(f"✅ Final Audio-Video Overlay Completed in {round(time.time() - t3, 1)}s")
        
        with open(final_out, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
            
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["video_base64"] = b64
        jobs[job_id]["time"] = round(time.time() - t0, 1)
        print(f"🎉 MASTER DUAL-GPU PIPELINE COMPLETED IN {jobs[job_id]['time']} seconds!")
        
    except Exception as e:
        print(f"❌ Pipeline Error: {e}")
        jobs[job_id] = {"status": "failed", "error": str(e)}

# ---------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------
@app.post("/generate_full_video")
def generate_endpoint(req: GenerateRequest):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending"}
    threading.Thread(target=run_pipeline, args=(job_id, req), daemon=True).start()
    return {"success": True, "job_id": job_id}

@app.get("/status/{job_id}")
def status_endpoint(job_id: str):
    res = jobs.get(job_id, {"status": "failed", "error": "Job not found"})
    if res["status"] in ["completed", "failed"]:
        jobs.pop(job_id, None)
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
```
