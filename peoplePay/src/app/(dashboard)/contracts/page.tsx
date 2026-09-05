"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, AlertCircle } from "lucide-react";

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/contracts")
      .then((res) => res.json())
      .then((data) => {
        setContracts(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Contracts</h1>
          <p className="text-zinc-400 mt-1">Manage active and historical employee contracts.</p>
        </div>
        <Link
          href="/contracts/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium rounded-tl-xl">Employee</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Wage</th>
                <th className="px-6 py-4 font-medium">Schedule</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">Loading Contracts...</td>
                </tr>
              ) : contracts.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">
                    {c.employee?.fullName || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {new Date(c.startDate).toLocaleDateString()} - {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Ongoing'}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-300">
                    ${Number(c.wage).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {c.workingSchedule?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
                      c.status === 'Active' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                    }`}>
                      {c.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-zinc-700 rounded-lg inline-flex transition-colors text-zinc-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-500">No contracts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
