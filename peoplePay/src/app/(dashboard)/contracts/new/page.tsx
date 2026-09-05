"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileSignature, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    wage: "",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Failed to create contract");
      
      router.push("/contracts");
    } catch (error) {
      console.error(error);
      alert("Error creating contract. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
        <Link href="/contracts" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Contracts
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <FileSignature className="w-8 h-8 text-purple-400" />
          Create Contract
        </h1>
        <p className="text-zinc-400 mt-1">Assign a new employment contract and salary structure.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Employee ID / Selector</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                placeholder="Select an employee..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Wage (Base Salary)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-zinc-500">$</span>
                </div>
                <input
                  type="number"
                  required
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 pl-8 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                  placeholder="60000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/contracts")}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-0 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white border-0 rounded-xl min-w-[120px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Contract"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
