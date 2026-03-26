"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Loader2, Download, Trash2, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { SKILLCRED_STREAMS, CONTENT_TYPES } from "@/lib/skillcred-context";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  stream: string;
  contentType: string;
  timestamp: number;
}

export default function ImageEnginePage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [stream, setStream] = useState(SKILLCRED_STREAMS[0].name);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].id);
  const [numberOfImages, setNumberOfImages] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ id: string; url: string }[]>([]);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt) return;
    setLoading(true);
    setResults([]);
    setSelectedImage(null);

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          stream,
          contentType,
          numberOfImages,
        })
      });
      const data = await res.json();

      if (data.success && data.images) {
        setResults(data.images);
        // Add to gallery history
        const newEntries: GeneratedImage[] = data.images.map((img: any) => ({
          ...img,
          prompt,
          stream,
          contentType,
          timestamp: Date.now(),
        }));
        setGallery(prev => [...newEntries, ...prev]);
        if (data.images.length > 0) setSelectedImage(data.images[0].url);
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Failed to connect to AI server.");
    } finally {
      setLoading(false);
    }
  }

  function removeFromGallery(id: string) {
    setGallery(prev => prev.filter(g => g.id !== id));
  }

  function clearGallery() {
    setGallery([]);
  }

  // Find topics for the selected stream to act as prompt suggestions if needed
  const selectedStream = SKILLCRED_STREAMS.find(s => s.name === stream);
  const suggestedTopics = selectedStream?.topics || [];


  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00e5ff] to-[#007b8a] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,229,255,0.5)]">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">Image Engine</h1>
        </div>
        <p className="text-gray-400">Generate high-quality graphics for SkillCred targeting specific content types using Google Imagen 3.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ━━━━━━━━ CONTROLS ━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-5"
        >
          <div className="glass-panel p-5 rounded-2xl space-y-4 relative z-10">
            {/* Stream Context */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SkillCred Stream</label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full bg-[#0f0f16] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#00e5ff] transition-colors"
              >
                {SKILLCRED_STREAMS.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content Type (Vibe)</label>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map(ct => (
                  <button
                    key={ct.id}
                    onClick={() => setContentType(ct.id)}
                    className={`py-2 px-3 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                      contentType === ct.id
                        ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-white'
                        : 'border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    <span>{ct.icon}</span> {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {["1:1", "16:9", "9:16", "4:3"].map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2.5 rounded-lg border transition-all text-sm ${
                      aspectRatio === ratio
                        ? "border-[#00e5ff] bg-[#00e5ff]/10 text-white"
                        : "border-white/10 text-gray-400 hover:border-white/30"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Variations */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Variations: <span className="text-[#00e5ff] font-bold">{numberOfImages}</span>
              </label>
              <input
                type="range"
                min={1}
                max={4}
                value={numberOfImages}
                onChange={(e) => setNumberOfImages(Number(e.target.value))}
                className="w-full accent-[#00e5ff] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>1</span><span>2</span><span>3</span><span>4</span>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Graphic Description</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A futuristic robot building a React application on a holographic screen..."
                rows={4}
                className="w-full bg-[#0f0f16] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#00e5ff] transition-colors resize-none"
              />
              {suggestedTopics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestedTopics.slice(0, 3).map(t => (
                    <button
                      key={t}
                      onClick={() => setPrompt(t)}
                      className="text-[10px] px-2 py-1 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 hover:bg-[#00e5ff]/20 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt || loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#007b8a] text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  GENERATING {numberOfImages} IMAGE{numberOfImages > 1 ? "S" : ""}...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  GENERATE {numberOfImages} IMAGE{numberOfImages > 1 ? "S" : ""}
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ━━━━━━━━ OUTPUT ━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 space-y-6"
        >
          {/* Main Preview */}
          <div className="glass-panel p-5 rounded-2xl min-h-[400px] flex flex-col justify-center items-center relative border border-[#ffffff10] overflow-hidden group">
            {!selectedImage && !loading ? (
              <div className="text-gray-500 italic text-center px-8 relative z-10">
                <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                Select a stream, choose a content type, and describe your graphic.
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center gap-4 relative z-10">
                <Loader2 className="w-10 h-10 animate-spin text-[#00e5ff]" />
                <p className="text-sm text-gray-400 animate-pulse">Rendering {numberOfImages} variation{numberOfImages > 1 ? "s" : ""} via Google Imagen 3...</p>
              </div>
            ) : selectedImage ? (
              <>
                <div className="absolute inset-0 p-4">
                  <div className="w-full h-full rounded-xl overflow-hidden relative group-hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-shadow">
                    <img src={selectedImage} alt="Generated" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                  <a
                    href={selectedImage}
                    download={`skillcred_image_${Date.now()}.jpg`}
                    className="w-full py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white font-medium flex items-center justify-center gap-2 hover:bg-black/80 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download Full Res
                  </a>
                </div>
              </>
            ) : null}
          </div>

          {/* Variations Thumbnails */}
          {results.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h4 className="text-sm font-medium text-gray-400 mb-3">Generated Variations — click to preview</h4>
              <div className="grid grid-cols-4 gap-3">
                {results.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                      selectedImage === img.url
                        ? "border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt="Variation"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Session Gallery / History */}
          {gallery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5 rounded-2xl border border-white/5"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                  Session Gallery ({gallery.length})
                </h4>
                <button
                  onClick={clearGallery}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {gallery.map(img => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group/thumb"
                    >
                      <button
                        onClick={() => setSelectedImage(img.url)}
                        className={`rounded-lg overflow-hidden border transition-all aspect-square w-full block ${
                          selectedImage === img.url
                            ? "border-[#00e5ff]"
                            : "border-white/5 hover:border-white/20"
                        }`}
                      >
                        <img src={img.url} alt="History" className="w-full h-full object-cover" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromGallery(img.id); }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center text-[10px] opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
