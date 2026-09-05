"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Briefcase, Mail, Building2, MapPin, Calendar, Clock, ArrowUpRight, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to archive this employee?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/employees/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/employees");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (e) {
      alert("Error archiving employee.");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetch(`/api/v1/employees/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error || !data.fullName) {
          setEmployee(null);
        } else {
          setEmployee(data);
        }
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="text-zinc-500 py-10">Loading Employee Details...</div>;
  if (!employee || !employee.fullName) return <div className="text-red-400 py-10">Employee not found or access denied.</div>;

  const smartButtons = [
    { label: "Contracts", value: 1, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Attendance", value: "98%", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Time Off", value: "2 Req", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "Allocations", value: "15 Days", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
        <Link href="/employees" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Link>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-8 relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-purple-500/20">
            {employee.fullName.charAt(0)}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{employee.fullName}</h1>
                <p className="text-zinc-400 mt-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {employee.jobPosition} at {employee.department?.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  employee.status === 'Active' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                }`}>
                  {employee.status}
                </span>
                {employee.status !== "Archived" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/employees/${params.id}/edit`)}
                      className="border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDelete} 
                      disabled={isDeleting}
                      className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? "Archiving..." : "Archive"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-500" />
                {employee.workEmail}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Building2 className="w-4 h-4 text-zinc-500" />
                {employee.company || "PeoplePay360 Inc."}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <MapPin className="w-4 h-4 text-zinc-500" />
                {employee.workLocation || "Remote"}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Calendar className="w-4 h-4 text-zinc-500" />
                {employee.workingSchedule?.name || "No Schedule Linked"}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Buttons / Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10 border-t border-zinc-800/50 pt-8">
          {smartButtons.map((btn) => (
            <div key={btn.label} className={`p-4 rounded-2xl border ${btn.border} ${btn.bg} cursor-pointer hover:scale-[1.02] transition-transform group`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-300 transition-colors">{btn.label}</span>
                <ArrowUpRight className={`w-4 h-4 ${btn.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
              </div>
              <div className={`text-2xl font-bold ${btn.color}`}>{btn.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
