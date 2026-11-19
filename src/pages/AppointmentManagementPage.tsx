import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarPlus, X } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { EmptyState, StatusText } from '../components/StatusText';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { appointmentApi, extractErrorMessage } from '../services/apiClient';
import type { Appointment } from '../types/healthcare';

export default function AppointmentManagementPage() {
  const { primaryRole } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('10:00');
  const [newEnd, setNewEnd] = useState('10:30');

  const load = () => {
    setLoading(true);
    appointmentApi
      .list()
      .then((res) => setAppointments(res.content))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await appointmentApi.cancel(id, 'Cancelled from appointment manager');
      showToast('Appointment cancelled and notification sent', 'info');
      load();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    try {
      await appointmentApi.reschedule(rescheduleTarget.id, {
        appointmentDate: newDate,
        startTime: newStart,
        endTime: newEnd,
      });
      showToast('Appointment rescheduled successfully', 'success');
      setRescheduleTarget(null);
      load();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const filtered =
    statusFilter === 'ALL'
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

  return (
    <AppShell
      breadcrumb="Scheduling / Appointment Management"
      primaryAction={
        primaryRole !== 'DOCTOR' ? (
          <Link
            to="/book-appointment"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md whitespace-nowrap shrink-0"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Book Visit</span>
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments</h1>
            <p className="text-sm text-slate-600 mt-1">
              Reschedule or cancel visits with real-time slot conflict verification.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md overflow-x-auto">
            {['ALL', 'CONFIRMED', 'SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-xs text-slate-500">Loading appointments...</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="w-5 h-5" />}
              title="No appointments in this view"
              description="Book a new visit or switch the status filter above."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-5">Patient</th>
                    <th className="py-2.5 px-4">Specialist</th>
                    <th className="py-2.5 px-4">Date &amp; Slot</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtered.map((a) => {
                    const active = ['CONFIRMED', 'SCHEDULED', 'RESCHEDULED'].includes(a.status);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-5 font-medium text-slate-900">{a.patientName}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {a.doctorName} · {a.specialization}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                          {a.appointmentDate} · {a.startTime}–{a.endTime}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{a.reason}</td>
                        <td className="py-3 px-4">
                          <StatusText status={a.status} />
                        </td>
                        <td className="py-3 px-5 text-right whitespace-nowrap space-x-2">
                          {active && (
                            <>
                              <button
                                onClick={() => {
                                  setRescheduleTarget(a);
                                  setNewDate(a.appointmentDate);
                                  setNewStart(a.startTime);
                                  setNewEnd(a.endTime);
                                }}
                                className="text-sky-700 hover:text-sky-900 font-medium"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancel(a.id)}
                                className="text-red-700 hover:text-red-900 font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Reschedule Appointment</h2>
              <button onClick={() => setRescheduleTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-md"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md"
                >
                  Confirm New Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
