'use client';

import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';

interface AttendanceWidgetProps {
  employeeId?: string;
  onAttendanceChange?: () => void;
}

export function AttendanceWidget({ employeeId = '', onAttendanceChange }: AttendanceWidgetProps) {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState(employeeId);
  const [employees, setEmployees] = useState<any[]>([]);

  // Fetch employees list for demo switching
  useEffect(() => {
    fetch('/api/v1/attendance?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          // Collect unique employees from recent records if any
          const emps = Array.from(
            new Map(data.data.map((r: any) => [r.employee.id, r.employee])).values()
          );
          setEmployees(emps);
          if (!selectedEmpId && emps.length > 0) {
            setSelectedEmpId((emps[0] as any).id);
          }
        }
      })
      .catch(() => {});
  }, [selectedEmpId]);

  // Check current check-in status
  useEffect(() => {
    if (!selectedEmpId) return;
    fetch(`/api/v1/attendance?employeeId=${selectedEmpId}&exceptionsOnly=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setActiveSession(data.data[0]);
        } else {
          setActiveSession(null);
        }
      })
      .catch(() => setActiveSession(null));
  }, [selectedEmpId]);

  const handleCheckIn = async () => {
    if (!selectedEmpId) {
      setError('Please select an employee first.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/v1/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmpId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Check-in failed');
      }

      setActiveSession(data.data);
      setSuccess(`Checked in successfully at ${new Date(data.data.checkIn).toLocaleTimeString()} (${data.data.status})`);
      onAttendanceChange?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/v1/attendance/${activeSession.id}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Check-out failed');
      }

      setActiveSession(null);
      setSuccess(`Checked out! Worked hours: ${data.data.workedHours} hrs`);
      onAttendanceChange?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Attendance Quick Action
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {activeSession
                ? `Active session started at ${new Date(activeSession.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Not currently checked in'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeSession ? (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {loading ? 'Recording...' : 'Check Out'}
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={loading || !selectedEmpId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Recording...' : 'Check In'}
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
