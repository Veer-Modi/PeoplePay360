"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, MoreHorizontal, Filter } from "lucide-react";

export default function EmployeesListPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/v1/employees")
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      });
  }, []);

  const filteredEmployees = employees.filter((emp) =>
    emp.fullName?.toLowerCase().includes(search.toLowerCase()) || 
    emp.workEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Employees</h1>
          <p className="text-zinc-400 mt-1">Manage your team and view their details.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/employees/kanban"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Kanban View
          </Link>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium rounded-tl-xl">Employee</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Position</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">Loading...</td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{emp.fullName}</div>
                        <div className="text-xs text-zinc-500">{emp.workEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{emp.department?.name || "N/A"}</td>
                  <td className="px-6 py-4">{emp.jobPosition}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      emp.status === 'Active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/employees/${emp.id}`} className="p-2 hover:bg-zinc-700 rounded-lg inline-flex transition-colors text-zinc-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-500">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
