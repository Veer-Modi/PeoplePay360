"use client";
import React, { useEffect, useState } from "react";
import { Layers } from "lucide-react";

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStructures() {
      try {
        const res = await fetch("/api/v1/payroll/salary-structures");
        const data = await res.json();
        setStructures(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStructures();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Salary Structures</h2>
          <p className="text-sm text-zinc-500">Configure base salary templates and their rules.</p>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Rules Count</th>
              <th className="px-6 py-4">Contracts Using This</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : structures.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No structures found.</td></tr>
            ) : (
              structures.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4 text-zinc-400" />
                    {s.name}
                  </td>
                  <td className="px-6 py-4">{s._count?.rules || 0} rules</td>
                  <td className="px-6 py-4">{s._count?.contracts || 0} contracts</td>
                  <td className="px-6 py-4">
                    {s.active ? (
                      <span className="text-emerald-600 font-medium">Active</span>
                    ) : (
                      <span className="text-rose-600 font-medium">Inactive</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
