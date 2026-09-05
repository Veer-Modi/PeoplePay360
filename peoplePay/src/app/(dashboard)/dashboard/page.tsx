"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Users, FileText, CalendarClock } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome back, {session?.user?.email?.split('@')[0] || "User"}
        </h1>
        <p className="text-zinc-400 mt-1">Here is a quick overview of your HR modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/employees" className="bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 p-6 rounded-3xl transition-all group">
          <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Employees</h2>
          <p className="text-sm text-zinc-400">Manage the workforce, view profiles, and organize the pipeline.</p>
        </Link>

        <Link href="/contracts" className="bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 p-6 rounded-3xl transition-all group">
          <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Contracts</h2>
          <p className="text-sm text-zinc-400">Handle active, historical, and overlapping employment contracts.</p>
        </Link>

        <Link href="/schedules" className="bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 p-6 rounded-3xl transition-all group">
          <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CalendarClock className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Schedules</h2>
          <p className="text-sm text-zinc-400">Configure standard and custom weekly working hours.</p>
        </Link>
      </div>
    </div>
  );
}
