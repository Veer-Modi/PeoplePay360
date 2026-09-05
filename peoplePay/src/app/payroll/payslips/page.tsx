"use client";
import React, { useEffect, useState } from "react";
import { FileText } from "lucide-react";

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayslips() {
      try {
        const res = await fetch("/api/v1/payroll/payslips");
        const data = await res.json();
        setPayslips(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPayslips();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Payslips</h2>
          <p className="text-sm text-zinc-500">View and print employee payslips.</p>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Net Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : payslips.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No payslips found.</td></tr>
            ) : (
              payslips.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    {p.employee?.fullName}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">
                    {new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    ${Number(p.netTotal).toFixed(2)}
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
