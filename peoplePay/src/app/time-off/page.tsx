'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function TimeOffPage() {
  const [tab, setTab] = useState<'requests' | 'allocations' | 'types'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [newRequestModal, setNewRequestModal] = useState(false);
  const [newAllocModal, setNewAllocModal] = useState(false);
  const [newTypeModal, setNewTypeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [employees, setEmployees] = useState<any[]>([]);
  const [reqEmpId, setReqEmpId] = useState('');
  const [reqTypeId, setReqTypeId] = useState('');
  const [reqStart, setReqStart] = useState('');
  const [reqEnd, setReqEnd] = useState('');
  const [reqReason, setReqReason] = useState('');

  const [allocEmpId, setAllocEmpId] = useState('');
  const [allocTypeId, setAllocTypeId] = useState('');
  const [allocDays, setAllocDays] = useState('10');

  const [typeName, setTypeName] = useState('');
  const [typeUnit, setTypeUnit] = useState<'Days' | 'Hours'>('Days');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [reqRes, allocRes, typeRes, attRes] = await Promise.all([
        fetch('/api/v1/time-off-requests').then((r) => r.json()),
        fetch('/api/v1/allocations').then((r) => r.json()),
        fetch('/api/v1/time-off-types').then((r) => r.json()),
        fetch('/api/v1/attendance').then((r) => r.json()),
      ]);

      if (reqRes.success) setRequests(reqRes.data || []);
      if (allocRes.success) setAllocations(allocRes.data || []);
      if (typeRes.success) setTypes(typeRes.data || []);

      if (attRes.success && attRes.data) {
        const emps = Array.from(
          new Map(attRes.data.map((r: any) => [r.employee.id, r.employee])).values()
        );
        setEmployees(emps);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveRequest = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/v1/time-off-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Approval failed');
      }
      setSuccessMsg('Request approved and allocation balance deducted atomically (BR-LEAVE-002)!');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRefuseRequest = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/v1/time-off-requests/${id}/refuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Refusal failed');
      }
      setSuccessMsg('Request refused. Allocation balance remained completely untouched (BR-LEAVE-003).');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleApproveAllocation = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/v1/allocations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Allocation approval failed');
      }
      setSuccessMsg('Allocation approved and now active for use (BR-LEAVE-001)!');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch('/api/v1/time-off-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: reqEmpId,
          timeOffTypeId: reqTypeId,
          startDate: reqStart,
          endDate: reqEnd,
          reason: reqReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }
      setNewRequestModal(false);
      setSuccessMsg('Time off request submitted successfully!');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch('/api/v1/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: allocEmpId,
          timeOffTypeId: allocTypeId,
          allocatedAmount: Number(allocDays),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Allocation creation failed');
      }
      setNewAllocModal(false);
      setSuccessMsg('Allocation drafted successfully. Approve it to make it usable.');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch('/api/v1/time-off-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: typeName,
          unit: typeUnit,
          requiresAllocation: true,
          requiresApproval: true,
          affectsPayroll: false,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Leave type creation failed');
      }
      setNewTypeModal(false);
      setTypeName('');
      setSuccessMsg('New Time Off Policy created!');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-10 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Time Off & Leave Management</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Configure policies, manage allocations, and enforce atomic leave approval balances (BR-LEAVE-001..003).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {tab === 'requests' && (
              <button
                onClick={() => {
                  setNewRequestModal(true);
                  if (!reqEmpId && employees.length > 0) setReqEmpId(employees[0].id);
                  if (!reqTypeId && types.length > 0) setReqTypeId(types[0].id);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Leave Request
              </button>
            )}

            {tab === 'allocations' && (
              <button
                onClick={() => {
                  setNewAllocModal(true);
                  if (!allocEmpId && employees.length > 0) setAllocEmpId(employees[0].id);
                  if (!allocTypeId && types.length > 0) setAllocTypeId(types[0].id);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Allocation
              </button>
            )}

            {tab === 'types' && (
              <button
                onClick={() => setNewTypeModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Leave Type
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
          <button
            onClick={() => setTab('requests')}
            className={`pb-3 text-sm font-medium transition relative ${
              tab === 'requests'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Leave Requests ({requests.length})
            {tab === 'requests' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setTab('allocations')}
            className={`pb-3 text-sm font-medium transition relative ${
              tab === 'allocations'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Leave Allocations & Balances ({allocations.length})
            {tab === 'allocations' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setTab('types')}
            className={`pb-3 text-sm font-medium transition relative ${
              tab === 'types'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Policy Types ({types.length})
            {tab === 'types' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
            )}
          </button>
        </div>

        {/* TAB 1: REQUESTS */}
        {tab === 'requests' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                      {loading ? 'Loading requests...' : 'No leave requests submitted yet.'}
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {r.employee?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {r.employee?.department?.name || 'Department'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-xs">
                        {r.timeOffType?.name}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-600 dark:text-zinc-400" suppressHydrationWarning>
                        {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-xs">
                        {Number(r.duration)} {r.timeOffType?.unit || 'Days'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            r.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : r.status === 'Refused'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {r.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(r.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRefuseRequest(r.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition"
                            >
                              Refuse
                            </button>
                          </>
                        )}
                        {r.status !== 'Pending' && (
                          <span className="text-xs text-zinc-400 italic">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: ALLOCATIONS */}
        {tab === 'allocations' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Allocated</th>
                  <th className="px-6 py-4">Taken</th>
                  <th className="px-6 py-4">Remaining</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {allocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-sm">
                      {loading ? 'Loading allocations...' : 'No allocations assigned yet.'}
                    </td>
                  </tr>
                ) : (
                  allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {a.employee?.fullName}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">{a.timeOffType?.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{Number(a.allocatedAmount)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-amber-600">{Number(a.takenAmount)}</td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600">
                        {Number(a.remainingAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            a.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.status === 'Draft' ? (
                          <button
                            onClick={() => handleApproveAllocation(a.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">Usable</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: POLICY TYPES */}
        {tab === 'types' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Policy Name</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Requires Allocation</th>
                  <th className="px-6 py-4">Requires Approval</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {types.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                      {loading ? 'Loading types...' : 'No leave policies created yet.'}
                    </td>
                  </tr>
                ) : (
                  types.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4 font-semibold">{t.name}</td>
                      <td className="px-6 py-4 text-xs font-mono">{t.unit}</td>
                      <td className="px-6 py-4 text-xs">
                        {t.requiresAllocation ? 'Yes (Strict Balance)' : 'No (Open)'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {t.requiresApproval ? 'Yes (Manager review)' : 'Auto-approved'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: New Leave Request */}
        {newRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-semibold">Submit Leave Request</h3>
                <button onClick={() => setNewRequestModal(false)} className="text-zinc-400 hover:text-zinc-600 text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Employee
                  </label>
                  <select
                    value={reqEmpId}
                    onChange={(e) => setReqEmpId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    required
                  >
                    <option value="">Select employee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.jobPosition || 'Employee'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Leave Policy Type
                  </label>
                  <select
                    value={reqTypeId}
                    onChange={(e) => setReqTypeId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    required
                  >
                    <option value="">Select type...</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={reqStart}
                      onChange={(e) => setReqStart(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={reqEnd}
                      onChange={(e) => setReqEnd(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    placeholder="Provide reason for time off"
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewRequestModal(false)}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: New Allocation */}
        {newAllocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-semibold">Assign Leave Allocation</h3>
                <button onClick={() => setNewAllocModal(false)} className="text-zinc-400 hover:text-zinc-600 text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAllocation} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Employee
                  </label>
                  <select
                    value={allocEmpId}
                    onChange={(e) => setAllocEmpId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    required
                  >
                    <option value="">Select employee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Leave Policy Type
                  </label>
                  <select
                    value={allocTypeId}
                    onChange={(e) => setAllocTypeId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    required
                  >
                    <option value="">Select type...</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Allocated Amount (Days/Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={allocDays}
                    onChange={(e) => setAllocDays(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewAllocModal(false)}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Create Allocation (Draft)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: New Policy Type */}
        {newTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-semibold">Create Time Off Type</h3>
                <button onClick={() => setNewTypeModal(false)} className="text-zinc-400 hover:text-zinc-600 text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateType} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Casual Leave, Sick Leave"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Unit
                  </label>
                  <select
                    value={typeUnit}
                    onChange={(e) => setTypeUnit(e.target.value as 'Days' | 'Hours')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  >
                    <option value="Days">Days</option>
                    <option value="Hours">Hours</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewTypeModal(false)}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Save Policy Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
