"use client";

import { motion } from "framer-motion";
import { Video, Loader2, Play, Film, Type, Download, Check, AlertCircle, Sparkles, Wrench } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type PipelineMode = "veo" | "programmatic";

interface ScriptData {
  title: string;
  hook: string;
  scenes: { visual: string; narration: string; subtitle?: string }[];
}

export default function VideoEnginePage() {
  const [topic, setTopic] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [style, setStyle] = useState("Fast-paced & High Energy");
  const [pipeline, setPipeline] = useState<PipelineMode>("programmatic");
  const [aspectRatio, setAspectRatio] = useState("16:9");

  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);

  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  async function handleGenerateScript() {
    if (!topic) return;
    setScriptLoading(true);
    setScriptData(null);
    setVideoUrl(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("topic", topic);
      formData.append("style", style);
      if (pdfFile) {
        formData.append("pdf", pdfFile);
      }

      const res = await fetch("/ai-engine/api/generate/video", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setScriptData(data.scriptData);
      } else {
        setError(data.error || "Script generation failed.");
      }
    } catch {
      setError("Failed to connect to AI server.");
    } finally {
      setScriptLoading(false);
    }
  }

  async function handleGenerateVideo() {
    if (!scriptData) return;
    setVideoLoading(true);
    setVideoUrl(null);
    setError("");

    await handleProgrammaticGeneration();
  }

  // ━━━━━━━━━━ PROGRAMMATIC PIPELINE ━━━━━━━━━━
  async function handleProgrammaticGeneration() {
    try {
      setStatusMessage("Generating images for each scene...");

      const res = await fetch("/ai-engine/api/generate/video-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, style, scenes: scriptData })
      });
      const data = await res.json();

      if (data.success) {
        setVideoUrl(data.videoUrl);
        setStatusMessage("Video generated successfully!");
      } else {
        setError(data.error || "Pipeline failed.");
      }
    } catch {
      setError("Failed to connect to pipeline server.");
    } finally {
      setVideoLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff0080] to-[#7928ca] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,0,128,0.5)]">
            <Video className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">Video Shorts Engine</h1>
        </div>
        <p className="text-gray-400">Generate 1-minute video shorts with AI — choose between the Multi-Shot Veo 3.1 pipeline or Imagen/FFmpeg.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ━━━━━━━━ CONTROLS PANEL ━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pacing & Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-[#0f0f16] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#ff0080] transition-colors"
              >
                {["Fast-paced & High Energy", "Educational / Deep-dive", "Storytelling / Vlog", "Meme / Viral format"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Video Concept</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 3 AI Tools every developer needs in 2026..."
                rows={3}
                className="w-full bg-[#0f0f16] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#ff0080] transition-colors resize-none mb-4"
              />

              <label className="block text-sm font-medium text-gray-300 mb-2 mt-4">Upload Context Document (PDF)</label>
              <div className="relative border border-white/10 rounded-lg py-3 px-4 bg-[#0f0f16] flex items-center gap-3 transition-colors focus-within:border-[#ff0080]">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-400 pointer-events-none truncate overflow-hidden">
                  {pdfFile ? (
                    <span className="text-white flex items-center gap-2">
                       ✅ {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  ) : "Click to seamlessly attach a .pdf script"}
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateScript}
              disabled={!topic || scriptLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(255,0,128,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {scriptLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  WRITING 1-MIN SCRIPT...
                </>
              ) : (
                <>
                  <Type className="w-5 h-5" />
                  STEP 1: GENERATE SCRIPT
                </>
              )}
            </button>

            {scriptData && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleGenerateVideo}
                disabled={videoLoading}
                className={`w-full py-3.5 rounded-xl text-white font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  pipeline === "veo"
                    ? "bg-gradient-to-r from-[#ff0080] to-[#ff4500] hover:shadow-[0_0_20px_rgba(255,0,128,0.4)]"
                    : "bg-gradient-to-r from-[#00e5ff] to-[#0077b6] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                }`}
              >
                {videoLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {pipeline === "veo" ? "POLLING VEO CLIPS..." : "STITCHING VIDEO..."}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    STEP 2: RENDER 1-MIN VIDEO
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ━━━━━━━━ OUTPUT PANEL ━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <div className="glass-panel p-6 rounded-2xl min-h-[600px] flex flex-col relative border border-[#ffffff10] space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div><p className="text-sm text-red-300">{error}</p></div>
              </div>
            )}

            {statusMessage && videoLoading && (
              <div className="bg-black/40 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                <Loader2 className="w-5 h-5 animate-spin text-[#ff0080] shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">{statusMessage}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pipeline: Colab CogVideoX + TTS + FFmpeg</p>
                </div>
              </div>
            )}

            {videoUrl && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-[11px] font-bold tracking-wide">COLAB COGVIDEOX</span><span className="font-bold text-white">{scriptData?.title || "Generated Video"}</span>
                  </div>
                  <a href={videoUrl} download={`skillcred_1min_video_${Date.now()}.mp4`} className="px-4 py-2 rounded-lg bg-white/10 text-sm font-medium text-gray-300 hover:bg-white/20 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download 1-Min MP4
                  </a>
                </div>
                <div className="rounded-xl overflow-hidden bg-black border border-white/10">
                  <video src={videoUrl} controls className="w-full max-h-[400px]" autoPlay />
                </div>
              </motion.div>
            )}

            {scriptData ? (
              <div className="bg-white/5 rounded-xl border border-white/5 p-5 flex-1 overflow-y-auto">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Type className="w-4 h-4" /> 1-Minute Script ({scriptData.scenes.length} Scenes) — "{scriptData.title}"
                </h4>
                <div className="space-y-4">
                  <div className="bg-[#ff0080]/10 border border-[#ff0080]/20 p-3 rounded-lg">
                    <p className="text-xs text-[#ff0080] font-bold mb-1">HOOK [0:00 - 0:03]</p>
                    <p className="text-sm text-white font-medium">&ldquo;{scriptData.hook}&rdquo;</p>
                  </div>

                  {scriptData.scenes?.map((scene, idx) => (
                    <div key={idx} className="flex gap-4 border-l-2 border-white/10 pl-4 py-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-[#00e5ff] font-semibold">
                          Scene {idx + 1} — Visual (Colab CogVideoX MP4):
                        </p>
                        <p className="text-sm text-gray-400">{scene.visual}</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-purple-400 font-semibold">Narration (TTS):</p>
                        <p className="text-sm text-gray-200">&ldquo;{scene.narration}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !scriptLoading && !error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 italic text-center px-8 space-y-4">
                <Film className="w-16 h-16 text-gray-700" />
                <p>Click Generate Script and AI will draft a complete 1-minute video script with 7 distinct scenes.</p>
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <Wrench className="w-8 h-8 mx-auto text-[#00e5ff]/40 mb-2" />
                    <p className="text-xs text-gray-600"><strong>Colab CogVideoX</strong></p>
                    <p className="text-[10px] text-gray-700">7 video scenes + TTS + stitched</p>
                  </div>
                </div>
              </div>
            ) : scriptLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#ff0080]" />
                <p className="text-sm text-gray-400 animate-pulse">Drafting 1-minute video script with Open-Source AI...</p>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
