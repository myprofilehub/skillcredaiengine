"use client";

import { motion } from "framer-motion";
import { MessageSquare, Loader2, Copy, Check, Hash, RefreshCw } from "lucide-react";
import { useState } from "react";
import { SKILLCRED_STREAMS, CONTENT_TYPES } from "@/lib/skillcred-context";

const PLATFORMS = ["LinkedIn", "Instagram", "YouTube Community Post", "Twitter/X"];

export default function TextEnginePage() {
  const [topic, setTopic] = useState("");
  const [stream, setStream] = useState(SKILLCRED_STREAMS[0].name);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].id);
  const [numberOfVariations, setNumberOfVariations] = useState(2);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [hashtags, setHashtags] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleGenerate(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    if (!topic) return;
    
    setLoading(true);
    setResults([]);
    setHashtags("");
    setActiveTab(0);
    
    try {
      const res = await fetch("/api/generate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic, 
          stream, 
          platform, 
          contentType,
          numberOfVariations
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setResults(data.content);
        setHashtags(data.hashtags || "");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to connect to AI server.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  // Find topics for the selected stream
  const selectedStream = SKILLCRED_STREAMS.find(s => s.name === stream);
  const suggestedTopics = selectedStream?.topics || [];

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8a2be2] to-[#4a00e0] flex items-center justify-center text-white shadow-[0_0_15px_rgba(138,43,226,0.5)]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">Post Engine</h1>
        </div>
        <p className="text-gray-400">Generate high-converting text posts based on SkillCred's 8 streams and AI automation context. No length limits.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ━━━━━━━━ CONTROLS ━━━━━━━━ */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Platform</label>
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#0f0f16] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#8a2be2] transition-colors"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SkillCred Stream</label>
              <select 
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full bg-[#0f0f16] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#8a2be2] transition-colors"
              >
                {SKILLCRED_STREAMS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map(ct => (
                  <button
                    key={ct.id}
                    onClick={() => setContentType(ct.id)}
                    className={`py-2 px-3 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                      contentType === ct.id
                        ? 'border-[#8a2be2] bg-[#8a2be2]/10 text-white'
                        : 'border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    <span>{ct.icon}</span> {ct.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Variations: <span className="text-[#8a2be2] font-bold">{numberOfVariations}</span>
              </label>
              <input 
                type="range" 
                min={1} 
                max={3} 
                value={numberOfVariations}
                onChange={(e) => setNumberOfVariations(Number(e.target.value))}
                className="w-full accent-[#8a2be2] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>1</span><span>2</span><span>3</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Topic or Keyword</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How to use Gemini API to automate your code reviews..."
                rows={3}
                className="w-full bg-[#0f0f16] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#8a2be2] transition-colors resize-none"
              />
              {suggestedTopics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestedTopics.slice(0, 3).map(t => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className="text-[10px] px-2 py-1 rounded-full bg-[#8a2be2]/10 text-[#8a2be2] border border-[#8a2be2]/20 hover:bg-[#8a2be2]/20 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!topic || loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8a2be2] to-[#4a00e0] text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(138,43,226,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  GENERATING {numberOfVariations} VARIATION{numberOfVariations > 1 ? 'S' : ''}...
                </>
              ) : "GENERATE POST"}
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
          <div className="glass-panel p-6 rounded-2xl min-h-[600px] flex flex-col relative border border-[#ffffff10]">
            
            {/* Header / Tabs */}
            <div className="flex justify-between items-end mb-4 border-b border-[#ffffff10] pb-4">
              <div>
                <h3 className="font-semibold text-gray-200 mb-3">Generated Content</h3>
                {results.length > 1 && (
                  <div className="flex gap-2">
                    {results.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          activeTab === idx 
                            ? "bg-[#8a2be2] text-white" 
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        Option {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleGenerate}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white flex items-center gap-2 text-sm"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleCopy(results[activeTab], activeTab)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white flex items-center gap-2 text-sm bg-white/5"
                  >
                    {copiedIndex === activeTab ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copiedIndex === activeTab ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 pb-4">
              {results.length === 0 && !loading ? (
                <div className="h-full flex items-center justify-center text-gray-500 italic text-center px-8">
                  Configure your post settings and hit Generate to see the AI magic.
                </div>
              ) : loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#8a2be2]" />
                    <p className="text-sm text-gray-400 animate-pulse">Consulting the SkillCred Brain...</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-200 whitespace-pre-wrap leading-relaxed font-sans text-[15px]">
                  {results[activeTab]}
                </div>
              )}
            </div>

            {/* Hashtag Footer */}
            {hashtags && results.length > 0 && !loading && (
              <div className="mt-4 pt-4 border-t border-[#ffffff10] bg-[#0a0a0f]/50 p-4 rounded-xl">
                <h4 className="flex items-center gap-2 text-sm font-bold text-[#8a2be2] mb-2">
                  <Hash className="w-4 h-4" /> Suggested Hashtags for {stream}
                </h4>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[85%]">{hashtags}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(hashtags);
                      setCopiedIndex(999);
                      setTimeout(() => setCopiedIndex(null), 2000);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                    title="Copy merely hashtags"
                  >
                    {copiedIndex === 999 ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </motion.div>
      </div>
    </div>
  );
}
