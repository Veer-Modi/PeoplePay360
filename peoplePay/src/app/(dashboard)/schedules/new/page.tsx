"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Full-Time");
  const [days, setDays] = useState([
    { dayOfWeek: "Mon", startTime: "09:00", endTime: "17:30", breakMinutes: 30 },
    { dayOfWeek: "Tue", startTime: "09:00", endTime: "17:30", breakMinutes: 30 },
  ]);

  const addDay = () => setDays([...days, { dayOfWeek: "Wed", startTime: "09:00", endTime: "17:30", breakMinutes: 30 }]);
  const removeDay = (index: number) => setDays(days.filter((_, i) => i !== index));
  const updateDay = (index: number, field: string, value: string | number) => {
    const newDays = [...days];
    (newDays[index] as any)[field] = value;
    setDays(newDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // In a real app, POST to /api/v1/schedules
    setTimeout(() => {
      setLoading(false);
      router.push("/schedules");
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
        <Link href="/schedules" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Schedules
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <CalendarClock className="w-8 h-8 text-emerald-400" />
          Create Working Schedule
        </h1>
        <p className="text-zinc-400 mt-1">Define standard weekly working hours and breaks.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Schedule Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                placeholder="e.g. Standard 40hr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all appearance-none"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Shift">Shift</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-zinc-300 ml-1">Working Days Configuration</label>
              <button 
                type="button" 
                onClick={addDay}
                className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Day
              </button>
            </div>
            
            <div className="space-y-3">
              {days.map((day, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-zinc-950/30 p-3 rounded-2xl border border-zinc-800/50 group hover:border-zinc-700 transition-colors">
                  <select
                    value={day.dayOfWeek}
                    onChange={(e) => updateDay(idx, "dayOfWeek", e.target.value)}
                    className="w-32 bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white outline-none"
                  >
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thu">Thursday</option>
                    <option value="Fri">Friday</option>
                    <option value="Sat">Saturday</option>
                    <option value="Sun">Sunday</option>
                  </select>
                  
                  <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <span>From</span>
                    <input type="time" value={day.startTime} onChange={e => updateDay(idx, "startTime", e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-white outline-none" />
                    <span>to</span>
                    <input type="time" value={day.endTime} onChange={e => updateDay(idx, "endTime", e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-white outline-none" />
                  </div>

                  <div className="flex-1 flex items-center justify-end gap-2 text-zinc-500 text-sm">
                    <span>Break (mins):</span>
                    <input type="number" min="0" value={day.breakMinutes} onChange={e => updateDay(idx, "breakMinutes", parseInt(e.target.value)||0)} className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-white outline-none text-right" />
                  </div>

                  <button type="button" onClick={() => removeDay(idx)} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/schedules")}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-0 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 rounded-xl min-w-[140px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
