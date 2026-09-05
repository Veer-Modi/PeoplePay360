"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FileText, CalendarClock, LogOut, LayoutDashboard } from "lucide-react";
import { AttendanceWidget } from "@/modules/time-tracking/components/AttendanceWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Contracts", href: "/contracts", icon: FileText },
    { name: "Schedules", href: "/schedules", icon: CalendarClock },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col hidden md:flex relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <div className="h-8 w-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-purple-500/20">
            <Users className="text-white w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-white/90">PeoplePay360</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center px-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
              {session?.user?.email?.[0].toUpperCase() || "?"}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white leading-none mb-1">
                {session?.user?.email?.split('@')[0] || "User"}
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{session?.user?.roleName || "Role"}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="h-16 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md flex items-center justify-end px-8 z-10">
           <AttendanceWidget />
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 z-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
