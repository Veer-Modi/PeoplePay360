"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    workEmail: "",
    jobPosition: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/v1/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Failed to create employee");
      
      router.push("/employees");
    } catch (error) {
      console.error(error);
      alert("Error creating employee. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
        <Link href="/employees" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-blue-400" />
          Add New Employee
        </h1>
        <p className="text-zinc-400 mt-1">Create a new employee profile in the system.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Work Email</label>
              <input
                type="email"
                required
                value={formData.workEmail}
                onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                placeholder="john@peoplepay360.demo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Job Position</label>
              <input
                type="text"
                required
                value={formData.jobPosition}
                onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/employees")}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-0 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-xl min-w-[120px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
