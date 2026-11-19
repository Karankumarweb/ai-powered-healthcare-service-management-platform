import React, { useEffect, useState } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { EmptyState, StatusText } from '../components/StatusText';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { appointmentApi, doctorApi, extractErrorMessage } from '../services/apiClient';
import type { Appointment, AvailabilitySlot, Doctor } from '../types/healthcare';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [savingAvail, setSavingAvail] = useState(false);

  const loadData = async () => {
    try {
      const [apptRes, docProfile] = await Promise.all([
        appointmentApi.list(),
        user ? doctorApi.getByUserId(user.id) : Promise.reject(),
      ]);
      setAppointments(apptRes.content);
      setDoctor(docProfile);
      setSlots(docProfile.availabilities || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleComplete = async (id: number) => {
    try {
      await appointmentApi.complete(id);
      showToast('Appointment marked completed', 'success');
      loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const toggleSlotDay = (index: number) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, available: !s.available } : s))
    );
  };

  const saveAvailability = async () => {
    if (!doctor) return;
    setSavingAvail(true);
    try {
      const updated = await doctorApi.updateAvailability(
        doctor.id,
        slots.map(({ dayOfWeek, startTime, endTime, slotDurationMinutes, available }) => ({
          dayOfWeek,
          startTime,
          endTime,
          slotDurationMinutes,
          available,
        }))
      );
      setSlots(updated);
      showToast('Weekly availability saved', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSavingAvail(false);
    }
  };

  return (
    <AppShell breadcrumb="Clinician Console / Schedule & Availability">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user?.fullName} — Clinical Schedule
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {doctor ? `${doctor.specialization} · ${doctor.department}` : 'Review your patient queue and manage weekly clinic hours.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Patient Queue */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Assigned Appointments</h2>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {appointments.length} total
              </span>
            </div>

            {appointments.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="w-5 h-5" />}
                title="No scheduled patients"
                description="Confirmed patient bookings will appear here automatically."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <div key={a.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold text-slate-900">{a.patientName}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <StatusText status={a.status} />
                      </div>
                      <div className="text-xs font-mono text-slate-500 tabular-nums">
                        {a.appointmentDate} · {a.startTime}–{a.endTime} ·{' '}
                        {a.visitType === 'VIDEO_TELEHEALTH' ? 'Video' : 'In Person'}
                      </div>
                      <p className="text-xs text-slate-600">{a.reason}</p>
                    </div>
                    {['CONFIRMED', 'SCHEDULED', 'RESCHEDULED'].includes(a.status) && (
                      <button
                        onClick={() => handleComplete(a.id)}
                        className="px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-md whitespace-nowrap shrink-0"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Availability Manager */}
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <h2 className="text-sm font-semibold text-slate-900">Weekly Clinic Hours</h2>
              </div>
              <button
                onClick={saveAvailability}
                disabled={savingAvail}
                className="px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 rounded-md"
              >
                {savingAvail ? 'Saving...' : 'Save Hours'}
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {slots.map((slot, idx) => (
                <div key={slot.id || slot.dayOfWeek} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{slot.dayOfWeek}</div>
                    <div className="text-xs font-mono text-slate-500 tabular-nums">
                      {slot.startTime} – {slot.endTime} · {slot.slotDurationMinutes}m slots
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSlotDay(idx)}
                    className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                      slot.available
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {slot.available ? 'Open' : 'Paused'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
