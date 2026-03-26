"use client";

import { useState, useRef, useEffect } from "react";

import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, MessageSquare, Video, Zap, Activity } from "lucide-react";
import Link from "next/link";

export interface DashboardData {
  stats: {
    posts: number;
    images: number;
    videos: number;
  };
  recentGenerations: Array<{
    id: string;
    type: "POST" | "IMAGE" | "VIDEO";
    title: string;
    stream: string;
    timeAgo: string;
    status: string;
    imageUrl?: string;
  }>;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-12 pb-12">
      {/* Header section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome Back, <span className="gradient-text">Creator</span></h1>
          <p className="text-gray-400">Generate high-converting content for SkillCred in seconds.</p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="glass-panel px-6 py-3 rounded-full flex items-center gap-2 hover-lift group"
          >
            <Zap className="w-5 h-5 text-[#00e5ff] group-hover:text-white transition-colors" />
            <span className="font-medium text-sm tracking-wide">QUICK GENERATE</span>
          </button>
          
          {isDropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 mt-3 w-56 glass-panel rounded-xl overflow-hidden shadow-2xl z-50 border border-white/10"
            >
              <div className="flex flex-col">
                <Link href="/text" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-sm font-medium text-gray-200 hover:text-white group">
                  <MessageSquare className="w-4 h-4 text-[#8a2be2] group-hover:scale-110 transition-transform" />
                  Post Engine
                </Link>
                <div className="h-px w-full bg-white/5" />
                <Link href="/image" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-sm font-medium text-gray-200 hover:text-white group">
                  <ImageIcon className="w-4 h-4 text-[#00e5ff] group-hover:scale-110 transition-transform" />
                  Image Engine
                </Link>
                <div className="h-px w-full bg-white/5" />
                <Link href="/video" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-sm font-medium text-gray-200 hover:text-white group">
                  <Video className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
                  Video Shorts
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Posts Generated" value={data.stats.posts.toString()} icon={<MessageSquare className="w-6 h-6 text-[#8a2be2]" />} trend="Total generated" delay={0.1} />
        <StatCard title="Images Created" value={data.stats.images.toString()} icon={<ImageIcon className="w-6 h-6 text-[#00e5ff]" />} trend="Total generated" delay={0.2} />
        <StatCard title="Videos Produced" value={data.stats.videos.toString()} icon={<Video className="w-6 h-6 text-pink-500" />} trend="Total generated" delay={0.3} />
      </div>

      {/* Action Engines */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#00e5ff]" /> 
          AI Content Engines
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <EngineCard 
            title="Post Engine"
            desc="Generate LinkedIn & Instagram posts using the 8 core SkillCred streams as context."
            href="/text"
            icon={<MessageSquare className="w-8 h-8" />}
            color="from-[#8a2be2] to-[#4a00e0]"
            delay={0.4}
          />
          <EngineCard 
            title="Image Engine"
            desc="Create stunning graphics and thumbnails using Google Imagen 3 capabilities."
            href="/image"
            icon={<ImageIcon className="w-8 h-8" />}
            color="from-[#00e5ff] to-[#007b8a]"
            delay={0.5}
          />
          <EngineCard 
            title="Video Shorts"
            desc="Synthesize 1-minute video shorts with voiceovers and AI-driven edits."
            href="/video"
            icon={<Video className="w-8 h-8" />}
            color="from-[#ff0080] to-[#7928ca]"
            delay={0.6}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-panel rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold mb-6 border-b border-white/5 pb-4">Recent Generations</h3>
        <div className="space-y-4">
          {data.recentGenerations.length === 0 ? (
            <p className="text-gray-400 text-sm">No generations yet. Try creating something!</p>
          ) : (
            data.recentGenerations.map((gen, i) => (
              <div key={gen.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    gen.type === 'IMAGE' ? 'bg-[#00e5ff]/20 text-[#00e5ff]' : 
                    gen.type === 'POST' ? 'bg-[#8a2be2]/20 text-[#8a2be2]' : 
                    'bg-pink-500/20 text-pink-500'
                  }`}>
                    {gen.imageUrl ? (
                      <img src={gen.imageUrl} alt={gen.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        {gen.type === 'IMAGE' && <ImageIcon className="w-5 h-5" />}
                        {gen.type === 'POST' && <MessageSquare className="w-5 h-5" />}
                        {gen.type === 'VIDEO' && <Video className="w-5 h-5" />}
                      </>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-200">{gen.title}</h4>
                    <p className="text-xs text-gray-500">Stream: {gen.stream}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{gen.timeAgo}</p>
                  <p className="text-xs text-[#00e5ff]">{gen.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, delay }: { title: string, value: string, icon: React.ReactNode, trend: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover-lift"
    >
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-500">
        {icon}
      </div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
      <p className="text-xs text-[#00e5ff] font-medium">{trend}</p>
    </motion.div>
  );
}

function EngineCard({ title, desc, href, icon, color, delay }: { title: string, desc: string, href: string, icon: React.ReactNode, color: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link href={href} className="block group">
        <div className="glass-panel p-8 rounded-3xl h-full border border-white/5 hover:border-white/20 transition-all duration-300 relative overflow-hidden hover-lift flex flex-col">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} rounded-full blur-[60px] opacity-30 group-hover:opacity-60 transition-opacity`} />
          
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white overflow-hidden relative">
             <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
             {icon}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-glow transition-all">{title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">{desc}</p>
          
          <div className="flex items-center text-sm font-semibold tracking-wide text-white gap-2 mt-auto">
            <span>LAUNCH ENGINE</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
