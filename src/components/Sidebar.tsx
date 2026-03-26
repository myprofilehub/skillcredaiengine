"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname() || "";
  
  // Strip basePath prefix for matching if Next.js hasn't already done so
  // In App Router with basePath, usePathname usually includes it.
  const checkActive = (href: string) => {
    // If we're at the root of the app (which is /ai-engine/)
    if (href === "/" && (pathname === "/ai-engine" || pathname === "/ai-engine/")) return true;
    
    // Otherwise check if pathname starts with the link's href
    // Need to account for basePath
    return pathname.endsWith(href === "/" ? "/ai-engine/" : href) || pathname.includes(`${href}/`);
  };

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 glass-panel border-r border-[#ffffff10] flex flex-col pt-8 z-50">
      <div className="px-6 mb-12 flex items-center gap-3 relative">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e5ff] to-[#8a2be2] shadow-[0_0_15px_rgba(138,43,226,0.6)] flex items-center justify-center">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">SkillCred<span className="text-[#00e5ff]">AI</span></h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <SidebarLink href="/" icon="❖" label="Dashboard" active={checkActive("/")} />
        <SidebarLink href="/text" icon="📝" label="Post Engine" active={checkActive("/text")} />
        <SidebarLink href="/image" icon="🎨" label="Image Engine" active={checkActive("/image")} />
        <SidebarLink href="/video" icon="🎬" label="Video Engine" active={checkActive("/video")} />
        <SidebarLink href="/gallery" icon="🖼️" label="Creative Gallery" active={checkActive("/gallery")} />
        <SidebarLink href="/calendar" icon="📅" label="Content Calendar" active={checkActive("/calendar")} />
      </nav>

      <div className="p-6 border-t border-[#ffffff10]">
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#8a2be2] to-[#00e5ff] opacity-10 group-hover:opacity-20 transition-opacity" />
          <h3 className="font-semibold text-white mb-1 relative z-10">Gemini Pro API</h3>
          <div className="flex items-center gap-2 text-sm text-[#00e5ff] relative z-10">
            <span className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" />
            Connected
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
