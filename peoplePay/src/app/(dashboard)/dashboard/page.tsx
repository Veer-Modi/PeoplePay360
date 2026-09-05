"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DollarSign, FileText, CalendarCheck, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/v1/dashboard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-zinc-500">Loading live dashboard data...</div>;
  }

  if (!data || data.error) {
    return <div className="p-10 text-center text-rose-500">Failed to load dashboard data.</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Payroll Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Live aggregated reporting across HR, Attendance, Time Off, and Payroll.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Net Salary Paid</p>
              <h3 className="text-2xl font-bold mt-2">${data.kpis.totalNetSalary.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Payslips Generated</p>
              <h3 className="text-2xl font-bold mt-2">{data.kpis.payslipsGenerated}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Salary</p>
              <h3 className="text-2xl font-bold mt-2">${data.kpis.avgSalary.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Approved Time Off</p>
              <h3 className="text-2xl font-bold mt-2">{data.kpis.approvedTimeOffs} requests</h3>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
              <CalendarCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm h-96 flex flex-col">
          <h3 className="font-semibold text-lg mb-4">Salary Cost by Department</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.salaryCostByDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#18181b', color: '#fff' }} />
                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm h-96 flex flex-col">
          <h3 className="font-semibold text-lg mb-4">Monthly Net Salary Trend</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#18181b', color: '#fff' }} />
                <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-lg">Action Needed (Alerts)</h3>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {data.alerts.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">No active alerts. All systems nominal.</div>
          ) : (
            data.alerts.map((alert: any) => (
              <div key={alert.id} className="p-4 px-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition flex justify-between items-center cursor-pointer">
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs text-zinc-500 uppercase mt-1">{alert.type} • {alert.severity}</p>
                </div>
                <button className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                  Resolve
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
