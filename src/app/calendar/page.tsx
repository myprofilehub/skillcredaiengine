"use client";

import { motion } from "framer-motion";
import { Calendar, Plus, Sparkles, Loader2, Trash2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { SKILLCRED_STREAMS, CONTENT_TYPES } from "@/lib/skillcred-context";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PLATFORMS_SHORT = ["LinkedIn", "Instagram", "YouTube", "Twitter/X"];

interface CalendarEntry {
  id: string;
  day: string;
  platform: string;
  contentType: string;
  stream: string;
  topic: string;
  generatedContent?: string;
  status: "planned" | "generating" | "ready";
}

export default function CalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  function getWeekDates() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    return DAYS.map((day, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return { day, date: d.getDate(), month: d.toLocaleString("default", { month: "short" }) };
    });
  }

  const weekDates = getWeekDates();

  function addEntry(day: string) {
    const newEntry: CalendarEntry = {
      id: Date.now().toString(),
      day,
      platform: "LinkedIn",
      contentType: CONTENT_TYPES[0].id,
      stream: SKILLCRED_STREAMS[0].name,
      topic: "",
      status: "planned"
    };
    setEntries([...entries, newEntry]);
  }

  function removeEntry(id: string) {
    setEntries(entries.filter(e => e.id !== id));
  }

  function updateEntry(id: string, field: string, value: string) {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  async function generateSingle(entry: CalendarEntry) {
    updateEntry(entry.id, "status", "generating");
    try {
      const res = await fetch("/api/generate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: entry.topic || `${entry.contentType} about ${entry.stream}`,
          stream: entry.stream,
          platform: entry.platform
        })
      });
      const data = await res.json();
      if (data.success) {
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, generatedContent: data.content, status: "ready" } : e));
      }
    } catch {
      updateEntry(entry.id, "status", "planned");
    }
  }

  async function autoFillWeek() {
    setBulkLoading(true);
    const newEntries: CalendarEntry[] = [];
    const platforms = ["LinkedIn", "Instagram", "LinkedIn", "Twitter/X", "LinkedIn", "YouTube", "Instagram"];
    
    DAYS.forEach((day, i) => {
      const stream = SKILLCRED_STREAMS[i % SKILLCRED_STREAMS.length];
      const contentType = CONTENT_TYPES[i % CONTENT_TYPES.length];
      newEntries.push({
        id: `auto-${Date.now()}-${i}`,
        day,
        platform: platforms[i],
        contentType: contentType.id,
        stream: stream.name,
        topic: stream.topics[i % stream.topics.length],
        status: "planned"
      });
    });
    setEntries(prev => [...prev, ...newEntries]);
    setBulkLoading(false);
  }

  function exportCalendar() {
    const csv = [
      "Day,Platform,Stream,Topic,Status,Content",
      ...entries.map(e => `"${e.day}","${e.platform}","${e.stream}","${e.topic}","${e.status}","${(e.generatedContent || '').replace(/"/g, '""')}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skillcred_content_calendar.csv";
    a.click();
  }

  return (
    <div className="pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Calendar className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold">Content Calendar</h1>
          </div>
          <p className="text-gray-400">Plan, auto-schedule, and batch-generate your weekly content.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCalendar} className="glass-panel px-5 py-2.5 rounded-full text-sm font-medium hover-lift flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={autoFillWeek} disabled={bulkLoading} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2">
            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Auto-Fill Week
          </button>
        </div>
      </motion.div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold text-white">
          {weekDates[0].month} {weekDates[0].date} – {weekDates[6].month} {weekDates[6].date}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDates.map(({ day, date, month }) => {
          const dayEntries = entries.filter(e => e.day === day);
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-4 min-h-[300px] flex flex-col border border-white/5"
            >
              <div className="text-center mb-4 pb-3 border-b border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{day}</p>
                <p className="text-2xl font-bold text-white">{date}</p>
                <p className="text-xs text-gray-500">{month}</p>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayEntries.map(entry => (
                  <div key={entry.id} className={`p-2.5 rounded-xl text-xs border transition-all ${
                    entry.status === "ready"
                      ? "bg-green-500/10 border-green-500/30"
                      : entry.status === "generating"
                      ? "bg-amber-500/10 border-amber-500/30 animate-pulse"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-white truncate flex-1">{entry.platform}</span>
                      <button onClick={() => removeEntry(entry.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-1 shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-gray-400 truncate text-[10px] mb-2">{entry.stream}</p>
                    {entry.status === "planned" && (
                      <button onClick={() => generateSingle(entry)} className="w-full py-1 rounded-md bg-white/10 text-[10px] text-gray-300 hover:bg-white/20 transition-colors">
                        Generate
                      </button>
                    )}
                    {entry.status === "ready" && (
                      <span className="text-green-400 text-[10px] font-medium">✓ Ready</span>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => addEntry(day)} className="mt-3 w-full py-2 rounded-xl border border-dashed border-white/10 text-gray-500 hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-1 text-xs">
                <Plus className="w-3 h-3" /> Add
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
