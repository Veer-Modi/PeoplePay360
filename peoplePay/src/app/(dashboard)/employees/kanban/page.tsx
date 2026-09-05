"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, LayoutList } from "lucide-react";

export default function KanbanPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/employees")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEmployees(data);
        } else {
          setEmployees([]);
        }
        setLoading(false);
      });
  }, []);

  // Group by department
  const grouped = employees.reduce((acc, emp) => {
    const dept = emp.department?.name || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, any[]>);

  const departments = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Employee Kanban</h1>
          <p className="text-zinc-400 mt-1">Pipeline grouped by department.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/employees"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center"
          >
            <LayoutList className="w-4 h-4 mr-2" />
            List View
          </Link>
          <Link href="/employees/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading Kanban...</div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
          {departments.map((dept) => (
            <div key={dept} className="flex-shrink-0 w-80 bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-5 flex flex-col snap-start">
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-semibold text-zinc-200">{dept}</h3>
                <span className="bg-zinc-800 text-zinc-400 text-xs py-1 px-2.5 rounded-full font-medium">
                  {grouped[dept].length}
                </span>
              </div>
              
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                {grouped[dept].map((emp) => (
                  <Link 
                    href={`/employees/${emp.id}`}
                    key={emp.id}
                    className="block bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {emp.fullName}
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                    </div>
                    <div className="text-xs text-zinc-500 mb-3">{emp.jobPosition}</div>
                    
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-zinc-600">{emp.workEmail.split('@')[0]}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          
          {departments.length === 0 && (
             <div className="text-center w-full py-20 text-zinc-500">No employees assigned to departments yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
