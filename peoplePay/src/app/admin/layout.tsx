import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-7xl mx-auto p-6 sm:p-10">
        <h1 className="text-3xl font-bold mb-8">Admin Portal</h1>
        {children}
      </div>
    </div>
  );
}
