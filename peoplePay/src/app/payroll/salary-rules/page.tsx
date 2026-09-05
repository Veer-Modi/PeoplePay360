"use client";
import React, { useEffect, useState } from "react";
import { Calculator } from "lucide-react";

export default function SalaryRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch("/api/v1/payroll/salary-rules");
        const data = await res.json();
        setRules(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchRules();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Salary Rules</h2>
          <p className="text-sm text-zinc-500">Define the computation logic for payroll.</p>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4">Seq</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Calculation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No rules found.</td></tr>
            ) : (
              rules.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                  <td className="px-6 py-4 font-mono text-xs">{r.sequence}</td>
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-zinc-400" />
                    {r.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-600 dark:text-blue-400">{r.code}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {r.category?.name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                    {r.calculationType}: {r.calculationValue}
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
