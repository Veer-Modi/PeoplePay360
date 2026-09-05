"use client";

import React, { useEffect, useState } from "react";
import { User, Shield, CheckCircle, XCircle } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/v1/users");
        const data = await res.json();
        setUsers(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-zinc-500">Manage access and roles for all accounts.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Linked Employee</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="font-medium">{user.workEmail}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                      <Shield className="w-3 h-3" />
                      {user.role?.name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {user.employee?.fullName || <span className="italic text-zinc-400">Unlinked</span>}
                  </td>
                  <td className="px-6 py-4">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                        <XCircle className="w-4 h-4" /> Inactive
                      </span>
                    )}
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
