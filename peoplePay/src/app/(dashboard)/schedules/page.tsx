"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Clock } from "lucide-react";

export default function SchedulesListPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/schedules")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSchedules(data);
        } else {
          setSchedules([]);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Schedules</h1>
          <p className="text-zinc-400 mt-1">Configure standard and custom weekly working hours.</p>
        </div>
        <Link
          href="/schedules/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Schedule
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium rounded-tl-xl">Schedule Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Weekly Hours</th>
                <th className="px-6 py-4 font-medium">Work Days</th>
                <th className="px-6 py-4 font-medium rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">Loading Schedules...</td>
                </tr>
              ) : schedules.map((s) => (
                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    {s.name}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {s.type || "Full-Time"}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-300">
                    {s.weeklyHours} hrs
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => {
                        const isWorkingDay = s.days?.some((sd: any) => sd.dayOfWeek === d);
                        return (
                          <span key={d} className={`text-[10px] uppercase font-bold w-6 h-6 rounded flex items-center justify-center ${
                            isWorkingDay ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800/50 text-zinc-600'
                          }`}>
                            {d[0]}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-zinc-700 rounded-lg inline-flex transition-colors text-zinc-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-500">No schedules found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
