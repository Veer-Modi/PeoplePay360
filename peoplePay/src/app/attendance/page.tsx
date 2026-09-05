'use client';

import React, { useState, useEffect } from 'react';
import { AttendanceWidget } from '@/modules/time-tracking/components/AttendanceWidget';
import {
  Clock,
  UserCheck,
  AlertCircle,
  Filter,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Edit3,
} from 'lucide-react';

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [correctionModal, setCorrectionModal] = useState<any | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = '/api/v1/attendance';
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (exceptionsOnly) params.append('exceptionsOnly', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, exceptionsOnly]);

  const openCorrection = (record: any) => {
    setCorrectionModal(record);
    setNewCheckIn(
      record.checkIn ? new Date(record.checkIn).toISOString().slice(0, 16) : ''
    );
    setNewCheckOut(
      record.checkOut ? new Date(record.checkOut).toISOString().slice(0, 16) : ''
    );
    setCorrectionReason('');
    setActionError(null);
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionModal) return;
    if (!correctionReason.trim()) {
      setActionError('Please provide a correction reason for auditing (BR-ATT-002).');
      return;
    }
    setCorrecting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/v1/attendance/${correctionModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: newCheckIn ? new Date(newCheckIn).toISOString() : undefined,
          checkOut: newCheckOut ? new Date(newCheckOut).toISOString() : null,
          correctionReason,
          correctedById: 'system-hr-lead', // Evaluated in backend
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Correction failed');
      }

      setCorrectionModal(null);
      fetchRecords();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setCorrecting(false);
    }
  };

  const totalHours = records.reduce((acc, r) => acc + Number(r.workedHours || 0), 0);
  const presentCount = records.filter((r) => r.status === 'Present').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const missingCount = records.filter((r) => !r.checkOut).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-10 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Operations</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Live worked hours computation, status derivation, and exception tracking (BR-ATT-001 & BR-ATT-002).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Check-in Widget */}
        <AttendanceWidget onAttendanceChange={fetchRecords} />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Records
              </span>
              <Calendar className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold mt-2">{records.length}</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Present
              </span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {presentCount}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Late Entries
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              {lateCount}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Missing Checkouts
              </span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
              {missingCount}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium">Filters:</span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>

            <button
              onClick={() => setExceptionsOnly(!exceptionsOnly)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                exceptionsOnly
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              Missing Checkout Only
            </button>
          </div>

          <div className="text-xs text-zinc-500 font-medium">
            Total Worked: <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalHours.toFixed(2)} hrs</span>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                  <th className="px-6 py-4">Worked Hours</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                      {loading ? 'Loading attendance records...' : 'No attendance entries found.'}
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {record.employee?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {record.employee?.jobPosition || record.employee?.department?.name || 'Staff'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {new Date(record.checkIn).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {record.checkOut ? (
                          new Date(record.checkOut).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                            <AlertCircle className="w-3 h-3" />
                            Missing Checkout
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-xs">
                        {Number(record.workedHours) > 0 ? (
                          `${Number(record.workedHours).toFixed(2)} hrs`
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : record.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {record.status}
                        </span>
                        {record.correctedAt && (
                          <span className="ml-2 text-[10px] text-zinc-400 italic">
                            (Adjusted)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openCorrection(record)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          Correct
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manual Correction Modal (BR-ATT-002) */}
        {correctionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-semibold">
                  Correct Attendance — {correctionModal.employee?.fullName}
                </h3>
                <button
                  onClick={() => setCorrectionModal(null)}
                  className="text-zinc-400 hover:text-zinc-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitCorrection} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Check In Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    value={newCheckIn}
                    onChange={(e) => setNewCheckIn(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Check Out Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    value={newCheckOut}
                    onChange={(e) => setNewCheckOut(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Correction Reason (Audit requirement BR-ATT-002)
                  </label>
                  <textarea
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    rows={2}
                    placeholder="e.g. Employee forgot to clock out at departure"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    required
                  />
                </div>

                {actionError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{actionError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCorrectionModal(null)}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={correcting}
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  >
                    {correcting ? 'Saving...' : 'Save Correction'}
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
