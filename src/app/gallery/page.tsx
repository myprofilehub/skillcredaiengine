'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Image as ImageIcon, Video, Filter, Loader2, Maximize2, ExternalLink } from 'lucide-react';

interface GalleryItem {
  id: string;
  type: 'video' | 'image';
  title?: string;
  prompt?: string;
  videoUrl?: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  stream?: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'video' | 'image'>('all');

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/ai-engine/api/gallery');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to load gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    filter === 'all' ? true : item.type === filter
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Creative Gallery
          </h1>
          <p className="text-gray-400 max-w-lg">
            A unified showcase of SkillCred's AI-generated 121-frame cinematic shorts and FLUX technical engineering stills.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1 bg-[#1a1a24] rounded-xl border border-white/5 self-start">
          {(['all', 'video', 'image'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab 
                ? 'bg-[#8a2be2] text-white shadow-lg shadow-purple-500/20' 
                : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}s
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="w-8 h-8 text-[#8a2be2] animate-spin" />
          <p className="text-gray-500 animate-pulse">Retrieving creative assets...</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group relative bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden hover:border-[#8a2be2]/50 transition-all shadow-xl"
              >
                {/* Media Preview */}
                <div className="aspect-video relative overflow-hidden bg-black/40">
                  {item.type === 'video' ? (
                    item.status === 'COMPLETED' ? (
                      <video 
                        src={item.videoUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
                        onMouseOut={(e) => {
                          const v = e.currentTarget as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                        muted
                        loop
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 text-[#00e5ff] animate-spin" />
                        <span className="text-xs font-mono text-[#00e5ff] tracking-widest uppercase">Generating...</span>
                      </div>
                    )
                  ) : (
                    <img 
                      src={item.imageUrl} 
                      alt={item.prompt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}

                  {/* Icon Overlay */}
                  <div className="absolute top-4 right-4 p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 z-20">
                    {item.type === 'video' ? <Video className="w-4 h-4 text-purple-400" /> : <ImageIcon className="w-4 h-4 text-blue-400" />}
                  </div>

                  {/* Label Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8a2be2]/20 text-[#8a2be2] border border-[#8a2be2]/30 uppercase tracking-tighter">
                         {item.type}
                       </span>
                       <span className="text-[10px] text-gray-400 font-mono">
                         {new Date(item.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white/90 line-clamp-1 leading-relaxed">
                      {item.type === 'video' ? item.title : item.prompt}
                    </h3>
                  </div>
                </div>

                {/* Footer / Meta */}
                <div className="px-6 py-4 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'COMPLETED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{item.status}</span>
                  </div>
                  <button className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-white/5 rounded-3xl gap-4">
          <div className="p-4 bg-white/5 rounded-full">
            <Filter className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-500">No {filter} content has been generated yet.</p>
        </div>
      )}
    </div>
  );
}
