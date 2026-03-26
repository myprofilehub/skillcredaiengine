import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkillCred AI Engine",
  description: "AI-powered content marketing engine for SkillCred",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.className} dark`} suppressHydrationWarning>
      <body className="antialiased bg-[#0a0a0f] text-gray-100 min-h-screen selection:bg-[#8a2be2] selection:text-white pb-32">
        <Sidebar />
        <main className="ml-64 p-8 min-h-screen relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8a2be2] rounded-full blur-[150px] opacity-10 pointer-events-none" />
          <div className="absolute bottom-0 left-64 w-[500px] h-[500px] bg-[#00e5ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />
          
          <div className="relative z-10 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
